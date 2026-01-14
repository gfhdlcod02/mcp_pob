# Feature Specification: MCP Server for Path of Building Integration

**Feature Branch**: `001-mcp-pob`
**Created**: 2026-01-15
**Status**: Draft
**Input**: MCP Server for Path of Build (PoB) integration - parse build codes, analyze builds, suggest improvements

## Clarifications

### Session 2026-01-15

- Q: What does the 3-second performance target in SC-001 apply to? → A: 3 seconds for cached parsing only; cold starts up to 10s acceptable
- Q: Should PoE 2 support be included in MVP or deferred? → A: PoE 2 only for MVP; PoE 1 as future enhancement
- Q: How should the MCP server handle game updates (new leagues, items, skills)? → A: Auto-update from official PoE API on league launches

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parse PoB Build Codes (Priority: P1)

AI assistant receives a Path of Building build code (base64 + zlib compressed XML) and needs to extract structured build information to understand the character configuration.

**Why this priority**: This is the foundational capability - without parsing, no analysis or suggestions can be provided. All other user stories depend on this core functionality.

**Independent Test**: Can be fully tested by providing valid PoB build codes and verifying that all key build elements (class, skills, gear, passives) are correctly extracted and returned in structured JSON format.

**Acceptance Scenarios**:

1. **Given** a valid Path of Building build code, **When** the parse_pob_code tool is called, **Then** the system MUST return structured JSON containing character class, ascendancy, main skills, support gems, passive tree nodes, and gear slots
2. **Given** a malformed build code, **When** the parse_pob_code tool is called, **Then** the system MUST return a specific error indicating the validation failure type (invalid base64, decompression error, or XML parsing error)
3. **Given** a build code from PoE version 3.25+, **When** the parse_pob_code tool is called, **Then** the system MUST correctly parse all supported game mechanics and flag any unsupported features
4. **Given** a build code with partial data (missing gems or gear), **When** the parse_pob_code tool is called, **Then** the system MUST successfully parse available data and return null/empty for missing sections

---

### User Story 2 - Analyze Build Strengths & Weaknesses (Priority: P2)

AI assistant needs to evaluate a parsed build to identify what the build does well, what vulnerabilities exist, and what playstyle it's optimized for (clear speed, boss killing, tankiness, etc.).

**Why this priority**: Build analysis enables AI assistants to provide meaningful insights about player builds. This is valuable for theorycrafting discussion and helping players understand their build's focus.

**Independent Test**: Can be fully tested by providing parsed build data and verifying that analysis output correctly identifies defensive/offensive stats, playstyle focus, and specific weaknesses (e.g., low resists, no curse immunity, single-element damage).

**Acceptance Scenarios**:

1. **Given** a parsed build with 75% all elemental resistances and 5,000+ life, **When** the analyze_build tool is called, **Then** the system MUST identify "Strong defensive layer" and classify the build as "tanky" or "endgame-capable"
2. **Given** a parsed build with 30% fire resistance and 2,000 life, **When** the analyze_build tool is called, **Then** the system MUST flag "Critical weakness: Low fire resistance" and "Vulnerable to elemental damage"
3. **Given** a parsed build with 10+ attack speed and movement speed bonuses, **When** the analyze_build tool is called, **Then** the system MUST identify playstyle as "Clear speed focused"
4. **Given** a parsed build with 500%+ increased damage but minimal defensive nodes, **When** the analyze_build tool is called, **Then** the system MUST identify playstyle as "Glass cannon boss killer"
5. **Given** a parsed build with Chaos Inoculation keystone, **When** the analyze_build tool is called, **Then** the system MUST identify "CI build - no life, energy shield based, chaos immunity"

---

### User Story 3 - Suggest Build Improvements (Priority: P3)

AI assistant needs to recommend specific, actionable improvements to a build based on analysis of weaknesses and missing optimization opportunities.

**Why this priority**: Suggestions provide direct value to players by identifying upgrade paths. This enhances the AI assistant's ability to help players improve their builds.

**Independent Test**: Can be fully tested by providing parsed builds with known weaknesses and verifying that suggestions are specific, actionable, and address the identified issues (e.g., suggesting support gem swaps, passive tree pathing, or defensive layers).

**Acceptance Scenarios**:

1. **Given** a parsed build with unmaxed resistances, **When** the suggest_improvements tool is called, **Then** the system MUST recommend specific passive tree nodes or gear affixes to reach 75% resistance cap
2. **Given** a parsed build with a main skill missing a key support gem (e.g., Kinetic Blast w/o Multistrike), **When** the suggest_improvements tool is called, **Then** the system MUST recommend the missing support gem with explanation of its benefit
3. **Given** a parsed build with no curse setup, **When** the suggest_improvements tool is called, **Then** the system MUST suggest adding a curse blasphemied setup or curse ring with appropriate curse for the build type
4. **Given** a parsed build focused on bossing with low life, **When** the suggest_improvements tool is called, **Then** the system MUST recommend defensive layers (e.g., "Add Aspect of the Crab for physical mitigation" or "Consider Steelskin for guard skill")
5. **Given** a parsed build with inefficient passive tree pathing (traversing 3+ nodes without notable benefits), **When** the suggest_improvements tool is called, **Then** the system MUST suggest more efficient pathing options

---

### Edge Cases

- What happens when a PoB build code is from an outdated PoB version (pre-Community Fork)?
- How does the system handle builds with experimental/unsupported gems or items?
- What happens when a build has multiple main skills (e.g., boss swap setup)?
- How does the system handle legacy items or unique items that have been changed/removed?
- What happens when the build code exceeds maximum size limits?
- How does the system handle corrupted gear with implicit modifications?
- What happens when a build uses Abyss jewels with specific conditional modifiers?
- How does the system handle cluster jewel passive trees (nested passive trees)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept Path of Building build codes as input (base64-encoded, zlib-compressed XML format)
- **FR-002**: System MUST decode and decompress PoB build codes to extract XML data
- **FR-003**: System MUST parse PoB XML to extract: character class, ascendancy, level, skills, support gems, passive tree nodes, gear slots, and stats
- **FR-004**: System MUST provide parse_pob_code tool that accepts build code and returns structured JSON
- **FR-005**: System MUST validate build code format and return specific error messages for: invalid base64, decompression failure, XML parsing errors, missing required fields
- **FR-006**: System MUST provide analyze_build tool that accepts parsed build data and returns analysis including: defensive stats (life, ES, resists, armor, evasion), offensive stats (damage type, DPS estimate), playstyle classification (clear, boss, hybrid), strengths list, weaknesses list
- **FR-007**: System MUST identify playstyle focus based on passive tree clustering, skill choices, and stat priorities
- **FR-008**: System MUST provide suggest_improvements tool that accepts parsed build data and analysis, returns prioritized list of specific, actionable suggestions
- **FR-009**: System MUST generate suggestions for: gem setup improvements (missing supports, better alternatives), passive tree optimization (inefficient pathing, missing keystones, defensive layers), gear recommendations (resist capping, offensive upgrades), utility additions (curses, guard skills, mobility)
- **FR-010**: System MUST handle partial build data gracefully (return available information, mark missing sections as null/empty)
- **FR-011**: System MUST support Path of Exile 2 build formats for MVP; PoE 1 support is out of scope for initial release (future enhancement)
- **FR-012**: System MUST return all outputs in structured JSON format for AI consumption
- **FR-013**: System MUST identify game version from build code and flag unsupported mechanics
- **FR-014**: System MUST detect keystones and notable passive nodes that significantly alter build mechanics (e.g., Chaos Inoculation, Low-life, Mind Over Matter)
- **FR-015**: System MUST calculate or estimate defensive/offensive stats when not explicitly provided in PoB data
- **FR-016**: System MUST auto-update game data (items, skills, gems, passive tree) from official PoE API when new leagues launch

### Key Entities

- **BuildCode**: Encoded Path of Building build data (base64 + zlib compressed XML)
- **ParsedBuild**: Structured representation of a PoB build containing character info, skills, passives, gear, and stats
- **Character**: Player character entity with attributes: class, ascendancy, level, league (if applicable)
- **SkillSetup**: Collection of main skill + support gems with attributes: skill name, gem level, quality, support gem list, link count
- **PassiveTree**: Passive skill tree representation including: allocated nodes, keystones, notable clusters, total points spent
- **GearSlot**: Equipment slot with attributes: slot name, item name, base type, affixes, corruption implicit (if any)
- **Stat**: Calculated or estimated build stat with attributes: stat name, value, source (explicit or estimated)
- **BuildAnalysis**: Analysis output with attributes: strengths (list), weaknesses (list), playstyle_type (enum: clear, boss, hybrid, unknown), defensive_rating (enum: glass_cannon, moderate, tanky, uber_viable), offensive_rating (enum: low, moderate, high, extreme)
- **Suggestion**: Improvement recommendation with attributes: category (enum: gems, passives, gear, utility), priority (enum: critical, important, optional), description, specific_action, expected_impact

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can parse any valid PoB build code and receive complete structured data in under 3 seconds for cached builds, under 10 seconds for cold starts
- **SC-002**: 95% of build analysis results correctly identify the primary playstyle focus (clear/boss/hybrid) as validated by human expert review
- **SC-003**: 90% of generated suggestions are rated as "relevant and actionable" by users (not obviously inapplicable)
- **SC-004**: System successfully parses 99% of valid PoB build codes from PoE version 3.20+ (excluding known unsupported edge cases)
- **SC-005**: Build analysis identifies at least 80% of critical weaknesses (low resists, no curse immunity, missing defensive layers) in test builds
- **SC-006**: Users report that suggestions help them improve their builds in 70% of cases (measured by follow-up feedback)
- **SC-007**: Error messages correctly identify the failure type in 100% of invalid build code scenarios
- **SC-008**: System handles build codes up to 1MB in size without performance degradation
