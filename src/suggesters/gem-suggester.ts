/**
 * Gem Suggester - Suggests gem setup improvements
 * Identifies missing critical supports, inefficient combinations, and suggests alternatives
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import type { Suggestion } from "../models/analysis.js";

/**
 * Critical support gem mappings for common skills
 */
const CRITICAL_SUPPORTS: Record<string, string[]> = {
  // Kinetic Blast
  "kinetic blast": ["multistrike", "greater multiple projectiles", "elemental damage", "controlled destruction"],
  // Tornado Shot
  "tornado shot": ["greater multiple projectiles", "chain", "elemental damage", "vicious projectiles"],
  // Spark
  spark: ["arcane potency", "controlled destruction", "greater multiple projectiles", "spell cascade"],
  // Ice Spear
  "ice spear": ["greater multiple projectiles", "elemental damage", "controlled destruction", "hypothermia"],
  // Lightning Arrow
  "lightning arrow": ["greater multiple projectiles", "chain", "elemental damage", "vicious projectiles"],
  // Generic attack skills
  "default attack": ["multistrike", "melee splash", "elemental damage with attacks", "ruthless"],
  // Generic spell skills
  "default spell": ["controlled destruction", "elemental damage", "greater multiple projectiles", "efficacy"],
};

/**
 * Inefficient support gem combinations
 */
const INEFFICIENT_COMBINATIONS: Array<{
  gems: string[];
  reason: string;
  betterAlternative: string;
}> = [
  {
    gems: ["elemental damage with attacks", "physical to lightning"],
    reason: "Reduces physical damage without enough added lightning",
    betterAlternative: "replace Physical to Lightning with Added Fire or Melee Physical Damage",
  },
  {
    gems: ["controlled destruction", "elemental focus"],
    reason: "Cannot shock/freeze/ignite with both supports",
    betterAlternative: "choose one based on build needs (more damage vs ailments)",
  },
  {
    gems: ["multiple projectiles", "lesser multiple projectiles"],
    reason: "Redundant projectile supports",
    betterAlternative: "replace LMP with GMP or a damage support",
  },
];

/**
 * Check for missing critical support gems
 */
function checkCriticalSupports(build: ParsedBuild, _analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const skill of build.skills) {
    if (!skill.isMainSkill) continue;

    const skillNameLower = skill.skillName.toLowerCase();
    const supportNames = skill.supports.map((s) => s.name.toLowerCase());

    // Find critical supports for this skill
    let criticalSupports: string[] = [];
    for (const [key, supports] of Object.entries(CRITICAL_SUPPORTS)) {
      if (skillNameLower.includes(key)) {
        criticalSupports = supports;
        break;
      }
    }

    // If no specific mapping found, use generic
    if (criticalSupports.length === 0) {
      criticalSupports = CRITICAL_SUPPORTS["default spell"];
      if (skillNameLower.includes("attack") || skillNameLower.includes("strike") || skillNameLower.includes("slam")) {
        criticalSupports = CRITICAL_SUPPORTS["default attack"];
      }
    }

    // Check which critical supports are missing
    for (const support of criticalSupports) {
      const hasSupport = supportNames.some((n) => n.includes(support));
      if (!hasSupport && skill.linkCount < 6) {
        suggestions.push({
          category: "gems",
          priority: "important",
          description: `Add ${support} to ${skill.skillName}`,
          specificAction: `Insert ${support} in ${skill.skillName} link (available socket: ${skill.linkCount + 1}/6)`,
          expectedImpact: `Increases damage output significantly`,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Check for inefficient support combinations
 */
function checkInefficientCombinations(build: ParsedBuild): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const skill of build.skills) {
    const supportNames = skill.supports.map((s) => s.name.toLowerCase());

    for (const combo of INEFFICIENT_COMBINATIONS) {
      const hasAllGems = combo.gems.every((gem) =>
        supportNames.some((n) => n.includes(gem.toLowerCase()))
      );

      if (hasAllGems) {
        suggestions.push({
          category: "gems",
          priority: "optional",
          description: `Inefficient support combination in ${skill.skillName}`,
          specificAction: combo.betterAlternative,
          expectedImpact: combo.reason,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Check for low link count (suboptimal damage)
 */
function checkLinkCount(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const skill of build.skills) {
    if (!skill.isMainSkill) continue;

    if (skill.linkCount < 5 && analysis.offensiveRating === "low") {
      suggestions.push({
        category: "gems",
        priority: "important",
        description: `Upgrade ${skill.skillName} to higher link setup`,
        specificAction: `Find ${skill.skillName} a ${skill.linkCount + 1}-link item (current: ${skill.linkCount}-link)`,
        expectedImpact: "Each additional link adds a support gem, increasing damage by 20-50%",
      });
    }
  }

  return suggestions;
}

/**
 * Check for low gem levels
 */
function checkGemLevels(build: ParsedBuild): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const skill of build.skills) {
    // Check main skill level
    if (skill.isMainSkill && skill.gemLevel < 18) {
      suggestions.push({
        category: "gems",
        priority: "optional",
        description: `Level up ${skill.skillName} gem`,
        specificAction: `Gain experience to level ${skill.skillName} from ${skill.gemLevel} to 20`,
        expectedImpact: "Significant damage increase as gem levels add flat damage and multipliers",
      });
    }

    // Check support levels
    for (const support of skill.supports) {
      if (support.gemLevel < 18 && support.quality < 15) {
        suggestions.push({
          category: "gems",
          priority: "optional",
          description: `Level up and quality ${support.name}`,
          specificAction: `Gain experience to level ${support.name} from ${support.gemLevel} to 20, then use Gemcutter's for 20% quality`,
          expectedImpact: "Higher gem levels increase support effectiveness by 10-30%",
        });
      }
    }
  }

  return suggestions;
}

/**
 * Generate all gem-related suggestions
 */
export function suggestGemImprovements(
  build: ParsedBuild,
  analysis: BuildAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check for critical supports
  suggestions.push(...checkCriticalSupports(build, analysis));

  // Check for inefficient combinations
  suggestions.push(...checkInefficientCombinations(build));

  // Check link count
  suggestions.push(...checkLinkCount(build, analysis));

  // Check gem levels
  suggestions.push(...checkGemLevels(build));

  return suggestions;
}
