/**
 * Strength Detector - Identifies build strengths
 * Detects notable defensive/offensive strengths, keystones, and build-defining mechanics
 */

import type { ParsedBuild } from "../models/build.js";

export interface StrengthDetection {
  strengths: string[];
  categories: {
    keystones: string[];
    defenses: string[];
    offenses: string[];
    utilities: string[];
  };
}

/**
 * Notable keystones and their strength descriptions
 */
const KEYSTONE_STRENGTHS: Record<string, string> = {
  "Chaos Inoculation": "Chaos immunity from Chaos Inoculation",
  CI: "Chaos immunity from Chaos Inoculation",
  "Mind Over Matter": "Mind Over Matter - 30% of damage taken from Mana before Life",
  MoM: "Mind Over Matter - 30% of damage taken from Mana before Life",
  "Eldritch Battery": "Eldritch Battery - Energy Shield protects Mana",
  "Iron Reflexes": "Iron Reflexes - All Evasion converted to Armor",
  "Elemental Overload": "Elemental Overload - 40% more elemental damage for less crit",
  "Point Blank": "Point Blank - Close-range projectile damage bonus",
  "Acrobatics": "Acrobatics - 30% chance to dodge attacks",
  "Phase Acrobatics": "Phase Acrobatics - 30% chance to dodge spells",
  "Resolute Technique": "Resolute Technique - Hits can't be evaded",
  "Unwavering Stance": "Unwavering Stance - Cannot be stunned",
  "Vaal Pact": "Vaal Pact - Instant life leech",
  "Ghost Reaver": "Ghost Reaver - Energy Shield leech instead of Life",
};

/**
 * Strength patterns to detect in gear affixes
 */
const GEAR_STRENGTH_PATTERNS = {
  highLife: /\+([7-9][0-9]|1[0-9][0-9]) to maximum life/i,
  highES: /\+([5-9][0-9]|1[0-9][0-9]) to maximum energy shield/i,
  highResist: /\+([3-9][0-9]|100)% to (fire|cold|lightning) resistance/i,
  maxResist: /\+(maximum |max )?(fire|cold|lightning|chaos) resistance/i,
  highArmor: /\+([5-9][0-9][0-9]|1[0-9][0-9][0-9]) to armour/i,
  highEvasion: /\+([5-9][0-9][0-9]|1[0-9][0-9][0-9]) to evasion rating/i,
  highMana: /\+([5-9][0-9]|1[0-9][0-9]) to maximum mana/i,
  spellSuppression: /\+([1-9][0-9])% chance to suppress spell damage/i,
  blockChance: /\+(\d+%?) (block chance|chance to block)/i,
  critMulti: /\+(\d+) to critical strike multiplier/i,
  incDamage: /\+(\d+)% increased (damage|attack damage|spell damage)/i,
  moreDamage: /\+(\d+)% more (damage|attack damage|spell damage)/i,
};

/**
 * Utility strengths to detect
 */
const UTILITY_STRENGTHS = {
  movement: ["movement speed", "move speed", "base movement speed"],
  curses: ["blasphemy", "curse on hit", "aura"],
  auras: ["aura", "banner", "herald"],
  regen: ["life regeneration", "life regen", "energy shield regeneration", "es regen"],
  leech: ["life leech", "energy shield leech", "mana leech"],
 fortification: ["fortification", "fortify"],
  phasing: ["phasing", "phantom dash"],
};

/**
 * Detect keystones and build-defining passives
 */
function detectKeystones(build: ParsedBuild): string[] {
  const keystones: string[] = [];

  if (!build.passives?.keystones) {
    return keystones;
  }

  for (const keystone of build.passives.keystones) {
    const name = keystone.name || "";
    const id = keystone.id || "";

    // Check known keystones
    for (const [key, description] of Object.entries(KEYSTONE_STRENGTHS)) {
      if (name.toLowerCase().includes(key.toLowerCase()) || id === key) {
        keystones.push(description);
        break;
      }
    }

    // If no match but has a name, add it anyway
    if (keystones.length === 0 && name) {
      keystones.push(`Keystone: ${name}`);
    }
  }

  return keystones;
}

/**
 * Detect defensive strengths from stats and gear
 */
function detectDefensiveStrengths(build: ParsedBuild): string[] {
  const strengths: string[] = [];

  // Check for capped resistances
  let fireResist = 0;
  let coldResist = 0;
  let lightningResist = 0;
  let chaosResist = 0;

  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();
    if (statNameLower.includes("fire resist")) fireResist = stat.value;
    if (statNameLower.includes("cold resist")) coldResist = stat.value;
    if (statNameLower.includes("lightning resist")) lightningResist = stat.value;
    if (statNameLower.includes("chaos resist")) chaosResist = stat.value;
  }

  // Resistance capping
  if (fireResist >= 75 && coldResist >= 75 && lightningResist >= 75) {
    strengths.push("75% all elemental resistances (capped)");
  } else {
    const capped = [];
    if (fireResist >= 75) capped.push("Fire");
    if (coldResist >= 75) capped.push("Cold");
    if (lightningResist >= 75) capped.push("Lightning");
    if (capped.length > 0) {
      strengths.push(`${capped.join(", ")} resistance capped at 75%`);
    }
  }

  if (chaosResist >= 60) {
    strengths.push(`High chaos resistance (${chaosResist}%)`);
  }

  // Check for high life/ES
  let life = 0;
  let energyShield = 0;

  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("life") && !stat.name.toLowerCase().includes("regen")) {
      life = stat.value;
    }
    if (stat.name.toLowerCase().includes("energy shield")) {
      energyShield = stat.value;
    }
  }

  if (life > 5000) {
    strengths.push(`Very high life pool (${life})`);
  } else if (life > 3500) {
    strengths.push(`High life pool (${life})`);
  }

  if (energyShield > 5000) {
    strengths.push(`Very high energy shield (${energyShield})`);
  } else if (energyShield > 3500) {
    strengths.push(`High energy shield (${energyShield})`);
  }

  // Check gear for defensive affixes
  let maxBlock = 0;
  let spellSuppression = 0;

  for (const gear of build.gear) {
    if (!gear.affixes) continue;

    for (const affix of gear.affixes) {
      const text = affix.text;

      // Block chance
      const blockMatch = text.match(GEAR_STRENGTH_PATTERNS.blockChance);
      if (blockMatch) {
        maxBlock = Math.max(maxBlock, parseInt(blockMatch[1], 10));
      }

      // Spell suppression
      const suppressMatch = text.match(GEAR_STRENGTH_PATTERNS.spellSuppression);
      if (suppressMatch) {
        spellSuppression = Math.max(spellSuppression, parseInt(suppressMatch[1], 10));
      }

      // High armor
      if (GEAR_STRENGTH_PATTERNS.highArmor.test(text)) {
        if (!strengths.includes("High armor from gear")) {
          strengths.push("High armor from gear");
        }
      }

      // High evasion
      if (GEAR_STRENGTH_PATTERNS.highEvasion.test(text)) {
        if (!strengths.includes("High evasion from gear")) {
          strengths.push("High evasion from gear");
        }
      }
    }
  }

  if (maxBlock >= 75) {
    strengths.push("Maximum block chance (75%)");
  } else if (maxBlock >= 50) {
    strengths.push(`High block chance (${maxBlock}%)`);
  }

  if (spellSuppression >= 80) {
    strengths.push("High spell suppression chance");
  }

  return strengths;
}

/**
 * Detect offensive strengths from skills and gear
 */
function detectOffensiveStrengths(build: ParsedBuild): string[] {
  const strengths: string[] = [];

  // Count support gems (more supports = more damage)
  let totalSupports = 0;
  let damageSupports = 0;

  for (const skill of build.skills) {
    totalSupports += skill.supports.length;

    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();
      if (
        supportNameLower.includes("damage") ||
        supportNameLower.includes("attack") ||
        supportNameLower.includes("spell") ||
        supportNameLower.includes("elemental") ||
        supportNameLower.includes("multistrike")
      ) {
        damageSupports++;
      }
    }
  }

  if (damageSupports >= 5) {
    strengths.push("Many damage support gems (high damage output)");
  }

  // Check for high-value damage affixes
  let moreDamageCount = 0;
  let highIncDamage = 0;

  for (const gear of build.gear) {
    if (!gear.affixes) continue;

    for (const affix of gear.affixes) {
      const text = affix.text;

      // More damage multipliers
      if (GEAR_STRENGTH_PATTERNS.moreDamage.test(text)) {
        moreDamageCount++;
      }

      // High increased damage
      const incMatch = text.match(GEAR_STRENGTH_PATTERNS.incDamage);
      if (incMatch) {
        const value = parseInt(incMatch[1], 10);
        if (value >= 50) {
          highIncDamage++;
        }
      }

      // Critical multiplier
      const critMatch = text.match(GEAR_STRENGTH_PATTERNS.critMulti);
      if (critMatch) {
        const value = parseInt(critMatch[1], 10);
        if (value >= 30) {
          strengths.push("High critical strike multiplier from gear");
        }
      }
    }
  }

  if (moreDamageCount >= 2) {
    strengths.push("Multiple 'more damage' modifiers");
  }

  if (highIncDamage >= 3) {
    strengths.push("Many high-value increased damage modifiers");
  }

  // Check for 6-link skills (max damage potential)
  for (const skill of build.skills) {
    if (skill.linkCount >= 6 && skill.isMainSkill) {
      strengths.push(`6-link main skill (${skill.skillName})`);
      break;
    }
  }

  return strengths;
}

/**
 * Detect utility strengths (movement, curses, auras, etc.)
 */
function detectUtilityStrengths(build: ParsedBuild): string[] {
  const strengths: string[] = [];

  // Movement speed
  let totalMovementSpeed = 0;
  for (const stat of build.stats) {
    if (stat.name.toLowerCase().includes("movement speed") || stat.name.toLowerCase().includes("move speed")) {
      totalMovementSpeed = stat.value;
      break;
    }
  }

  if (totalMovementSpeed > 30) {
    strengths.push(`High movement speed (${totalMovementSpeed}%)`);
  } else if (totalMovementSpeed > 15) {
    strengths.push(`Moderate movement speed (${totalMovementSpeed}%)`);
  }

  // Check skills for utilities
  let hasCurse = false;
  let hasAura = false;
  let hasMovementSkill = false;

  const movementSkills = ["flicker strike", "flame dash", "lightning dash", "whirling blades", "shield charge", "leap slam", "blink arrow"];

  for (const skill of build.skills) {
    const skillNameLower = skill.skillName.toLowerCase();

    // Movement skills
    if (movementSkills.some((ms) => skillNameLower.includes(ms))) {
      hasMovementSkill = true;
    }

    // Check support gems for utilities
    for (const support of skill.supports) {
      const supportNameLower = support.name.toLowerCase();

      if (UTILITY_STRENGTHS.curses.some((c) => supportNameLower.includes(c))) {
        hasCurse = true;
      }

      if (UTILITY_STRENGTHS.auras.some((a) => supportNameLower.includes(a))) {
        hasAura = true;
      }
    }
  }

  if (hasMovementSkill) {
    strengths.push("Movement skill for mobility");
  }

  if (hasCurse) {
    strengths.push("Curse setup for debuffing enemies");
  }

  if (hasAura) {
    strengths.push("Aura setup for buffs");
  }

  // Check for regen/leech
  let hasRegen = false;
  let hasLeech = false;

  for (const stat of build.stats) {
    const statNameLower = stat.name.toLowerCase();
    if (UTILITY_STRENGTHS.regen.some((r) => statNameLower.includes(r))) {
      hasRegen = true;
    }
    if (UTILITY_STRENGTHS.leech.some((l) => statNameLower.includes(l))) {
      hasLeech = true;
    }
  }

  if (hasRegen) {
    strengths.push("Health/ES regeneration for sustain");
  }

  if (hasLeech) {
    strengths.push("Life/ES leech for sustain");
  }

  return strengths;
}

/**
 * Detect all build strengths
 */
export function detectStrengths(build: ParsedBuild): StrengthDetection {
  // Detect keystones
  const keystones = detectKeystones(build);

  // Detect defensive strengths
  const defenses = detectDefensiveStrengths(build);

  // Detect offensive strengths
  const offenses = detectOffensiveStrengths(build);

  // Detect utility strengths
  const utilities = detectUtilityStrengths(build);

  // Combine all strengths
  const allStrengths = [...keystones, ...defenses, ...offenses, ...utilities];

  return {
    strengths: allStrengths,
    categories: {
      keystones,
      defenses,
      offenses,
      utilities,
    },
  };
}
