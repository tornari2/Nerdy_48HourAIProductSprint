import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  tutors,
  tutorMetrics,
  sessions,
  sessionTranscripts,
  sessionAiEvaluations,
} from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tutorId } = await params;

    // Get tutor basic info
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.tutorId, tutorId))
      .limit(1);

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Get metrics
    const [metrics] = await db
      .select()
      .from(tutorMetrics)
      .where(eq(tutorMetrics.tutorId, tutorId))
      .limit(1);

    // Get recent sessions with evaluations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await db
      .select({
        sessionId: sessions.sessionId,
        studentId: sessions.studentId,
        subject: sessions.subject,
        scheduledStartAt: sessions.scheduledStartAt,
        actualStartAt: sessions.actualStartAt,
        durationMinutes: sessions.durationMinutes,
        status: sessions.status,
        isFirstSessionForStudent: sessions.isFirstSessionForStudent,
        rescheduleInitiator: sessions.rescheduleInitiator,
        studentRating: sessions.studentRating,
        studentFeedback: sessions.studentFeedback,
        studentChurnedAfterSession: sessions.studentChurnedAfterSession,
        hasTranscript: sessions.hasTranscript,
        createdAt: sessions.createdAt,
        // AI Evaluation
        aiQualityScore: sessionAiEvaluations.qualityScore,
        aiStrengths: sessionAiEvaluations.strengths,
        aiAreasForImprovement: sessionAiEvaluations.areasForImprovement,
        aiRiskTags: sessionAiEvaluations.riskTags,
      })
      .from(sessions)
      .leftJoin(
        sessionAiEvaluations,
        eq(sessions.sessionId, sessionAiEvaluations.sessionId)
      )
      .where(
        and(
          eq(sessions.tutorId, tutorId),
          gte(sessions.scheduledStartAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(sessions.scheduledStartAt))
      .limit(50);

    // Get transcripts for sessions that have them
    const sessionsWithTranscripts = recentSessions.filter((s) => s.hasTranscript);
    const transcriptMap = new Map<string, string>();

    if (sessionsWithTranscripts.length > 0) {
      const transcripts = await db
        .select()
        .from(sessionTranscripts)
        .where(
          eq(
            sessionTranscripts.sessionId,
            sessionsWithTranscripts[0].sessionId
          )
        );

      for (const t of transcripts) {
        transcriptMap.set(t.sessionId, t.transcriptText);
      }
    }

    // Enrich sessions with transcripts
    const enrichedSessions = recentSessions.map((s) => ({
      ...s,
      transcript: transcriptMap.get(s.sessionId) || null,
    }));

    // Calculate rating trend (last 4 weeks)
    const ratingTrend: { week: string; avgRating: number; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekSessions = recentSessions.filter((s) => {
        const date = new Date(s.scheduledStartAt);
        return date >= weekStart && date < weekEnd && s.studentRating !== null;
      });

      const avgRating =
        weekSessions.length > 0
          ? weekSessions.reduce((sum, s) => sum + (s.studentRating || 0), 0) /
            weekSessions.length
          : 0;

      ratingTrend.push({
        week: `Week ${4 - i}`,
        avgRating: Math.round(avgRating * 10) / 10,
        count: weekSessions.length,
      });
    }

    return NextResponse.json({
      tutor,
      metrics,
      sessions: enrichedSessions,
      ratingTrend,
      stats: {
        totalSessions: recentSessions.length,
        completedSessions: recentSessions.filter((s) => s.status === "completed").length,
        firstSessions: recentSessions.filter((s) => s.isFirstSessionForStudent).length,
        evaluatedSessions: recentSessions.filter((s) => s.aiQualityScore !== null).length,
      },
    });
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor details" },
      { status: 500 }
    );
  }
}

