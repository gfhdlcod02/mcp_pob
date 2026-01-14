/**
 * Offensive Analyzer - Evaluates build offensive capability
 * Classifies builds as low, moderate, high, or extreme DPS
 * Identifies primary damage type and damage sources
 */

import type { ParsedBuild } from "../models/build.js";
import type { OffensiveRating } from "../models/analysis.js";

export interface OffensiveAnalysis {
  rating: OffensiveRating;
  estimatedDPS: number;
  damageType: string;
  damageSources: string[];
  details: string[];
}

/**
 * Damage type categories
 */
const DAMAGE_TYPES = {
  FIRE: ["fire", "burn", "ignite"],
  COLD: ["cold", "freeze", "chill", "frostbite"],
  LIGHTNING: ["lightning", "shock", "arc"],
  CHAOS: ["chaos", "doom", "wither"],
  PHYSICAL: ["physical", "bleed", "impale"],
  ELEMENTAL: ["elemental", "elemental damage"],
} as const;

/**
 * Identify primary damage type from skills and gear
 */
function identifyDamageType(build: ParsedBuild): string {
  const damageTypeCounts: Record<string, number> = {};

  // Count damage type keywords in skills
  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    for (const [type, keywords] of Object.entries(DAMAGE_TYPES)) {
      for (const keyword of keywords) {
        if (skillNameLower.includes(keyword)) {
          damageTypeCounts[type] = (damageTypeCounts[type] || 0) + 1;
        }
      }
    }

    // Check support gems for damage type hints
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      for (const [type, keywords] of Object.entries(DAMAGE_TYPES)) {
        for (const keyword of keywords) {
          if (supportNameLower.includes(keyword)) {
            damageTypeCounts[type] = (damageTypeCounts[type] || 0) + 0.5;
          }
        }
      }
    }
  }

  // Find damage type with highest count
  let maxCount = 0;
  let primaryType = "unknown";
  for (const [type, count] of Object.entries(damageTypeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
  }

  // Check for elemental conversion (multiple elements present)
  const elementalCount =
    (damageTypeCounts.Fire || 0) +
    (damageTypeCounts.Cold || 0) +
    (damageTypeCounts.Lightning || 0);
  if (elementalCount >= 2 && elementalCount === maxCount) {
    return "Elemental";
  }

  return primaryType;
}

/**
 * Estimate DPS from stats and skills
 */
function estimateDPS(build: ParsedBuild): number {
  let dps = 0;

  // Try to get explicit DPS stat
  for (const stat of build.stats) {
    if (
      stat.name.toLowerCase().includes("dps") ||
      stat.name.toLowerCase().includes("damage per second")
    ) {
      dps = stat.value;
      return dps;
    }
  }

  // Estimate from skill and gear affixes
  let addedDamage = 0;
  let increasedDamage = 0;
  let moreMultipliers = 1;

  // Extract damage modifiers from gear
  for (const gear of build.gear) {
    if (gear.affixes) {
      for (const affix of gear.affixes) {
        const text = affix.text.toLowerCase();

        // Added damage
        if (text.includes("added") && (text.includes("damage") || text.includes("attacks"))) {
          const match = text.match(/(\d+)\s*to\s*(\d+)\s*\w*\s*damage/i);
          if (match) {
            addedDamage += (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
          }
        }

        // Increased damage
        if (text.includes("increased") && text.includes("damage")) {
          const match = text.match(/(\d+)%\s*increased/i);
          if (match) {
            increasedDamage += parseInt(match[1], 10);
          }
        }

        // More multipliers
        if (text.includes("% more")) {
          const match = text.match(/(\d+)%\s*more/i);
          if (match) {
            moreMultipliers *= 1 + parseInt(match[1], 10) / 100;
          }
        }
      }
    }
  }

  // Extract damage modifiers from support gems
  for (const skill of build.skills) {
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();

      // Count support gems as damage multipliers
      if (
        supportNameLower.includes("damage") ||
        supportNameLower.includes("melee") ||
        supportNameLower.includes("attack") ||
        supportNameLower.includes("spell") ||
        supportNameLower.includes("elemental")
      ) {
        moreMultipliers *= 1.2; // Typical support gem multiplier
      }

      // More multipliers from support gems
      if (supportNameLower.includes("more")) {
        moreMultipliers *= 1.4;
      }
    }
  }

  // Calculate base DPS estimate (very rough approximation)
  // Base skill damage ~1000, modified by increases and multipliers
  const baseDamage = 1000 + addedDamage * 10;
  const increasedMultiplier = 1 + increasedDamage / 100;
  dps = baseDamage * increasedMultiplier * moreMultipliers;

  // Adjust for character level (higher level = more damage)
  const levelMultiplier = 1 + (build.character.level - 1) * 0.05;
  dps *= levelMultiplier;

  return Math.round(dps);
}

/**
 * Identify damage sources (skills, attacks, spells)
 */
function identifyDamageSources(build: ParsedBuild): string[] {
  const sources: string[] = [];

  for (const skill of build.skills) {
    if (skill.isMainSkill) {
      const skillName = skill.skillName;
      const supports = skill.supports.map((s) => s.name).join(", ");

      if (supports) {
        sources.push(`${skillName} (supported by: ${supports})`);
      } else {
        sources.push(skillName);
      }
    }
  }

  // If no main skill found, list all skills
  if (sources.length === 0) {
    for (const skill of build.skills) {
      sources.push(skill.skillName);
    }
  }

  return sources;
}

/**
 * Classify offensive rating based on DPS
 */
function classifyOffensive(dps: number): OffensiveRating {
  if (dps < 100000) return "low";
  if (dps < 500000) return "moderate";
  if (dps < 1000000) return "high";
  return "extreme";
}

/**
 * Generate offensive analysis details
 */
function generateDetails(
  rating: OffensiveRating,
  dps: number,
  damageType: string,
  sources: string[]
): string[] {
  const details: string[] = [];

  // DPS assessment
  const formattedDPS = dps >= 1000000 ? `${(dps / 1000000).toFixed(2)}M` : `${(dps / 1000).toFixed(0)}k`;
  details.push(`Estimated DPS: ${formattedDPS}`);

  // Damage type
  details.push(`Primary damage type: ${damageType}`);

  // Damage sources
  if (sources.length > 0) {
    details.push(`Main damage source(s): ${sources.slice(0, 2).join(", ")}`);
  }

  // Rating-specific notes
  switch (rating) {
    case "extreme":
      details.push("Extreme DPS output - very high damage build");
      break;
    case "high":
      details.push("High DPS - strong offensive capability");
      break;
    case "moderate":
      details.push("Moderate DPS - average damage output");
      break;
    case "low":
      details.push("Low DPS - damage output may need improvement");
      break;
  }

  // Damage type-specific insights
  if (damageType === "Elemental") {
    details.push("Elemental damage: benefits from elemental penetration and resistance lowering");
  } else if (damageType === "Chaos") {
    details.push("Chaos damage: bypasses energy shield, effective against many enemies");
  } else if (damageType === "Physical") {
    details.push("Physical damage: can be mitigated by armor, consider adding elemental conversion");
  }

  return details;
}

/**
 * Analyze build offensive capability
 */
export function analyzeOffense(build: ParsedBuild): OffensiveAnalysis {
  // Identify damage type
  const damageType = identifyDamageType(build);

  // Estimate DPS
  const estimatedDPS = estimateDPS(build);

  // Classify offensive rating
  const rating = classifyOffensive(estimatedDPS);

  // Identify damage sources
  const damageSources = identifyDamageSources(build);

  // Generate analysis details
  const details = generateDetails(rating, estimatedDPS, damageType, damageSources);

  return {
    rating,
    estimatedDPS,
    damageType,
    damageSources,
    details,
  };
}
