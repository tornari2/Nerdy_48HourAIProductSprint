# Active Context: Current Work Focus

## Current Status

**Phase:** Project Initialization Complete - Ready for Development  
**Date:** 2025-12-01  
**Last Updated:** 2025-12-01  
**Next Step:** Begin Task 1 - Define Data Schema and Generate Synthetic Data

## Recent Changes

### Completed (Initialization Phase)
1. ✅ PRD finalized with tech stack decisions
2. ✅ GitHub repository initialized and synced
3. ✅ Task Master initialized with 10 tasks
4. ✅ All tasks expanded into 50 subtasks (using AI expansion)
5. ✅ Memory Bank created with all 6 core files
6. ✅ Memory Bank structure documented in README.md
7. ✅ All initialization work committed to git

### Current Work
- **No active coding yet** - Ready to begin when approved
- All planning, setup, and documentation complete
- Memory Bank fully populated and ready for AI session continuity

## Next Steps (Immediate)

### Task 1: Define Data Schema and Generate Synthetic Data
**Subtasks:**
1. Design Database Schema for Tutors, Students, and Sessions
2. Design Database Schema for Transcripts and Metrics
3. Implement TypeScript Script for Synthetic Data Generation
4. Generate Synthetic Data for Transcripts and Metrics
5. Validate and Document Data Schema and Generation Process

**Dependencies:** None (can start immediately)

**Key Decisions Needed:**
- Finalize database schema (reference PRD Appendix A)
- Choose synthetic data generation approach
- Determine transcript generation strategy (LLM vs templates)

## Active Decisions & Considerations

### Database Schema
- **Decision:** Use Drizzle ORM with Postgres (Neon)
- **Schema Reference:** PRD Appendix A.1
- **Tables:** tutors, students, sessions, session_transcripts, tutor_metrics, session_ai_evaluations
- **Consideration:** Ensure schema supports efficient analytics queries

### Synthetic Data Generation
- **Approach:** TypeScript scripts for structured data, LLM for transcripts
- **Volume:** ~100 tutors, ~2-3k students, ~3k sessions over 7 days
- **Distributions:** 
  - 20-30% first sessions
  - 5-15% rescheduled (90% tutor-initiated)
  - 2-5% no-shows
- **Transcripts:** 50-200 transcripts using GPT-4o-mini with Eedi dataset examples

### LLM Evaluation
- **Model:** GPT-4o (speed priority)
- **Prompt Template:** To be designed (see PRD Section 9.1)
- **Output Format:** JSON with quality_score, strengths, areas_for_improvement, risk_tags
- **Idempotency:** Cache results, skip if already evaluated

## Current Blockers

**None** - Ready to begin implementation

## Active Questions

1. **OpenAI API Key:** User needs to provide API key before LLM evaluation can be tested
2. **Neon Database:** User needs to create Neon account and provide DATABASE_URL
3. **Design Preferences:** Any specific UI/UX preferences beyond bluish-purple Nerdy palette?

## Focus Areas

### This Sprint (48 Hours)
1. **Hours 0-12:** Database schema, synthetic data generator, basic Next.js pages
2. **Hours 12-24:** API routes, database connections, analytics pipeline
3. **Hours 24-36:** UI improvements, LLM prompt tuning, end-to-end validation
4. **Hours 36-48:** Error handling, testing, documentation, demo video

### Priority Order
1. Data layer (schema + synthetic data) - Foundation
2. Analytics pipeline - Core functionality
3. LLM evaluation - AI component
4. Dashboard UI - User-facing
5. Deployment - Demo readiness

## Context for Next Session

When resuming work:
1. Check `progress.md` for current status
2. Review `activeContext.md` for immediate next steps
3. Check Task Master for current task status
4. Review recent commits for code changes
5. Check for any new decisions or blockers

## Key Files to Monitor

- `.taskmaster/tasks/tasks.json` - Task progress
- `PRD.md` - Requirements reference
- `drizzle/schema.ts` - Database schema (to be created)
- `lib/analytics/pipeline.ts` - Analytics logic (to be created)
- `lib/llm/evaluator.ts` - LLM service (to be created)

