# Tasks: MCP Server for Path of Building Integration

**Input**: Design documents from `/specs/001-mcp-pob/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT REQUIRED for MVP (per specification - test-optional principle)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `data/` at repository root
- Paths shown below match the plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure per plan.md (src/, data/, and subdirectories)
- [X] T002 Initialize TypeScript project with npm init and install dependencies: @modelcontextprotocol/sdk, fast-xml-parser, axios, lru-cache, typescript, tsx
- [X] T003 [P] Create tsconfig.json with TypeScript 5.3+ configuration (ES2022, strict mode, module resolution node16)
- [X] T004 [P] Create package.json with scripts: start (tsx src/index.ts), dev (tsx watch), fetch-data (node scripts/fetch-data.ts)
- [X] T005 [P] Create .gitignore for node_modules/, .env, data/*.json, dist/
- [X] T006 Create README.md with project overview, setup instructions, and MCP tool descriptions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create error handler utilities in src/utils/error-handler.ts with standardized error response types (INVALID_BASE64, DECOMPRESSION_ERROR, INVALID_XML, UNSUPPORTED_VERSION, MISSING_REQUIRED_FIELD, PASSIVE_TREE_ERROR)
- [X] T008 [P] Create base64 decoder utility in src/utils/base64-decoder.ts with validation logic
- [X] T009 [P] Create zlib decompressor utility in src/utils/decompressor.ts with error handling
- [X] T010 [P] Create LRU cache module in src/cache/build-cache.ts with max 100 entries, 1h TTL, SHA-256 key generation
- [X] T011 [P] Create TypeScript type definitions for all core entities in src/models/build.ts (ParsedBuild, BuildCode, Character, SkillSetup, SupportGem)
- [X] T012 [P] Create TypeScript type definitions for passive tree entities in src/models/passive-tree.ts (PassiveTree, Keystone, Notable)
- [X] T013 [P] Create TypeScript type definitions for gear entities in src/models/gear.ts (GearSlot, Affix, GearSlotType enum)
- [X] T014 [P] Create TypeScript type definitions for stat and analysis entities in src/models/analysis.ts (Stat, BuildAnalysis, Suggestion, all enums)
- [X] T015 Create MCP server entry point in src/index.ts that initializes stdio transport and registers tools (parse_pob_code, analyze_build, suggest_improvements)
- [X] T016 Create PoE API client in src/api/poe-api-client.ts with methods to fetch skills, gems, items, passive tree data, and league info
- [X] T017 Create data fetch script in scripts/fetch-data.ts that downloads initial game data from PoE API and saves to data/ directory
- [X] T018 Create empty data files in data/ directory: skills.json, gems.json, items.json, keystones.json, passives.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Parse PoB Build Codes (Priority: P1) 🎯 MVP

**Goal**: Enable AI assistants to extract structured build data from Path of Building build codes

**Independent Test**: Can be tested by providing valid PoB build codes and verifying that all key build elements (class, skills, gear, passives) are correctly extracted and returned in structured JSON format

### Implementation for User Story 1

- [X] T019 [P] [US1] Create PoB XML structure parser in src/parsers/pob-xml-parser.ts that decodes base64, decompresses zlib, and extracts root XML element
- [X] T020 [P] [US1] Create character parser in src/parsers/character-parser.ts that extracts class, ascendancy, level, league from <Build> section
- [X] T021 [P] [US1] Create skill parser in src/parsers/skill-parser.ts that extracts main skills, support gems, gem levels, quality, link count from <Skills> section
- [X] T022 [P] [US1] Create passive tree parser in src/parsers/passive-parser.ts that extracts node IDs, keystones, notables from <Tree> section and matches against data/keystones.json
- [X] T023 [P] [US1] Create gear parser in src/parsers/gear-parser.ts that extracts slot, item name, base type, affixes, implicits, corruption from <Gear> section
- [X] T024 [P] [US1] Create stats extractor in src/parsers/stats-parser.ts that extracts explicit stats from <Stats> section or marks as estimated/missing
- [X] T025 [US1] Implement parse_pob_code MCP tool in src/tools/parse_pob_code.ts that orchestrates all parsers, validates input, returns ParsedBuild or error response per contracts/parse_pob_code.json
- [X] T026 [US1] Integrate cache layer in parse_pob_code.ts to check build-cache.ts before parsing, store results after successful parse
- [X] T027 [US1] Add version validation in parse_pob_code.ts to check PoB version >= 1.4.170, game version >= 3.20.0, flag unsupported features
- [X] T028 [US1] Add partial data handling in parse_pob_code.ts to return available data with null/empty for missing sections (no error)
- [X] T029 [US1] Register parse_pob_code tool in src/index.ts with input schema validation using contracts/parse_pob_code.json

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can parse PoB codes and get structured build data.

---

## Phase 4: User Story 2 - Analyze Build Strengths & Weaknesses (Priority: P2)

**Goal**: Enable AI assistants to evaluate build strengths, weaknesses, and playstyle focus

**Independent Test**: Can be tested by providing parsed build data and verifying that analysis output correctly identifies defensive/offensive stats, playstyle focus, and specific weaknesses

### Implementation for User Story 2

- [X] T030 [P] [US2] Create defensive analyzer in src/analyzers/defensive-analyzer.ts that evaluates life, ES, resists, armor, evasion and classifies as glass_cannon/moderate/tanky/uber_viable
- [X] T031 [P] [US2] Create offensive analyzer in src/analyzers/offensive-analyzer.ts that estimates DPS, identifies damage type, and classifies as low/moderate/high/extreme
- [X] T032 [P] [US2] Create playstyle detector in src/analyzers/playstyle-detector.ts that analyzes passive tree clustering, skill choices, stat priorities to classify as clear/boss/hybrid/unknown
- [X] T033 [P] [US2] Create strength detector in src/analyzers/strength-detector.ts that identifies build strengths (CI chaos immunity, 75% resists, high ES/armor, max block, etc.)
- [X] T034 [P] [US2] Create weakness detector in src/analyzers/weakness-detector.ts that identifies build weaknesses (uncapped resists, low life, no curse, single element damage, etc.)
- [X] T035 [US2] Implement analyze_build MCP tool in src/tools/analyze_build.ts that orchestrates all analyzers, returns BuildAnalysis per contracts/analyze_build.json
- [X] T036 [US2] Integrate keystones detection in analyze_build.ts to flag build-defining keystones (CI, MoM, etc.) in strengths/weaknesses
- [X] T037 [US2] Add stat estimation logic in analyze_build.ts for missing stats (calculate from gear/passives if not explicitly provided)
- [X] T038 [US2] Register analyze_build tool in src/index.ts with input schema validation using contracts/analyze_build.json

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can parse builds AND analyze them for strengths/weaknesses/playstyle.

---

## Phase 5: User Story 3 - Suggest Build Improvements (Priority: P3)

**Goal**: Enable AI assistants to recommend specific, actionable build improvements

**Independent Test**: Can be tested by providing parsed builds with known weaknesses and verifying that suggestions are specific, actionable, and address the identified issues

### Implementation for User Story 3

- [X] T039 [P] [US3] Create gem suggester in src/suggesters/gem-suggester.ts that identifies missing critical supports, inefficient combinations, suggests better alternatives per build type
- [X] T040 [P] [US3] Create passive suggester in src/suggesters/passive-suggester.ts that detects inefficient pathing (>3 nodes without notable), suggests keystones nearby, recommends defensive layers
- [X] T041 [P] [US3] Create gear suggester in src/suggesters/gear-suggester.ts that identifies uncapped resists, low life, suggests specific gear slots and affixes to cap
- [X] T042 [P] [US3] Create utility suggester in src/suggesters/utility-suggester.ts that detects missing curses, guard skills, mobility options, suggests appropriate additions per playstyle
- [X] T043 [US3] Implement suggest_improvements MCP tool in src/tools/suggest_improvements.ts that orchestrates all suggesters, prioritizes suggestions (critical/important/optional), returns Suggestion[] per contracts/suggest_improvements.json
- [X] T044 [US3] Add priority scoring logic in suggest_improvements.ts based on weakness severity (life-saving = critical, significant boost = important, QoL = optional)
- [X] T045 [US3] Integrate analysis results in suggest_improvements.ts to map weaknesses → suggestions, ensure suggestions address identified issues
- [X] T046 [US3] Register suggest_improvements tool in src/index.ts with input schema validation using contracts/suggest_improvements.json

**Checkpoint**: All user stories should now be independently functional. Users can parse builds, analyze them, and get improvement suggestions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T047 [P] Update README.md with complete setup instructions, PoE API key configuration, game data fetch steps, testing examples
- [X] T048 [P] Add logging throughout all tools/parsers/analyzers/suggesters using winston for operational visibility
- [X] T049 Add auto-update game data functionality in src/index.ts that checks for new leagues on startup, fetches updated data from PoE API
- [X] T050 Implement graceful error handling in src/index.ts for stdio transport errors, malformed tool calls, cache failures
- [X] T051 Add environment variable support in src/index.ts for POE_API_KEY, REDIS_URL (optional), CACHE_SIZE, CACHE_TTL
- [X] T052 [P] Add inline documentation to all complex parsing logic (PoB XML structure, passive tree matching, stat estimation)
- [X] T053 Run quickstart.md validation: follow setup steps, verify server starts, tools are callable, example flows work end-to-end
- [X] T054 Performance optimization: verify cold parse <10s, cached parse <3s, cache hit rate >60%, optimize bottlenecks if needed
- [X] T055 Handle edge cases: outdated PoB versions (pre-Community Fork), experimental gems/items, multiple main skills, legacy items, corrupted gear implicits, abyss jewels, cluster jewel passive trees

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories (PARALLEL with US2/US3 if team allows)
  - User Story 2 (P2): Can start after Foundational - Depends on US1 for input data (ParsedBuild), but can develop analyzers in parallel with US1 parsers
  - User Story 3 (P3): Can start after Foundational - Depends on US2 for input data (BuildAnalysis), but can develop suggesters in parallel with US1/US2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation for all stories - outputs ParsedBuild used by US2/US3
- **User Story 2 (P2)**: Takes ParsedBuild from US1, outputs BuildAnalysis used by US3 - can develop analyzers in parallel with US1 parsers
- **User Story 3 (P3)**: Takes ParsedBuild from US1 + BuildAnalysis from US2 - can develop suggesters in parallel with US1/US2

### Within Each User Story

- Parser/Analyzer/Suggester components marked [P] can run in parallel
- Orchestration tool (parse_pob_code/analyze_build/suggest_improvements) depends on component completion
- Tool registration in index.ts depends on tool implementation completion
- Each story complete when all its tasks done

### Parallel Opportunities

- **Setup phase**: T003, T004, T005 can run in parallel (different files)
- **Foundational phase**: T007-T014 can all run in parallel (8 concurrent tasks, different files)
- **User Story 1**: T019-T024 parsers can run in parallel (6 concurrent tasks)
- **User Story 2**: T030-T035 analyzers can run in parallel (6 concurrent tasks)
- **User Story 3**: T039-T042 suggesters can run in parallel (4 concurrent tasks)
- **Polish phase**: T047, T048, T052 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all parsers for User Story 1 together:
Task: "Create PoB XML structure parser in src/parsers/pob-xml-parser.ts"
Task: "Create character parser in src/parsers/character-parser.ts"
Task: "Create skill parser in src/parsers/skill-parser.ts"
Task: "Create passive tree parser in src/parsers/passive-parser.ts"
Task: "Create gear parser in src/parsers/gear-parser.ts"
Task: "Create stats extractor in src/parsers/stats-parser.ts"
# All 6 parsers can be developed simultaneously by different team members
```

---

## Parallel Example: User Story 2

```bash
# Launch all analyzers for User Story 2 together:
Task: "Create defensive analyzer in src/analyzers/defensive-analyzer.ts"
Task: "Create offensive analyzer in src/analyzers/offensive-analyzer.ts"
Task: "Create playstyle detector in src/analyzers/playstyle-detector.ts"
Task: "Create strength detector in src/analyzers/strength-detector.ts"
Task: "Create weakness detector in src/analyzers/weakness-detector.ts"
# All 5 analyzers can be developed simultaneously (no shared dependencies)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T018)
3. Complete Phase 3: User Story 1 (T019-T029)
4. **STOP and VALIDATE**: Test parse_pob_code tool independently with real PoB codes
5. Deploy/demo if ready (MVP delivers value: AI assistants can parse builds)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T018)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Users can parse builds)
3. Add User Story 2 → Test independently → Deploy/Demo (Users can now analyze builds)
4. Add User Story 3 → Test independently → Deploy/Demo (Users can now get suggestions)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done, split into parallel tracks:
   - Developer A: User Story 1 parsers (T019-T024)
   - Developer B: User Story 2 analyzers (T030-T034)
   - Developer C: User Story 3 suggesters (T039-T042)
3. Tracks complete and integrate independently (US1 tool → US2 tool → US3 tool)
4. Integration: US1 provides ParsedBuild to US2, US2 provides BuildAnalysis to US3

---

## Notes

- Tests NOT REQUIRED (test-optional principle from constitution)
- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Performance targets: 3s cached, 10s cold starts (validate in Phase 6)
- PoE 2 only for MVP (PoE 1 deferred to future work)
