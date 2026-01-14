# Data Model: MCP Server for Path of Building Integration

**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)
**Date**: 2026-01-15

## Overview

This document defines the domain entities and data structures for the MCP-PoB server. All entities are designed for TypeScript type safety and JSON serialization (MCP protocol requirement).

---

## Core Entities

### 1. BuildCode

**Purpose**: Represents the encoded Path of Building build code input

**Type**: Input value object (immutable)

**Fields**:
- `code: string` - Base64-encoded, zlib-compressed PoB XML (1MB max)
- `hash: string` (derived) - SHA-256 hash for cache key

**Validation Rules**:
- Must be valid base64 string
- Must decompress to valid XML
- Must have root element `<PathOfBuilding>`
- Size ≤ 1MB after decompression

**Example**:
```json
{
  "code": "eJztwTEBAAAAwqD1T20JT6AAADgcw+8xAURpYWxv... (truncated)"
}
```

---

### 2. ParsedBuild

**Purpose**: Complete structured representation of a Path of Building build

**Type**: Aggregate root (contains all build data)

**Fields**:
- `buildId: string` - SHA-256 hash of original build code
- `version: string` - PoB version (e.g., "1.4.170")
- `gameVersion: string` - PoE version (e.g., "3.25.0")
- `character: Character` - Player character information
- `skills: SkillSetup[]` - All skill configurations (main + supports)
- `passives: PassiveTree` - Allocated passive nodes and keystones
- `gear: GearSlot[]` - All equipped items
- `stats: Stat[]` - Calculated or estimated stats
- `parsedAt: string` - ISO 8601 timestamp

**Relationships**:
- `character` - 1:1 composition
- `skills` - 1:N composition
- `passives` - 1:1 composition
- `gear` - 1:N composition
- `stats` - 1:N composition

**Validation Rules**:
- `character.class` must be valid PoE 2 class
- `skills` array cannot be empty (at least 1 skill required)
- `passives.totalPoints` ≤ 123 (max level 100 + 23 quest points)
- `gear` array must have exactly 12 slots (or empty slots marked null)

**Example**:
```json
{
  "buildId": "a1b2c3d4e5f6...",
  "version": "1.4.170",
  "gameVersion": "3.25.0",
  "character": {
    "class": "Witch",
    "ascendancy": "Necromancer",
    "level": 92,
    "league": "Affliction"
  },
  "skills": [...],
  "passives": {...},
  "gear": [...],
  "stats": [...],
  "parsedAt": "2026-01-15T10:30:00Z"
}
```

---

### 3. Character

**Purpose**: Player character identity and basic info

**Type**: Entity

**Fields**:
- `class: string` - Character class (enum: "Witch", "Ranger", "Marauder", "Duelist", "Shadow", "Templar", "Scion", "Mercenary", "Monk", "Sorceress", "Huntress", "Druid") - PoE 2 classes
- `ascendancy: string` - Ascendancy class (enum: "Necromancer", "Elementalist", "Occultist", etc., or null)
- `level: number` - Character level (1-100)
- `league: string | null` - League name (if applicable)

**Validation Rules**:
- `class` must be valid PoE 2 class
- `level` must be 1-100
- `ascendancy` must be null or valid ascendancy for the class
- `league` can be null (standard league)

**Enums**:
```typescript
type CharacterClass =
  | "Witch" | "Ranger" | "Marauder" | "Duelist" | "Shadow"
  | "Templar" | "Scion" // PoE 1 classes
  | "Mercenary" | "Monk" | "Sorceress" | "Huntress" | "Druid"; // PoE 2 classes

type Ascendancy =
  | "Necromancer" | "Elementalist" | "Occultist"
  | "Deadeye" | "Pathfinder" | "Ranger"
  // ... full list of 19 ascendancies
  | null;
```

---

### 4. SkillSetup

**Purpose**: Represents a main skill with its support gems

**Type**: Entity

**Fields**:
- `id: string` - Unique identifier (e.g., "skill-1")
- `skillName: string` - Active skill name (e.g., "Kinetic Blast")
- `gemLevel: number` - Gem level (1-20, or 21 if corrupted)
- `quality: number` - Gem quality (0-23%)
- `supports: SupportGem[]` - Array of support gems
- `linkCount: number` - Number of linked sockets (2-6)
- `isMainSkill: boolean` - True if this is the primary damage skill

**Relationships**:
- `supports` - 1:N composition

**Validation Rules**:
- `gemLevel` must be 1-20 (or 21 if corrupted)
- `quality` must be 0-23
- `linkCount` must match `supports.length + 1` (main skill + supports)
- At least one skill must have `isMainSkill: true`

**Example**:
```json
{
  "id": "skill-1",
  "skillName": "Kinetic Blast",
  "gemLevel": 20,
  "quality": 20,
  "supports": [
    {
      "name": "Greater Multiple Projectiles",
      "gemLevel": 20,
      "quality": 20
    },
    {
      "name": "Multistrike",
      "gemLevel": 20,
      "quality": 20
    }
  ],
  "linkCount": 3,
  "isMainSkill": true
}
```

---

### 5. SupportGem

**Purpose**: Represents a support gem linked to a main skill

**Type**: Value object

**Fields**:
- `name: string` - Support gem name
- `gemLevel: number` - Gem level (1-20)
- `quality: number` - Gem quality (0-23%)

**Validation Rules**:
- `name` must be valid support gem (checked against data/gems.json)
- `gemLevel` must be 1-20
- `quality` must be 0-23

---

### 6. PassiveTree

**Purpose**: Allocated passive skill tree nodes and keystones

**Type**: Entity

**Fields**:
- `totalPoints: number` - Total passive points spent
- `nodes: string[]` - Array of allocated node IDs (e.g., ["12345", "67890"])
- `keystones: Keystone[]` - Array of allocated keystones
- `notables: Notable[]` - Array of allocated notable passives
- `version: string` - Passive tree version (e.g., "3.25.0")

**Relationships**:
- `keystones` - 1:N composition
- `notables` - 1:N composition

**Validation Rules**:
- `totalPoints` must equal `nodes.length`
- `totalPoints` ≤ 123 (level 100 + 23 quest points)
- `nodes` must all exist in passive tree data

**Example**:
```json
{
  "totalPoints": 115,
  "nodes": ["12345", "67890", "24680", ...],
  "keystones": [
    {
      "id": "12345",
      "name": "Chaos Inoculation",
      "effect": "1% maximum Energy Shield is Chaos Immune"
    }
  ],
  "notables": [
    {
      "id": "67890",
      "name": "Heart of Ice",
      "effect": "30% increased Cold Damage"
    }
  ],
  "version": "3.25.0"
}
```

---

### 7. Keystone

**Purpose**: Represents a keystone passive node (build-defining)

**Type**: Value object

**Fields**:
- `id: string` - Node ID from passive tree
- `name: string` - Keystone name
- `effect: string` - Keystone description

**Common Keystones** (examples):
- Chaos Inoculation (CI)
- Mind Over Matter (MoM)
- Eldritch Battery
- Iron Reflexes
- Elemental Overload
- Point Blank
- Acrobatics
- Phase Acrobatics

---

### 8. Notable

**Purpose**: Represents a notable passive node (medium impact)

**Type**: Value object

**Fields**:
- `id: string` - Node ID from passive tree
- `name: string` - Notable name
- `effect: string` - Notable description

---

### 9. GearSlot

**Purpose**: Represents an equipped item in a specific slot

**Type**: Entity

**Fields**:
- `slot: GearSlotType` - Equipment slot type
- `itemName: string` - Item name
- `baseType: string` - Base item type (e.g., "Glorious Plate")
- `itemClass: string` - Item class (e.g., "Body Armour")
- `affixes: Affix[]` - Array of explicit modifiers
- `implicit: string | null` - Implicit modifier (if any)
- `corrupted: boolean` - Whether item is corrupted
- `influences: string[]` - Influences (e.g., ["Shaper", "Elder"])

**Relationships**:
- `affixes` - 1:N composition

**Enums**:
```typescript
type GearSlotType =
  | "Weapon1" | "Weapon2" | "Helmet" | "BodyArmour" | "Gloves" | "Boots"
  | "Amulet" | "Ring1" | "Ring2" | "Belt" | "Flask1" | "Flask2" | "Flask3" | "Flask4" | "Flask5";
```

**Validation Rules**:
- `slot` must be valid GearSlotType
- `itemName` cannot be empty (slot can be null, but if present, must have name)
- `affixes` array ≤ 6 (rare items max)

**Example**:
```json
{
  "slot": "BodyArmour",
  "itemName": "Carcass Jack",
  "baseType": "Varnished Coat",
  "itemClass": "Body Armour",
  "affixes": [
    {
      "type": "explicit",
      "text": "+89 to maximum Life",
      "value": 89,
      "unparsed": false
    },
    {
      "type": "explicit",
      "text": "+40 to maximum Energy Shield",
      "value": 40,
      "unparsed": false
    }
  ],
  "implicit": "+24 to maximum Energy Shield",
  "corrupted": false,
  "influences": []
}
```

---

### 10. Affix

**Purpose**: Represents an item modifier (explicit or implicit)

**Type**: Value object

**Fields**:
- `type: string` - Modifier type ("explicit", "implicit", "corrupted-implicit")
- `text: string` - Modifier text as shown in PoB
- `value: number | null` - Numeric value (if parseable)
- `unparsed: boolean` - True if value couldn't be parsed from text

**Validation Rules**:
- `type` must be one of: "explicit", "implicit", "corrupted-implicit"
- `text` cannot be empty
- If `unparsed: false`, `value` must be non-null

---

### 11. Stat

**Purpose**: Represents a calculated or estimated build stat

**Type**: Value object

**Fields**:
- `name: string` - Stat name (e.g., "Life", "Fire Resistance")
- `value: number` - Stat value
- `source: StatSource` - Where this stat came from

**Enums**:
```typescript
type StatSource = "explicit" | "estimated" | "calculated";
```

**Validation Rules**:
- `name` cannot be empty
- `value` must be number (can be negative for reductions)

**Example**:
```json
{
  "name": "Fire Resistance",
  "value": 75,
  "source": "explicit"
}
```

---

## Analysis Entities

### 12. BuildAnalysis

**Purpose**: Result of analyzing a parsed build (strengths, weaknesses, playstyle)

**Type**: Output value object

**Fields**:
- `strengths: string[]` - List of build strengths (e.g., "Chaos immunity")
- `weaknesses: string[]` - List of build weaknesses (e.g., "Uncapped lightning resistance")
- `playstyleType: PlaystyleType` - Detected playstyle
- `defensiveRating: DefensiveRating` - Defensive capability assessment
- `offensiveRating: OffensiveRating` - Offensive capability assessment
- `analyzedAt: string` - ISO 8601 timestamp

**Enums**:
```typescript
type PlaystyleType = "clear" | "boss" | "hybrid" | "unknown";

type DefensiveRating = "glass_cannon" | "moderate" | "tanky" | "uber_viable";

type OffensiveRating = "low" | "moderate" | "high" | "extreme";
```

**Validation Rules**:
- `strengths` and `weaknesses` arrays cannot be empty (must detect at least 1 each)
- If `playstyleType` is "unknown", provide reason in weaknesses

**Example**:
```json
{
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
```

---

### 13. Suggestion

**Purpose**: Actionable improvement suggestion for a build

**Type**: Value object

**Fields**:
- `category: SuggestionCategory` - Type of suggestion
- `priority: SuggestionPriority` - How important this change is
- `description: string` - Human-readable description
- `specificAction: string` - Exact action to take
- `expectedImpact: string` - What this change will achieve

**Enums**:
```typescript
type SuggestionCategory = "gems" | "passives" | "gear" | "utility";

type SuggestionPriority = "critical" | "important" | "optional";
```

**Validation Rules**:
- All string fields must be non-empty
- `priority` must be valid enum value
- `specificAction` must be actionable (not vague)

**Example**:
```json
{
  "category": "gems",
  "priority": "critical",
  "description": "Add Multistrike Support to Kinetic Blast",
  "specificAction": "Insert Multistrike in link #2 (after Kinetic Blast, before Greater Multiple Projectiles)",
  "expectedImpact": "Increases attack speed by 44%, adds 2 strikes per attack"
}
```

---

## MCP Tool Input/Output Schemas

### parse_pob_code Tool

**Input**:
```typescript
{
  buildCode: string; // Base64-encoded PoB code
}
```

**Output** (Success):
```typescript
{
  success: true;
  build: ParsedBuild; // Complete parsed build
}
```

**Output** (Error):
```typescript
{
  success: false;
  error: {
    code: "INVALID_BASE64" | "DECOMPRESSION_ERROR" | "INVALID_XML" | "UNSUPPORTED_VERSION";
    message: string;
    details: string;
  };
}
```

---

### analyze_build Tool

**Input**:
```typescript
{
  build: ParsedBuild; // Parsed build from parse_pob_code
}
```

**Output**:
```typescript
{
  success: true;
  analysis: BuildAnalysis;
}
```

---

### suggest_improvements Tool

**Input**:
```typescript
{
  build: ParsedBuild; // Parsed build
  analysis: BuildAnalysis; // Analysis from analyze_build
}
```

**Output**:
```typescript
{
  success: true;
  suggestions: Suggestion[];
}
```

---

## Type Definitions (TypeScript)

```typescript
// Core types
type BuildCode = {
  code: string;
  hash?: string; // Derived
};

type ParsedBuild = {
  buildId: string;
  version: string;
  gameVersion: string;
  character: Character;
  skills: SkillSetup[];
  passives: PassiveTree;
  gear: GearSlot[];
  stats: Stat[];
  parsedAt: string;
};

type Character = {
  class: CharacterClass;
  ascendancy: Ascendancy | null;
  level: number;
  league: string | null;
};

type SkillSetup = {
  id: string;
  skillName: string;
  gemLevel: number;
  quality: number;
  supports: SupportGem[];
  linkCount: number;
  isMainSkill: boolean;
};

type SupportGem = {
  name: string;
  gemLevel: number;
  quality: number;
};

type PassiveTree = {
  totalPoints: number;
  nodes: string[];
  keystones: Keystone[];
  notables: Notable[];
  version: string;
};

type Keystone = {
  id: string;
  name: string;
  effect: string;
};

type Notable = {
  id: string;
  name: string;
  effect: string;
};

type GearSlot = {
  slot: GearSlotType;
  itemName: string;
  baseType: string;
  itemClass: string;
  affixes: Affix[];
  implicit: string | null;
  corrupted: boolean;
  influences: string[];
};

type Affix = {
  type: "explicit" | "implicit" | "corrupted-implicit";
  text: string;
  value: number | null;
  unparsed: boolean;
};

type Stat = {
  name: string;
  value: number;
  source: "explicit" | "estimated" | "calculated";
};

// Analysis types
type BuildAnalysis = {
  strengths: string[];
  weaknesses: string[];
  playstyleType: PlaystyleType;
  defensiveRating: DefensiveRating;
  offensiveRating: OffensiveRating;
  analyzedAt: string;
};

type Suggestion = {
  category: SuggestionCategory;
  priority: SuggestionPriority;
  description: string;
  specificAction: string;
  expectedImpact: string;
};

// Enums
type CharacterClass =
  | "Witch" | "Ranger" | "Marauder" | "Duelist" | "Shadow" | "Templar" | "Scion"
  | "Mercenary" | "Monk" | "Sorceress" | "Huntress" | "Druid";

type Ascendancy =
  | "Necromancer" | "Elementalist" | "Occultist"
  | "Deadeye" | "Pathfinder" | "Raider"
  // ... (full list in implementation)
  | null;

type GearSlotType =
  | "Weapon1" | "Weapon2" | "Helmet" | "BodyArmour" | "Gloves" | "Boots"
  | "Amulet" | "Ring1" | "Ring2" | "Belt"
  | "Flask1" | "Flask2" | "Flask3" | "Flask4" | "Flask5";

type PlaystyleType = "clear" | "boss" | "hybrid" | "unknown";

type DefensiveRating = "glass_cannon" | "moderate" | "tanky" | "uber_viable";

type OffensiveRating = "low" | "moderate" | "high" | "extreme";

type SuggestionCategory = "gems" | "passives" | "gear" | "utility";

type SuggestionPriority = "critical" | "important" | "optional";
```

---

## Data Flow

1. **User Input** (AI assistant) → `BuildCode` (raw PoB code)
2. **parse_pob_code** → `ParsedBuild` (structured data)
3. **analyze_build** (takes `ParsedBuild`) → `BuildAnalysis`
4. **suggest_improvements** (takes `ParsedBuild` + `BuildAnalysis`) → `Suggestion[]`

---

## Storage Requirements

### In-Memory Cache
- Key: `buildId` (SHA-256 hash)
- Value: `ParsedBuild` (JSON)
- Max entries: 100
- TTL: 1 hour

### Game Data Files (static, auto-updated)
- `data/skills.json` - Skill definitions
- `data/gems.json` - Support gem data
- `data/items.json` - Base item types
- `data/keystones.json` - Passive tree keystones
- `data/passives.json` - Full passive tree snapshot

---

## Validation Summary

All entities enforce:
- Type safety (TypeScript)
- Value constraints (ranges, enums)
- Relationship integrity (composition)
- Business rules (e.g., total passive points ≤ 123)

Validation occurs at:
1. **Input validation** (MCP tool call) - Check basic types
2. **Parsing validation** (PoB decode) - Check XML structure
3. **Domain validation** (Entity construction) - Check business rules
4. **Output validation** (MCP response) - Ensure JSON schema compliance

---

## Future Extensions

**PoE 1 Support** (deferred):
- Add `game: "poe1" | "poe2"` field to `ParsedBuild`
- Separate passive tree data structure
- Different character class/ascendancy enums

**Cluster Jewels** (deferred):
- Add `clusterJewels: ClusterJewel[]` to `PassiveTree`
- `ClusterJewel` entity with nested passive nodes
- Recursive parsing logic

**Advanced Stats** (deferred):
- Add `detailedStats: DetailedStats` to `ParsedBuild`
- Breakdown by damage type, buff effects, conditional modifiers
