import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../db/schema";
import { AIEvaluator, SessionMetadata } from "../lib/ai-evaluator";

// Load environment variables
dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

// Configuration
const BATCH_SIZE = 5; // Process in parallel
const MAX_EVALUATIONS = 100; // Limit for MVP (cost control)

interface SessionWithTranscript {
  sessionId: string;
  subject: string;
  isFirstSessionForStudent: boolean;
  studentRating: number | null;
  studentFeedback: string | null;
  status: string;
  durationMinutes: number;
  transcriptText: string;
}

async function getSessionsToEvaluate(): Promise<SessionWithTranscript[]> {
  // Get sessions with transcripts that haven't been evaluated yet
  const sessions = await db
    .select({
      sessionId: schema.sessions.sessionId,
      subject: schema.sessions.subject,
      isFirstSessionForStudent: schema.sessions.isFirstSessionForStudent,
      studentRating: schema.sessions.studentRating,
      studentFeedback: schema.sessions.studentFeedback,
      status: schema.sessions.status,
      durationMinutes: schema.sessions.durationMinutes,
      transcriptText: schema.sessionTranscripts.transcriptText,
    })
    .from(schema.sessions)
    .innerJoin(
      schema.sessionTranscripts,
      eq(schema.sessions.sessionId, schema.sessionTranscripts.sessionId)
    )
    .leftJoin(
      schema.sessionAiEvaluations,
      eq(schema.sessions.sessionId, schema.sessionAiEvaluations.sessionId)
    )
    .where(sql`${schema.sessionAiEvaluations.sessionId} IS NULL`)
    .limit(MAX_EVALUATIONS);

  return sessions;
}

async function storeEvaluation(
  sessionId: string,
  evaluation: {
    qualityScore: number;
    strengths: string[];
    areasForImprovement: string[];
    riskTags: string[];
  }
): Promise<void> {
  await db.insert(schema.sessionAiEvaluations).values({
    sessionId,
    qualityScore: evaluation.qualityScore,
    strengths: evaluation.strengths,
    areasForImprovement: evaluation.areasForImprovement,
    riskTags: evaluation.riskTags,
    createdAt: new Date(),
  });
}

async function runEvaluations(): Promise<void> {
  console.log("🤖 Starting AI Evaluation Pipeline...\n");

  const evaluator = new AIEvaluator();

  try {
    // Get sessions to evaluate
    console.log("📋 Fetching sessions with transcripts to evaluate...");
    const sessions = await getSessionsToEvaluate();
    console.log(`   Found ${sessions.length} sessions to evaluate\n`);

    if (sessions.length === 0) {
      console.log("⚠️  No sessions found to evaluate.");
      console.log("   Run the transcript generation script first.");
      return;
    }

    let evaluated = 0;
    let failed = 0;
    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
      const batch = sessions.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(sessions.length / BATCH_SIZE);
      
      console.log(`\n📝 Processing batch ${batchNum}/${totalBatches}...`);

      const results = await Promise.allSettled(
        batch.map(async (session) => {
          const metadata: SessionMetadata = {
            sessionId: session.sessionId,
            subject: session.subject,
            isFirstSession: session.isFirstSessionForStudent,
            studentRating: session.studentRating,
            studentFeedback: session.studentFeedback,
            status: session.status as "completed" | "no_show" | "rescheduled",
            durationMinutes: session.durationMinutes,
          };

          const result = await evaluator.evaluateSession(metadata, session.transcriptText);

          if (result.success && result.evaluation) {
            await storeEvaluation(session.sessionId, result.evaluation);
            return { sessionId: session.sessionId, success: true };
          } else {
            throw new Error(result.error || "Unknown error");
          }
        })
      );

      // Count results
      for (const result of results) {
        if (result.status === "fulfilled") {
          evaluated++;
        } else {
          failed++;
          console.error(`   ✗ Failed: ${result.reason}`);
        }
      }

      console.log(`   Batch ${batchNum} complete: ${evaluated} evaluated, ${failed} failed`);

      // Rate limiting between batches
      if (i + BATCH_SIZE < sessions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 Evaluation Summary:");
    console.log(`   Total Evaluated: ${evaluated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    console.log(`   Rate: ${(evaluated / duration).toFixed(1)} sessions/sec`);

    // Print score distribution
    const evaluations = await db.select().from(schema.sessionAiEvaluations);
    if (evaluations.length > 0) {
      const scoreCounts = [0, 0, 0, 0, 0]; // Index 0-4 for scores 1-5
      for (const e of evaluations) {
        scoreCounts[e.qualityScore - 1]++;
      }
      
      console.log("\n📈 Score Distribution:");
      for (let i = 0; i < 5; i++) {
        const pct = ((scoreCounts[i] / evaluations.length) * 100).toFixed(1);
        const bar = "█".repeat(Math.round(scoreCounts[i] / evaluations.length * 20));
        console.log(`   Score ${i + 1}: ${bar} ${scoreCounts[i]} (${pct}%)`);
      }
    }

    console.log("\n✅ AI Evaluation pipeline completed!");

  } catch (error) {
    console.error("❌ Error running evaluations:", error);
    throw error;
  }
}

// Run
runEvaluations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

