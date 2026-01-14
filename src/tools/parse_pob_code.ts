/**
 * MCP Tool: parse_pob_code
 *
 * Parses a Path of Building build code and returns structured build data
 */

import type { ParsedBuild } from "../models/build.js";
import type { PassiveTree } from "../models/passive-tree.js";
import type { GearSlot } from "../models/gear.js";
import { parsePoBXML, validatePoBVersion } from "../parsers/pob-xml-parser.js";
import { parseCharacter } from "../parsers/character-parser.js";
import { parseSkills } from "../parsers/skill-parser.js";
import { parsePassives } from "../parsers/passive-parser.js";
import { parseGear } from "../parsers/gear-parser.js";
import { parseStats } from "../parsers/stats-parser.js";
import { getCachedBuild, setCachedBuild } from "../cache/build-cache.js";
import { wrapError } from "../utils/error-handler.js";

/**
 * Tool input schema (matches contracts/parse_pob_code.json)
 */
export const inputSchema = {
  type: "object",
  properties: {
    buildCode: {
      type: "string",
      description:
        "Base64-encoded, zlib-compressed Path of Building XML build code (max 1MB after decompression)",
    },
  },
  required: ["buildCode"],
};

/**
 * Tool handler
 */
export async function handler(args: { buildCode: string }) {
  const { buildCode } = args;

  try {
    // Check cache first
    const cached = getCachedBuild(buildCode);
    if (cached) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              build: cached,
            }),
          },
        ],
      };
    }

    // Parse PoB XML
    const pobXML = parsePoBXML(buildCode);

    // Validate version
    validatePoBVersion(pobXML);

    // Extract game version
    const gameVersion = pobXML.gameVersion || "3.25.0";

    // Parse all sections
    const character = parseCharacter(pobXML.Build);
    const skills = parseSkills(pobXML.Skills);
    const passives: PassiveTree = parsePassives(pobXML.Tree);
    const gear: GearSlot[] = parseGear(pobXML.Gear);
    const stats = parseStats(pobXML.Stats);

    // Build ParsedBuild object
    const build: ParsedBuild = {
      buildId: "", // Will be set by cache
      version: pobXML.version,
      gameVersion,
      character,
      skills,
      passives,
      gear,
      stats,
      parsedAt: new Date().toISOString(),
    };

    // Cache the result
    setCachedBuild(buildCode, build);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            build,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(wrapError(error, "parse_pob_code")),
        },
      ],
    };
  }
}

/**
 * Tool export for server registration
 */
export const parsePobCodeTool = {
  name: "parse_pob_code",
  description:
    "Parse a Path of Building build code and return structured build data",
  inputSchema,
  handler,
};
