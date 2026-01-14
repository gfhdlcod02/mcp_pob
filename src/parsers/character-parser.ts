/**
 * Character Parser
 *
 * Extracts character information from the <Build> section
 */

import type { Character } from "../models/build.js";

/**
 * Parses character data from PoB Build section
 * @param buildSection - PoB <Build> XML section
 * @returns Character entity
 */
export function parseCharacter(buildSection: any): Character {
  if (!buildSection) {
    // Return default character if Build section missing
    return {
      class: "Witch",
      ascendancy: null,
      level: 1,
      league: null,
    };
  }

  // Extract class
  const characterClass = buildSection.MainSocket?.class || buildSection.class || "Witch";

  // Extract ascendancy
  const ascendancy = buildSection.MainSocket?.ascendancyName || buildSection.ascendancy || null;

  // Extract level
  const level = parseInt(buildSection.level || buildSection.MainSocket?.level || "1", 10);

  // Extract league
  const league = buildSection.league || null;

  return {
    class: characterClass,
    ascendancy,
    level: Math.min(100, Math.max(1, level)), // Clamp to valid range
    league,
  };
}
