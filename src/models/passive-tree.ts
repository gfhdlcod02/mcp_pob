/**
 * Passive tree entity types
 */

/**
 * Keystone passive node (build-defining)
 */
export interface Keystone {
  id: string; // Node ID from passive tree
  name: string; // Keystone name
  effect: string; // Keystone effect description
}

/**
 * Notable passive node (medium impact)
 */
export interface Notable {
  id: string; // Node ID from passive tree
  name: string; // Notable name
  effect: string; // Notable effect description
}

/**
 * Passive tree entity
 */
export interface PassiveTree {
  totalPoints: number; // Total passive points spent
  nodes: string[]; // Array of allocated node IDs
  keystones: Keystone[]; // Array of allocated keystones
  notables: Notable[]; // Array of allocated notable passives
  version: string; // Passive tree version (e.g., "3.25.0")
}
