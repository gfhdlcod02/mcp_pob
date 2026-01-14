/**
 * Stats Parser
 *
 * Extracts explicit stats from the <Stats> section or marks as estimated/missing
 */

import type { Stat } from "../models/build.js";

/**
 * Parses stats data from PoB Stats section
 * @param statsSection - PoB <Stats> section
 * @returns Array of Stat entities
 */
export function parseStats(statsSection: any): Stat[] {
  if (!statsSection || !statsSection.Stat) {
    return getDefaultStats();
  }

  const stats = Array.isArray(statsSection.Stat)
    ? statsSection.Stat
    : [statsSection.Stat];

  return stats.map((stat: any) => ({
    name: stat.$.toString(),
    value: parseStatValue(stat.value || stat.$),
    source: "explicit" as const,
  }));
}

/**
 * Parses a stat value (can be numeric object or string)
 */
function parseStatValue(value: any): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  if (typeof value === "object" && value.$.value !== undefined) {
    return parseFloat(value.$.value);
  }

  return 0;
}

/**
 * Returns default stats when Stats section is missing
 */
function getDefaultStats(): Stat[] {
  return [
    { name: "Life", value: 0, source: "estimated" },
    { name: "Energy Shield", value: 0, source: "estimated" },
    { name: "Fire Resistance", value: 0, source: "estimated" },
    { name: "Cold Resistance", value: 0, source: "estimated" },
    { name: "Lightning Resistance", value: 0, source: "estimated" },
    { name: "Chaos Resistance", value: 0, source: "estimated" },
  ];
}
