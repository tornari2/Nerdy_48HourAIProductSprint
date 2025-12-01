# Project Brief: Tutor Quality Scoring & Risk Detection System

**Version:** 1.0  
**Owner:** Michael / AI-First Dev Team  
**Date:** 2025-11-30  
**Target:** 48-hour AI-first MVP + path to production

## Core Mission

Build an **AI-powered Tutor Quality Scoring System** that evaluates every tutoring session, identifies coaching opportunities, predicts tutor-related risks (churn, no-shows, reschedules), and surfaces **actionable insights within 1 hour of session completion**.

## Critical Requirements

### Performance Requirements
- **Process 3,000 sessions per day** with insights available within **1 hour** of completion
- Batch analytics for ~3,000 sessions must complete within **10-20 minutes**
- System must be demoable in an interview setting

### Functional Requirements
1. **Automated Quality Scoring**
   - AI-generated quality score (1-5) for sessions with transcripts
   - Short coaching summary (strengths/weaknesses)
   - Risk tags (e.g., "rushed tutor," "poor first session," "student confusion")

2. **Tutor Risk Analytics**
   - Compute per-tutor reschedule rates, no-show rates, first-session outcomes
   - Flag high-reschedule and no-show risk tutors
   - Identify poor first-session patterns per tutor/subject

3. **Operator Dashboard**
   - Ranked list of tutors with risk flags
   - Tutor detail view with metrics, sessions, and AI feedback
   - First-session pattern analysis view

### Key Business Problems
- **24% of churners** fail at the **first session**
- **98.2% of reschedules** are **tutor-initiated**
- **16% of tutor replacements** due to **tutor no-shows**

## Success Criteria (MVP)

**Short-term (demo / MVP):**
- Demo quality: Live flow showing session completion → metrics + AI evaluation → dashboard update within ~1 minute
- Coverage: ≥80% of sample tutors have computed metrics; ≥50 sessions have AI evaluations
- Clarity: Ops user can explain why a tutor is flagged based on dashboard alone

**Medium-term (production):**
- Time-to-insight: 95% of real sessions analyzed within 1 hour
- Retention impact: Reduction in poor first-session outcomes and tutor-initiated reschedules
- Operational adoption: Ops team uses dashboard weekly

## Scope Boundaries

### In-Scope (MVP)
- Data schema & synthetic data generation (~100 tutors, ~2-3k students, ~3k sessions)
- Batch analytics pipeline for tutor metrics
- LLM-based session evaluation (GPT-4o)
- Rules-based risk scoring
- Operator dashboard (Next.js/React on Vercel)
- Basic authentication (Vercel Password Protection)

### Out-of-Scope (Roadmap)
- Real-time streaming ingestion
- Sophisticated ML models (beyond simple rules)
- Automated coaching workflows
- Multi-tenant configuration
- Full production infrastructure integration

## Deliverables

1. ✅ Working prototype deployed (Vercel frontend + backend)
2. ✅ Synthetic data seeding and analytics pipeline
3. ✅ AI evaluation service with documented prompts
4. ✅ Operator dashboard (tutor list, detail view, first-session patterns)
5. ✅ Documentation (tech stack, architecture, AI strategies, deployment)
6. ✅ 5-minute demo video

## Project Timeline

**48-Hour Sprint:**
- Hours 0-12: DB schema, synthetic data generator, basic Next.js pages, LLM evaluator prompt
- Hours 12-24: Database connections, API routes, seeding endpoint, analytics job
- Hours 24-36: UI improvements, LLM prompt tuning, end-to-end validation
- Hours 36-48: Error handling, testing, logging, demo video

## Source of Truth

- **PRD:** `/PRD.md` - Complete product requirements document
- **Tasks:** `.taskmaster/tasks/tasks.json` - Task Master task breakdown (10 tasks, 50 subtasks)
- **Tech Stack:** Defined in PRD Section 8.1

