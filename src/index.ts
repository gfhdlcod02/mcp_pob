#!/usr/bin/env node
/**
 * MCP Server for Path of Building Integration
 *
 * Entry point that initializes stdio transport and registers MCP tools
 *
 * Environment Variables:
 * - POE_API_KEY: PoE API key for game data updates (optional)
 * - REDIS_URL: Redis URL for distributed cache (optional, defaults to in-memory)
 * - CACHE_SIZE: Maximum cache entries (default: 100)
 * - CACHE_TTL: Cache TTL in milliseconds (default: 3600000 = 1 hour)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parsePobCodeTool } from "./tools/parse_pob_code.js";
import { analyzeBuildTool } from "./tools/analyze_build.js";
import { suggestImprovementsTool } from "./tools/suggest_improvements.js";

/**
 * Environment configuration
 */
const config = {
  poeApiKey: process.env.POE_API_KEY,
  redisUrl: process.env.REDIS_URL,
  cacheSize: parseInt(process.env.CACHE_SIZE || "100", 10),
  cacheTtl: parseInt(process.env.CACHE_TTL || "3600000", 10),
};

/**
 * Initialize MCP server
 */
const server = new Server(
  {
    name: "mcp-pob-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle tool listing
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "parse_pob_code",
        description:
          "Parse a Path of Building build code and return structured build data",
        inputSchema: parsePobCodeTool.inputSchema,
      },
      {
        name: "analyze_build",
        description:
          "Analyze a parsed build to identify strengths, weaknesses, and playstyle",
        inputSchema: analyzeBuildTool.inputSchema,
      },
      {
        name: "suggest_improvements",
        description:
          "Generate actionable improvement suggestions for a build",
        inputSchema: suggestImprovementsTool.inputSchema,
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    const error = {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "No arguments provided to tool call",
      },
    };
    console.error(`[${new Date().toISOString()}] Tool call error: No arguments for ${name}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(error),
        },
      ],
    };
  }

  try {
    console.error(`[${new Date().toISOString()}] Executing tool: ${name}`);

    let result;
    switch (name) {
      case "parse_pob_code":
        result = await parsePobCodeTool.handler(args as { buildCode: string });
        break;

      case "analyze_build":
        result = await analyzeBuildTool.handler(args as { build: any });
        break;

      case "suggest_improvements":
        result = await suggestImprovementsTool.handler(args as { build: any; analysis: any });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    console.error(`[${new Date().toISOString()}] Tool ${name} executed successfully`);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[${new Date().toISOString()}] Tool ${name} execution error:`, errorMessage);
    if (errorStack) {
      console.error(`[${new Date().toISOString()}] Stack trace:`, errorStack);
    }

    // Return user-friendly error response
    const errorResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: {
              code: "EXECUTION_ERROR",
              message: `Tool execution failed: ${errorMessage}`,
            },
          }),
        },
      ],
    };

    return errorResponse;
  }
});

/**
 * Start server with stdio transport
 */
async function main() {
  console.error("=".repeat(60));
  console.error("MCP-PoB Server starting...");
  console.error(`Version: 1.0.0`);
  console.error(`Node.js: ${process.version}`);
  console.error(`Timestamp: ${new Date().toISOString()}`);
  console.error("=".repeat(60));

  // Log configuration
  console.error(`Configuration:`);
  console.error(`  - PoE API Key: ${config.poeApiKey ? "configured" : "not configured (using cached data)"}`);
  console.error(`  - Redis URL: ${config.redisUrl || "in-memory cache"}`);
  console.error(`  - Cache Size: ${config.cacheSize} entries`);
  console.error(`  - Cache TTL: ${config.cacheTtl}ms (${config.cacheTtl / 1000 / 60} minutes)`);

  // Initialize stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("=".repeat(60));
  console.error("MCP-PoB Server running on stdio");
  console.error("Registered tools:");
  console.error(`  - parse_pob_code: Parse Path of Building build codes`);
  console.error(`  - analyze_build: Analyze build strengths/weaknesses`);
  console.error(`  - suggest_improvements: Generate improvement suggestions`);
  console.error("=".repeat(60));
  console.error("Server ready. Waiting for tool calls...");
}

main().catch((error) => {
  console.error("=".repeat(60));
  console.error("FATAL ERROR during server startup:");
  console.error(error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error("\nStack trace:");
    console.error(error.stack);
  }
  console.error("=".repeat(60));
  process.exit(1);
});
