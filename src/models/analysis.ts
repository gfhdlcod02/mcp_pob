/**
 * Analysis and suggestion entity types
 */

/**
 * Playstyle classification
 */
export type PlaystyleType = "clear" | "boss" | "hybrid" | "unknown";

/**
 * Defensive rating classification
 */
export type DefensiveRating = "glass_cannon" | "moderate" | "tanky" | "uber_viable";

/**
 * Offensive rating classification
 */
export type OffensiveRating = "low" | "moderate" | "high" | "extreme";

/**
 * Suggestion category
 */
export type SuggestionCategory = "gems" | "passives" | "gear" | "utility";

/**
 * Suggestion priority
 */
export type SuggestionPriority = "critical" | "important" | "optional";

/**
 * Build analysis output entity
 */
export interface BuildAnalysis {
  strengths: string[]; // List of build strengths
  weaknesses: string[]; // List of build weaknesses
  playstyleType: PlaystyleType; // Detected playstyle
  defensiveRating: DefensiveRating; // Defensive capability assessment
  offensiveRating: OffensiveRating; // Offensive capability assessment
  analyzedAt: string; // ISO 8601 timestamp
}

/**
 * Suggestion entity
 */
export interface Suggestion {
  category: SuggestionCategory;
  priority: SuggestionPriority;
  description: string; // Human-readable description
  specificAction: string; // Exact action to take
  expectedImpact: string; // What this change will achieve
}
