/**
 * Passive Tree Parser
 *
 * Extracts passive tree nodes, keystones, and notables from the <Tree> section
 */

import type { PassiveTree, Keystone, Notable } from "../models/passive-tree.js";
import { readFileSync } from "fs";
import { join } from "path";

// Calculate __dirname relative to src/parsers/
const __dirname = join(process.cwd(), "src", "parsers");

/**
 * Keystones data (loaded from data/keystones.json)
 */
let keystonesData: any[] = [];

/**
 * Load keystones data from file
 */
function loadKeystonesData(): void {
  try {
    const dataPath = join(__dirname, "../../data", "keystones.json");
    const fileContent = readFileSync(dataPath, "utf-8");
    keystonesData = JSON.parse(fileContent);
  } catch (error) {
    console.error("Failed to load keystones data:", error);
    keystonesData = [];
  }
}

/**
 * Parses passive tree data from PoB Tree section
 * @param treeSection - PoB <Tree> XML section
 * @returns PassiveTree entity
 */
export function parsePassives(treeSection: any): PassiveTree {
  // Load keystones data on first call
  if (keystonesData.length === 0) {
    loadKeystonesData();
  }

  if (!treeSection) {
    return {
      totalPoints: 0,
      nodes: [],
      keystones: [],
      notables: [],
      version: "unknown",
    };
  }

  // Extract allocated node IDs
  const nodes = extractNodeIds(treeSection);

  // Extract version
  const version = treeSection.version || "unknown";

  // Identify keystones and notables from node IDs
  const { keystones, notables } = identifySpecialNodes(nodes);

  return {
    totalPoints: nodes.length,
    nodes,
    keystones,
    notables,
    version,
  };
}

/**
 * Extracts node IDs from tree section
 */
function extractNodeIds(treeSection: any): string[] {
  const nodes: string[] = [];

  // Extract from Specs node
  if (treeSection.Specs && treeSection.Specs.Spec) {
    const specs = Array.isArray(treeSection.Specs.Spec)
      ? treeSection.Specs.Spec
      : [treeSection.Specs.Spec];

    specs.forEach((spec: any) => {
      if (spec.nodes && spec.nodes.node) {
        const nodeIds = Array.isArray(spec.nodes.node)
          ? spec.nodes.node
          : [spec.nodes.node];

        nodeIds.forEach((nodeId: any) => {
          if (typeof nodeId === "string") {
            nodes.push(nodeId);
          } else if (typeof nodeId === "object" && nodeId.$) {
            nodes.push(nodeId.$);
          }
        });
      }
    });
  }

  return nodes;
}

/**
 * Identifies keystones and notables from node IDs
 */
function identifySpecialNodes(nodeIds: string[]): {
  keystones: Keystone[];
  notables: Notable[];
} {
  const keystonesMap = new Map(
    keystonesData.map((k) => [k.id, { id: k.id, name: k.name, effect: k.effects?.join("; ") || "" }])
  );

  const keystones: Keystone[] = [];
  const notables: Notable[] = [];

  nodeIds.forEach((nodeId) => {
    if (keystonesMap.has(nodeId)) {
      const keystone = keystonesMap.get(nodeId)!;
      keystones.push(keystone);
    }
  });

  return { keystones, notables };
}
