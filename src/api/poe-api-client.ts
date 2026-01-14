/**
 * PoE API Client
 *
 * Fetches game data from official Path of Exile API
 */

import axios, { type AxiosInstance } from "axios";

/**
 * PoE API client configuration
 */
const POE_API_BASE = "https://api.pathofexile.com";
const API_KEY = process.env.POE_API_KEY || "";
const RATE_LIMIT_DELAY = 1000; // 1 request per second per PoE API policy

/**
 * Game data types fetched from PoE API
 */
export interface PoEItemData {
  id: string;
  name: string;
  type: string;
  baseType?: string;
}

export interface PoESkillData {
  id: string;
  name: string;
  type: "active" | "support";
}

export interface PoEPassiveSkill {
  id: string;
  name: string;
  effects?: string[];
  isKeystone: boolean;
  isNotable: boolean;
}

export interface PoELeague {
  id: string;
  name: string;
}

/**
 * PoE API client class
 */
export class PoEAPIClient {
  private client: AxiosInstance;
  private lastRequestTime = 0;

  constructor(apiKey: string = API_KEY) {
    this.client = axios.create({
      baseURL: POE_API_BASE,
      headers: {
        "User-Agent": "MCP-PoB-Server/1.0.0",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
  }

  /**
   * Rate limiting helper - ensures 1 request/second
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch all item data from PoE API
   */
  async fetchItems(): Promise<PoEItemData[]> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get("/api/data/items");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch items from PoE API:", error);
      throw error;
    }
  }

  /**
   * Fetch all skill data from PoE API
   */
  async fetchSkills(): Promise<PoESkillData[]> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get("/api/data/skills");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch skills from PoE API:", error);
      throw error;
    }
  }

  /**
   * Fetch passive tree snapshot from PoE API
   */
  async fetchPassiveTree(): Promise<{
    version: string;
    skills: PoEPassiveSkill[];
  }> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get("/api/data/passive-skills");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch passive tree from PoE API:", error);
      throw error;
    }
  }

  /**
   * Fetch current league information
   */
  async fetchLeagues(): Promise<PoELeague[]> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get("/api/leagues");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch leagues from PoE API:", error);
      throw error;
    }
  }

  /**
   * Check if a new league has started (triggers data update)
   */
  async checkForNewLeague(): Promise<boolean> {
    try {
      await this.fetchLeagues();
      // TODO: Compare with stored league info to detect new league
      // For now, always return false
      return false;
    } catch (error) {
      console.error("Failed to check for new league:", error);
      return false;
    }
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const poeAPIClient = new PoEAPIClient();
