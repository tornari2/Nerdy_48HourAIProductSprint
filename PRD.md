# PRD: Tutor Quality Scoring & Risk Detection System (Option B)

**Version:** 1.0  

**Owner:** Michael / AI-First Dev Team  

**Date:** 2025-11-30  

**Target:** 48-hour AI-first MVP + path to production

---

## 1. Executive Summary

This project delivers an **AI-powered Tutor Quality Scoring System** that evaluates every tutoring session, identifies coaching opportunities, predicts tutor-related risks (churn, no-shows, reschedules), and surfaces **actionable insights within 1 hour of session completion**.

The system ingests session-level data (real or synthetic), computes tutor performance metrics, and uses a **LLM-as-judge** + rules-based analytics to:

- Detect patterns leading to **poor first-session experiences** (24% of churners fail here).

- Flag tutors with **high rescheduling rates** (98.2% of reschedules are tutor-initiated).

- Identify tutors at **risk of no-shows** (16% of tutor replacements are due to no-shows).

The MVP will be **demoable in an interview**, with a clear dashboard, sample transcripts, and AI-generated feedback. It will integrate conceptually (and optionally technically) with the existing **Rails/React** platform, and be deployable with:

- Frontend on **Vercel** (Next.js/React).

- Backend on **AWS** (or serverless on Vercel + managed DB).

---

## 2. Problem Statement

Nerdy's marketplace relies on thousands of tutors delivering high-quality sessions. However:

- **24% of churners** fail at the **first session**.

- **98.2% of reschedules** are **tutor-initiated**, hurting trust and retention.

- **16% of tutor replacements** are due to **tutor no-shows**.

Existing processes lack:

- A consistent, scalable way to **evaluate session quality**.

- Early-warning signals for **at-risk tutors** (no-shows, reschedulers).

- A system that **combines quantitative metrics and qualitative signals** (transcripts, feedback) into **actionable coaching insights**.

We need a system that can **process ~3,000 sessions per day**, evaluate them within **1 hour**, and surface **simple, trustworthy signals** that operations and coaching teams can act on.

---

## 3. Goals & Success Metrics

### 3.1 MVP (48-hour Sprint) Goals

- **Goal 1 – Automated Quality Scoring (Demo Focus)**  

  For a subset of sessions with transcripts, compute:

  - AI-generated **quality score** (1–5).

  - Short **coaching summary** (what went well / what to improve).

  - **Risk tags** (e.g., "rushed tutor," "poor first session," "student confusion").

- **Goal 2 – Tutor Risk Analytics**  

  From session-level data (synthetic for demo):

  - Compute **per-tutor reschedule rates**, no-show rates, and first-session outcomes.

  - Flag **high-reschedule** and **no-show risk** tutors.

  - Identify **poor first-session patterns** per tutor or subject.

- **Goal 3 – Operator Dashboard**  

  Build a basic **web dashboard** where ops can:

  - See a **ranked list of tutors** with risk flags.

  - Click into a tutor to see metrics + sample sessions + AI feedback.

  - Explore **first-session failure patterns**.

### 3.2 Success Metrics (Product-Level)

**Short-term (demo / MVP):**
ee
- **Demo quality:** Can we show a live flow where:

  1. A new session (synthetic) is "completed".

  2. The system computes metrics + AI evaluation.

  3. The dashboard updates with new tutor quality info **within ~1 minute**.

- **Coverage:** ≥80% of sample tutors have computed metrics; ≥50 sessions have AI evaluations.

- **Clarity:** An ops user can explain why a tutor is flagged based on the dashboard alone.

**Medium-term (production):**

- **Time-to-insight:** 95% of real sessions analyzed within **1 hour** of completion.

- **Retention impact proxy:** Reduction in:

  - Poor first-session outcomes for tutors who received coaching.

  - Tutor-initiated reschedule and no-show rates in flagged segments.

- **Operational adoption:** Ops team uses dashboard weekly; outputs integrated into coaching workflows.

---

## 4. Users & Use Cases

### 4.1 Primary Users

1. **Tutor Quality Manager / Coaching Lead**

   - Needs to find tutors needing coaching and track improvements over time.

   - Wants high-signal, low-noise flags and clear evidence (transcripts, metrics).

2. **Operations Manager**

   - Monitors marketplace health.

   - Wants to identify systemic issues (subjects, cohorts, geos) linked to churn.

3. **Product / Data Team (Secondary)**

   - Uses system outputs to refine matching, routing, and marketplace policies.

### 4.2 Core Use Cases

1. **Identify risky first-session experiences**

   - View a list of tutors with high first-session dropout rates.

   - Drill into example sessions, transcripts, and AI-generated explanations.

2. **Flag high-rescheduling tutors**

   - See tutors with high tutor-initiated reschedule rates.

   - Understand impact on student churn.

3. **Predict tutor no-show risk**

   - Score tutors for likelihood of future no-shows using historical patterns.

   - Provide guidance to ops (e.g., deprioritize for new students, schedule check-in).

4. **Coach via AI feedback**

   - For a given tutor, see AI-generated feedback summarizing strengths/weaknesses from multiple transcripts.

5. **Monitor improvement over time**

   - Track whether coaching interventions lead to improved metrics and reduced risk flags.

---

## 5. Scope

### 5.1 In-Scope for 48-Hour MVP

- **Data schema & synthetic data**

  - Define relational data model for tutors, students, sessions, transcripts, and tutor-level metrics.

  - Generate realistic synthetic data for all entities.

  - Simulate ~3,000 sessions across a recent time window (e.g., 7 days).

- **Analytics pipeline (batch)**

  - Compute per-tutor metrics: reschedules, no-shows, first-session outcomes, average rating.

  - Derive first-session failure patterns per tutor and subject.

- **AI evaluator**

  - LLM-based evaluation of transcripts:

    - Per-session quality score.

    - Key strengths/weaknesses.

    - Risk tags.

- **Risk scoring**

  - Simple rules-based tutor risk labels ("low/medium/high") based on:

    - First-session performance.

    - Reschedule rate.

    - No-show rate.

    - Average ratings and AI quality scores.

- **Operator dashboard (web)**

  - Tutor list with sorting/filtering by risk and subject.

  - Tutor detail view with metrics & sample session(s) + AI feedback.

  - First-session patterns view (by subject and tutor).

- **Basic integration with existing Rails/React platform**

  - Conceptual integration direction and simple stub auth for MVP.

  - Ability to embed dashboard in existing ops/admin area in future phases.

### 5.2 Out-of-Scope for MVP (Roadmap)

- Real-time streaming ingestion of all sessions.

- Sophisticated ML models for tutor churn & no-show prediction (beyond simple rules or a toy model).

- Automated coaching assignment workflows and ticketing integration.

- Multi-tenant configuration and fine-grained access control.

- Full integration with production Nerdy infrastructure (monitoring, SSO, etc.).

---

## 6. Functional Requirements

### 6.1 Data Model (Conceptual)

The data model must support:

- **Tutors**

  - Unique ID, basic identity, subjects, experience, timezone, hire date.

- **Students**

  - Unique ID, grade level, learning segment (SAT, AP, homework help, etc.).

- **Sessions**

  - Links between tutor and student.

  - Subject and timestamps (scheduled and actual).

  - Duration, status (completed, no_show, rescheduled).

  - Flags indicating first session per student.

  - Reschedule initiator (tutor or student).

  - Optional link to a prior session (for reschedules).

  - Student rating and free-text feedback.

  - Synthetic labels for student churn-after-session and tutor churn-within-30-days.

  - Boolean indicating whether a transcript exists.

  - Creation timestamp.

- **Session transcripts**

  - A text transcript for sessions where a transcript is available.

- **Tutor metrics (derived)**

  - Counts of sessions and first sessions in the last 30 days.

  - First-session dropout rate.

  - Reschedule rate.

  - No-show rate.

  - Average student rating.

  - Aggregated AI quality score.

  - Risk labels and flags (churn risk, no-show risk, high rescheduler, poor first session).

  - Last updated timestamp.

All of these entities should be modeled in a relational database (e.g., Postgres) with an eye toward easy querying for analytics and dashboard views.

---

### 6.2 Synthetic Data Generation (for MVP)

The system must include a **data seeding module** capable of generating synthetic but realistic data, to be used for the MVP demo and local development.

**Requirements:**

- Generate approximately:

  - ~100 tutors.

  - ~2–3k students.

  - ~3k sessions over a 7-day window.

- Session distributions:

  - 20–30% of sessions should be first sessions for that student.

  - 5–15% of sessions should be marked as rescheduled.

    - ~90% of reschedules should be tutor-initiated (to mirror the 98.2% spec).

  - 2–5% of sessions should be no-shows.

  - Ratings and churn labels should be consistent (but noisy) with perceived quality:

    - Low ratings and poor behavior patterns more likely to lead to student churn.

    - High ratings more likely to correlate with continued engagement.

- Transcripts:

  - Attach 50–200 transcripts to sessions covering:

    - Great sessions (high rating, no churn).

    - Poor first sessions (low rating, churn).

    - Sessions from reschedule-heavy tutors.

    - No-show scenarios (short transcripts where tutor doesn't appear, etc.).

- Implementation:

  - Script-based (TypeScript) generation of:
    - Tutors, students, sessions with realistic distributions

  - AI-assisted generation of transcripts using GPT-4o-mini:
    - Use session metadata (rating, subject, churn flag, etc.) to prompt the LLM
    - Few-shot examples from [Eedi Tutoring Dialogues dataset](https://huggingface.co/datasets/Eedi/Question-Anchored-Tutoring-Dialogues-2k)
    - Generate dialogues that reflect the Talk Move patterns (checking understanding, pressing for accuracy, etc.)
    - Create variety: excellent sessions, struggling students, rushed tutors, no-show scenarios

The seeding module should be idempotent or easily resettable (e.g., truncate and re-seed) for quick iteration.

---

### 6.3 Quality Scoring Engine (LLM + Rules)

The Quality Scoring Engine is responsible for assessing the quality of individual sessions where transcripts are available.

**Inputs:**

- The transcript text for a session.

- Session metadata, including:

  - Subject.

  - Whether it is a first session.

  - Student rating and feedback (if any).

  - Session status (completed, no_show, rescheduled).

- Optional tutor history snippet:

  - A brief summary of recent ratings and flags for that tutor.

**Outputs per evaluated session:**

- `ai_quality_score` (1–5).

- `ai_feedback_summary` (short paragraph).

- `ai_tags` (list of labels capturing key issues or strengths).

**Functional Requirements:**

1. **Prompt template**

   - Provide a prompt that:

     - Clearly describes the evaluation rubric (e.g., clarity, engagement, pacing, goal alignment).

     - Asks for:

       - A numeric quality score (1–5).

       - Lists of strengths and areas for improvement.

       - Risk tags capturing patterns like "rushed_pacing", "ignored_student_questions", "excellent_student_engagement", etc.

     - Requires JSON output with a fixed schema for easy parsing.

2. **LLM service wrapper**

   - Implement a service layer that:

     - Scores each session at most once (idempotency via a check or cache).

     - Handles partial failures with retry and backoff.

     - Logs LLM calls and responses for debugging and cost monitoring.

3. **Storage**

   - Persist per-session AI evaluations in:

     - A dedicated `session_ai_evaluations` table, or

     - Additional fields attached to the `sessions` table.

   - Aggregation logic will roll up per-session scores into tutor-level metrics (`tutor_metrics`).

For MVP, a single per-session evaluation endpoint (e.g., `POST /api/evaluate-session`) is sufficient. A batch job can iterate over sessions with transcripts and invoke this endpoint or service.

---

### 6.4 Risk Models & Flags

The system must derive risk flags and labels using simple, explainable rules that can later be replaced or augmented by more sophisticated models.

**First-session risk patterns:**

- Compute a first-session dropout rate for each tutor and subject combination.

- A first session counts as "bad" if:

  - The student churned after the session, or

  - The student rating is less than or equal to a low threshold (e.g., ≤ 2).

- If this rate exceeds a configurable threshold (e.g., > 25%), set a `poor_first_session_flag` for that tutor and/or subject.

**High-rescheduler flag:**

- Calculate a reschedule rate per tutor:

  - Number of sessions with status = "rescheduled" divided by total sessions.

- If this rate exceeds a threshold (e.g., > 15–20%), set `high_rescheduler_flag = true`.

**No-show risk:**

- Compute a no-show rate:

  - Number of sessions with status = "no_show" divided by total sessions.

- Combine with reschedule rate and average rating:

  - If no-show rate is high OR (reschedule rate is high AND average rating is low, e.g., < 3.5),

    - Set `no_show_risk_label = "high"`.

  - Otherwise label as `"medium"` or `"low"` according to thresholds.

**Overall churn risk label:**

- Assign `churn_risk_label` for each tutor based on:

  - Downward trend in ratings or AI quality scores.

  - High no-show and reschedule rates.

  - Synthetic `tutor_churned_within_30d` labels (used only for evaluation during MVP).

**Configuration:**

- All numeric thresholds (reschedule rate, no-show rate, rating cutoffs, etc.) should be:

  - Defined in a configuration file or environment variables.

  - Easy to adjust without code changes.

---

### 6.5 Dashboards & Views

The frontend should present a small set of clear, opinionated views for ops users.

#### 6.5.1 Tutor List (Main Screen)

**Columns:**

- Tutor name and subjects.

- Average student rating over the last 30 days.

- Average AI quality score from evaluated transcripts.

- Tutor reschedule rate.

- Tutor no-show rate.

- Risk badges:

  - Poor First Sessions.

  - High Rescheduler.

  - No-Show Risk (e.g., color-coded low/medium/high).

**Features:**

- Sort by:

  - Highest risk.

  - Highest reschedule rate.

  - Highest no-show rate.

  - Lowest rating / AI quality score.

- Filter by:

  - Subject.

  - Risk label.

  - Minimum number of sessions.

This screen should be usable as a "hit list" for coaching and intervention.

---

#### 6.5.2 Tutor Detail View

**Sections:**

- **Overview card**

  - Key metrics:

    - Total sessions (last 30 days).

    - First sessions (last 30 days).

    - First-session dropout rate.

    - Reschedule rate.

    - No-show rate.

    - Average student rating.

    - Average AI quality score.

    - Risk labels (churn risk, no-show risk, high rescheduler, poor first sessions).

- **Trend chart**

  - Simple bar or line chart for:

    - Ratings over time.

    - Or AI quality scores over time.

- **Session list**

  - Table of recent sessions with:

    - Date/time.

    - Subject.

    - Status (completed, rescheduled, no-show).

    - Student rating.

    - AI quality score (if available).

    - Icon or badge indicating first session.

- **Transcript viewer**

  - For sessions with transcripts:

    - Display transcript text in a scrollable area.

    - Display AI feedback summary and tags alongside the transcript.

---

#### 6.5.3 First-Session Pattern View

This view directly addresses the **24% churn on first sessions** requirement.

**Table should include:**

- Subject.

- Total first sessions in the chosen window (e.g., last 30 days or 7 days).

- First-session dropout rate:

  - Percentage of first sessions that resulted in student churn or very low rating.

- Top tutors with poor first sessions in that subject:

  - Name and their specific first-session dropout rate.

This view can be filtered by timeframe or subject, and is primarily for Ops and Product to identify systemic onboarding issues.

For MVP, alerts and notifications (email/Slack) are out of scope and can be added later.

---

## 7. Non-Functional Requirements

- **Performance**

  - Batch analytics for ~3,000 sessions should complete within **10–20 minutes**.

  - LLM evaluations for the demo should be limited to a manageable subset (e.g., 100 sessions) but architecture should support scaling via batching and/or queues.

- **Reliability**

  - Batch analytics jobs must be idempotent and safe to re-run.

  - LLM calls should be logged and retried on transient failures with reasonable backoff.

- **Security**

  - MVP uses synthetic data only (no real PII).

  - For production:

    - Respect existing authentication/SSO.

    - Implement role-based access control (RBAC) so only ops/coaching roles can view data.

- **Observability**

  - Basic logging and error tracking for:

    - API requests.

    - Batch jobs.

    - LLM calls.

  - Simple metrics around:

    - Job durations.

    - LLM call volume and cost.

---

## 8. Architecture & Tech Stack (Finalized)

### 8.1 Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | TypeScript, RSC, deployed on Vercel |
| **Styling** | TailwindCSS + shadcn/ui | Bluish-purple Nerdy palette, modern ops aesthetic |
| **Charts** | Recharts | Clean, composable, great Next.js integration |
| **Database** | Neon (Serverless Postgres) | Handles 3k sessions/day, auto-scales, great DX |
| **ORM** | Drizzle ORM | Lightweight, type-safe, fast migrations |
| **Backend** | Next.js API Routes + Server Actions | Vercel serverless, simple deployment |
| **LLM (Evaluation)** | OpenAI GPT-4o | Fast responses, high quality evaluations |
| **LLM (Transcript Gen)** | OpenAI GPT-4o-mini | Cost-effective for bulk transcript generation |
| **Auth (MVP)** | Vercel Password Protection | Simple, no code needed |
| **Deployment** | Vercel | Auto-deploy from GitHub |

### 8.2 Design System

**Nerdy Bluish-Purple Palette:**
- Primary: `#6366f1` (indigo-500) → `#8b5cf6` (violet-500)
- Accent: `#a78bfa` (violet-400)
- Background: Dark mode base with subtle gradient accents
- Risk badges: Red (high), Yellow (medium), Green (low)
- Card-based layouts with subtle shadows and glass effects

### 8.3 Reference Data Source

**Training Data for Transcript Generation:**
- [Eedi Question-Anchored Tutoring Dialogues (HuggingFace)](https://huggingface.co/datasets/Eedi/Question-Anchored-Tutoring-Dialogues-2k)
- 68,717 real tutor-student messages across ~2,000 dialogues
- Includes pedagogical "Talk Move" annotations for quality patterns
- Used as few-shot examples for realistic synthetic transcript generation

### 8.4 MVP Architecture

**Frontend (Vercel):**

- Framework: **Next.js 14 (App Router)** deployed on **Vercel**

- Pages:
  - `/` – Dashboard overview
  - `/tutors` – Tutor List with risk flags
  - `/tutors/[id]` – Tutor Detail with sessions & AI feedback
  - `/first-sessions` – First-session Pattern View

- UI stack:
  - TypeScript
  - TailwindCSS + shadcn/ui
  - Recharts for data visualization

- Auth for MVP:
  - Vercel Password Protection (environment-based)
  - Integration with Nerdy's auth/SSO is a roadmap item

---

**Backend (Vercel Serverless):**

- Use **Next.js API Routes** and **Server Actions** for backend logic

- Key endpoints:
  - `POST /api/seed-data` – generate and insert synthetic data into the DB
  - `POST /api/run-analytics` – compute tutor-level metrics and risk flags
  - `GET /api/tutors` – return list of tutors with metrics and filters
  - `GET /api/tutors/[id]` – return details, metrics, and sessions for a single tutor
  - `GET /api/first-sessions` – return first-session pattern stats
  - `POST /api/evaluate-session` – trigger LLM evaluation for a specific session
  - `POST /api/evaluate-batch` – batch evaluate multiple sessions in parallel

- Database:
  - **Neon** (Serverless Postgres)
  - Connection pooling enabled for serverless compatibility
  - Accessed by both API routes and background tasks

- AI Provider:
  - **OpenAI GPT-4o** for session evaluation (speed priority)
  - **OpenAI GPT-4o-mini** for transcript generation (volume)
  - Wrapped in a client module for easy provider switching

### 8.5 Performance Architecture (3,000 Sessions/Hour)

To meet the requirement of processing 3,000 daily sessions with insights within 1 hour:

1. **Parallel LLM Processing**
   - Batch sessions into groups of 10-20
   - Fire concurrent API calls using Promise.all()
   - Rate limiting with exponential backoff

2. **Priority Queue**
   - First sessions evaluated first (highest risk)
   - High-risk tutor sessions prioritized
   - Background processing for routine sessions

3. **Incremental Analytics**
   - Tutor metrics updated incrementally as sessions complete
   - Full recalculation nightly for consistency

4. **Database Optimization**
   - Indexed queries on tutor_id, session date, status
   - Materialized views for complex aggregations (roadmap)

---

### 8.6 Integration with Existing Rails/React Platform

- **Phase 1 (MVP – Current Sprint)**:
  - Fully standalone dashboard deployed on Vercel
  - Environment-protected via Vercel Password Protection
  - Synthetic data only, no production dependencies

- **Phase 2 (Post-sprint)**:
  - Add SSO / JWT-based integration so existing ops users can be auto-authenticated
  - Embed React components within the existing admin UI
  - Provide deep links from Rails admin pages into the new dashboard views

- **Data Integration (Roadmap):**
  - Replace synthetic seeding with:
    - Direct queries from the production DB, or
    - A data pipeline that streams session data into the analytics DB or event store

---

## 9. AI Components & Prompting Strategy

### 9.1 LLM Evaluator Prompt (Conceptual)

For each transcript, the system must send a prompt that:

- **System message:**

  - Defines the role of the model as a tutor quality evaluator for an online tutoring platform.

  - Specifies that quality is assessed on clarity, pacing, engagement, and goal alignment.

- **Context:**

  - A clear rubric describing what a "1" vs "5" score means.

  - Any special instructions for first sessions.

- **User content:**

  - A JSON blob containing:

    - Session metadata (subject, first-session flag, rating, status).

    - The transcript text (tutor/student turns).

The model must respond with a structured JSON object including:

- `quality_score` (1–5).

- `strengths` (list of strings).

- `areas_for_improvement` (list of strings).

- `risk_tags` (list of strings).

The specific JSON schema is defined in the appendix.

---

### 9.2 Cost Control

- Limit the number of sessions scored by the LLM for the MVP:

  - For example, ~100 sessions across a variety of tutors and subjects.

- Design output storage and caching so:

  - Each session is evaluated only once.

  - Re-evaluations (e.g., with adjusted prompts) can be done by explicitly clearing the cache.

Future enhancements can:

- Sample sessions per tutor (e.g., a fraction of sessions for large-volume tutors).

- Always prioritize:

  - First sessions.

  - Sessions from high-risk tutors.

  - Sessions in new or experimental programs.

---

### 9.3 AI in Development Workflow

**First 24 hours (AI-only coding):**

- Use AI coding assistants to:

  - Generate initial DB migration scripts.

  - Implement the synthetic data generator.

  - Scaffold Next.js pages and core API routes.

  - Draft the LLM prompt template and JSON schema.

**Hours 24–36 (Mixed AI + Human):**

- Manually refine the UI layout, sorting, and filtering.

- Tighten the LLM prompt to ensure stable, well-formed JSON.

- Create a wrapper that validates and parses responses (with fallbacks).

**Hours 36–48 (Hardening & Demo):**

- Add error states and loading indicators to the frontend.

- Run end-to-end tests:

  - Seeding.

  - Analytics.

  - Evaluation.

  - Dashboard rendering.

- Document:

  - Prompt designs.

  - LLM usage patterns.

  - Expected cost at scale.

---

## 10. Deployment Plan

### 10.1 MVP Deploy

**Frontend:**

- Deploy Next.js app to **Vercel**:

  - Configure necessary environment variables:

    - Database URL.

    - LLM API keys.

    - Any feature flags.

**Backend (Option 1 – Vercel-only for MVP):**

- Implement backend logic as Next.js API routes or Vercel functions.

- Use a managed Postgres instance (Neon/Supabase or AWS RDS).

- Ensure DB credentials and LLM keys are securely managed in Vercel environment variables.

**Alternative Backend (Option 2 – AWS):**

- Deploy FastAPI/NestJS service to AWS (ECS or Lambda).

- Configure CORS to allow requests from the Vercel frontend.

- Use AWS RDS Postgres for persistence.

### 10.2 CI/CD

- Host code in a GitHub repo.

- Configure:

  - Vercel integration to auto-deploy from the `main` branch.

  - Optional GitHub Actions workflow to deploy the backend to AWS on merge or tag.

---

## 11. 48-Hour Sprint Plan (High-Level)

**Hours 0–12 (AI-only coding):**

- Define the DB schema and write migration scripts.

- Implement the synthetic data generator for tutors, students, and sessions.

- Create basic Next.js pages:

  - Simple `/tutors` list with placeholder data.

- Draft the initial LLM evaluator prompt and a simple evaluation service.

**Hours 12–24 (AI-only coding):**

- Wire up database connections and API routes:

  - `GET /tutors`.

  - `GET /tutors/[id]`.

- Implement seeding endpoint or CLI script.

- Implement first version of an analytics job to populate tutor-level metrics.

**Hours 24–36 (Mixed AI + Human):**

- Improve UI:

  - Layout, tables, filters, and badges.

- Tune the LLM prompt for consistent JSON output.

- Ensure that:

  - Synthetic data can be seeded.

  - Analytics can be run end-to-end.

  - Tutor list and detail views show real metrics.

**Hours 36–48 (Hardening & Demo):**

- Add error states and loading indicators on the frontend.

- Write basic tests/smoke checks:

  - Data seeding.

  - Analytics job.

  - API endpoints.

  - Key UI flows.

- Instrument logging for LLM calls and job execution.

- Record a **5-minute demo video** walking through:

  - Data generation.

  - Running analytics.

  - Exploring the dashboard.

  - Inspecting AI-generated feedback and flags.

---

## 12. 90-Day Roadmap (High-Level)

**Phase 1 (0–30 days): Production Pilot**

- Integrate with real session data from the Rails DB or event streams.

- Add SSO and RBAC for ops users.

- Implement automatic batch jobs (e.g., hourly and/or nightly analytics).

- Expand transcript ingestion and evaluation sampling strategy.

**Phase 2 (30–60 days): Advanced Analytics**

- Build and deploy initial supervised models such as:

  - Logistic regression or gradient boosting for tutor churn prediction.

  - No-show likelihood.

  - First-session failure probability.

- Calibrate thresholds for alerts and risk labels using historical outcomes.

- Add per-cohort/subject dashboards for Product and Ops.

**Phase 3 (60–90 days): Coaching Workflows & Automation**

- Integrate with ticketing/coaching tools:

  - Auto-create coaching tasks for high-risk tutors.

- Track post-coaching outcomes:

  - Measure if risk flags decrease or metrics improve.

- Add notification channels (email/Slack) for urgent risk alerts.

- Run AB tests on interventions to quantify retention impact.

---

## 13. Deliverables Checklist

For the 48-hour sprint, the system should deliver:

- ✅ Working prototype deployed (Vercel frontend + backend).  

- ✅ Synthetic data seeding and analytics pipeline.  

- ✅ AI evaluation service with documented prompts and error handling.  

- ✅ Operator dashboard with:

  - Tutor list.

  - Tutor detail view.

  - First-session pattern view.  

- ✅ Documentation including:

  - Tech stack and architecture overview.

  - AI tools and prompting strategies.

  - Deployment steps and approximate LLM/infra cost.  

- ✅ A 5-minute demo video walking through:

  - Seeding data.

  - Running analytics.

  - Navigating the dashboard.

  - Inspecting AI-generated feedback and flags.

This PRD is designed for easy consumption by AI coding agents and humans, enabling a coherent, demo-ready Tutor Quality Scoring System in 48 hours, with a clear path to real-world value and productionization.

---

# Appendix A: Data Schemas

## A.1 Tutors Table

```sql
tutors (
  tutor_id                 VARCHAR PRIMARY KEY,
  name                     TEXT NOT NULL,
  subjects                 JSONB,        -- e.g. ["SAT Math", "Chemistry"]
  years_experience         INT,
  timezone                 TEXT,
  hire_date                DATE
);

students (
  student_id               VARCHAR PRIMARY KEY,
  grade_level              INT,
  segment                  TEXT          -- e.g. "SAT", "AP", "Homework Help"
);

sessions (
  session_id               VARCHAR PRIMARY KEY,
  tutor_id                 VARCHAR NOT NULL REFERENCES tutors(tutor_id),
  student_id               VARCHAR NOT NULL REFERENCES students(student_id),
  subject                  TEXT NOT NULL,
  scheduled_start_at       TIMESTAMPTZ NOT NULL,
  actual_start_at          TIMESTAMPTZ NULL,   -- NULL if no-show
  duration_minutes         INT NOT NULL,       -- 0 for no-show
  status                   TEXT NOT NULL,      -- "completed", "no_show", "rescheduled"
  is_first_session_for_student  BOOLEAN NOT NULL,
  reschedule_initiator          TEXT NULL,     -- "tutor", "student", NULL
  rescheduled_from_session_id   VARCHAR NULL,
  student_rating            INT NULL,          -- 1–5, maybe NULL
  student_feedback          TEXT NULL,
  student_churned_after_session   BOOLEAN NOT NULL,
  tutor_churned_within_30d        BOOLEAN NOT NULL,
  has_transcript            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

session_transcripts (
  session_id               VARCHAR PRIMARY KEY REFERENCES sessions(session_id),
  transcript_text          TEXT NOT NULL       -- "Tutor: ...\nStudent: ..."
);

tutor_metrics (
  tutor_id                        VARCHAR PRIMARY KEY REFERENCES tutors(tutor_id),
  total_sessions_last_30d         INT NOT NULL,
  first_sessions_last_30d       INT NOT NULL,
  first_session_dropout_rate      DOUBLE PRECISION NOT NULL,  -- 0.0–1.0
  tutor_reschedule_rate           DOUBLE PRECISION NOT NULL,  -- 0.0–1.0
  tutor_no_show_rate              DOUBLE PRECISION NOT NULL,  -- 0.0–1.0
  avg_student_rating_last_30d     DOUBLE PRECISION,
  ai_avg_quality_score            DOUBLE PRECISION,
  churn_risk_label                TEXT,        -- "low", "medium", "high"
  no_show_risk_label              TEXT,        -- "low", "medium", "high"
  high_rescheduler_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  poor_first_session_flag         BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

session_ai_evaluations (
  session_id               VARCHAR PRIMARY KEY REFERENCES sessions(session_id),
  quality_score            INT NOT NULL,     -- 1–5
  strengths                JSONB NOT NULL,   -- ["Tutor checked for understanding", ...]
  areas_for_improvement    JSONB NOT NULL,   -- ["Could slow down pacing", ...]
  risk_tags                JSONB NOT NULL,   -- ["rushed_pacing", "low_student_talk_ratio"]
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## A.2 Example AI Evaluation JSON Schema

```json
{
  "quality_score": 3,
  "strengths": [
    "Tutor checked for understanding regularly.",
    "Tutor encouraged the student and praised effort."
  ],
  "areas_for_improvement": [
    "Tutor sometimes moved on without fully resolving confusion.",
    "Explanations could have used more concrete examples."
  ],
  "risk_tags": [
    "slightly_rushed_pacing",
    "inconsistent_concept_reinforcement"
  ]
}
```

