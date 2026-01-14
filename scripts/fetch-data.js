#!/usr/bin/env node
/**
 * Data Fetch Script
 *
 * Downloads initial game data from PoE API and saves to data/ directory
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { poeAPIClient } from "../src/api/poe-api-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

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
    console.log(`✓ Downloaded ${filename}`);
  } catch (error) {
    console.error(`✗ Failed to save ${filename}:`, error);
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
    console.log("Fetching items from PoE API...");
    const items = await poeAPIClient.fetchItems();
    await saveData("items.json", items);

    // Fetch skills
    console.log("Fetching skills from PoE API...");
    const skills = await poeAPIClient.fetchSkills();
    await saveData("skills.json", skills);

    // Extract gems (support skills)
    const gems = skills.filter((skill) => skill.type === "support");
    await saveData("gems.json", gems);

    // Fetch passive tree
    console.log("Fetching passive tree from PoE API...");
    const passiveTree = await poeAPIClient.fetchPassiveTree();
    await saveData("passives.json", passiveTree.skills);

    // Extract keystones
    const keystones = passiveTree.skills.filter((skill) => skill.isKeystone);
    await saveData("keystones.json", keystones);

    console.log("\nData fetch complete!");
    console.log(`Saved ${items.length} items`);
    console.log(`Saved ${skills.length} skills (${gems.length} support gems)`);
    console.log(`Saved ${passiveTree.skills.length} passive skills (${keystones.length} keystones)`);
  } catch (error) {
    console.error("\nFatal error during data fetch:", error);
    process.exit(1);
  }
}

// Run the fetch
fetchAllData();
