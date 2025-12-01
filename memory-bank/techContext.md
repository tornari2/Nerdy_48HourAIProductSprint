# Technical Context

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Deployment:** Vercel

### Backend
- **Framework:** Next.js 14 API Routes + Server Actions
- **Language:** TypeScript
- **Deployment:** Vercel Serverless Functions
- **Database:** Neon (Serverless Postgres)
- **ORM:** Drizzle ORM

### AI/ML
- **Evaluation Model:** OpenAI GPT-4o
- **Transcript Generation:** OpenAI GPT-4o-mini
- **Provider:** OpenAI API

### Infrastructure
- **Hosting:** Vercel
- **Database:** Neon (Postgres)
- **Authentication:** Vercel Password Protection (MVP)
- **Version Control:** GitHub

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Neon account (for database)
- OpenAI API key

### Environment Variables

Required in `.env` file:
```
DATABASE_URL=postgresql://... (Neon connection string with pooling)
OPENAI_API_KEY=sk-... (OpenAI API key)
NODE_ENV=development
```

For Vercel deployment, set these in Vercel dashboard:
- `DATABASE_URL` - Neon connection string
- `OPENAI_API_KEY` - OpenAI API key
- `NODE_ENV` - production

### Local Development

1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run database migrations: `npm run db:migrate`
5. Seed synthetic data: `npm run seed` (or `POST /api/seed-data`)
6. Run analytics: `npm run analytics` (or `POST /api/run-analytics`)
7. Start dev server: `npm run dev`

### Database Setup

**Neon Setup:**
1. Create Neon account
2. Create new project
3. Enable connection pooling
4. Copy connection string to `DATABASE_URL`

**Schema Management:**
- Migrations: Drizzle Kit
- Location: `drizzle/` directory
- Run migrations: `npm run db:migrate`

## Technical Constraints

### Performance Constraints
- **3,000 sessions/day** must be processed within 1 hour
- Batch analytics: 10-20 minutes for ~3,000 sessions
- LLM calls: Parallel processing (10-20 concurrent)
- Database: Connection pooling required for serverless

### Cost Constraints
- OpenAI API costs: Monitor via logging
- Neon: Free tier sufficient for MVP
- Vercel: Free tier sufficient for MVP

### Scalability Constraints (MVP)
- Synthetic data only (no production load)
- Batch processing (not real-time streaming)
- Simple rules-based risk scoring (not ML models)

## Dependencies

### Core Dependencies
```json
{
  "next": "^14.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "drizzle-orm": "^0.x",
  "postgres": "^3.x",
  "openai": "^4.x",
  "recharts": "^2.x"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.x",
  "@types/react": "^18.x",
  "drizzle-kit": "^0.x",
  "eslint": "^8.x",
  "prettier": "^3.x"
}
```

## Development Workflow

### Code Organization
```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── tutors/            # Tutor pages
│   └── first-sessions/    # First-session patterns page
├── components/            # React components
├── lib/                   # Utilities and services
│   ├── db/               # Database setup
│   ├── llm/              # LLM service
│   └── analytics/        # Analytics pipeline
├── drizzle/              # Database migrations
├── scripts/              # Data generation scripts
└── memory-bank/          # Project documentation
```

### Key Files
- `PRD.md` - Product requirements document
- `.taskmaster/tasks/tasks.json` - Task breakdown
- `drizzle/schema.ts` - Database schema definition
- `lib/llm/evaluator.ts` - LLM evaluation service
- `lib/analytics/pipeline.ts` - Analytics computation

## Testing Strategy

### MVP Testing
- Manual testing of key flows
- Synthetic data validation
- API endpoint testing (Postman)
- UI component testing
- End-to-end smoke tests

### Future Testing (Roadmap)
- Unit tests for analytics logic
- Integration tests for API endpoints
- E2E tests for dashboard flows
- Performance testing under load

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set build command: `npm run build`
4. Deploy automatically on push to `main`

### Database Migrations
- Run migrations as part of deployment
- Use Drizzle Kit for migration management
- Ensure idempotent migrations

### Monitoring (MVP)
- Basic logging for API requests
- LLM call logging (cost tracking)
- Error tracking (console logs)

## Reference Data

### Training Data Source
- **Eedi Question-Anchored Tutoring Dialogues**
- HuggingFace: `Eedi/Question-Anchored-Tutoring-Dialogues-2k`
- 68,717 real tutor-student messages
- Used as few-shot examples for transcript generation

## Known Technical Challenges

1. **LLM Rate Limiting**
   - Solution: Batch processing with concurrency limits
   - Retry logic with exponential backoff

2. **Serverless Database Connections**
   - Solution: Neon connection pooling
   - Drizzle ORM with proper connection management

3. **Synthetic Data Realism**
   - Solution: LLM-assisted transcript generation
   - Few-shot examples from real dataset

4. **Performance at Scale**
   - Solution: Parallel LLM processing
   - Incremental analytics updates
   - Database indexing

