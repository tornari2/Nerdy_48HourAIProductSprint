# System Patterns & Architecture

## Architecture Overview

**Deployment Model:** Vercel-only (MVP)
- Frontend: Next.js 14 (App Router) on Vercel
- Backend: Next.js API Routes + Server Actions (Vercel Serverless)
- Database: Neon (Serverless Postgres)
- AI: OpenAI GPT-4o (evaluation), GPT-4o-mini (transcript generation)

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Frontend   │         │    Backend   │            │
│  │  (Next.js)   │◄────────┤  (API Routes)│            │
│  │              │         │              │            │
│  │  - Dashboard │         │  - Analytics │            │
│  │  - Tutor List│         │  - LLM Eval  │            │
│  │  - Detail    │         │  - Data APIs │            │
│  └──────────────┘         └──────┬───────┘            │
│                                  │                     │
│                                  ▼                     │
│                          ┌──────────────┐             │
│                          │   Neon DB    │             │
│                          │  (Postgres)  │             │
│                          └──────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  OpenAI API     │
                    │  (GPT-4o)       │
                    └─────────────────┘
```

## Key Technical Decisions

### 1. Database Schema Design

**Tables:**
- `tutors` - Tutor profiles and metadata
- `students` - Student profiles
- `sessions` - Session records with status, ratings, flags
- `session_transcripts` - Transcript text for sessions
- `tutor_metrics` - Aggregated tutor-level metrics (computed)
- `session_ai_evaluations` - Per-session AI evaluation results

**Key Relationships:**
- Sessions link tutors to students
- Transcripts are optional (only for sessions with `has_transcript = true`)
- Metrics are derived/aggregated from sessions
- AI evaluations are stored per-session, aggregated into metrics

### 2. Data Flow Patterns

**Synthetic Data Generation:**
1. Generate tutors (~100)
2. Generate students (~2-3k)
3. Generate sessions (~3k over 7 days)
4. Generate transcripts (50-200) using LLM with few-shot examples
5. Ensure realistic distributions (20-30% first sessions, 5-15% rescheduled, 2-5% no-shows)

**Analytics Pipeline:**
1. Batch job reads sessions from database
2. Computes per-tutor metrics (reschedule rate, no-show rate, first-session dropout rate)
3. Applies rules-based risk scoring
4. Updates `tutor_metrics` table
5. Idempotent - safe to re-run

**AI Evaluation Flow:**
1. Identify sessions with transcripts that need evaluation
2. Batch sessions (10-20 concurrent calls)
3. Call OpenAI GPT-4o with prompt template
4. Parse JSON response (quality_score, strengths, areas_for_improvement, risk_tags)
5. Store in `session_ai_evaluations` table
6. Aggregate into tutor metrics

### 3. Performance Architecture (3,000 Sessions/Hour)

**Parallel Processing:**
- Batch sessions into groups of 10-20
- Fire concurrent LLM API calls using Promise.all()
- Rate limiting with exponential backoff

**Priority Queue:**
- First sessions evaluated first (highest risk)
- High-risk tutor sessions prioritized
- Background processing for routine sessions

**Incremental Analytics:**
- Tutor metrics updated incrementally as sessions complete
- Full recalculation nightly for consistency

**Database Optimization:**
- Indexed queries on tutor_id, session date, status
- Connection pooling for serverless compatibility

## Design Patterns

### 1. LLM-as-Judge Pattern
- Use GPT-4o to evaluate session transcripts
- Structured JSON output for consistency
- Idempotent evaluation (cache results)
- Retry logic with exponential backoff

### 2. Rules-Based Risk Scoring
- Simple, explainable rules (not ML models for MVP)
- Configurable thresholds (environment variables)
- Risk labels: "low", "medium", "high"
- Flags: `high_rescheduler_flag`, `poor_first_session_flag`

### 3. Synthetic Data Generation
- TypeScript scripts for structured data (tutors, students, sessions)
- LLM-assisted generation for transcripts (realistic dialogue)
- Few-shot examples from Eedi Tutoring Dialogues dataset
- Idempotent seeding (truncate and re-seed)

### 4. Serverless-First Architecture
- Next.js API Routes for backend logic
- Server Actions for data mutations
- Neon Postgres with connection pooling
- Vercel deployment for zero-config scaling

## Component Relationships

### Frontend Components (To Be Built)
- `/tutors` - Tutor list page with sorting/filtering
- `/tutors/[id]` - Tutor detail page with metrics, sessions, transcripts
- `/first-sessions` - First-session pattern analysis
- Shared components: tables, charts, badges, cards

### Project Structure (Current)
```
/
├── memory-bank/          # Memory Bank documentation (✅ Complete)
├── .taskmaster/          # Task Master configuration (✅ Complete)
├── .cursor/rules/        # Cursor AI rules (✅ Complete)
├── PRD.md                # Product requirements (✅ Complete)
└── [app/]                # Next.js app (To be created)
```

### Backend Services
- `POST /api/seed-data` - Generate and insert synthetic data
- `POST /api/run-analytics` - Compute tutor metrics and risk flags
- `GET /api/tutors` - List tutors with metrics and filters
- `GET /api/tutors/[id]` - Get tutor details, metrics, sessions
- `GET /api/first-sessions` - Get first-session pattern stats
- `POST /api/evaluate-session` - Trigger LLM evaluation for a session
- `POST /api/evaluate-batch` - Batch evaluate multiple sessions

### Data Layer
- Drizzle ORM for type-safe database queries
- Migration scripts for schema management
- Connection pooling for serverless compatibility

## Integration Points

### Current (MVP)
- Standalone system with synthetic data
- Vercel Password Protection for auth
- No external integrations

### Future (Roadmap)
- SSO/JWT integration with Nerdy auth
- Direct queries from production Rails DB
- Event stream ingestion
- Ticketing/coaching tool integration

## Security Patterns

### MVP
- Environment variables for sensitive data (API keys, DB URLs)
- Vercel Password Protection for dashboard access
- Synthetic data only (no real PII)

### Production (Roadmap)
- Role-based access control (RBAC)
- SSO integration
- Data encryption at rest and in transit
- Audit logging

## Error Handling Patterns

### LLM Calls
- Retry with exponential backoff
- Log all calls for debugging and cost monitoring
- Graceful degradation (skip evaluation if LLM fails)

### Database Operations
- Transaction management for data integrity
- Connection retry logic
- Query timeout handling

### API Endpoints
- Standard HTTP error codes
- Structured error responses
- Input validation

