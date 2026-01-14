/**
 * Core build entity types
 */

/**
 * Character class (PoE 1 and PoE 2)
 */
export type CharacterClass =
  | "Witch"
  | "Ranger"
  | "Marauder"
  | "Duelist"
  | "Shadow"
  | "Templar"
  | "Scion" // PoE 1 classes
  | "Mercenary"
  | "Monk"
  | "Sorceress"
  | "Huntress"
  | "Druid"; // PoE 2 classes

/**
 * Ascendancy classes (subset - full list in implementation)
 */
export type Ascendancy =
  | "Necromancer"
  | "Elementalist"
  | "Occultist"
  | "Deadeye"
  | "Pathfinder"
  | "Raider"
  | "Gladiator"
  | "Champion"
  | "Slayer"
  | "Assassin"
  | "Trickster"
  | "Saboteur"
  | "Inquisitor"
  | "Hierophant"
  | "Guardian"
  | "Juggernaut"
  | "Berserker"
  | "Chieftain"
  | null;

/**
 * Character entity
 */
export interface Character {
  class: CharacterClass;
  ascendancy: Ascendancy | null;
  level: number;
  league: string | null;
}

/**
 * Support gem entity
 */
export interface SupportGem {
  name: string;
  gemLevel: number;
  quality: number;
}

/**
 * Skill setup entity (main skill + supports)
 */
export interface SkillSetup {
  id: string;
  skillName: string;
  gemLevel: number;
  quality: number;
  supports: SupportGem[];
  linkCount: number;
  isMainSkill: boolean;
}

/**
 * Build code input (immutable value object)
 */
export interface BuildCode {
  code: string; // Base64-encoded, zlib-compressed PoB XML
  hash?: string; // SHA-256 hash (derived, used for cache key)
}

/**
 * Parsed build aggregate root
 */
export interface ParsedBuild {
  buildId: string; // SHA-256 hash of original build code
  version: string; // PoB version (e.g., "1.4.170")
  gameVersion: string; // PoE version (e.g., "3.25.0")
  character: Character;
  skills: SkillSetup[];
  passives: any; // Will import from passive-tree.ts
  gear: any[]; // Will import from gear.ts
  stats: Stat[];
  parsedAt: string; // ISO 8601 timestamp
}

/**
 * Stat entity
 */
export interface Stat {
  name: string;
  value: number;
  source: "explicit" | "estimated" | "calculated";
}
