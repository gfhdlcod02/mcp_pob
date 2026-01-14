/**
 * Gear Suggester - Suggests gear upgrades
 * Identifies uncapped resists, low life, and suggests specific gear slots and affixes
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import type { Suggestion } from "../models/analysis.js";

/**
 * Gear slot priorities for defensive upgrades
 */
const SLOT_PRIORITY = [
  "Ring1",
  "Ring2",
  "Amulet",
  "Helmet",
  "Boots",
  "Gloves",
  "Belt",
  "BodyArmour",
  "Weapon1",
  "Weapon2",
];

/**
 * High-value affixes for gear upgrades
 * Note: Currently unused, reserved for future enhancement
 */
// @ts-ignore - Reserved for future use
const _VALUABLE_AFFIXES: Array<{
  pattern: RegExp;
  suggestion: string;
  worth: "critical" | "important" | "optional";
}> = [
  {
    pattern: /\+([4-9][0-9]|1[0-9][0-9]) to maximum life/i,
    suggestion: "High life affix (+70+ life)",
    worth: "critical",
  },
  {
    pattern: /\+([4-9][0-9]|1[0-9][0-9]) to maximum energy shield/i,
    suggestion: "High energy shield affix (+50+ ES)",
    worth: "important",
  },
  {
    pattern: /\+([3-9][0-9]|100)% to (fire|cold|lightning) resistance/i,
    suggestion: "High single-element resistance (+35%+)",
    worth: "critical",
  },
  {
    pattern: /\+(maximum |max )?(fire|cold|lightning|chaos) resistance/i,
    suggestion: "Maximum resistance affix (+1% max)",
    worth: "critical",
  },
  {
    pattern: /% increased attributes/i,
    suggestion: "Increased attributes affix",
    worth: "optional",
  },
  {
    pattern: /\+([3-9][0-9]) to (strength|dexterity|intelligence)/i,
    suggestion: "High attribute affix (+50+)",
    worth: "important",
  },
];

/**
 * Check for resistance capping gear suggestions
 */
function checkResistanceGear(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Extract current resistances
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

  // Suggest gear upgrades for uncapped elements
  if (fireResist < 75) {
    const needed = 75 - fireResist;
    suggestions.push({
      category: "gear",
      priority: "critical",
      description: `Increase fire resistance (${needed}% more needed)`,
      specificAction: `Find Rings/Amulet/Boots with ${needed}%+ fire resistance (prioritize high elemental resist gear)`,
      expectedImpact: `Reaches 75% fire resistance cap, reducing fire damage taken by ${Math.round((75 - fireResist) * 4)}%`,
    });
  }

  if (coldResist < 75) {
    const needed = 75 - coldResist;
    suggestions.push({
      category: "gear",
      priority: "critical",
      description: `Increase cold resistance (${needed}% more needed)`,
      specificAction: `Find Rings/Amulet/Boots with ${needed}%+ cold resistance (prioritize high elemental resist gear)`,
      expectedImpact: `Reaches 75% cold resistance cap, reducing cold damage taken by ${Math.round((75 - coldResist) * 4)}%`,
    });
  }

  if (lightningResist < 75) {
    const needed = 75 - lightningResist;
    suggestions.push({
      category: "gear",
      priority: "critical",
      description: `Increase lightning resistance (${needed}% more needed)`,
      specificAction: `Find Rings/Amulet/Boots with ${needed}%+ lightning resistance (prioritize high elemental resist gear)`,
      expectedImpact: `Reaches 75% lightning resistance cap, reducing lightning damage taken by ${Math.round((75 - lightningResist) * 4)}%`,
    });
  }

  if (chaosResist < 60 && !analysis.weaknesses.includes("Chaos immunity from Chaos Inoculation")) {
    const needed = 60 - chaosResist;
    suggestions.push({
      category: "gear",
      priority: "important",
      description: `Increase chaos resistance (${needed}% more recommended)`,
      specificAction: `Find Amulet/Rings with chaos resistance or craft on gear`,
      expectedImpact: `Increases chaos resistance toward 60%, reducing chaos damage taken`,
    });
  }

  return suggestions;
}

/**
 * Check for life/ES gear upgrades
 */
function checkLifeESGear(build: ParsedBuild, _analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check for low life
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

  // Check for Chaos Inoculation
  const hasCI = build.passives?.keystones?.some((k: any) =>
    k.name?.toLowerCase().includes("chaos inoculation")
  );

  // Life upgrade suggestions
  if (!hasCI && life < 4000) {
    const needed = 5000 - life;
    const perSlotNeeded = Math.ceil(needed / 8); // Assume 8 slots can have life

    suggestions.push({
      category: "gear",
      priority: "critical",
      description: `Increase maximum life (${needed} more needed to reach 5000)`,
      specificAction: `Upgrade ${Math.min(3, Math.ceil(perSlotNeeded / 30))} gear slots with +${perSlotNeeded}+ life affixes (target: +70+ life per slot)`,
      expectedImpact: `Increases life pool to 5000+, improving survivability by ${Math.round(((5000 - life) / life) * 100)}%`,
    });
  }

  // ES upgrade suggestions (for CI or ES builds)
  if (hasCI || energyShield > 2000) {
    const targetES = hasCI ? 6000 : 4000;
    if (energyShield < targetES) {
      const needed = targetES - energyShield;
      const perSlotNeeded = Math.ceil(needed / 8);

      suggestions.push({
        category: "gear",
        priority: hasCI ? "critical" : "important",
        description: `Increase maximum energy shield (${needed} more needed to reach ${targetES})`,
        specificAction: `Upgrade ${Math.min(3, Math.ceil(perSlotNeeded / 50))} gear slots with +${perSlotNeeded}+ ES affixes (prioritize high ES base types)`,
        expectedImpact: `Increases energy shield to ${targetES}+, improving survivability by ${Math.round(((targetES - energyShield) / energyShield) * 100)}%`,
      });
    }
  }

  return suggestions;
}

/**
 * Check for empty gear slots
 */
function checkEmptySlots(build: ParsedBuild): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const slot of SLOT_PRIORITY) {
    const hasSlot = build.gear.some((g: any) => g.slot === slot);

    if (!hasSlot) {
      suggestions.push({
        category: "gear",
        priority: "critical",
        description: `Empty gear slot: ${slot}`,
        specificAction: `Fill ${slot} with an appropriate item for your build`,
        expectedImpact: "Missing gear slot significantly reduces stats and defenses",
      });
    }
  }

  return suggestions;
}

/**
 * Check for low-quality gear (base type suggestions)
 */
function checkGearQuality(build: ParsedBuild, analysis: BuildAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // If offensive rating is low, suggest weapon upgrades
  if (analysis.offensiveRating === "low") {
    const weapon = build.gear.find((g: any) =>
      g.slot === "Weapon1" || g.slot === "Weapon2"
    );

    if (weapon) {
      suggestions.push({
        category: "gear",
        priority: "important",
        description: "Upgrade weapon for higher damage output",
        specificAction: `Find weapon with higher base DPS and elemental damage prefixes`,
        expectedImpact: "Weapon base damage scales all damage, increasing total DPS by 30-50%",
      });
    }
  }

  // Check for low-tier body armor
  const bodyArmour = build.gear.find((g: any) => g.slot === "BodyArmour");
  if (bodyArmour && bodyArmour.baseType) {
    const lowTierBases = ["quilted jacket", "common coat", "garb", "robe"];
    const isLowTier = lowTierBases.some((base) =>
      bodyArmour.baseType.toLowerCase().includes(base)
    );

    if (isLowTier) {
      suggestions.push({
        category: "gear",
        priority: "important",
        description: "Upgrade body armor to higher tier base",
        specificAction: `Find body armor with higher base defenses (Glorious Plate, Varnished Coat, etc.)`,
        expectedImpact: "Higher tier bases provide significantly more armor/ES/evasion",
      });
    }
  }

  return suggestions;
}

/**
 * Check for jewelry upgrades
 */
function checkJewelryUpgrades(build: ParsedBuild): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check rings
  const ring1 = build.gear.find((g: any) => g.slot === "Ring1");
  const ring2 = build.gear.find((g: any) => g.slot === "Ring2");

  for (const [ring, slotName] of [
    [ring1, "Ring 1"],
    [ring2, "Ring 2"],
  ] as const) {
    if (!ring) continue;

    const hasHighLife = ring.affixes?.some((a: any) =>
      a.text.match(/\+([7-9][0-9]|1[0-9][0-9]) to maximum life/i)
    );
    const hasHighResist = ring.affixes?.some((a: any) =>
      a.text.match(/\+([3-9][0-9])% to (fire|cold|lightning) resistance/i)
    );

    if (!hasHighLife || !hasHighResist) {
      suggestions.push({
        category: "gear",
        priority: "important",
        description: `Upgrade ${slotName} with better affixes`,
        specificAction: `Find ${slotName} with high life (+70+) and elemental resistances (+35%+ each)`,
        expectedImpact: "Rings are excellent sources of life and resistances",
      });
    }
  }

  // Check amulet
  const amulet = build.gear.find((g: any) => g.slot === "Amulet");
  if (amulet) {
    const hasDamage = amulet.affixes?.some((a: any) =>
      a.text.toLowerCase().includes("damage") || a.text.toLowerCase().includes("penetration")
    );

    if (!hasDamage) {
      suggestions.push({
        category: "gear",
        priority: "optional",
        description: "Upgrade amulet with damage affixes",
        specificAction: "Find amulet with elemental damage, spell damage, or penetration",
        expectedImpact: "Amulet can provide significant damage boosts",
      });
    }
  }

  return suggestions;
}

/**
 * Generate all gear-related suggestions
 */
export function suggestGearImprovements(
  build: ParsedBuild,
  analysis: BuildAnalysis
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check for empty slots
  suggestions.push(...checkEmptySlots(build));

  // Check for resistance capping
  suggestions.push(...checkResistanceGear(build, analysis));

  // Check for life/ES upgrades
  suggestions.push(...checkLifeESGear(build, analysis));

  // Check for gear quality
  suggestions.push(...checkGearQuality(build, analysis));

  // Check for jewelry upgrades
  suggestions.push(...checkJewelryUpgrades(build));

  return suggestions;
}
