/**
 * Playstyle Detector - Detects build playstyle focus
 * Classifies builds as clear_speed, boss, hybrid, or unknown
 * Based on passive tree clustering, skill choices, and stat priorities
 */

import type { ParsedBuild } from "../models/build.js";
import type { PlaystyleType } from "../models/analysis.js";

export interface PlaystyleDetection {
  type: PlaystyleType;
  confidence: number;
  indicators: string[];
  reasoning: string[];
}

/**
 * Clear speed indicators
 */
const CLEAR_SPEED_INDICATORS = {
  gems: [
    "melee splash",
    "greater multiple projectiles",
    "lesser multiple projectiles",
    "chain",
    "pierce",
    "fork",
    "area of effect",
    "increased aoe",
    "concentrated effect", // Can be boss or clear depending on build
    "ancestral call",
    "vicious projectiles",
  ],
  passives: [
    "area of effect",
    "movement speed",
    "attack speed",
    "cast speed",
    "cooldown recovery",
    "clear speed",
    "incursion",
    "delirium",
  ],
  stats: ["movement speed", "attack speed", "cast speed", "area of effect", "radius"],
};

/**
 * Boss killing indicators
 */
const BOSS_INDICATORS = {
  gems: [
    "concentrated effect",
    "elemental focus",
    "controlled destruction",
    "single target",
    "brutality",
    "fire penetration",
    "cold penetration",
    "lightning penetration",
    "elemental penetration",
    "bane",
    "wither",
  ],
  passives: [
    "single target",
    "damage",
    "critical strike",
    "critical multiplier",
    "penetration",
    "spell damage",
    "attack damage",
    "projectile damage",
  ],
  stats: ["critical strike chance", "critical strike multiplier", "penetration"],
};

/**
 * Count clear speed indicators in build
 */
function countClearSpeedIndicators(build: ParsedBuild): number {
  let count = 0;
  const indicators: string[] = [];

  // Check skills and support gems
  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    for (const indicator of CLEAR_SPEED_INDICATORS.gems) {
      if (skillNameLower.includes(indicator) && !indicators.includes(indicator)) {
        count += 2;
        indicators.push(indicator);
      }
    }

    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      for (const indicator of CLEAR_SPEED_INDICATORS.gems) {
        if (supportNameLower.includes(indicator) && !indicators.includes(indicator)) {
          count += 1;
          indicators.push(indicator);
        }
      }
    }
  }

  // Check passive tree notables
  if (build.passives?.notables) {
    for (const notable of build.passives.notables) {
      const notableNameLower = notable.name?.toLowerCase() || "";
      for (const indicator of CLEAR_SPEED_INDICATORS.passives) {
        if (notableNameLower.includes(indicator) && !indicators.includes(indicator)) {
          count += 1;
          indicators.push(indicator);
        }
      }
    }
  }

  // Check stats
  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();
    for (const indicator of CLEAR_SPEED_INDICATORS.stats) {
      if (statNameLower.includes(indicator) && stat.value > 20) {
        count += 0.5;
      }
    }
  }

  return count;
}

/**
 * Count boss killing indicators in build
 */
function countBossIndicators(build: ParsedBuild): number {
  let count = 0;
  const indicators: string[] = [];

  // Check skills and support gems
  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    for (const indicator of BOSS_INDICATORS.gems) {
      if (skillNameLower.includes(indicator) && !indicators.includes(indicator)) {
        count += 2;
        indicators.push(indicator);
      }
    }

    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      for (const indicator of BOSS_INDICATORS.gems) {
        if (supportNameLower.includes(indicator) && !indicators.includes(indicator)) {
          count += 1;
          indicators.push(indicator);
        }
      }
    }
  }

  // Check passive tree notables
  if (build.passives?.notables) {
    for (const notable of build.passives.notables) {
      const notableNameLower = notable.name?.toLowerCase() || "";
      for (const indicator of BOSS_INDICATORS.passives) {
        if (notableNameLower.includes(indicator) && !indicators.includes(indicator)) {
          count += 1;
          indicators.push(indicator);
        }
      }
    }
  }

  // Check stats
  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();
    for (const indicator of BOSS_INDICATORS.stats) {
      if (statNameLower.includes(indicator) && stat.value > 30) {
        count += 0.5;
      }
    }
  }

  return count;
}

/**
 * Extract movement speed from build
 */
function getMovementSpeed(build: ParsedBuild): number {
  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("movement speed") || stat.name.toLowerCase().includes("move speed")) {
      return stat.value;
    }
  }

  // Estimate from gear
  let totalMovementSpeed = 0;
  for (const gear of build.gear) {
    if (gear.affixes) {
      for (const affix of gear.affixes) {
        const text = affix.text.toLowerCase();
        if (text.includes("movement speed") || text.includes("move speed")) {
          const match = text.match(/(\d+)%?\s*increased\s*movement\s*speed/i);
          if (match) {
            totalMovementSpeed += parseInt(match[1], 10);
          }
        }
      }
    }
  }

  return totalMovementSpeed;
}

/**
 * Extract area of effect from build
 */
function getAreaOfEffect(build: ParsedBuild): number {
  let totalAoE = 0;

  // Check support gems
  for (const skill of build.skills) {
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      if (supportNameLower.includes("area of effect") || supportNameLower.includes("increased aoe")) {
        totalAoE += 20; // Typical AoE support
      }
      if (supportNameLower.includes("concentrated effect")) {
        totalAoE -= 15; // Concentrated effect reduces AoE
      }
    }
  }

  return totalAoE;
}

/**
 * Classify playstyle based on indicators
 */
function classifyPlaystyle(
  clearScore: number,
  bossScore: number,
  movementSpeed: number,
  _areaOfEffect: number
): { type: PlaystyleType; confidence: number } {
  const totalScore = clearScore + bossScore;

  // No clear indicators
  if (totalScore < 1) {
    return { type: "unknown", confidence: 0.3 };
  }

  // Clear dominant
  if (clearScore > bossScore * 1.5 && movementSpeed > 20) {
    return { type: "clear", confidence: 0.8 };
  }

  // Boss dominant
  if (bossScore > clearScore * 1.5) {
    return { type: "boss", confidence: 0.8 };
  }

  // Balanced (hybrid)
  if (Math.abs(clearScore - bossScore) < 3) {
    return { type: "hybrid", confidence: 0.7 };
  }

  // Moderate preference
  if (clearScore > bossScore) {
    return { type: "clear", confidence: 0.6 };
  }

  return { type: "boss", confidence: 0.6 };
}

/**
 * Generate playstyle indicators
 */
function generateIndicators(
  build: ParsedBuild,
  _clearScore: number,
  _bossScore: number,
  movementSpeed: number,
  areaOfEffect: number
): string[] {
  const indicators: string[] = [];

  // Movement speed
  if (movementSpeed > 30) {
    indicators.push(`High movement speed (${movementSpeed}%)`);
  } else if (movementSpeed > 15) {
    indicators.push(`Moderate movement speed (${movementSpeed}%)`);
  } else if (movementSpeed > 0) {
    indicators.push(`Low movement speed (${movementSpeed}%)`);
  }

  // Area of effect
  if (areaOfEffect > 30) {
    indicators.push(`Large area of effect (+${areaOfEffect}%)`);
  } else if (areaOfEffect < -10) {
    indicators.push(`Small area of effect (${areaOfEffect}%) - single target focus`);
  }

  // Clear speed gems
  const clearGems: string[] = [];
  for (const skill of build.skills) {
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      for (const indicator of CLEAR_SPEED_INDICATORS.gems) {
        if (supportNameLower.includes(indicator) && !clearGems.includes(support.name)) {
          clearGems.push(support.name);
        }
      }
    }
  }
  if (clearGems.length > 0) {
    indicators.push(`Clear speed gems: ${clearGems.slice(0, 3).join(", ")}`);
  }

  // Boss gems
  const bossGems: string[] = [];
  for (const skill of build.skills) {
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      for (const indicator of BOSS_INDICATORS.gems) {
        if (supportNameLower.includes(indicator) && !bossGems.includes(support.name)) {
          bossGems.push(support.name);
        }
      }
    }
  }
  if (bossGems.length > 0) {
    indicators.push(`Single-target gems: ${bossGems.slice(0, 3).join(", ")}`);
  }

  return indicators;
}

/**
 * Generate reasoning for playstyle detection
 */
function generateReasoning(
  type: PlaystyleType,
  clearScore: number,
  bossScore: number
): string[] {
  const reasoning: string[] = [];

  switch (type) {
    case "clear":
      reasoning.push(
        `Build focuses on clear speed (score: ${clearScore.toFixed(1)}) over boss damage (${bossScore.toFixed(1)})`
      );
      reasoning.push("Optimized for mapping and general content");
      break;
    case "boss":
      reasoning.push(
        `Build focuses on single-target damage (score: ${bossScore.toFixed(1)}) over clear speed (${clearScore.toFixed(1)})`
      );
      reasoning.push("Optimized for boss fights and hard content");
      break;
    case "hybrid":
      reasoning.push(
        `Build balances clear speed (${clearScore.toFixed(1)}) and boss damage (${bossScore.toFixed(1)})`
      );
      reasoning.push("Capable of both mapping and bossing");
      break;
    case "unknown":
      reasoning.push("Insufficient indicators to determine playstyle");
      reasoning.push("Build may be incomplete or use unconventional mechanics");
      break;
  }

  return reasoning;
}

/**
 * Detect build playstyle
 */
export function detectPlaystyle(build: ParsedBuild): PlaystyleDetection {
  // Count indicators
  const clearScore = countClearSpeedIndicators(build);
  const bossScore = countBossIndicators(build);

  // Extract key stats
  const movementSpeed = getMovementSpeed(build);
  const areaOfEffect = getAreaOfEffect(build);

  // Classify playstyle
  const { type, confidence } = classifyPlaystyle(clearScore, bossScore, movementSpeed, areaOfEffect);

  // Generate indicators
  const indicators = generateIndicators(build, clearScore, bossScore, movementSpeed, areaOfEffect);

  // Generate reasoning
  const reasoning = generateReasoning(type, clearScore, bossScore);

  return {
    type,
    confidence,
    indicators,
    reasoning,
  };
}
