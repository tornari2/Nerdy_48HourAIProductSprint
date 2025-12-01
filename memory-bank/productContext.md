# Product Context: Tutor Quality Scoring System

## Why This Project Exists

Nerdy's marketplace relies on thousands of tutors delivering high-quality sessions, but existing processes lack:
- A consistent, scalable way to **evaluate session quality**
- Early-warning signals for **at-risk tutors** (no-shows, reschedulers)
- A system that **combines quantitative metrics and qualitative signals** (transcripts, feedback) into **actionable coaching insights**

## Problems We're Solving

### Problem 1: First-Session Failures (24% Churn)
- 24% of churners fail at their first session
- No systematic way to identify tutors with poor first-session outcomes
- Need to detect patterns leading to poor first-session experiences

### Problem 2: Tutor-Initiated Reschedules (98.2%)
- 98.2% of reschedules are tutor-initiated, hurting trust and retention
- No early warning system for high-rescheduling tutors
- Need to flag tutors with high reschedule rates before they impact students

### Problem 3: Tutor No-Shows (16% Replacements)
- 16% of tutor replacements are due to tutor no-shows
- No predictive system to identify at-risk tutors
- Need to predict tutor no-show risk using historical patterns

## How It Should Work

### User Experience Flow

1. **Tutor Quality Manager / Coaching Lead**
   - Opens dashboard → sees ranked list of tutors with risk flags
   - Clicks on high-risk tutor → sees detailed metrics, sample sessions, AI feedback
   - Reviews AI-generated coaching summary → identifies specific areas for improvement
   - Uses evidence (transcripts, metrics) to create coaching plan

2. **Operations Manager**
   - Views first-session patterns page → identifies systemic issues by subject
   - Sees tutor list filtered by risk → prioritizes interventions
   - Monitors marketplace health through aggregated metrics

3. **Product / Data Team**
   - Uses system outputs to refine matching algorithms
   - Analyzes patterns to inform marketplace policies
   - Tracks improvement over time post-coaching

### Core User Journeys

**Journey 1: Identify Risky First Sessions**
1. Navigate to First-Session Patterns view
2. See subject breakdown with dropout rates
3. Click into specific subject → see top tutors with poor first sessions
4. Review example sessions and transcripts
5. Understand AI-generated explanations for failures

**Journey 2: Flag High-Rescheduling Tutors**
1. View tutor list sorted by reschedule rate
2. See tutors flagged as "High Rescheduler"
3. Click into tutor detail → see reschedule history and patterns
4. Review impact on student churn
5. Decide on intervention strategy

**Journey 3: Predict No-Show Risk**
1. View tutor list with no-show risk labels (low/medium/high)
2. Filter for high-risk tutors
3. Review historical no-show patterns
4. See recommendations (e.g., deprioritize for new students)
5. Schedule proactive check-in

**Journey 4: Coach via AI Feedback**
1. Navigate to specific tutor detail page
2. View aggregated AI feedback from multiple transcripts
3. See strengths and areas for improvement
4. Review sample sessions with AI evaluations
5. Create targeted coaching plan

## User Experience Goals

### Clarity
- An ops user should be able to explain why a tutor is flagged based on the dashboard alone
- All metrics should have clear labels and context
- Risk flags should be self-explanatory

### Actionability
- Every insight should lead to a clear action
- Evidence (transcripts, metrics) should be readily available
- Feedback should be specific and constructive

### Trust
- AI evaluations should be transparent (show reasoning)
- Metrics should be accurate and verifiable
- System should surface high-signal, low-noise flags

### Speed
- Dashboard should load quickly (< 2 seconds)
- New session insights available within 1 hour
- Real-time updates during demo (within ~1 minute)

## Success Indicators

**User Adoption:**
- Ops team uses dashboard weekly
- Coaching leads reference AI feedback in coaching sessions
- Product team uses insights to inform decisions

**Impact Metrics:**
- Reduction in poor first-session outcomes for coached tutors
- Decrease in tutor-initiated reschedule rates
- Lower no-show rates in flagged segments

## Design Principles

1. **Data-Driven Decisions**: Every insight backed by evidence
2. **Transparency**: AI reasoning visible and explainable
3. **Actionability**: Clear next steps for every flag
4. **Speed**: Insights available when they matter most
5. **Trust**: High-signal, low-noise approach

