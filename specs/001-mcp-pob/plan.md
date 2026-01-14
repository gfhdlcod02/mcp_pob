# Implementation Plan: MCP Server for Path of Building Integration

**Branch**: `001-mcp-pob` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mcp-pob/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an MCP (Model Context Protocol) server that enables AI assistants to parse Path of Building build codes, analyze character builds, and provide improvement suggestions for Path of Exile 2. The server will decode base64+zlib compressed PoB XML, extract structured build data (character info, skills, passives, gear), perform build analysis (defensive/offensive stats, playstyle classification, strengths/weaknesses), and generate actionable improvement suggestions. Technical approach uses Node.js/TypeScript with MCP SDK, implements XML parsing for PoB format, provides three core MCP tools (parse_pob_code, analyze_build, suggest_improvements), caches parsed builds for performance (3s cached, 10s cold), and auto-updates game data from official PoE API on league launches.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Node.js 20 LTS)
**Primary Dependencies**: @modelcontextprotocol/sdk (MCP server framework), fast-xml-parser (XML parsing), zlib (built-in), axios (HTTP client for PoE API)
**Storage**: In-memory caching (LRU cache) with optional Redis for distributed deployments
**Testing**: Tests NOT REQUIRED for MVP (per spec clarification - test-optional principle)
**Target Platform**: Cross-platform (Windows, macOS, Linux) - Node.js server
**Project Type**: Single project (MCP server with tool-based architecture)
**Performance Goals**: 3s for cached build parsing, 10s for cold starts; handle 1MB build codes
**Constraints**: Must parse PoB Community Fork XML format; PoE 2 only for MVP (PoE 1 deferred); auto-update from PoE API
**Scale/Scope**: Single server deployment initially; ~100 concurrent build parses; 3 MCP tools

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Specification Completeness
✅ PASS - All mandatory sections complete: User Scenarios (3 prioritized stories), Requirements (16 FRs), Success Criteria (8 measurable outcomes), Key Entities (9 defined), Edge Cases (8 identified), Clarifications (3 decisions recorded)

### User Story Independence
✅ PASS - All 3 user stories are independently testable:
- US1 (P1): Parse PoB codes - independently delivers structured build data
- US2 (P2): Analyze builds - works on parsed data from US1, independently valuable
- US3 (P3): Suggest improvements - uses analysis from US2, independently actionable

### Test Requirements
✅ PASS - Tests explicitly marked as NOT REQUIRED in spec (test-optional principle applies)

### Determinism
✅ PASS - No vague language found:
- All FRs use MUST/SHOULD with clear criteria
- Success criteria are measurable (e.g., "3 seconds cached", "95% accuracy")
- MCP tool input/output schemas will be JSON (defined in contracts)
- Error types specified (invalid base64, decompression failure, XML parsing error)

### Simplicity
✅ PASS - Design follows YAGNI:
- PoE 2 only for MVP (PoE 1 deferred - complexity justified)
- 3 core MCP tools (not over-engineered)
- In-memory caching (simple before distributed)
- XML parsing only (no full PoB calculation engine)

**Constitution Status**: ✅ ALL GATES PASSED - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-pob/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (being filled)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (domain model)
├── quickstart.md        # Phase 1 output (dev setup guide)
├── contracts/           # Phase 1 output (MCP tool schemas)
│   ├── parse_pob_code.json
│   ├── analyze_build.json
│   └── suggest_improvements.json
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
mcp-pob-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── tools/                   # MCP tool implementations
│   │   ├── parse_pob_code.ts    # US1: PoB code parsing
│   │   ├── analyze_build.ts     # US2: Build analysis
│   │   └── suggest_improvements.ts  # US3: Suggestions
│   ├── parsers/                 # XML parsing logic
│   │   ├── pob-xml-parser.ts    # PoB XML structure parser
│   │   ├── skill-parser.ts      # Skill/gem extraction
│   │   ├── passive-parser.ts    # Passive tree parsing
│   │   └── gear-parser.ts       # Gear/item extraction
│   ├── analyzers/               # Build analysis logic
│   │   ├── defensive-analyzer.ts    # Life, ES, resists
│   │   ├── offensive-analyzer.ts    # DPS, damage type
│   │   └── playstyle-detector.ts    # Clear/boss/hybrid
│   ├── suggesters/              # Improvement suggestions
│   │   ├── gem-suggester.ts     # Support gem recommendations
│   │   ├── passive-suggester.ts # Tree pathing suggestions
│   │   └── gear-suggester.ts    # Gear upgrade recommendations
│   ├── models/                  # Domain entities
│   │   ├── build.ts             # ParsedBuild entity
│   │   ├── character.ts         # Character entity
│   │   ├── skill-setup.ts       # SkillSetup entity
│   │   └── analysis.ts          # BuildAnalysis entity
│   ├── cache/                   # Caching layer
│   │   └── build-cache.ts       # LRU cache for parsed builds
│   ├── api/                     # PoE API integration
│   │   └── poe-api-client.ts    # Fetch game data updates
│   └── utils/                   # Utilities
│       ├── base64-decoder.ts    # PoB code decoding
│       ├── decompressor.ts      # Zlib handling
│       └── error-handler.ts     # Standardized error responses

├── data/                        # Static game data (auto-updated)
│   ├── skills.json              # PoE 2 skill definitions
│   ├── gems.json                # Support gem data
│   ├── items.json               # Base item types
│   ├── keystones.json           # Passive tree keystones
│   └── passives.json            # Passive tree data

├── package.json
├── tsconfig.json
└── README.md
```

**Structure Decision**: Single-project structure chosen because this is a standalone MCP server with no frontend or separate backend components. The server exposes tools via MCP protocol, not HTTP APIs. All code resides in `src/` with clear separation by functional responsibility (parsing, analysis, suggestions, models, caching).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| PoE 2 support only (MVP scope limitation) | PoE 2 is the newer game with evolving mechanics; PoE 1 has established but different data structures | Supporting both games simultaneously would require dual parsing logic, separate passive trees, and divergent gem/item datasets - increasing complexity by 2-3x without validating core value proposition first |
| Auto-update from PoE API (operational complexity) | PoE releases new leagues every ~3 months with balance changes; manual updates would cause rapid obsolescence | Static data would become outdated within 3 months, requiring manual data file updates and causing incorrect build analysis for new leagues |
