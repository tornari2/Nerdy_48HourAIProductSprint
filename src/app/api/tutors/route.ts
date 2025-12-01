import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tutors, tutorMetrics, sessions } from "@/db/schema";
import { eq, desc, asc, sql, and, gte, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          tutors: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          error: "Database not configured. Please set DATABASE_URL environment variable."
        },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const sortBy = searchParams.get("sortBy") || "churnRisk";
    const sortOrder = searchParams.get("order") || "desc";
    const subject = searchParams.get("subject");
    const riskLevel = searchParams.get("riskLevel");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build the query
    const query = db
      .select({
        tutorId: tutors.tutorId,
        name: tutors.name,
        subjects: tutors.subjects,
        yearsExperience: tutors.yearsExperience,
        timezone: tutors.timezone,
        hireDate: tutors.hireDate,
        // Metrics
        totalSessionsLast30d: tutorMetrics.totalSessionsLast30d,
        firstSessionsLast30d: tutorMetrics.firstSessionsLast30d,
        firstSessionDropoutRate: tutorMetrics.firstSessionDropoutRate,
        tutorRescheduleRate: tutorMetrics.tutorRescheduleRate,
        tutorNoShowRate: tutorMetrics.tutorNoShowRate,
        avgStudentRatingLast30d: tutorMetrics.avgStudentRatingLast30d,
        aiAvgQualityScore: tutorMetrics.aiAvgQualityScore,
        churnRiskLabel: tutorMetrics.churnRiskLabel,
        noShowRiskLabel: tutorMetrics.noShowRiskLabel,
        highReschedulerFlag: tutorMetrics.highReschedulerFlag,
        poorFirstSessionFlag: tutorMetrics.poorFirstSessionFlag,
        updatedAt: tutorMetrics.updatedAt,
      })
      .from(tutors)
      .leftJoin(tutorMetrics, eq(tutors.tutorId, tutorMetrics.tutorId));

    // Get all results with timeout (10 seconds)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 10000)
    );

    const results = await Promise.race([query, timeoutPromise]);

    // Filter by subject if provided
    let filtered = results;
    if (subject) {
      filtered = filtered.filter((t) =>
        t.subjects?.some((s) => s.toLowerCase().includes(subject.toLowerCase()))
      );
    }

    // Filter by risk level
    if (riskLevel) {
      filtered = filtered.filter((t) => t.churnRiskLabel === riskLevel);
    }

    // Sort results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "churnRisk":
          const riskOrder = { high: 3, medium: 2, low: 1 };
          comparison =
            (riskOrder[a.churnRiskLabel as keyof typeof riskOrder] || 0) -
            (riskOrder[b.churnRiskLabel as keyof typeof riskOrder] || 0);
          break;
        case "rescheduleRate":
          comparison = (a.tutorRescheduleRate || 0) - (b.tutorRescheduleRate || 0);
          break;
        case "noShowRate":
          comparison = (a.tutorNoShowRate || 0) - (b.tutorNoShowRate || 0);
          break;
        case "rating":
          comparison = (a.avgStudentRatingLast30d || 0) - (b.avgStudentRatingLast30d || 0);
          break;
        case "aiScore":
          comparison = (a.aiAvgQualityScore || 0) - (b.aiAvgQualityScore || 0);
          break;
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      tutors: paginated,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    
    // Return empty result instead of error to prevent frontend hang
    return NextResponse.json({
      tutors: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
      error: error instanceof Error ? error.message : "Failed to fetch tutors. Please check your database connection.",
    }, { status: 200 }); // Return 200 so frontend doesn't treat it as error
  }
}

