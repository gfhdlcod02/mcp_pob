/**
 * Weakness Detector - Identifies build weaknesses
 * Detects missing defensive layers, uncapped resistances, low life, and other issues
 */

import type { ParsedBuild } from "../models/build.js";

export interface WeaknessDetection {
  weaknesses: string[];
  categories: {
    defenses: string[];
    offenses: string[];
    utilities: string[];
  };
}

/**
 * Weakness patterns to detect in gear affixes
 */
const WEAKNESS_INDICATORS = {
  lowLife: 3000, // Below 3k life is low
  lowES: 2000, // Below 2k ES is low
  uncappedResist: 75, // Below 75% is uncapped
  lowChaosResist: 0, // 0% or negative is low
  noCurse: "No curse setup",
  lowMovementSpeed: 15, // Below 15% is low
  singleElement: "Single-element damage",
};

/**
 * Detect defensive weaknesses
 */
function detectDefensiveWeaknesses(build: ParsedBuild): string[] {
  const weaknesses: string[] = [];

  // Extract resistance values
  let fireResist = 0;
  let coldResist = 0;
  let lightningResist = 0;
  let chaosResist = 0;
  let life = 0;
  let energyShield = 0;
  let armor = 0;
  let evasion = 0;

  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();

    if (statNameLower.includes("fire resist")) fireResist = stat.value;
    if (statNameLower.includes("cold resist")) coldResist = stat.value;
    if (statNameLower.includes("lightning resist")) lightningResist = stat.value;
    if (statNameLower.includes("chaos resist")) chaosResist = stat.value;
    if (statNameLower.includes("life") && !statNameLower.includes("regen")) life = stat.value;
    if (statNameLower.includes("energy shield")) energyShield = stat.value;
    if (statNameLower.includes("armour") || statNameLower.includes("armor")) armor = stat.value;
    if (statNameLower.includes("evasion")) evasion = stat.value;
  }

  // Check for Chaos Inoculation
  const hasCI =
    build.passives?.keystones?.some(
      (k: any) => k.name?.toLowerCase().includes("chaos inoculation") || k.id === "16226"
    ) || false;

  // Life/ES weakness
  if (!hasCI) {
    if (life < WEAKNESS_INDICATORS.lowLife) {
      weaknesses.push(`Low life pool (${life}) - vulnerable to burst damage`);
    }
  } else {
    if (energyShield < WEAKNESS_INDICATORS.lowES) {
      weaknesses.push(`Low energy shield (${energyShield}) for CI build`);
    }
  }

  // Resistance weaknesses
  if (fireResist < WEAKNESS_INDICATORS.uncappedResist) {
    weaknesses.push(`Uncapped fire resistance (${fireResist}% - need ${75 - fireResist}% more)`);
  }
  if (coldResist < WEAKNESS_INDICATORS.uncappedResist) {
    weaknesses.push(`Uncapped cold resistance (${coldResist}% - need ${75 - coldResist}% more)`);
  }
  if (lightningResist < WEAKNESS_INDICATORS.uncappedResist) {
    weaknesses.push(
      `Uncapped lightning resistance (${lightningResist}% - need ${75 - lightningResist}% more)`
    );
  }

  // Chaos resistance weakness
  if (!hasCI && chaosResist <= WEAKNESS_INDICATORS.lowChaosResist) {
    weaknesses.push(`No chaos resistance (${chaosResist}%) - vulnerable to chaos damage`);
  }

  // Armor/evasion weaknesses
  if (armor < 2000 && evasion < 2000 && !hasCI) {
    weaknesses.push("Low armor and evasion - poor physical damage mitigation");
  }

  // Check for missing mitigation layers
  let hasBlock = false;
  let hasSpellSuppression = false;

  for (const gear of build.gear) {
    if (!gear.affixes) continue;

    for (const affix of gear.affixes) {
      const text = affix.text.toLowerCase();
      if (text.includes("block") && text.includes("%")) {
        hasBlock = true;
      }
      if (text.includes("suppress") && text.includes("spell")) {
        hasSpellSuppression = true;
      }
    }
  }

  if (!hasBlock && !hasSpellSuppression && armor < 5000) {
    weaknesses.push("No block or spell suppression - relies solely on life/ES");
  }

  return weaknesses;
}

/**
 * Detect offensive weaknesses
 */
function detectOffensiveWeaknesses(build: ParsedBuild): string[] {
  const weaknesses: string[] = [];

  // Check for single-element damage (no versatility)
  const damageTypes: Record<string, number> = {};
  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    if (skillNameLower.includes("fire")) damageTypes.fire = (damageTypes.fire || 0) + 1;
    if (skillNameLower.includes("cold")) damageTypes.cold = (damageTypes.cold || 0) + 1;
    if (skillNameLower.includes("lightning")) damageTypes.lightning = (damageTypes.lightning || 0) + 1;
    if (skillNameLower.includes("chaos")) damageTypes.chaos = (damageTypes.chaos || 0) + 1;
    if (skillNameLower.includes("physical")) damageTypes.physical = (damageTypes.physical || 0) + 1;
  }

  if (Object.keys(damageTypes).length === 1) {
    const onlyType = Object.keys(damageTypes)[0];
    weaknesses.push(
      `Single-element damage (${onlyType}) - struggles against resistant enemies`
    );
  }

  // Check for low link count (suboptimal damage)
  for (const skill of build.skills) {
    if (skill.isMainSkill && skill.linkCount < 5) {
      weaknesses.push(
        `Main skill in ${skill.linkCount}-link (recommend 6-link for max damage)`
      );
    }
  }

  // Check for missing damage supports
  const mainSkill = build.skills.find((s) => s.isMainSkill);
  if (mainSkill) {
    const supportNames = mainSkill.supports.map((s) => s.name.toLowerCase());
    const hasDamageSupport =
      supportNames.some((n) => n.includes("damage")) ||
      supportNames.some((n) => n.includes("more"));

    if (!hasDamageSupport && mainSkill.supports.length > 0) {
      weaknesses.push("Main skill lacks damage support gems");
    }
  }

  // Check DPS from stats
  let dps = 0;
  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("dps") || stat.name.toLowerCase().includes("damage per second")) {
      dps = stat.value;
      break;
    }
  }

  if (dps > 0 && dps < 100000) {
    weaknesses.push(`Low DPS (${(dps / 1000).toFixed(0)}k) - clear speed will be slow`);
  }

  return weaknesses;
}

/**
 * Detect utility weaknesses
 */
function detectUtilityWeaknesses(build: ParsedBuild): string[] {
  const weaknesses: string[] = [];

  // Check for curse setup
  let hasCurse = false;
  const curseSkills = [
    "blasphemy",
    "curse on hit",
    "vulnerability",
    "elemental weakness",
    "frostbite",
    "conductivity",
    "flammability",
    "despair",
    "enfeeble",
    "temporal chains",
    "punishment",
  ];

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    if (curseSkills.some((cs) => skillNameLower.includes(cs))) {
      hasCurse = true;
      break;
    }

    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      if (curseSkills.some((cs) => supportNameLower.includes(cs))) {
        hasCurse = true;
        break;
      }
    }

    if (hasCurse) break;
  }

  if (!hasCurse) {
    weaknesses.push("No curse setup - missing enemy debuff potential");
  }

  // Check for movement skill
  let hasMovementSkill = false;
  const movementSkills = [
    "flicker strike",
    "flame dash",
    "lightning dash",
    "whirling blades",
    "shield charge",
    "leap slam",
    "blink arrow",
    "dash",
  ];

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    if (movementSkills.some((ms) => skillNameLower.includes(ms))) {
      hasMovementSkill = true;
      break;
    }
  }

  if (!hasMovementSkill) {
    weaknesses.push("No movement skill - poor mobility");
  }

  // Check movement speed from stats
  let movementSpeed = 0;
  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("movement speed") || stat.name.toLowerCase().includes("move speed")) {
      movementSpeed = stat.value;
      break;
    }
  }

  if (!hasMovementSkill && movementSpeed < WEAKNESS_INDICATORS.lowMovementSpeed) {
    weaknesses.push(`Low movement speed (${movementSpeed}%) - slow clear speed`);
  }

  // Check for guard skills
  let hasGuardSkill = false;
  const guardSkills = ["steelskin", "guardian", "molten shell", "immortal call", "arctic armour"];

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();
    if (guardSkills.some((gs) => skillNameLower.includes(gs))) {
      hasGuardSkill = true;
      break;
    }
  }

  if (!hasGuardSkill) {
    weaknesses.push("No guard skill - vulnerable to burst damage");
  }

  // Check for regen/leech
  let hasRegen = false;
  let hasLeech = false;

  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();
    if (statNameLower.includes("regen") && (statNameLower.includes("life") || statNameLower.includes("energy shield"))) {
      hasRegen = true;
    }
    if (statNameLower.includes("leech")) {
      hasLeech = true;
    }
  }

  if (!hasRegen && !hasLeech) {
    weaknesses.push("No life/ES regeneration or leech - poor sustain");
  }

  return weaknesses;
}

/**
 * Detect all build weaknesses
 */
export function detectWeaknesses(build: ParsedBuild): WeaknessDetection {
  // Detect defensive weaknesses
  const defenses = detectDefensiveWeaknesses(build);

  // Detect offensive weaknesses
  const offenses = detectOffensiveWeaknesses(build);

  // Detect utility weaknesses
  const utilities = detectUtilityWeaknesses(build);

  // Combine all weaknesses
  const allWeaknesses = [...defenses, ...offenses, ...utilities];

  // If no weaknesses detected, add a generic message
  if (allWeaknesses.length === 0) {
    allWeaknesses.push("No obvious weaknesses detected - well-rounded build");
  }

  return {
    weaknesses: allWeaknesses,
    categories: {
      defenses,
      offenses,
      utilities,
    },
  };
}
