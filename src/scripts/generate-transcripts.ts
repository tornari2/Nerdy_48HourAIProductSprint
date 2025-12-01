import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNull, sql } from "drizzle-orm";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as schema from "../db/schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration
const NUM_TRANSCRIPTS = 150; // Generate 50-200 transcripts as per PRD
const BATCH_SIZE = 5; // Process in parallel batches

// Few-shot examples inspired by Eedi Tutoring Dialogues
const FEW_SHOT_EXAMPLES = `
Example 1 - Excellent Session (Rating 5):
Tutor: Hi! Ready to work on quadratic equations today?
Student: Yes, but I'm really confused about factoring.
Tutor: That's totally normal! Let's start with the basics. Can you tell me what you remember about factors?
Student: Um, like numbers that multiply together?
Tutor: Exactly right! So for quadratics, we're looking for two expressions that multiply to give us our equation. Let me show you a simple example first.
Student: Okay.
Tutor: Take x² + 5x + 6. We need two numbers that multiply to 6 and add to 5. What pairs multiply to 6?
Student: 2 and 3? And 1 and 6?
Tutor: Perfect! Now which pair adds to 5?
Student: Oh! 2 and 3 add to 5!
Tutor: You've got it! So the factored form is (x + 2)(x + 3). Want to try one on your own?
Student: Yes! I think I understand now.
Tutor: Great enthusiasm! Here's one: x² + 7x + 12. Take your time.
Student: Factors of 12... 3 and 4, and they add to 7! So (x + 3)(x + 4)?
Tutor: Excellent work! You're really getting this. Let's try a slightly harder one to make sure you've mastered it.

Example 2 - Poor First Session (Rating 2):
Tutor: Okay so we're doing chemistry today. What do you need help with?
Student: I don't really understand balancing equations.
Tutor: Right, so you just need to make sure the atoms are equal on both sides. It's pretty straightforward.
Student: But how do I know what numbers to use?
Tutor: You just look at the atoms and balance them. Here, Fe + O2 -> Fe2O3. You need 4 Fe on the left and 3 O2.
Student: Wait, where did those numbers come from?
Tutor: From balancing. You count the atoms. Let's move on to the next problem.
Student: But I still don't understand how you got 4 and 3...
Tutor: It just works out that way. Practice more and you'll get it. Here's another one.
Student: Can we go back to the first one?
Tutor: We don't have time, we need to cover more material.

Example 3 - Average Session (Rating 3):
Tutor: Hey there! Working on AP History essay writing today?
Student: Yeah, I got a C on my last DBQ and I don't know what I did wrong.
Tutor: Let's take a look at the feedback. What did your teacher write?
Student: She said my thesis was weak and I didn't use enough documents.
Tutor: Those are common issues. A strong thesis needs to make an argument, not just state facts. What was your thesis?
Student: "The American Revolution had many causes."
Tutor: I see. That's more of a topic sentence. A thesis should take a position. Try something like "The American Revolution was primarily caused by economic tensions, though ideological factors also played a role."
Student: Oh, that makes sense.
Tutor: Good. Now about the documents - you should use at least 6 in a DBQ. How many did you use?
Student: Maybe 4?
Tutor: That's part of the issue. Let's practice incorporating documents into an argument.
Student: Okay.
`;

interface SessionForTranscript {
  sessionId: string;
  subject: string;
  studentRating: number | null;
  isFirstSessionForStudent: boolean;
  status: string;
  studentChurnedAfterSession: boolean;
  durationMinutes: number;
}

async function generateTranscript(session: SessionForTranscript): Promise<string> {
  const sessionContext = buildSessionContext(session);
  
  const prompt = `You are generating a realistic tutoring session transcript. The transcript should reflect the session quality indicated by the metadata.

Session Metadata:
- Subject: ${session.subject}
- Rating: ${session.studentRating ?? "N/A"}/5
- First Session: ${session.isFirstSessionForStudent ? "Yes" : "No"}
- Session Status: ${session.status}
- Duration: ${session.durationMinutes} minutes
- Student Churned After: ${session.studentChurnedAfterSession ? "Yes" : "No"}

${sessionContext}

${FEW_SHOT_EXAMPLES}

Now generate a realistic transcript for this session. The transcript should:
1. Match the rating quality (low ratings = rushed/confusing, high ratings = patient/clear)
2. Be appropriate for the subject matter
3. Show realistic tutor-student interaction patterns
4. Be about 10-20 exchanges long
5. Use the format "Tutor: [text]" and "Student: [text]"

Generate the transcript:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert at generating realistic tutoring session transcripts. Your transcripts should accurately reflect the quality indicated by the session metadata.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "";
}

function buildSessionContext(session: SessionForTranscript): string {
  const contexts: string[] = [];

  if (session.status === "no_show") {
    return "Context: This is a no-show session. Generate a very short transcript showing the tutor waiting and the student not appearing.";
  }

  if (session.studentRating !== null) {
    if (session.studentRating <= 2) {
      contexts.push("The session was poorly received. The tutor may have been rushed, unclear, or not responsive to student needs.");
      if (session.isFirstSessionForStudent) {
        contexts.push("This was the student's first session, making the poor experience particularly impactful.");
      }
    } else if (session.studentRating === 3) {
      contexts.push("The session was adequate but not exceptional. Some concepts were covered but there's room for improvement.");
    } else if (session.studentRating >= 4) {
      contexts.push("The session went well. The tutor was patient, clear, and the student showed understanding.");
    }
  }

  if (session.studentChurnedAfterSession) {
    contexts.push("The student did not return after this session, suggesting it did not meet their needs.");
  }

  if (session.isFirstSessionForStudent) {
    contexts.push("This is the student's first tutoring session, so some rapport-building and level assessment is expected.");
  }

  return contexts.length > 0 ? `Context: ${contexts.join(" ")}` : "";
}

async function selectSessionsForTranscripts(): Promise<SessionForTranscript[]> {
  // Select a diverse set of sessions for transcript generation
  // Priority: first sessions, sessions from high-risk tutors, varied ratings
  
  const sessions = await db
    .select({
      sessionId: schema.sessions.sessionId,
      subject: schema.sessions.subject,
      studentRating: schema.sessions.studentRating,
      isFirstSessionForStudent: schema.sessions.isFirstSessionForStudent,
      status: schema.sessions.status,
      studentChurnedAfterSession: schema.sessions.studentChurnedAfterSession,
      durationMinutes: schema.sessions.durationMinutes,
    })
    .from(schema.sessions)
    .where(eq(schema.sessions.hasTranscript, false))
    .orderBy(sql`RANDOM()`)
    .limit(NUM_TRANSCRIPTS * 2); // Get more than needed for diversity selection

  // Ensure diverse selection
  const selected: SessionForTranscript[] = [];
  const categories = {
    firstSessionPoor: [] as SessionForTranscript[],
    firstSessionGood: [] as SessionForTranscript[],
    regularPoor: [] as SessionForTranscript[],
    regularGood: [] as SessionForTranscript[],
    noShow: [] as SessionForTranscript[],
    rescheduled: [] as SessionForTranscript[],
  };

  // Categorize sessions
  for (const session of sessions) {
    if (session.status === "no_show") {
      categories.noShow.push(session);
    } else if (session.status === "rescheduled") {
      categories.rescheduled.push(session);
    } else if (session.isFirstSessionForStudent) {
      if ((session.studentRating ?? 3) <= 2) {
        categories.firstSessionPoor.push(session);
      } else {
        categories.firstSessionGood.push(session);
      }
    } else {
      if ((session.studentRating ?? 3) <= 2) {
        categories.regularPoor.push(session);
      } else {
        categories.regularGood.push(session);
      }
    }
  }

  // Select proportionally from each category
  const quotas = {
    firstSessionPoor: Math.ceil(NUM_TRANSCRIPTS * 0.15), // 15% poor first sessions
    firstSessionGood: Math.ceil(NUM_TRANSCRIPTS * 0.20), // 20% good first sessions
    regularPoor: Math.ceil(NUM_TRANSCRIPTS * 0.15), // 15% poor regular
    regularGood: Math.ceil(NUM_TRANSCRIPTS * 0.40), // 40% good regular
    noShow: Math.ceil(NUM_TRANSCRIPTS * 0.05), // 5% no-shows
    rescheduled: Math.ceil(NUM_TRANSCRIPTS * 0.05), // 5% rescheduled
  };

  for (const [category, quota] of Object.entries(quotas)) {
    const available = categories[category as keyof typeof categories];
    selected.push(...available.slice(0, quota));
  }

  return selected.slice(0, NUM_TRANSCRIPTS);
}

async function generateAndStoreTranscripts() {
  console.log("🎭 Starting transcript generation...\n");

  try {
    // Select sessions for transcript generation
    console.log("📋 Selecting sessions for transcript generation...");
    const sessions = await selectSessionsForTranscripts();
    console.log(`  ✓ Selected ${sessions.length} sessions\n`);

    if (sessions.length === 0) {
      console.log("⚠️  No sessions available for transcript generation.");
      console.log("   Run the seed script first to populate sessions.");
      return;
    }

    // Generate transcripts in batches
    let generated = 0;
    let failed = 0;

    for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
      const batch = sessions.slice(i, i + BATCH_SIZE);
      console.log(`📝 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(sessions.length / BATCH_SIZE)}...`);

      const results = await Promise.allSettled(
        batch.map(async (session) => {
          const transcript = await generateTranscript(session);
          return { sessionId: session.sessionId, transcript };
        })
      );

      // Store successful transcripts
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.transcript) {
          try {
            await db.insert(schema.sessionTranscripts).values({
              sessionId: result.value.sessionId,
              transcriptText: result.value.transcript,
            });

            await db
              .update(schema.sessions)
              .set({ hasTranscript: true })
              .where(eq(schema.sessions.sessionId, result.value.sessionId));

            generated++;
          } catch (err) {
            console.error(`  ✗ Failed to store transcript for ${result.value.sessionId}`);
            failed++;
          }
        } else {
          failed++;
          if (result.status === "rejected") {
            console.error(`  ✗ Failed to generate: ${result.reason}`);
          }
        }
      }

      console.log(`  ✓ Batch complete (${generated} generated, ${failed} failed)`);

      // Rate limiting - wait between batches
      if (i + BATCH_SIZE < sessions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Transcript generation complete!`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Failed: ${failed}`);

  } catch (error) {
    console.error("❌ Error generating transcripts:", error);
    throw error;
  }
}

// Run the script
generateAndStoreTranscripts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

