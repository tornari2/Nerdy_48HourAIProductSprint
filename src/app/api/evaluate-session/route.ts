import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionTranscripts, sessionAiEvaluations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluateSessionTranscript, SessionMetadata } from "@/lib/ai-evaluator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Check if already evaluated
    const [existingEvaluation] = await db
      .select()
      .from(sessionAiEvaluations)
      .where(eq(sessionAiEvaluations.sessionId, sessionId))
      .limit(1);

    if (existingEvaluation) {
      return NextResponse.json({
        success: true,
        evaluation: existingEvaluation,
        cached: true,
      });
    }

    // Get session and transcript
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [transcript] = await db
      .select()
      .from(sessionTranscripts)
      .where(eq(sessionTranscripts.sessionId, sessionId))
      .limit(1);

    if (!transcript) {
      return NextResponse.json(
        { error: "Session has no transcript" },
        { status: 400 }
      );
    }

    // Build metadata
    const metadata: SessionMetadata = {
      sessionId: session.sessionId,
      subject: session.subject,
      isFirstSession: session.isFirstSessionForStudent,
      studentRating: session.studentRating,
      studentFeedback: session.studentFeedback,
      status: session.status as "completed" | "no_show" | "rescheduled",
      durationMinutes: session.durationMinutes,
    };

    // Evaluate
    const result = await evaluateSessionTranscript(metadata, transcript.transcriptText);

    if (!result.success || !result.evaluation) {
      return NextResponse.json(
        { error: result.error || "Evaluation failed" },
        { status: 500 }
      );
    }

    // Store evaluation
    await db.insert(sessionAiEvaluations).values({
      sessionId,
      qualityScore: result.evaluation.qualityScore,
      strengths: result.evaluation.strengths,
      areasForImprovement: result.evaluation.areasForImprovement,
      riskTags: result.evaluation.riskTags,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
      cached: false,
    });
  } catch (error) {
    console.error("Error evaluating session:", error);
    return NextResponse.json(
      { error: "Failed to evaluate session" },
      { status: 500 }
    );
  }
}

