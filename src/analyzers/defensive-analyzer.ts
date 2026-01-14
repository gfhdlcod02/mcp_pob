/**
 * Defensive Analyzer - Evaluates build defensive capability
 * Classifies builds as glass_cannon, moderate, tanky, or uber_viable
 * Based on life, energy shield, resists, armor, and evasion
 */

import type { ParsedBuild } from "../models/build.js";
import type { DefensiveRating } from "../models/analysis.js";

export interface DefensiveAnalysis {
  rating: DefensiveRating;
  life: number;
  energyShield: number;
  fireResist: number;
  coldResist: number;
  lightningResist: number;
  chaosResist: number;
  armor: number;
  evasion: number;
  details: string[];
}

/**
 * Extract defensive stats from parsed build
 */
function extractDefensiveStats(build: ParsedBuild): {
  life: number;
  energyShield: number;
  fireResist: number;
  coldResist: number;
  lightningResist: number;
  chaosResist: number;
  armor: number;
  evasion: number;
} {
  let life = 0;
  let energyShield = 0;
  let fireResist = 0;
  let coldResist = 0;
  let lightningResist = 0;
  let chaosResist = 0;
  let armor = 0;
  let evasion = 0;

  // Extract from explicit stats
  for (const stat of build.stats) {
    switch (stat.name.toLowerCase()) {
      case "life":
      case "maximum life":
        life = stat.value;
        break;
      case "energy shield":
      case "maximum energy shield":
        energyShield = stat.value;
        break;
      case "fire resistance":
      case "fire resist":
        fireResist = stat.value;
        break;
      case "cold resistance":
      case "cold resist":
        coldResist = stat.value;
        break;
      case "lightning resistance":
      case "lightning resist":
        lightningResist = stat.value;
        break;
      case "chaos resistance":
      case "chaos resist":
        chaosResist = stat.value;
        break;
      case "armor":
      case "base armour":
        armor = stat.value;
        break;
      case "evasion":
      case "evasion rating":
        evasion = stat.value;
        break;
    }
  }

  // Estimate from gear if stats missing
  if (life === 0 || energyShield === 0) {
    for (const gear of build.gear) {
      if (gear.affixes) {
        for (const affix of gear.affixes) {
          const text = affix.text.toLowerCase();
          if (text.includes("life") && life === 0) {
            // Extract life value from affix text
            const match = text.match(/(\d+)\s*to\s*maximum life/i);
            if (match) life += parseInt(match[1], 10);
          }
          if (text.includes("energy shield") && energyShield === 0) {
            const match = text.match(/(\d+)\s*to\s*maximum energy shield/i);
            if (match) energyShield += parseInt(match[1], 10);
          }
        }
      }
    }
  }

  return {
    life,
    energyShield,
    fireResist,
    coldResist,
    lightningResist,
    chaosResist,
    armor,
    evasion,
  };
}

/**
 * Calculate minimum elemental resistance
 */
function getMinElementalResist(stats: {
  fireResist: number;
  coldResist: number;
  lightningResist: number;
}): number {
  return Math.min(stats.fireResist, stats.coldResist, stats.lightningResist);
}

/**
 * Check if all elemental resistances are capped (75%)
 */
function isResistCapped(stats: {
  fireResist: number;
  coldResist: number;
  lightningResist: number;
}): boolean {
  return (
    stats.fireResist >= 75 &&
    stats.coldResist >= 75 &&
    stats.lightningResist >= 75
  );
}

/**
 * Classify defensive capability
 */
function classifyDefense(
  stats: ReturnType<typeof extractDefensiveStats>,
  hasChaosInoculation: boolean
): DefensiveRating {
  const { life, energyShield, armor, evasion } = stats;
  const minResist = getMinElementalResist(stats);
  const effectiveLife = hasChaosInoculation ? energyShield : Math.max(life, energyShield);

  // Uber viable: Very high life/ES AND max resists AND good mitigation
  if (
    effectiveLife > 5000 &&
    isResistCapped(stats) &&
    (armor > 10000 || evasion > 10000)
  ) {
    return "uber_viable";
  }

  // Tanky: High life/ES AND capped resists
  if (effectiveLife > 4000 && isResistCapped(stats)) {
    return "tanky";
  }

  // Moderate: Mid-tier life/ES OR decent resists
  if (effectiveLife > 2500 && minResist >= 50) {
    return "moderate";
  }

  // Glass cannon: Low life/ES OR uncapped resists
  return "glass_cannon";
}

/**
 * Generate defensive analysis details
 */
function generateDetails(
  stats: ReturnType<typeof extractDefensiveStats>,
  rating: DefensiveRating,
  hasChaosInoculation: boolean
): string[] {
  const details: string[] = [];
  const { life, energyShield, fireResist, coldResist, lightningResist, chaosResist, armor, evasion } =
    stats;

  // Life assessment
  if (hasChaosInoculation) {
    details.push(`Chaos Inoculation: ${energyShield} Energy Shield (chaos immune)`);
  } else {
    details.push(
      `Life: ${life}${life > 0 ? " (primary defense)" : ""}${
        energyShield > 0 ? `, ${energyShield} Energy Shield` : ""
      }`
    );
  }

  // Resistance assessment
  if (isResistCapped(stats)) {
    details.push("All elemental resistances capped at 75%");
  } else {
    const uncapped = [];
    if (fireResist < 75) uncapped.push(`Fire (${fireResist}%)`);
    if (coldResist < 75) uncapped.push(`Cold (${coldResist}%)`);
    if (lightningResist < 75) uncapped.push(`Lightning (${lightningResist}%)`);
    if (uncapped.length > 0) {
      details.push(`Uncapped resistances: ${uncapped.join(", ")}`);
    }
  }

  // Chaos resistance
  if (chaosResist > 0) {
    details.push(`Chaos resistance: ${chaosResist}%${chaosResist >= 75 ? " (capped)" : ""}`);
  } else if (!hasChaosInoculation) {
    details.push("No chaos resistance (vulnerable to chaos damage)");
  }

  // Mitigation assessment
  if (armor > 5000) {
    details.push(`High armor (${armor}): Good physical damage reduction`);
  }
  if (evasion > 5000) {
    details.push(`High evasion (${evasion}): Good chance to avoid attacks`);
  }

  // Rating-specific notes
  switch (rating) {
    case "uber_viable":
      details.push("Build capable of uber boss fights with high defenses");
      break;
    case "tanky":
      details.push("Strong defensive layers for endgame content");
      break;
    case "moderate":
      details.push("Moderate defenses - may struggle in hard content");
      break;
    case "glass_cannon":
      details.push("Low defenses - relies on offense or avoidance");
      break;
  }

  return details;
}

/**
 * Analyze build defensive capability
 */
export function analyzeDefense(build: ParsedBuild): DefensiveAnalysis {
  // Check for Chaos Inoculation keystone
  const hasChaosInoculation =
    build.passives?.keystones?.some(
      (k: any) => k.name?.toLowerCase().includes("chaos inoculation") || k.id === "16226"
    ) || false;

  // Extract defensive stats
  const stats = extractDefensiveStats(build);

  // Classify defensive rating
  const rating = classifyDefense(stats, hasChaosInoculation);

  // Generate analysis details
  const details = generateDetails(stats, rating, hasChaosInoculation);

  return {
    rating,
    life: stats.life,
    energyShield: stats.energyShield,
    fireResist: stats.fireResist,
    coldResist: stats.coldResist,
    lightningResist: stats.lightningResist,
    chaosResist: stats.chaosResist,
    armor: stats.armor,
    evasion: stats.evasion,
    details,
  };
}
