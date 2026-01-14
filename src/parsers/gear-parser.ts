/**
 * Gear Parser
 *
 * Extracts equipped items from the <Gear> section
 */

import type { GearSlot, Affix, GearSlotType } from "../models/gear.js";

/**
 * All gear slot types in order
 */
const GEAR_SLOTS: GearSlotType[] = [
  "Weapon1",
  "Weapon2",
  "Helmet",
  "BodyArmour",
  "Gloves",
  "Boots",
  "Amulet",
  "Ring1",
  "Ring2",
  "Belt",
  "Flask1",
  "Flask2",
  "Flask3",
  "Flask4",
  "Flask5",
];

/**
 * Parses gear data from PoB Gear section
 * @param gearSection - PoB <Gear> section
 * @returns Array of GearSlot entities
 */
export function parseGear(gearSection: any): GearSlot[] {
  if (!gearSection || !gearSection.Item) {
    // Return empty slots if no gear
    return GEAR_SLOTS.map((slot) => createEmptySlot(slot));
  }

  const items = Array.isArray(gearSection.Item)
    ? gearSection.Item
    : [gearSection.Item];

  const gear: GearSlot[] = [];

  // Map items to their slots
  items.forEach((item: any) => {
    const slot = parseGearSlot(item);
    if (slot) {
      gear.push(slot);
    }
  });

  // Fill in missing slots with empty slots
  const filledSlots = GEAR_SLOTS.map((slotType) => {
    const existing = gear.find((g) => g.slot === slotType);
    return existing || createEmptySlot(slotType);
  });

  return filledSlots;
}

/**
 * Parses a single gear item
 */
function parseGearSlot(item: any): GearSlot | null {
  if (!item || !item.$) {
    return null;
  }

  const itemName = item.$;

  // Determine slot type from item data
  const slotType = determineSlotType(item);
  if (!slotType) {
    return null;
  }

  return {
    slot: slotType,
    itemName,
    baseType: item.baseType || "",
    itemClass: item.itemClass || "",
    affixes: parseAffixes(item),
    implicit: item.implicit || null,
    corrupted: item.corrupted === true || item.corrupted === "true",
    influences: parseInfluences(item),
  };
}

/**
 * Determines the gear slot type from item data
 */
function determineSlotType(item: any): GearSlotType | null {
  // Try to get slot from item data
  if (item.slot) {
    return item.slot;
  }

  // Try to infer from item name/rarity/type
  if (!item.$) {
    return null;
  }

  const itemName = item.$.toLowerCase();

  // Simple heuristic mapping
  if (itemName.includes("flask")) {
    return "Flask1"; // Will be renumbered if multiple
  }

  // Default: return null (will be filled as empty slot)
  return null;
}

/**
 * Parses affixes/modifiers from an item
 */
function parseAffixes(item: any): Affix[] {
  const affixes: Affix[] = [];

  if (!item.mods || !item.mods.mod) {
    return affixes;
  }

  const mods = Array.isArray(item.mods.mod)
    ? item.mods.mod
    : [item.mods.mod];

  mods.forEach((mod: any) => {
    affixes.push({
      type: determineAffixType(mod),
      text: mod.str || mod.$ || "",
      value: parseAffixValue(mod.str || mod.$ || ""),
      unparsed: mod.value === undefined,
    });
  });

  return affixes;
}

/**
 * Determines affix type (explicit, implicit, corrupted-implicit)
 */
function determineAffixType(mod: any): "explicit" | "implicit" | "corrupted-implicit" {
  if (mod.type === "implicit") {
    return "implicit";
  }

  if (mod.corrupted === true || mod.corrupted === "true") {
    return "corrupted-implicit";
  }

  return "explicit";
}

/**
 * Attempts to parse numeric value from affix text
 */
function parseAffixValue(text: string): number | null {
  // Try to extract numeric value from text like "+89 to maximum Life"
  const match = text.match(/([-\d]+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parses item influences (Shaper, Elder, etc.)
 */
function parseInfluences(item: any): string[] {
  const influences: string[] = [];

  if (item.influences) {
    // Handle various influence formats
    if (typeof item.influences === "string") {
      influences.push(item.influences);
    } else if (Array.isArray(item.influences)) {
      influences.push(...item.influences);
    } else if (typeof item.influences === "object") {
      Object.keys(item.influences).forEach((key) => {
        if (item.influences[key] === true || item.influences[key] === "true") {
          influences.push(key);
        }
      });
    }
  }

  return influences;
}

/**
 * Creates an empty gear slot
 */
function createEmptySlot(slot: GearSlotType): GearSlot {
  return {
    slot,
    itemName: "Empty",
    baseType: "",
    itemClass: "",
    affixes: [],
    implicit: null,
    corrupted: false,
    influences: [],
  };
}
