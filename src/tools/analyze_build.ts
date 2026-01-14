/**
 * MCP Tool: analyze_build
 *
 * Analyzes a parsed build to identify strengths, weaknesses, and playstyle
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import { analyzeDefense } from "../analyzers/defensive-analyzer.js";
import { analyzeOffense } from "../analyzers/offensive-analyzer.js";
import { detectPlaystyle } from "../analyzers/playstyle-detector.js";
import { detectStrengths } from "../analyzers/strength-detector.js";
import { detectWeaknesses } from "../analyzers/weakness-detector.js";

/**
 * Tool input schema (matches contracts/analyze_build.json)
 */
export const inputSchema = {
  type: "object",
  properties: {
    build: {
      type: "object",
      description: "Parsed build data from parse_pob_code tool",
    },
  },
  required: ["build"],
};

/**
 * Estimate missing stats from gear and passives
 */
function estimateMissingStats(build: ParsedBuild): ParsedBuild {
  const estimatedBuild = { ...build };
  const statNames = new Set(build.stats.map((s) => s.name.toLowerCase()));

  // Estimate life if missing
  if (!statNames.has("life") && !statNames.has("maximum life")) {
    let totalLife = 0;
    for (const gear of build.gear) {
      if (gear.affixes) {
        for (const affix of gear.affixes) {
          const match = affix.text.match(/(\d+)\s*to\s*maximum life/i);
          if (match) {
            totalLife += parseInt(match[1], 10);
          }
        }
      }
    }
    // Base life approximation by level
    const baseLife = 38 + build.character.level * 12;
    if (totalLife > 0) {
      estimatedBuild.stats = [
        ...build.stats,
        { name: "Life", value: baseLife + totalLife, source: "estimated" },
      ];
    }
  }

  // Estimate ES if missing
  if (!statNames.has("energy shield") && !statNames.has("maximum energy shield")) {
    let totalES = 0;
    for (const gear of build.gear) {
      if (gear.affixes) {
        for (const affix of gear.affixes) {
          const match = affix.text.match(/(\d+)\s*to\s*maximum energy shield/i);
          if (match) {
            totalES += parseInt(match[1], 10);
          }
        }
      }
    }
    if (totalES > 0) {
      estimatedBuild.stats = [
        ...estimatedBuild.stats,
        { name: "Energy Shield", value: totalES, source: "estimated" },
      ];
    }
  }

  return estimatedBuild;
}

/**
 * Tool handler - implements build analysis
 */
export async function handler(args: { build: ParsedBuild }) {
  const { build } = args;

  // Estimate missing stats from gear
  const buildWithEstimatedStats = estimateMissingStats(build);

  // Run all analyzers
  const defensiveAnalysis = analyzeDefense(buildWithEstimatedStats);
  const offensiveAnalysis = analyzeOffense(buildWithEstimatedStats);
  const playstyleDetection = detectPlaystyle(buildWithEstimatedStats);
  const strengthDetection = detectStrengths(buildWithEstimatedStats);
  const weaknessDetection = detectWeaknesses(buildWithEstimatedStats);

  // Combine strengths with keystone-specific highlights
  const strengths = [
    ...strengthDetection.categories.keystones,
    ...strengthDetection.categories.defenses,
    ...strengthDetection.categories.offenses,
    ...strengthDetection.categories.utilities,
  ];

  // Combine all weaknesses
  const weaknesses = [
    ...weaknessDetection.categories.defenses,
    ...weaknessDetection.categories.offenses,
    ...weaknessDetection.categories.utilities,
  ];

  // Build final analysis
  const analysis: BuildAnalysis = {
    strengths,
    weaknesses,
    playstyleType: playstyleDetection.type,
    defensiveRating: defensiveAnalysis.rating,
    offensiveRating: offensiveAnalysis.rating,
    analyzedAt: new Date().toISOString(),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          analysis,
        }),
      },
    ],
  };
}

/**
 * Tool export for server registration
 */
export const analyzeBuildTool = {
  name: "analyze_build",
  description:
    "Analyze a parsed build to identify strengths, weaknesses, and playstyle",
  inputSchema,
  handler,
};
