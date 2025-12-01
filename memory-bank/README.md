# Memory Bank

This directory contains the project's Memory Bank - a comprehensive knowledge base that persists across AI sessions. Since AI memory resets between sessions, this Memory Bank is the **single source of truth** for understanding the project.

## Structure

### Core Files (Required)

1. **`projectbrief.md`** - Foundation document
   - Core mission and requirements
   - Success criteria and scope
   - Project timeline
   - Source of truth references

2. **`productContext.md`** - Product understanding
   - Why the project exists
   - Problems being solved
   - User experience goals
   - Success indicators

3. **`systemPatterns.md`** - Architecture and design
   - System architecture diagrams
   - Key technical decisions
   - Design patterns in use
   - Component relationships

4. **`techContext.md`** - Technical details
   - Technology stack
   - Development setup
   - Dependencies and constraints
   - Deployment procedures

5. **`activeContext.md`** - Current state
   - Recent changes
   - Next steps
   - Active decisions
   - Current blockers

6. **`progress.md`** - Status tracking
   - What works
   - What's left to build
   - Current status
   - Known issues

## Usage

### For AI Agents
- **MUST read ALL memory bank files at the start of EVERY task**
- Update `activeContext.md` and `progress.md` after significant changes
- Update other files when patterns or decisions change

### For Developers
- Reference these files to understand project context
- Update when making architectural decisions
- Keep `progress.md` current with actual status

## Update Workflow

When updating the Memory Bank:
1. Review ALL files (even if not all need changes)
2. Focus on `activeContext.md` and `progress.md` for current state
3. Update other files when patterns/decisions change
4. Commit changes with clear messages

## File Relationships

```
projectbrief.md (foundation)
    ├── productContext.md (why)
    ├── systemPatterns.md (how)
    └── techContext.md (what)
            │
            └── activeContext.md (current focus)
                    │
                    └── progress.md (status)
```

## Additional Context

Additional files can be added to this directory for:
- Complex feature documentation
- Integration specifications
- API documentation
- Testing strategies
- Deployment procedures

