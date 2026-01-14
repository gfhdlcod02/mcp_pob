# MCP Server for Path of Building Integration

An MCP (Model Context Protocol) server that enables AI assistants to parse Path of Building build codes, analyze character builds, and provide improvement suggestions for Path of Exile 2.

## Features

- **Parse PoB Codes**: Extract structured build data from base64-encoded Path of Building build codes
- **Analyze Builds**: Identify strengths, weaknesses, and playstyle focus (clear/boss/hybrid)
- **Suggest Improvements**: Get actionable recommendations for gems, passives, gear, and utility

## Tech Stack

- **Language**: TypeScript 5.3+ (Node.js 20 LTS)
- **Framework**: @modelcontextprotocol/sdk
- **Dependencies**: fast-xml-parser, axios, lru-cache, winston
- **Storage**: In-memory LRU cache (100 entries, 1h TTL)

## Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- npm or yarn
- (Optional) PoE API key for game data updates

### Installation

```bash
# Install dependencies
npm install

# Download initial game data
npm run fetch-data

# Start the server
npm start
```

### Configuration

Set environment variables (optional):

```bash
# PoE API key for game data updates
export POE_API_KEY="your_api_key_here"

# Optional: Redis for distributed cache
export REDIS_URL="redis://localhost:6379"

# Optional: Cache configuration
export CACHE_SIZE="100"
export CACHE_TTL="3600000"  # 1 hour in milliseconds
```

## MCP Tools

### parse_pob_code

Parses a Path of Building build code and returns structured build data.

**Input**: Base64-encoded PoB code
**Output**: ParsedBuild with character, skills, passives, gear, stats

### analyze_build

Analyzes a parsed build to identify strengths, weaknesses, and playstyle.

**Input**: ParsedBuild from parse_pob_code
**Output**: BuildAnalysis with strengths, weaknesses, playstyle type, ratings

### suggest_improvements

Generates actionable improvement suggestions based on build analysis.

**Input**: ParsedBuild + BuildAnalysis
**Output**: Prioritized list of suggestions (critical/important/optional)

## Performance

- **Cached parse**: <3 seconds
- **Cold parse**: <10 seconds
- **Cache hit rate**: ~60-80%

## Claude Desktop Integration

Add to Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-pob": {
      "command": "node",
      "args": ["D:/path/to/mcp-pob/src/index.ts"],
      "env": {
        "POE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

```bash
# Watch mode (auto-restart)
npm run dev

# Type checking
npm run type-check
```

## License

MIT
