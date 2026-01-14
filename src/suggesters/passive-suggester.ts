/**
 * Passive Suggester - Suggests passive tree optimizations
 * Detects inefficient pathing, missing keystones nearby, and recommends defensive layers
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import type { Suggestion } from "../models/analysis.js";

/**
 * Notable passive clusters worth pathing to
 * Note: Currently unused, reserved for future enhancement
 */
// @ts-ignore - Reserved for future use
const _NOTABLE_CLUSTERS: Array<{
  name: string;
  effect: string;
  worth: "critical" | "important" | "optional";
}> = [
  { name: "Heart of the Oak", effect: "+20 to Strength, Dexterity, Intelligence", worth: "important" },
  { name: "Growth and Decay", effect: "+30 to Strength and Intelligence", worth: "important" },
  { name: "Leadership", effect: "+20 to Dexterity and Intelligence", worth: "important" },
  { name: "Ancestral Knowledge", effect: "+20 to Intelligence and Strength", worth: "important" },
  { name: "Blood Drinker", effect: "2% of Life Regenerated per second", worth: "important" },
  { name: "Mana Flow", effect: "20% increased Mana Regeneration Rate", worth: "optional" },
  { name: "Soul of Steel", effect: "+1 to Maximum Armour per 2 Strength", worth: "important" },
];

/**
 * Defensive notable passives
 * Note: Currently unused, reserved for future enhancement
 */
// @ts-ignore - Reserved for future use
const _DEFENSIVE_NOTABLES: Array<{
  name: string;
  effect: string;
  worth: "critical" | "important" | "optional";
}> = [
  { name: "Cloaked in Savagery", effect: "40% increased Attack Damage while Unarmed", worth: "optional" },
  { name: "Golem's Skin", effect: "+1 to Maximum Level of Golems", worth: "optional" },
  { name: "Written in Blood", effect: "30% increased maximum Life", worth: "important" },
  { name: "Vitality Void", effect: "0.4% of Attack Damage Leeched as Life", worth: "important" },
  { name: "Deep Wisdom", effect: "+50 to maximum Mana", worth: "optional" },
  { name: "Nullification", effect: "+8% to all Elemental Resistances", worth: "critical" },
  { name: "Crystal Skin", effect: "+1% to all maximum Elemental Resistances", worth: "critical" },
  { name: "Elements", effect: "+15% to all Elemental Resistances", worth: "critical" },
  { name: "Diamond Skin", effect: "+1% to all maximum Elemental Resistances", worth: "critical" },
];

/**
 * Check for inefficient passive pathing
 */
function checkInefficientPathing(build: ParsedBuild): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Simple heuristic: if passive points > 90 and no notable clusters nearby
  // This is a basic check - full implementation would analyze tree graph structure
  if (build.passives?.totalPoints && build.passives.totalPoints > 90) {
    const notableCount = build.passives.notables?.length || 0;

    if (notableCount < 8) {
      suggestions.push({
        category: "passives",
        priority: "optional",
        description: "Consider pathing to more notable passives",
        specificAction: "Allocate nearby notable clusters instead of small nodes",
        expectedImpact:
          "Notables provide 2-3x the value of normal nodes, improving build efficiency",
      });
    }
  }

  return suggestions;
}

/**
 * Check for missing defensive layers
 */
function checkMissingDefensives(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // If tanky rating, no suggestions needed
  if (analysis.defensiveRating === "uber_viable" || analysis.defensiveRating === "tanky") {
    return suggestions;
  }

  // Check for resistance notables if uncapped
  const hasUncappedResist = analysis.weaknesses.some((w) =>
    w.toLowerCase().includes("uncapped") || w.toLowerCase().includes("resistance")
  );

  if (hasUncappedResist) {
    suggestions.push({
      category: "passives",
      priority: "critical",
      description: "Allocate resistance notables on passive tree",
      specificAction:
        "Path to resistance clusters like Nullification, Elements, or Diamond Skin",
      expectedImpact: "Increases resistances toward 75% cap, reducing elemental damage taken by 50%+",
    });
  }

  // Check for life notables if low life
  const hasLowLife = analysis.weaknesses.some((w) =>
    w.toLowerCase().includes("low life") || w.toLowerCase().includes("life pool")
  );

  if (hasLowLife) {
    suggestions.push({
      category: "passives",
      priority: "critical",
      description: "Allocate life notables on passive tree",
      specificAction: "Path to life clusters like Written in Blood or Scion life wheel",
      expectedImpact: "Increases maximum life by 30-40%, improving survivability significantly",
    });
  }

  // Check for energy shield notables if ES build
  const isESBuild = build.stats.some((s) =>
    s.name.toLowerCase().includes("energy shield") && s.value > 2000
  );

  if (isESBuild) {
    suggestions.push({
      category: "passives",
      priority: "important",
      description: "Allocate energy shield notables",
      specificAction: "Path to ES clusters like Arcane Focus, Psi, or Discipline and Training",
      expectedImpact: "Increases maximum energy shield by 20-30%",
    });
  }

  return suggestions;
}

/**
 * Check for missing keystones
 */
function checkMissingKeystones(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Suggest CI if ES build but no CI
  const isESBuild = build.stats.some((s) =>
    s.name.toLowerCase().includes("energy shield") && s.value > 3000
  );
  const hasCI = build.passives?.keystones?.some((k: any) =>
    k.name?.toLowerCase().includes("chaos inoculation")
  );

  if (isESBuild && !hasCI) {
    suggestions.push({
      category: "passives",
      priority: "optional",
      description: "Consider Chaos Inoculation keystone",
      specificAction: "Path to Chaos Inoculation on passive tree (requires 100% Intelligence)",
      expectedImpact: "Grants chaos immunity, allowing you to ignore chaos resistance",
    });
  }

  // Suggest MoM if Mana pool is high
  const hasMana = build.stats.some((s) =>
    s.name.toLowerCase().includes("mana") && s.value > 500
  );
  const hasMoM = build.passives?.keystones?.some((k: any) =>
    k.name?.toLowerCase().includes("mind over matter")
  );

  if (hasMana && !hasMoM && analysis.defensiveRating !== "tanky") {
    suggestions.push({
      category: "passives",
      priority: "important",
      description: "Consider Mind Over Matter keystone",
      specificAction: "Path to Mind Over Matter on passive tree (requires Templar start)",
      expectedImpact: "30% of damage taken from Mana before Life, increasing effective HP by 40%+",
    });
  }

  return suggestions;
}

/**
 * Check for offensive upgrades
 */
function checkOffensiveUpgrades(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // If offensive rating is low, suggest damage notables
  if (analysis.offensiveRating === "low") {
    suggestions.push({
      category: "passives",
      priority: "important",
      description: "Allocate damage notables on passive tree",
      specificAction: "Path to damage clusters matching your skill type (spell/attack/elemental)",
      expectedImpact: "Increases DPS by 20-40%",
    });
  }

  // Check for critical strike notables if crit build
  const isCritBuild = build.stats.some((s) =>
    s.name.toLowerCase().includes("critical") && s.value > 150
  );

  if (isCritBuild) {
    suggestions.push({
      category: "passives",
      priority: "important",
      description: "Allocate critical strike multiplier notables",
      specificAction: "Path to crit multiplier clusters like Assassination or Outlast",
      expectedImpact: "Increases critical strike damage by 30-50%",
    });
  }

  return suggestions;
}

/**
 * Generate all passive tree suggestions
 */
export function suggestPassiveImprovements(
  build: ParsedBuild,
  analysis: BuildAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check for inefficient pathing
  suggestions.push(...checkInefficientPathing(build));

  // Check for missing defensive layers
  suggestions.push(...checkMissingDefensives(build, analysis));

  // Check for missing keystones
  suggestions.push(...checkMissingKeystones(build, analysis));

  // Check for offensive upgrades
  suggestions.push(...checkOffensiveUpgrades(build, analysis));

  return suggestions;
}
