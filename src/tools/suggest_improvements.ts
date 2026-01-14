/**
 * MCP Tool: suggest_improvements
 *
 * Generates actionable improvement suggestions for a build
 */

import type { ParsedBuild } from "../models/build.js";
import type { BuildAnalysis } from "../models/analysis.js";
import type { Suggestion } from "../models/analysis.js";
import { suggestGemImprovements } from "../suggesters/gem-suggester.js";
import { suggestPassiveImprovements } from "../suggesters/passive-suggester.js";
import { suggestGearImprovements } from "../suggesters/gear-suggester.js";
import { suggestUtilityImprovements } from "../suggesters/utility-suggester.js";

/**
 * Tool input schema (matches contracts/suggest_improvements.json)
 */
export const inputSchema = {
  type: "object",
  properties: {
    build: {
      type: "object",
      description: "Parsed build data from parse_pob_code tool",
    },
    analysis: {
      type: "object",
      description: "Build analysis from analyze_build tool",
    },
  },
  required: ["build", "analysis"],
};

/**
 * Priority scoring based on weakness severity
 * Maps detected weaknesses to suggestion priorities
 */
function scoreSuggestionPriority(
  suggestion: Suggestion,
  analysis: BuildAnalysis
): Suggestion {
  const scored = { ...suggestion };

  // Critical indicators
  const criticalWeaknesses = [
    "uncapped",
    "low life",
    "no chaos",
    "low energy shield",
    "vulnerable",
    "empty",
  ];

  // Check if suggestion addresses a critical weakness
  const addressesCriticalWeakness = criticalWeaknesses.some((indicator) =>
    analysis.weaknesses.some((w) => w.toLowerCase().includes(indicator))
  );

  if (addressesCriticalWeakness && scored.priority !== "critical") {
    scored.priority = "critical";
  }

  // Downgrade optional suggestions if build is already strong
  // Note: Skip downgrading for critical priorities
  if (scored.priority !== "critical") {
    if (
      (analysis.defensiveRating === "uber_viable" || analysis.defensiveRating === "tanky") &&
      (scored.category === "passives" || scored.category === "gear") &&
      scored.priority === "important"
    ) {
      scored.priority = "optional";
    }

    if (
      analysis.offensiveRating === "extreme" &&
      scored.category === "gems" &&
      scored.priority === "important"
    ) {
      scored.priority = "optional";
    }
  }

  return scored;
}

/**
 * Deduplicate suggestions by category and description
 */
function deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const unique: Suggestion[] = [];

  for (const suggestion of suggestions) {
    const key = `${suggestion.category}:${suggestion.description}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(suggestion);
    }
  }

  return unique;
}

/**
 * Sort suggestions by priority and impact
 */
function sortSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const priorityWeight = {
    critical: 3,
    important: 2,
    optional: 1,
  };

  return suggestions.sort((a, b) => {
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Within same priority, sort by category
    const categoryOrder = ["gear", "passives", "gems", "utility"];
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);

    return aIndex - bIndex;
  });
}

/**
 * Limit suggestions per category to prevent overwhelming output
 */
function limitSuggestions(suggestions: Suggestion[], maxPerCategory: number = 5): Suggestion[] {
  const categoryCount: Record<string, number> = {};
  const limited: Suggestion[] = [];

  for (const suggestion of suggestions) {
    const count = categoryCount[suggestion.category] || 0;

    if (count < maxPerCategory || suggestion.priority === "critical") {
      limited.push(suggestion);
      categoryCount[suggestion.category] = count + 1;
    }
  }

  return limited;
}

/**
 * Tool handler - implements improvement suggestion generation
 */
export async function handler(args: {
  build: ParsedBuild;
  analysis: BuildAnalysis;
}) {
  const { build, analysis } = args;

  // Generate suggestions from all suggesters
  const gemSuggestions = suggestGemImprovements(build, analysis);
  const passiveSuggestions = suggestPassiveImprovements(build, analysis);
  const gearSuggestions = suggestGearImprovements(build, analysis);
  const utilitySuggestions = suggestUtilityImprovements(build, analysis);

  // Combine all suggestions
  let allSuggestions = [
    ...gemSuggestions,
    ...passiveSuggestions,
    ...gearSuggestions,
    ...utilitySuggestions,
  ];

  // Score and adjust priorities based on analysis
  allSuggestions = allSuggestions.map((s) => scoreSuggestionPriority(s, analysis));

  // Deduplicate
  allSuggestions = deduplicateSuggestions(allSuggestions);

  // Sort by priority
  allSuggestions = sortSuggestions(allSuggestions);

  // Limit suggestions per category
  allSuggestions = limitSuggestions(allSuggestions, 5);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          success: true,
          suggestions: allSuggestions,
        }),
      },
    ],
  };
}

/**
 * Tool export for server registration
 */
export const suggestImprovementsTool = {
  name: "suggest_improvements",
  description: "Generate actionable improvement suggestions for a build",
  inputSchema,
  handler,
};
