#!/usr/bin/env node
/**
 * Data Fetch Script
 *
 * Downloads initial game data from PoE API and saves to data/ directory
 * Note: PoE API endpoints may not be publicly available, so we use stub data as fallback
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { poeAPIClient } from "../src/api/poe-api-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

/**
 * Stub data for when PoE API is unavailable
 */
const STUB_DATA = {
  items: [
    { id: "1", name: "Glorious Plate", type: "Body Armour" },
    { id: "2", name: "Varnished Coat", type: "Body Armour" },
    { id: "3", name: "Spiraled Bow", type: "Bow" },
  ],
  skills: [
    { id: "1", name: "Kinetic Blast", type: "active" },
    { id: "2", name: "Tornado Shot", type: "active" },
    { id: "3", name: "Spark", type: "active" },
    { id: "4", name: "Greater Multiple Projectiles", type: "support" },
    { id: "5", name: "Multistrike", type: "support" },
    { id: "6", name: "Controlled Destruction", type: "support" },
  ],
  passives: [
    { id: "16226", name: "Chaos Inoculation", isKeystone: true, isNotable: false },
    { id: "18420", name: "Mind Over Matter", isKeystone: true, isNotable: false },
    { id: "21852", name: "Iron Reflexes", isKeystone: true, isNotable: false },
    { id: "31863", name: "Elemental Overload", isKeystone: true, isNotable: false },
    { id: "61420", name: "Heart of the Oak", isKeystone: false, isNotable: true },
    { id: "26196", name: "Nullification", isKeystone: false, isNotable: true },
  ],
};

/**
 * Ensures data directory exists
 */
async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create data directory:", error);
    throw error;
  }
}

/**
 * Save JSON data to file
 */
async function saveData(filename, data) {
  const filepath = join(DATA_DIR, filename);
  try {
    await writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✓ Saved ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to save ${filename}:`, error);
    throw error;
  }
}

/**
 * Fetch data with fallback to stub data
 */
async function fetchWithFallback(type, fetchFn, stubData) {
  try {
    console.log(`Fetching ${type} from PoE API...`);
    const data = await fetchFn();
    console.log(`✓ Successfully fetched ${type}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404 || error.code === "ERR_BAD_REQUEST") {
      console.log(`⚠ PoE API endpoint not found, using stub data for ${type}`);
      return stubData;
    }
    throw error;
  }
}

/**
 * Main fetch function
 */
async function fetchAllData() {
  console.log("Fetching game data from PoE API...\n");

  await ensureDataDir();

  try {
    // Fetch items
    const items = await fetchWithFallback("items", () => poeAPIClient.fetchItems(), STUB_DATA.items);
    await saveData("items.json", items);

    // Fetch skills
    const skills = await fetchWithFallback("skills", () => poeAPIClient.fetchSkills(), STUB_DATA.skills);
    await saveData("skills.json", skills);

    // Extract gems (support skills)
    const gems = skills.filter((skill) => skill.type === "support");
    await saveData("gems.json", gems);

    // Fetch passive tree
    const passiveTree = await fetchWithFallback(
      "passive tree",
      () => poeAPIClient.fetchPassiveTree(),
      { skills: STUB_DATA.passives }
    );
    await saveData("passives.json", passiveTree.skills);

    // Extract keystones
    const keystones = passiveTree.skills.filter((skill) => skill.isKeystone);
    await saveData("keystones.json", keystones);

    console.log("\n" + "=".repeat(50));
    console.log("Data fetch complete!");
    console.log(`Saved ${items.length} items`);
    console.log(`Saved ${skills.length} skills (${gems.length} support gems)`);
    console.log(`Saved ${passiveTree.skills.length} passive skills (${keystones.length} keystones)`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\nFatal error during data fetch:", error);
    process.exit(1);
  }
}

// Run the fetch
fetchAllData();
