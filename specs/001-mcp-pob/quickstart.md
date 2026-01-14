# Quickstart: MCP Server for Path of Building Integration

**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Date**: 2026-01-15

## Overview

This guide will help you set up and run the MCP-PoB server locally for development and testing. The server exposes three MCP tools for parsing Path of Building build codes, analyzing builds, and generating improvement suggestions.

**Prerequisites**:
- Node.js 20 LTS or higher
- npm or yarn package manager
- Git (for cloning repository)
- (Optional) PoE API key for game data updates

---

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository (replace with actual repo URL)
git clone https://github.com/your-org/mcp-pob-server.git
cd mcp-pob-server

# Install dependencies
npm install
```

**Expected output**: Dependencies installed successfully (~50 packages)

---

## Step 2: Obtain PoE API Key (Optional but Recommended)

1. Visit [Path of Exile API](https://www.pathofexile.com/developer/api)
2. Log in with your PoE account
3. Create a new API key with "read" permissions
4. Copy the API key

**Set environment variable**:
```bash
# Linux/macOS
export POE_API_KEY="your_api_key_here"

# Windows PowerShell
$env:POE_API_KEY="your_api_key_here"

# Windows CMD
set POE_API_KEY=your_api_key_here
```

**Note**: Without API key, the server will use cached game data (may be outdated).

---

## Step 3: Download Initial Game Data

The server requires PoE 2 game data (skills, gems, items, passive tree). Run the data fetch script:

```bash
npm run fetch-data
```

**Expected output**:
```
Fetching skills from PoE API...
✓ Downloaded 245 skills
Fetching gems from PoE API...
✓ Downloaded 120 support gems
Fetching items from PoE API...
✓ Downloaded 890 base items
Fetching passive tree from PoE API...
✓ Downloaded 1,234 passive nodes
Data fetch complete!
```

**Files created** in `data/` directory:
- `skills.json`
- `gems.json`
- `items.json`
- `keystones.json`
- `passives.json`

---

## Step 4: Start the MCP Server

```bash
npm start
```

**Expected output**:
```
MCP-PoB Server starting...
MCP SDK version: 1.0.3
Listening on stdio...
Registered tools:
  - parse_pob_code
  - analyze_build
  - suggest_improvements
Cache configured: 100 entries, 1h TTL
Game data loaded: 3.25.0
Server ready.
```

The server is now running and waiting for MCP tool calls via stdin/stdout.

---

## Step 5: Test the Tools

### Test 1: Parse a PoB Build Code

Create a test file `test-parse.js`:

```javascript
const { MCPClient } = require('@modelcontextprotocol/sdk');

const client = new MCPClient({
  name: 'test-client',
  version: '1.0.0'
});

async function testParse() {
  const buildCode = 'eJztwTEBAAAAwqD1T20JT6AAADgcw+8...'; // Replace with real PoB code

  const result = await client.callTool('parse_pob_code', {
    buildCode: buildCode
  });

  console.log('Parse result:', JSON.stringify(result, null, 2));
}

testParse().catch(console.error);
```

Run the test:
```bash
node test-parse.js
```

**Expected output** (truncated):
```json
{
  "success": true,
  "build": {
    "buildId": "a1b2c3d4e5f6...",
    "version": "1.4.170",
    "gameVersion": "3.25.0",
    "character": {
      "class": "Witch",
      "ascendancy": "Necromancer",
      "level": 92,
      "league": "Affliction"
    },
    "skills": [
      {
        "id": "skill-1",
        "skillName": "Kinetic Blast",
        "gemLevel": 20,
        "quality": 20,
        "supports": [...],
        "linkCount": 5,
        "isMainSkill": true
      }
    ],
    "passives": {...},
    "gear": [...],
    "stats": [...],
    "parsedAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### Test 2: Analyze the Parsed Build

```javascript
async function testAnalyze() {
  const parsedBuild = { /* from Test 1 */ };

  const result = await client.callTool('analyze_build', {
    build: parsedBuild
  });

  console.log('Analysis result:', JSON.stringify(result, null, 2));
}

testAnalyze().catch(console.error);
```

**Expected output**:
```json
{
  "success": true,
  "analysis": {
    "strengths": [
      "Chaos immunity from Chaos Inoculation",
      "75% all elemental resistances",
      "Energy Shield > 5000"
    ],
    "weaknesses": [
      "No curse setup for damage amplification",
      "Low movement speed (15%) - clear speed impacted"
    ],
    "playstyleType": "boss",
    "defensiveRating": "tanky",
    "offensiveRating": "high",
    "analyzedAt": "2026-01-15T10:30:05Z"
  }
}
```

---

### Test 3: Generate Improvement Suggestions

```javascript
async function testSuggest() {
  const parsedBuild = { /* from Test 1 */ };
  const analysis = { /* from Test 2 */ };

  const result = await client.callTool('suggest_improvements', {
    build: parsedBuild,
    analysis: analysis
  });

  console.log('Suggestions:', JSON.stringify(result, null, 2));
}

testSuggest().catch(console.error);
```

**Expected output**:
```json
{
  "success": true,
  "suggestions": [
    {
      "category": "utility",
      "priority": "important",
      "description": "Add curse setup for damage amplification",
      "specificAction": "Add Blasphemy Support + Elemental Weakness to 4-link",
      "expectedImpact": "Increases enemy damage taken by 30-40%, significantly boosting DPS"
    },
    {
      "category": "passives",
      "priority": "important",
      "description": "Increase movement speed",
      "specificAction": "Allocate 3 nodes towards 'Lightning Walker' notable",
      "expectedImpact": "Increases movement speed by 12%, improving clear speed"
    }
  ]
}
```

---

## Step 6: Integration with AI Assistant

### Claude Desktop Integration

1. Create/Edit Claude Desktop config file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add MCP server configuration:
```json
{
  "mcpServers": {
    "mcp-pob": {
      "command": "node",
      "args": ["D:/path/to/mcp-pob-server/src/index.ts"],
      "env": {
        "POE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

3. Restart Claude Desktop

4. Test in Claude:
   - "Parse this PoB build code: [paste code]"
   - "Analyze my build's strengths and weaknesses"
   - "Suggest improvements for my build"

---

## Development Workflow

### Project Structure

```
mcp-pob-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── tools/                   # MCP tool implementations
│   ├── parsers/                 # XML parsing logic
│   ├── analyzers/               # Build analysis logic
│   ├── suggesters/              # Improvement suggestions
│   ├── models/                  # Domain entities
│   ├── cache/                   # LRU cache
│   ├── api/                     # PoE API client
│   └── utils/                   # Utilities
├── data/                        # Game data (auto-updated)
├── tests/                       # (Tests not required for MVP)
├── package.json
└── tsconfig.json
```

### Running in Development Mode

```bash
# Watch mode (auto-restart on file changes)
npm run dev

# Type checking only
npm run type-check

# Linting
npm run lint
```

---

## Troubleshooting

### Issue: "Failed to fetch game data from PoE API"

**Cause**: API key missing or invalid

**Solution**:
1. Verify `POE_API_KEY` environment variable is set
2. Check API key has "read" permissions
3. Verify API key is not expired

**Fallback**: Server will use cached data in `data/` directory

---

### Issue: "Invalid PoB code: Not a valid base64 string"

**Cause**: Input is not valid base64

**Solution**: Ensure PoB code is copied exactly from Path of Building (no extra spaces or newlines)

---

### Issue: "Unsupported PoB version"

**Cause**: PoB version is too old (pre-Community Fork 1.4.170)

**Solution**: Update Path of Building to latest Community Fork version

---

### Issue: "Passive tree fetch failed"

**Cause**: Passive tree URL in PoB code is invalid or unreachable

**Solution**: Build will still parse, but passive data will be empty. Check PoB code was exported correctly.

---

### Issue: "Out of memory when parsing large build code"

**Cause**: Build code exceeds 1MB limit

**Solution**: Simplify build (remove unused items, skills) or increase Node.js memory:
```bash
node --max-old-space-size=4096 src/index.ts
```

---

## Performance Tips

### 1. Enable Caching

Caching is enabled by default (100 entries, 1h TTL). Adjust in `src/cache/build-cache.ts`:
```typescript
const cache = new LRUCache<string, ParsedBuild>({
  max: 200, // Increase cache size
  ttl: 1000 * 60 * 60 * 2 // 2 hours TTL
});
```

### 2. Use Redis for Distributed Deployments

1. Install Redis client:
```bash
npm install redis
```

2. Set environment variable:
```bash
export REDIS_URL="redis://localhost:6379"
```

3. Server will automatically use Redis backend

---

### 3. Pre-fetch Game Data

Before starting server, run data fetch to populate cache:
```bash
npm run fetch-data
npm start
```

Server will load data from disk instead of fetching from API on startup.

---

## Next Steps

1. **Read the full specification**: [spec.md](./spec.md)
2. **Review implementation plan**: [plan.md](./plan.md)
3. **Study data model**: [data-model.md](./data-model.md)
4. **Understand MCP tool contracts**: [contracts/](./contracts/)
5. **Contribute**: See CONTRIBUTING.md (if exists)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-pob-server/issues)
- **Discord**: [Join our Discord](https://discord.gg/your-server)
- **Email**: support@example.com

---

## License

MIT License - See [LICENSE](../LICENSE) file for details
