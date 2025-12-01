# Tutor Quality Scoring & Risk Detection System

An **AI-powered Tutor Quality Scoring System** that evaluates tutoring sessions, identifies coaching opportunities, predicts tutor-related risks (churn, no-shows, reschedules), and surfaces actionable insights.

![Dashboard Preview](https://img.shields.io/badge/Status-MVP-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC)

## 🚀 Features

- **AI-Powered Session Evaluation**: GPT-4o analyzes session transcripts to generate quality scores (1-5), strengths, areas for improvement, and risk tags
- **Tutor Risk Analytics**: Automated calculation of reschedule rates, no-show rates, and first-session dropout patterns
- **Interactive Dashboard**: Beautiful dark-themed UI with:
  - Real-time tutor metrics overview
  - Sortable/filterable tutor list
  - Individual tutor detail views with session history
  - First-session pattern analysis
  - Transcript viewer with AI feedback
- **Batch Analytics Pipeline**: Process thousands of sessions to compute tutor-level metrics
- **Synthetic Data Generation**: Realistic test data generator for demos

## 📊 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Styling** | TailwindCSS + shadcn/ui | Nerdy bluish-purple dark theme |
| **Charts** | Recharts | Data visualization |
| **Database** | Neon (Serverless Postgres) | Scalable database |
| **ORM** | Drizzle ORM | Type-safe database access |
| **AI** | OpenAI GPT-4o | Session evaluation |
| **Deployment** | Vercel | Serverless hosting |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │ Dashboard   │ │ Tutor List  │ │ First Sessions View  │  │
│  └─────────────┘ └─────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  /api/tutors  │  /api/tutors/[id]  │  /api/evaluate-session │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐     ┌─────────────────────────────┐
│   Neon Postgres DB    │     │      OpenAI GPT-4o          │
│  - tutors             │     │  - Session evaluation       │
│  - students           │     │  - Quality scoring          │
│  - sessions           │     │  - Risk tag generation      │
│  - transcripts        │     └─────────────────────────────┘
│  - tutor_metrics      │
│  - ai_evaluations     │
└───────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon Postgres account (free tier works)
- OpenAI API key

### 1. Clone and Install

```bash
git clone https://github.com/tornari2/Nerdy_48HourAIProductSprint.git
cd Nerdy_48HourAIProductSprint
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```env
# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Environment
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Seed with synthetic data
npm run db:seed
```

### 4. Generate AI Content (Optional)

```bash
# Generate synthetic transcripts (requires OPENAI_API_KEY)
npm run db:generate-transcripts

# Run analytics to compute metrics
npm run analytics:run

# Run AI evaluations on transcripts
npm run ai:evaluate
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── tutors/        # Tutor endpoints
│   │   ├── evaluate-session/
│   │   └── first-sessions/
│   ├── tutors/            # Tutor pages
│   │   └── [id]/          # Tutor detail page
│   └── first-sessions/    # First session patterns page
├── components/ui/         # shadcn/ui components
├── db/                    # Database schema & connection
│   ├── schema.ts          # Drizzle schema definitions
│   └── index.ts           # DB connection
├── lib/                   # Utilities
│   ├── ai-evaluator.ts    # OpenAI evaluation service
│   └── utils.ts           # Helper functions
└── scripts/               # CLI scripts
    ├── seed.ts            # Generate synthetic data
    ├── generate-transcripts.ts
    ├── run-analytics.ts
    └── run-evaluations.ts
```

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tutors` | GET | List tutors with metrics |
| `/api/tutors/[id]` | GET | Tutor details with sessions |
| `/api/first-sessions` | GET | First session patterns |
| `/api/evaluate-session` | POST | Trigger AI evaluation |

### Query Parameters for `/api/tutors`

- `sortBy`: `churnRisk`, `rescheduleRate`, `noShowRate`, `rating`, `aiScore`, `name`
- `order`: `asc`, `desc`
- `riskLevel`: `high`, `medium`, `low`
- `limit`: Number of results
- `offset`: Pagination offset

## 🤖 AI Prompting Strategy

The AI evaluation uses a carefully crafted prompt that:

1. **Defines clear evaluation criteria** (clarity, pacing, engagement, goal alignment)
2. **Uses a 1-5 scoring rubric** with detailed descriptions for each level
3. **Requests structured JSON output** for reliable parsing
4. **Includes special handling** for first sessions
5. **Generates risk tags** like `rushed_pacing`, `excellent_rapport_building`

Example evaluation output:

```json
{
  "quality_score": 4,
  "strengths": [
    "Tutor checked for understanding regularly",
    "Good use of examples to explain concepts"
  ],
  "areas_for_improvement": [
    "Could provide more practice problems"
  ],
  "risk_tags": ["strong_scaffolding", "adaptive_teaching"]
}
```

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables:
   - `DATABASE_URL` - Your Neon connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
3. Deploy!

### 3. Enable Password Protection (Optional)

For MVP demo security:
1. Go to Vercel Project Settings → Security
2. Enable Deployment Protection
3. Set a password for the preview/production deployment

## 📊 Sample Metrics

After running the analytics pipeline on synthetic data:

- **~100 tutors** tracked with metrics
- **~3,000 sessions** analyzed
- **Risk Distribution:**
  - ~15% High Risk
  - ~25% Medium Risk
  - ~60% Low Risk
- **Average Reschedule Rate:** ~8-12%
- **Average No-Show Rate:** ~3-5%
- **First Session Dropout Rate:** ~20-25%

## 🔧 Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start development server |
| Build | `npm run build` | Production build |
| Lint | `npm run lint` | Run ESLint |
| DB Push | `npm run db:push` | Push schema to DB |
| DB Seed | `npm run db:seed` | Generate synthetic data |
| DB Studio | `npm run db:studio` | Open Drizzle Studio |
| Transcripts | `npm run db:generate-transcripts` | Generate AI transcripts |
| Analytics | `npm run analytics:run` | Compute tutor metrics |
| Evaluate | `npm run ai:evaluate` | Run AI evaluations |

## 💰 Cost Estimates

For the MVP with synthetic data:

| Component | Usage | Est. Cost |
|-----------|-------|-----------|
| Neon DB | Free tier | $0 |
| Vercel | Free tier | $0 |
| OpenAI (transcripts) | ~150 transcripts | ~$0.50 |
| OpenAI (evaluations) | ~100 evaluations | ~$1-2 |

**Total MVP Cost: ~$2-3**

## 🎥 Demo Flow

1. **Dashboard Overview**: Show key metrics and risk distribution
2. **Tutor List**: Filter by high risk, sort by reschedule rate
3. **Tutor Detail**: View a flagged tutor's metrics and sessions
4. **Transcript Viewer**: Show AI evaluation with strengths/improvements
5. **First Sessions**: Highlight dropout patterns by subject

## 📝 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using AI-first development for the 48-Hour AI Product Sprint.
