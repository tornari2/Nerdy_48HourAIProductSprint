import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, tutors, tutorMetrics } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        overview: {
          totalFirstSessions: 0,
          badFirstSessions: 0,
          overallDropoutRate: 0,
          avgRating: 0,
          window: "Last 30 days",
        },
        bySubject: [],
        poorPerformingTutors: [],
        error: "Database not configured",
      }, { status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");
    const subject = searchParams.get("subject");

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - days);

    // Get first session stats by subject
    const subjectStats = await db
      .select({
        subject: sessions.subject,
        totalFirstSessions: sql<number>`COUNT(*)::int`,
        badFirstSessions: sql<number>`SUM(CASE WHEN ${sessions.studentChurnedAfterSession} OR ${sessions.studentRating} <= 2 THEN 1 ELSE 0 END)::int`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.isFirstSessionForStudent, true),
          gte(sessions.scheduledStartAt, windowStart),
          subject ? eq(sessions.subject, subject) : undefined
        )
      )
      .groupBy(sessions.subject);

    // Calculate dropout rates and sort
    const enrichedStats = subjectStats.map((stat) => ({
      ...stat,
      dropoutRate:
        stat.totalFirstSessions > 0
          ? stat.badFirstSessions / stat.totalFirstSessions
          : 0,
    }));

    enrichedStats.sort((a, b) => b.dropoutRate - a.dropoutRate);

    // Get tutors with worst first session performance
    const poorFirstSessionTutors = await db
      .select({
        tutorId: tutors.tutorId,
        name: tutors.name,
        subjects: tutors.subjects,
        firstSessionDropoutRate: tutorMetrics.firstSessionDropoutRate,
        firstSessionsLast30d: tutorMetrics.firstSessionsLast30d,
        avgStudentRatingLast30d: tutorMetrics.avgStudentRatingLast30d,
        poorFirstSessionFlag: tutorMetrics.poorFirstSessionFlag,
      })
      .from(tutors)
      .innerJoin(tutorMetrics, eq(tutors.tutorId, tutorMetrics.tutorId))
      .where(
        and(
          eq(tutorMetrics.poorFirstSessionFlag, true),
          gte(tutorMetrics.firstSessionsLast30d, 2) // At least 2 first sessions
        )
      )
      .orderBy(desc(tutorMetrics.firstSessionDropoutRate))
      .limit(20);

    // Overall first session metrics
    const [overallStats] = await db
      .select({
        totalFirstSessions: sql<number>`COUNT(*)::int`,
        badFirstSessions: sql<number>`SUM(CASE WHEN ${sessions.studentChurnedAfterSession} OR ${sessions.studentRating} <= 2 THEN 1 ELSE 0 END)::int`,
        avgRating: sql<number>`AVG(${sessions.studentRating})`,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.isFirstSessionForStudent, true),
          gte(sessions.scheduledStartAt, windowStart)
        )
      );

    return NextResponse.json({
      overview: {
        totalFirstSessions: overallStats?.totalFirstSessions || 0,
        badFirstSessions: overallStats?.badFirstSessions || 0,
        overallDropoutRate:
          overallStats && overallStats.totalFirstSessions > 0
            ? (overallStats.badFirstSessions / overallStats.totalFirstSessions) * 100
            : 0,
        avgRating: overallStats?.avgRating
          ? Math.round(overallStats.avgRating * 10) / 10
          : 0,
        window: `Last ${days} days`,
      },
      bySubject: enrichedStats,
      poorPerformingTutors: poorFirstSessionTutors,
    });
  } catch (error) {
    console.error("Error fetching first session data:", error);
    // Return empty data instead of error
    return NextResponse.json({
      overview: {
        totalFirstSessions: 0,
        badFirstSessions: 0,
        overallDropoutRate: 0,
        avgRating: 0,
        window: "Last 30 days",
      },
      bySubject: [],
      poorPerformingTutors: [],
      error: error instanceof Error ? error.message : "Failed to fetch first session data",
    }, { status: 200 });
  }
}

