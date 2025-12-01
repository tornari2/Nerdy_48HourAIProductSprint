import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, gte, sql, avg, count } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../db/schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

// ============================================
// CONFIGURATION - Risk Thresholds
// ============================================
const CONFIG = {
  // Time window for metrics calculation (30 days)
  METRIC_WINDOW_DAYS: 30,

  // Reschedule rate thresholds
  HIGH_RESCHEDULER_THRESHOLD: 0.15, // >15% = high rescheduler

  // No-show rate thresholds
  NO_SHOW_HIGH_THRESHOLD: 0.10, // >10% = high risk
  NO_SHOW_MEDIUM_THRESHOLD: 0.05, // >5% = medium risk

  // First session dropout thresholds
  POOR_FIRST_SESSION_THRESHOLD: 0.25, // >25% = poor first session flag

  // Churn risk calculation thresholds
  CHURN_RISK_RATING_LOW_THRESHOLD: 3.5,
  CHURN_RISK_AI_SCORE_LOW_THRESHOLD: 3.0,

  // Minimum sessions for reliable metrics
  MIN_SESSIONS_FOR_METRICS: 3,
};

// ============================================
// TYPES
// ============================================
interface TutorMetricsData {
  tutorId: string;
  totalSessionsLast30d: number;
  firstSessionsLast30d: number;
  firstSessionDropoutRate: number;
  tutorRescheduleRate: number;
  tutorNoShowRate: number;
  avgStudentRatingLast30d: number | null;
  aiAvgQualityScore: number | null;
  churnRiskLabel: "low" | "medium" | "high";
  noShowRiskLabel: "low" | "medium" | "high";
  highReschedulerFlag: boolean;
  poorFirstSessionFlag: boolean;
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

async function calculateTutorMetrics(): Promise<TutorMetricsData[]> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - CONFIG.METRIC_WINDOW_DAYS);

  // Get all tutors
  const tutors = await db.select().from(schema.tutors);
  console.log(`📊 Calculating metrics for ${tutors.length} tutors...`);

  const metricsResults: TutorMetricsData[] = [];

  for (const tutor of tutors) {
    // Get all sessions for this tutor in the window
    const sessions = await db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.tutorId, tutor.tutorId),
          gte(schema.sessions.scheduledStartAt, windowStart)
        )
      );

    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      // No sessions, skip this tutor (or create with zeros)
      continue;
    }

    // Calculate session statistics
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const noShowSessions = sessions.filter((s) => s.status === "no_show");
    const rescheduledSessions = sessions.filter((s) => s.status === "rescheduled");
    const firstSessions = sessions.filter((s) => s.isFirstSessionForStudent);

    // First session dropout rate
    const firstSessionWithChurn = firstSessions.filter(
      (s) => s.studentChurnedAfterSession || (s.studentRating !== null && s.studentRating <= 2)
    );
    const firstSessionDropoutRate =
      firstSessions.length > 0 ? firstSessionWithChurn.length / firstSessions.length : 0;

    // Reschedule rate (tutor-initiated)
    const tutorRescheduled = rescheduledSessions.filter(
      (s) => s.rescheduleInitiator === "tutor"
    );
    const tutorRescheduleRate = totalSessions > 0 ? tutorRescheduled.length / totalSessions : 0;

    // No-show rate
    const tutorNoShowRate = totalSessions > 0 ? noShowSessions.length / totalSessions : 0;

    // Average student rating
    const ratingsWithValues = completedSessions.filter((s) => s.studentRating !== null);
    const avgStudentRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, s) => sum + (s.studentRating || 0), 0) / ratingsWithValues.length
        : null;

    // Get AI evaluations for this tutor's sessions
    const sessionIds = sessions.map((s) => s.sessionId);
    let aiAvgScore: number | null = null;

    if (sessionIds.length > 0) {
      const aiEvaluations = await db
        .select()
        .from(schema.sessionAiEvaluations)
        .where(sql`${schema.sessionAiEvaluations.sessionId} = ANY(${sessionIds})`);

      if (aiEvaluations.length > 0) {
        aiAvgScore =
          aiEvaluations.reduce((sum, e) => sum + e.qualityScore, 0) / aiEvaluations.length;
      }
    }

    // Calculate risk labels
    const noShowRiskLabel = calculateNoShowRiskLabel(
      tutorNoShowRate,
      tutorRescheduleRate,
      avgStudentRating
    );
    const churnRiskLabel = calculateChurnRiskLabel(
      avgStudentRating,
      aiAvgScore,
      tutorNoShowRate,
      tutorRescheduleRate,
      firstSessionDropoutRate
    );

    // Set flags
    const highReschedulerFlag = tutorRescheduleRate > CONFIG.HIGH_RESCHEDULER_THRESHOLD;
    const poorFirstSessionFlag = firstSessionDropoutRate > CONFIG.POOR_FIRST_SESSION_THRESHOLD;

    metricsResults.push({
      tutorId: tutor.tutorId,
      totalSessionsLast30d: totalSessions,
      firstSessionsLast30d: firstSessions.length,
      firstSessionDropoutRate,
      tutorRescheduleRate,
      tutorNoShowRate,
      avgStudentRatingLast30d: avgStudentRating,
      aiAvgQualityScore: aiAvgScore,
      churnRiskLabel,
      noShowRiskLabel,
      highReschedulerFlag,
      poorFirstSessionFlag,
    });
  }

  return metricsResults;
}

function calculateNoShowRiskLabel(
  noShowRate: number,
  rescheduleRate: number,
  avgRating: number | null
): "low" | "medium" | "high" {
  // High risk: high no-show rate OR (high reschedule rate AND low rating)
  if (noShowRate > CONFIG.NO_SHOW_HIGH_THRESHOLD) {
    return "high";
  }

  if (
    rescheduleRate > CONFIG.HIGH_RESCHEDULER_THRESHOLD &&
    avgRating !== null &&
    avgRating < CONFIG.CHURN_RISK_RATING_LOW_THRESHOLD
  ) {
    return "high";
  }

  if (noShowRate > CONFIG.NO_SHOW_MEDIUM_THRESHOLD) {
    return "medium";
  }

  return "low";
}

function calculateChurnRiskLabel(
  avgRating: number | null,
  aiAvgScore: number | null,
  noShowRate: number,
  rescheduleRate: number,
  firstSessionDropoutRate: number
): "low" | "medium" | "high" {
  let riskScore = 0;

  // Factor 1: Low average rating
  if (avgRating !== null && avgRating < CONFIG.CHURN_RISK_RATING_LOW_THRESHOLD) {
    riskScore += avgRating < 3 ? 2 : 1;
  }

  // Factor 2: Low AI quality score
  if (aiAvgScore !== null && aiAvgScore < CONFIG.CHURN_RISK_AI_SCORE_LOW_THRESHOLD) {
    riskScore += aiAvgScore < 2.5 ? 2 : 1;
  }

  // Factor 3: High no-show rate
  if (noShowRate > CONFIG.NO_SHOW_HIGH_THRESHOLD) {
    riskScore += 2;
  } else if (noShowRate > CONFIG.NO_SHOW_MEDIUM_THRESHOLD) {
    riskScore += 1;
  }

  // Factor 4: High reschedule rate
  if (rescheduleRate > CONFIG.HIGH_RESCHEDULER_THRESHOLD) {
    riskScore += 1;
  }

  // Factor 5: Poor first session performance
  if (firstSessionDropoutRate > CONFIG.POOR_FIRST_SESSION_THRESHOLD) {
    riskScore += 2;
  }

  // Map score to risk label
  if (riskScore >= 4) return "high";
  if (riskScore >= 2) return "medium";
  return "low";
}

async function storeTutorMetrics(metrics: TutorMetricsData[]): Promise<void> {
  console.log(`💾 Storing metrics for ${metrics.length} tutors...`);

  // Upsert metrics (delete existing, insert new)
  for (const metric of metrics) {
    // Try to update first, then insert if doesn't exist
    await db
      .insert(schema.tutorMetrics)
      .values({
        ...metric,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.tutorMetrics.tutorId,
        set: {
          totalSessionsLast30d: metric.totalSessionsLast30d,
          firstSessionsLast30d: metric.firstSessionsLast30d,
          firstSessionDropoutRate: metric.firstSessionDropoutRate,
          tutorRescheduleRate: metric.tutorRescheduleRate,
          tutorNoShowRate: metric.tutorNoShowRate,
          avgStudentRatingLast30d: metric.avgStudentRatingLast30d,
          aiAvgQualityScore: metric.aiAvgQualityScore,
          churnRiskLabel: metric.churnRiskLabel,
          noShowRiskLabel: metric.noShowRiskLabel,
          highReschedulerFlag: metric.highReschedulerFlag,
          poorFirstSessionFlag: metric.poorFirstSessionFlag,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`  ✓ Metrics stored successfully`);
}

async function printAnalyticsSummary(metrics: TutorMetricsData[]): Promise<void> {
  console.log("\n📈 Analytics Summary:");
  console.log("=".repeat(50));

  // Risk distribution
  const highRiskCount = metrics.filter((m) => m.churnRiskLabel === "high").length;
  const mediumRiskCount = metrics.filter((m) => m.churnRiskLabel === "medium").length;
  const lowRiskCount = metrics.filter((m) => m.churnRiskLabel === "low").length;

  console.log("\n🎯 Churn Risk Distribution:");
  console.log(`   High Risk: ${highRiskCount} tutors (${((highRiskCount / metrics.length) * 100).toFixed(1)}%)`);
  console.log(`   Medium Risk: ${mediumRiskCount} tutors (${((mediumRiskCount / metrics.length) * 100).toFixed(1)}%)`);
  console.log(`   Low Risk: ${lowRiskCount} tutors (${((lowRiskCount / metrics.length) * 100).toFixed(1)}%)`);

  // No-show risk distribution
  const noShowHigh = metrics.filter((m) => m.noShowRiskLabel === "high").length;
  const noShowMedium = metrics.filter((m) => m.noShowRiskLabel === "medium").length;

  console.log("\n⚠️  No-Show Risk Distribution:");
  console.log(`   High: ${noShowHigh} tutors`);
  console.log(`   Medium: ${noShowMedium} tutors`);

  // Flag counts
  const highReschedulers = metrics.filter((m) => m.highReschedulerFlag).length;
  const poorFirstSessions = metrics.filter((m) => m.poorFirstSessionFlag).length;

  console.log("\n🚩 Flagged Tutors:");
  console.log(`   High Reschedulers: ${highReschedulers} tutors`);
  console.log(`   Poor First Sessions: ${poorFirstSessions} tutors`);

  // Average metrics
  const avgRescheduleRate = metrics.reduce((sum, m) => sum + m.tutorRescheduleRate, 0) / metrics.length;
  const avgNoShowRate = metrics.reduce((sum, m) => sum + m.tutorNoShowRate, 0) / metrics.length;
  const avgFirstSessionDropout = metrics.reduce((sum, m) => sum + m.firstSessionDropoutRate, 0) / metrics.length;

  console.log("\n📊 Average Rates:");
  console.log(`   Reschedule Rate: ${(avgRescheduleRate * 100).toFixed(1)}%`);
  console.log(`   No-Show Rate: ${(avgNoShowRate * 100).toFixed(1)}%`);
  console.log(`   First Session Dropout: ${(avgFirstSessionDropout * 100).toFixed(1)}%`);
}

// ============================================
// MAIN
// ============================================
async function runAnalytics() {
  console.log("🔄 Running Analytics Pipeline...\n");

  try {
    // Calculate metrics
    const metrics = await calculateTutorMetrics();

    if (metrics.length === 0) {
      console.log("⚠️  No tutors found with sessions. Run the seed script first.");
      return;
    }

    // Store metrics
    await storeTutorMetrics(metrics);

    // Print summary
    await printAnalyticsSummary(metrics);

    console.log("\n✅ Analytics pipeline completed successfully!");
  } catch (error) {
    console.error("❌ Error running analytics:", error);
    throw error;
  }
}

// Run
runAnalytics()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

