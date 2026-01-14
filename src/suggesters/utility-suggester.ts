/**
 * Utility Suggester - Suggests utility improvements
 * Detects missing curses, guard skills, mobility options, and suggests appropriate additions
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import type { Suggestion } from "../models/analysis.js";

/**
 * Common curse skills
 */
const CURSE_SKILLS = [
  "elemental weakness",
  "frostbite",
  "flammability",
  "conductivity",
  "vulnerability",
  "despair",
  "enfeeble",
  "temporal chains",
  "punishment",
  "assassin's mark",
  "warlord's mark",
  "poacher's mark",
  "proj. weakness",
  "burning ground",
  "vortex",
  "sin",
];

/**
 * Blasphemy support setup
 */
const BLASPHEMY_CURSE_SETUP =
  "Blasphemy Support + curse skill in 4-link (Blasphemy, curse, curse, Enhance)";

/**
 * Movement skills
 */
const MOVEMENT_SKILLS = [
  "flame dash",
  "lightning dash",
  "flicker strike",
  "whirling blades",
  "shield charge",
  "leap slam",
  "blink arrow",
  "phase run",
];

/**
 * Guard skills
 */
const GUARD_SKILLS = [
  "steelskin",
  "molten shell",
  "immortal call",
  "arctic armour",
  "guardian",
  "vigilant strike",
];

/**
 * Check for missing curse setup
 */
function checkMissingCurse(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check if build has any curse skills
  let hasCurse = false;
  let hasBlasphemy = false;

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    if (CURSE_SKILLS.some((c) => skillNameLower.includes(c))) {
      hasCurse = true;
    }

    for (const support of skill.supports) {
      if (support.name.toLowerCase().includes("blasphemy")) {
        hasBlasphemy = true;
      }
    }
  }

  // Suggest curse setup if missing
  if (!hasCurse) {
    // Determine best curse based on damage type
    let suggestedCurse = "Elemental Weakness";
    for (const skill of build.skills) {
      const skillNameLower = skill.skillName.toLowerCase();

      if (skillNameLower.includes("fire") || skillNameLower.includes("burn") || skillNameLower.includes("ignite")) {
        suggestedCurse = "Flammability";
      } else if (skillNameLower.includes("cold") || skillNameLower.includes("freeze") || skillNameLower.includes("chill")) {
        suggestedCurse = "Frostbite";
      } else if (skillNameLower.includes("lightning") || skillNameLower.includes("shock")) {
        suggestedCurse = "Conductivity";
      } else if (skillNameLower.includes("chaos") || skillNameLower.includes("poison")) {
        suggestedCurse = "Despair";
      } else if (skillNameLower.includes("physical") || skillNameLower.includes("bleed")) {
        suggestedCurse = "Vulnerability";
      }
    }

    suggestions.push({
      category: "utility",
      priority: analysis.offensiveRating === "low" ? "important" : "optional",
      description: `Add curse setup for damage amplification`,
      specificAction: `Add ${suggestedCurse} curse with Blasphemy Support in 3-4 link`,
      expectedImpact: "Curses increase enemy damage taken by 30-40%, significantly boosting DPS",
    });
  }

  // Suggest Blasphemy if has curses but no Blasphemy
  if (hasCurse && !hasBlasphemy) {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Consider Blasphemy Support for aura-cursing",
      specificAction: BLASPHEMY_CURSE_SETUP,
      expectedImpact: "Applies curse automatically in aura, improving clear speed",
    });
  }

  return suggestions;
}

/**
 * Check for missing movement skill
 */
function checkMissingMovementSkill(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check if build has movement skill
  let hasMovementSkill = false;

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    if (MOVEMENT_SKILLS.some((ms) => skillNameLower.includes(ms))) {
      hasMovementSkill = true;
      break;
    }
  }

  // Suggest movement skill if missing
  if (!hasMovementSkill) {
    // Determine best movement skill based on weapon type
    let suggestedSkill = "Flame Dash"; // Default for spellcasters

    // Check for melee weapons
    const hasMeleeWeapon = build.gear.some((g: any) =>
      g.baseType?.toLowerCase().includes("sword") ||
      g.baseType?.toLowerCase().includes("axe") ||
      g.baseType?.toLowerCase().includes("mace") ||
      g.baseType?.toLowerCase().includes("dagger") ||
      g.baseType?.toLowerCase().includes("claw")
    );

    const hasShield = build.gear.some((g: any) =>
      g.baseType?.toLowerCase().includes("shield")
    );

    if (hasMeleeWeapon && hasShield) {
      suggestedSkill = "Shield Charge";
    } else if (hasMeleeWeapon) {
      suggestedSkill = "Leap Slam";
    } else if (build.character.class.toLowerCase().includes("ranger") ||
               build.character.class.toLowerCase().includes("huntress")) {
      suggestedSkill = "Blink Arrow";
    }

    suggestions.push({
      category: "utility",
      priority: analysis.playstyleType === "clear" ? "important" : "optional",
      description: "Add movement skill for mobility",
      specificAction: `Add ${suggestedSkill} in 3-link with Faster Casting and Arcane Surge (if applicable)`,
      expectedImpact: "Significantly improves clear speed and bossing ability",
    });
  }

  return suggestions;
}

/**
 * Check for missing guard skill
 */
function checkMissingGuardSkill(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check if build has guard skill
  let hasGuardSkill = false;

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    if (GUARD_SKILLS.some((gs) => skillNameLower.includes(gs))) {
      hasGuardSkill = true;
      break;
    }
  }

  // Suggest guard skill if missing and build is not tanky
  if (!hasGuardSkill && analysis.defensiveRating !== "tanky" && analysis.defensiveRating !== "uber_viable") {
    // Determine best guard skill
    let suggestedSkill = "Steelskin"; // Default
    let reason = "Provides burst damage protection";

    if (analysis.playstyleType === "clear") {
      suggestedSkill = "Molten Shell";
      reason = "Provides explosion damage and armor";
    } else if (analysis.defensiveRating === "glass_cannon") {
      suggestedSkill = "Immortal Call";
      reason = "Provides physical immunity duration";
    }

    suggestions.push({
      category: "utility",
      priority: "important",
      description: "Add guard skill for burst damage protection",
      specificAction: `Add ${suggestedSkill} in 3-link with Increased Duration and Second Wind`,
      expectedImpact: reason + ", preventing one-shot deaths",
    });
  }

  return suggestions;
}

/**
 * Check for missing mobility utilities
 */
function checkMissingMobilityUtilities(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check movement speed
  let movementSpeed = 0;
  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("movement speed") || stat.name.toLowerCase().includes("move speed")) {
      movementSpeed = stat.value;
      break;
    }
  }

  // Suggest movement speed if low
  if (movementSpeed < 20 && analysis.playstyleType === "clear") {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Increase movement speed for better clear speed",
      specificAction: "Find boots with +25%+ movement speed and use Quartz Flask or Fortitude buff",
      expectedImpact: "Increases clear speed by 20-30%",
    });
  }

  // Check for phasing/avoidance utilities
  let hasPhasing = false;
  let hasFortification = false;

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    if (skillNameLower.includes("phasing") || skillNameLower.includes("phantom")) {
      hasPhasing = true;
    }
    if (skillNameLower.includes("fortify") || skillNameLower.includes("fortification")) {
      hasFortification = true;
    }
  }

  if (!hasPhasing && analysis.playstyleType === "clear") {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Consider phasing utility for enemy evasion",
      specificAction: "Use Quicksilver Flask of Phasing or Phase Run gem",
      expectedImpact: "Prevents enemy hits while moving, improving clear speed",
    });
  }

  if (!hasFortification && analysis.defensiveRating !== "tanky") {
    suggestions.push({
      category: "utility",
      priority: "important",
      description: "Add Fortification for damage reduction",
      specificAction: "Link Fortify to movement skill or use Fortification support",
      expectedImpact: "Reduces hit damage taken by 20%, significantly improving survivability",
    });
  }

  return suggestions;
}

/**
 * Check for flask upgrades
 */
function checkFlaskUpgrades(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check if build has flasks
  const flasks = build.gear.filter((g: any) => g.slot?.startsWith("Flask"));

  if (flasks.length === 0) {
    suggestions.push({
      category: "utility",
      priority: "important",
      description: "Use utility flasks for buffs and defenses",
      specificAction: "Equip 5 flasks: Quicksilver, Divine, Granite, Quartz, and life/mana flask",
      expectedImpact: "Flasks provide massive temporary buffs during mapping",
    });
    return suggestions;
  }

  // Check for specific flask types
  const hasQuicksilver = flasks.some((f: any) =>
    f.itemName?.toLowerCase().includes("quicksilver")
  );
  const hasDivine = flasks.some((f: any) =>
    f.itemName?.toLowerCase().includes("divine")
  );
  const hasGranite = flasks.some((f: any) =>
    f.itemName?.toLowerCase().includes("granite")
  );

  if (!hasQuicksilver && analysis.playstyleType === "clear") {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Use Quicksilver Flask for movement speed",
      specificAction: "Replace one flask with Quicksilver Flask of Adrenaline",
      expectedImpact: "Increases movement speed by 20-40% during flask effect",
    });
  }

  if (!hasDivine && analysis.defensiveRating !== "tanky") {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Use Divine Life Flask for instant recovery",
      specificAction: "Replace one flask with Divine Life Flask of Staunching/Heat",
      expectedImpact: "Instantly recovers large portion of life, preventing deaths",
    });
  }

  if (!hasGranite && analysis.defensiveRating !== "tanky") {
    suggestions.push({
      category: "utility",
      priority: "optional",
      description: "Use Granite Flask for physical mitigation",
      specificAction: "Replace one flask with Granite Flask of Iron Skin",
      expectedImpact: "Increases armor by 6000+, reducing physical damage taken",
    });
  }

  return suggestions;
}

/**
 * Generate all utility-related suggestions
 */
export function suggestUtilityImprovements(
  build: ParsedBuild,
  analysis: BuildAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check for missing curse setup
  suggestions.push(...checkMissingCurse(build, analysis));

  // Check for missing movement skill
  suggestions.push(...checkMissingMovementSkill(build, analysis));

  // Check for missing guard skill
  suggestions.push(...checkMissingGuardSkill(build, analysis));

  // Check for missing mobility utilities
  suggestions.push(...checkMissingMobilityUtilities(build, analysis));

  // Check for flask upgrades
  suggestions.push(...checkFlaskUpgrades(build, analysis));

  return suggestions;
}
