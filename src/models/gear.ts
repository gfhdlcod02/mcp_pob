/**
 * Gear entity types
 */

/**
 * Equipment slot types
 */
export type GearSlotType =
  | "Weapon1"
  | "Weapon2"
  | "Helmet"
  | "BodyArmour"
  | "Gloves"
  | "Boots"
  | "Amulet"
  | "Ring1"
  | "Ring2"
  | "Belt"
  | "Flask1"
  | "Flask2"
  | "Flask3"
  | "Flask4"
  | "Flask5";

/**
 * Item affix/modifier types
 */
export type AffixType = "explicit" | "implicit" | "corrupted-implicit";

/**
 * Item affix/modifier entity
 */
export interface Affix {
  type: AffixType;
  text: string; // Modifier text as shown in PoB
  value: number | null; // Numeric value (if parseable)
  unparsed: boolean; // True if value couldn't be parsed from text
}

/**
 * Gear slot entity
 */
export interface GearSlot {
  slot: GearSlotType;
  itemName: string;
  baseType: string; // Base item type (e.g., "Glorious Plate")
  itemClass: string; // Item class (e.g., "Body Armour")
  affixes: Affix[];
  implicit: string | null; // Implicit modifier (if any)
  corrupted: boolean;
  influences: string[]; // Influences (e.g., ["Shaper", "Elder"])
}
