<!--
Sync Impact Report:
- Version change: None → 1.0.0
- Added sections: All sections (initial constitution)
- Removed sections: None
- Templates updated:
  ✅ .specify/templates/plan-template.md (Constitution Check section present)
  ✅ .specify/templates/spec-template.md (aligns with specification-first approach)
  ✅ .specify/templates/tasks-template.md (aligns with user story independence principle)
  ✅ .claude/commands/speckit.*.md (all command files reference constitution principles)
- Follow-up TODOs: None
-->

# Speckit Constitution

## Core Principles

### I. Specification-First Development

Every feature MUST be fully specified before implementation begins. Specifications take the form of complete `SPEC.md` documents that are deterministic, testable, and unambiguous.

- **MUST**: Write complete specification before any code implementation
- **MUST**: Include all mandatory sections: Objective, Non-Goals, Target Users, Commands, Execution Flow, I/O, Error Handling, Exit Codes, Acceptance Criteria
- **MUST**: State assumptions explicitly when requirements are missing
- **MUST**: Design for both human users and CI/CD/scripting usage
- **Rationale**: Specifications prevent rework, enable parallel development, and ensure all stakeholders (human and AI) have a shared understanding of what to build. Specifications are contracts that enable independent implementation and testing.

### II. User Story Independence

User stories MUST be prioritized and independently testable. Each story represents a standalone slice of functionality that delivers value.

- **MUST**: Assign priorities (P1, P2, P3, etc.) to each user story
- **MUST**: Ensure each user story is independently developable
- **MUST**: Ensure each user story is independently testable
- **MUST**: Ensure each user story is independently deployable
- **MUST**: Organize implementation tasks by user story, not by technical layer
- **Rationale**: Independent stories enable incremental delivery, allow parallel development by multiple team members, and ensure that any subset of stories forms a viable MVP. This prevents "all-or-nothing" delivery where value is only realized after implementing everything.

### III. Test-Optional with Explicit Requirement

Tests are written ONLY when explicitly requested in the feature specification. When requested, test-driven development (TDD) principles MUST be followed.

- **IF** tests are requested, MUST write tests before implementation (Red-Green-Refactor)
- **IF** tests are requested, MUST ensure tests fail before implementing features
- **IF** tests are requested, MUST include contract tests for inter-service or API boundaries
- **IF** tests are requested, MUST include integration tests for user journeys
- **MUST**: Clearly mark in spec.md whether tests are required for the feature
- **Rationale**: Not all projects require comprehensive testing (e.g., prototypes, internal tools, proofs-of-concept). Making testing explicit prevents waste when tests aren't needed while enforcing rigor when they are. The optional nature respects the principle of YAGNI (You Aren't Gonna Need It).

### IV. Deterministic & Unambiguous Design

All specifications, plans, and tasks MUST be deterministic, testable, and free of ambiguity.

- **MUST**: Avoid vague language (e.g., "should", "could", "might")—use MUST/SHOULD with clear rationale
- **MUST**: Define concrete behavior for all commands, flags, and arguments
- **MUST**: Specify exact input/output formats (JSON, text, table)
- **MUST**: Define all error codes and their meanings
- **MUST**: Include measurable acceptance criteria (Given/When/Then format)
- **Rationale**: Ambiguity is the root cause of implementation defects. When AI agents or junior developers implement from specifications, unclear requirements lead to incorrect implementations. Deterministic specs enable correct implementation on the first attempt.

### V. Simplicity & YAGNI

Designs MUST start simple and avoid over-engineering. Only implement what is needed for current requirements.

- **MUST**: Choose the simplest solution that meets requirements
- **MUST**: Avoid adding features for "future-proofing" or hypothetical needs
- **MUST**: Reject premature abstraction and generality
- **MUST**: Justify complexity when it is introduced (document in Complexity Tracking table)
- **MUST**: Prefer explicit, predictable behavior over convenience magic
- **Rationale**: Complexity is the enemy of maintainability. Premature optimization and future-proofing result in code that is harder to understand, harder to modify, and often never needed. Simple solutions are easier to implement, test, and maintain.

## Quality Gates

### Constitution Compliance Checks

Every implementation plan MUST pass a Constitution Check before proceeding from Phase 0 (Research) to Phase 1 (Design) and again before Phase 2 (Task Generation).

- **MUST**: Verify specification completeness (all mandatory sections filled)
- **MUST**: Verify user story independence (each story is independently testable)
-- **MUST**: Verify test requirements are explicit (clear yes/no in specification)
- **MUST**: Verify determinism (no vague language, all behaviors specified)
- **MUST**: Verify simplicity (no unnecessary complexity, or justified in tracking table)

### Complexity Justification

When constitution violations are necessary, they MUST be documented in the Complexity Tracking table:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., Additional dependency] | [specific problem it solves] | [why existing solutions insufficient] |

## Governance

### Amendment Procedure

1. **Proposed Changes**: Any amendment to this constitution MUST be proposed via `/speckit.constitution` command with clear rationale
2. **Version Control**: Constitution version MUST follow semantic versioning (MAJOR.MINOR.PATCH)
   - **MAJOR**: Backward incompatible removal/redefinition of principles
   - **MINOR**: New principle or section added
   - **PATCH**: Clarifications, wording improvements, non-semantic changes
3. **Sync Impact Report**: Every amendment MUST include a report of affected templates and files
4. **Propagation**: Amendments MUST be propagated to dependent templates:
   - `.specify/templates/plan-template.md` (Constitution Check section)
   - `.specify/templates/spec-template.md` (requirements alignment)
   - `.specify/templates/tasks-template.md` (task categorization)
   - `.claude/commands/speckit.*.md` (command references)

### Compliance Review

- **All PRs**: Code reviews MUST verify compliance with constitution principles
- **Plan Review**: Implementation plans MUST pass Constitution Check before task generation
- **Complexity Review**: Any complexity justification MUST be reviewed and approved

### Runtime Guidance

For development-time guidance and agent-specific instructions, refer to the individual command files in `.claude/commands/speckit.*.md`. Each command contains execution workflows that implement these constitution principles.

**Version**: 1.0.0 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
