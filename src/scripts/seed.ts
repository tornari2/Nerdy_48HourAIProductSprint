import { faker } from "@faker-js/faker";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import * as schema from "../db/schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const NUM_TUTORS = 100;
const NUM_STUDENTS = 2500;
const NUM_SESSIONS = 3000;
const SESSION_WINDOW_DAYS = 7;

const SUBJECTS = [
  "SAT Math",
  "SAT Reading",
  "SAT Writing",
  "ACT Math",
  "ACT English",
  "AP Calculus",
  "AP Physics",
  "AP Chemistry",
  "AP Biology",
  "AP History",
  "Algebra 1",
  "Algebra 2",
  "Geometry",
  "Pre-Calculus",
  "Statistics",
  "Chemistry",
  "Physics",
  "Biology",
  "English",
  "Writing",
];

const SEGMENTS = ["SAT", "ACT", "AP", "Homework Help", "Test Prep", "College Prep"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomSubset<T>(array: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max: Math.min(max, array.length) });
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function weightedRandom(weights: { value: number; weight: number }[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  for (const w of weights) {
    random -= w.weight;
    if (random <= 0) return w.value;
  }
  return weights[weights.length - 1].value;
}

// ============================================
// DATA GENERATORS
// ============================================
function generateTutors(): schema.NewTutor[] {
  const tutors: schema.NewTutor[] = [];

  for (let i = 0; i < NUM_TUTORS; i++) {
    // Some tutors are "bad" (10-15%), most are average, some are great
    const tutorQuality = Math.random();
    const numSubjects = tutorQuality > 0.85 ? faker.number.int({ min: 3, max: 5 }) : faker.number.int({ min: 1, max: 3 });

    tutors.push({
      tutorId: `tutor_${faker.string.alphanumeric(8)}`,
      name: faker.person.fullName(),
      subjects: randomSubset(SUBJECTS, 1, numSubjects),
      yearsExperience: faker.number.int({ min: 0, max: 15 }),
      timezone: randomChoice(TIMEZONES),
      hireDate: faker.date.past({ years: 3 }).toISOString().split("T")[0],
    });
  }

  return tutors;
}

function generateStudents(): schema.NewStudent[] {
  const students: schema.NewStudent[] = [];

  for (let i = 0; i < NUM_STUDENTS; i++) {
    students.push({
      studentId: `student_${faker.string.alphanumeric(8)}`,
      gradeLevel: faker.number.int({ min: 6, max: 12 }),
      segment: randomChoice(SEGMENTS),
    });
  }

  return students;
}

interface GeneratedSession {
  session: schema.NewSession;
  tutorQualityBias: number;
}

function generateSessions(
  tutors: schema.NewTutor[],
  students: schema.NewStudent[]
): GeneratedSession[] {
  const sessions: GeneratedSession[] = [];
  const studentFirstSessions = new Set<string>();
  const now = new Date();
  const windowStart = new Date(now.getTime() - SESSION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Assign quality bias to each tutor (persistent characteristic)
  const tutorQualityBias: Map<string, number> = new Map();
  tutors.forEach((tutor) => {
    // 15% bad tutors, 70% average, 15% excellent
    const roll = Math.random();
    if (roll < 0.15) {
      tutorQualityBias.set(tutor.tutorId, -0.3); // Bad tutor bias
    } else if (roll > 0.85) {
      tutorQualityBias.set(tutor.tutorId, 0.3); // Excellent tutor bias
    } else {
      tutorQualityBias.set(tutor.tutorId, 0); // Average
    }
  });

  for (let i = 0; i < NUM_SESSIONS; i++) {
    const tutor = randomChoice(tutors);
    const student = randomChoice(students);
    const qualityBias = tutorQualityBias.get(tutor.tutorId) || 0;

    // Determine if this is a first session for the student
    const isFirstSession = !studentFirstSessions.has(student.studentId);
    if (isFirstSession) {
      studentFirstSessions.add(student.studentId);
    }

    // Generate scheduled time within the window
    const scheduledStart = faker.date.between({ from: windowStart, to: now });

    // Determine session status based on PRD requirements:
    // - 2-5% no-shows
    // - 5-15% rescheduled (~90% tutor-initiated)
    // - Rest are completed
    let status: "completed" | "no_show" | "rescheduled";
    let rescheduleInitiator: "tutor" | "student" | null = null;
    let durationMinutes: number;
    let actualStartAt: Date | null;

    const statusRoll = Math.random();
    const noShowThreshold = 0.03 + (qualityBias < 0 ? 0.02 : 0); // Bad tutors have higher no-show rate

    if (statusRoll < noShowThreshold) {
      status = "no_show";
      durationMinutes = 0;
      actualStartAt = null;
    } else if (statusRoll < noShowThreshold + 0.1 + (qualityBias < 0 ? 0.05 : 0)) {
      status = "rescheduled";
      // ~90% tutor-initiated reschedules
      rescheduleInitiator = Math.random() < 0.9 ? "tutor" : "student";
      durationMinutes = 0;
      actualStartAt = null;
    } else {
      status = "completed";
      durationMinutes = randomChoice([30, 45, 60, 60, 60, 90]); // Most are 60 min
      actualStartAt = new Date(scheduledStart.getTime() + faker.number.int({ min: -5, max: 10 }) * 60000);
    }

    // Generate rating based on tutor quality and session outcome
    let studentRating: number | null = null;
    let studentFeedback: string | null = null;
    let studentChurned = false;
    const tutorChurned = Math.random() < 0.05; // 5% of tutors churn within 30d

    if (status === "completed") {
      // Base rating influenced by tutor quality
      const baseRating = 3.5 + qualityBias * 2;
      const ratingVariance = faker.number.float({ min: -1.5, max: 1.5 });
      const rawRating = Math.round(baseRating + ratingVariance);
      studentRating = Math.max(1, Math.min(5, rawRating));

      // Generate feedback for some sessions
      if (Math.random() < 0.4) {
        studentFeedback = generateFeedback(studentRating, tutor.subjects?.[0] || "Math");
      }

      // Churn probability based on rating and first session
      // First session with low rating -> high churn (mirrors 24% stat)
      if (isFirstSession) {
        if (studentRating <= 2) {
          studentChurned = Math.random() < 0.5; // 50% churn on bad first session
        } else if (studentRating === 3) {
          studentChurned = Math.random() < 0.2;
        } else {
          studentChurned = Math.random() < 0.05;
        }
      } else {
        studentChurned = studentRating <= 2 ? Math.random() < 0.3 : Math.random() < 0.08;
      }
    } else if (status === "no_show") {
      // No-shows often lead to churn
      studentChurned = Math.random() < 0.4;
    } else {
      // Rescheduled - moderate churn
      studentChurned = Math.random() < 0.15;
    }

    // Pick subject from tutor's subjects
    const subject = randomChoice(tutor.subjects || [SUBJECTS[0]]);

    sessions.push({
      session: {
        sessionId: `session_${faker.string.alphanumeric(10)}`,
        tutorId: tutor.tutorId,
        studentId: student.studentId,
        subject,
        scheduledStartAt: scheduledStart,
        actualStartAt,
        durationMinutes,
        status,
        isFirstSessionForStudent: isFirstSession,
        rescheduleInitiator,
        rescheduledFromSessionId: null,
        studentRating,
        studentFeedback,
        studentChurnedAfterSession: studentChurned,
        tutorChurnedWithin30d: tutorChurned,
        hasTranscript: false, // Will be updated later for some sessions
        createdAt: scheduledStart,
      },
      tutorQualityBias: qualityBias,
    });
  }

  return sessions;
}

function generateFeedback(rating: number, subject: string): string {
  const positiveFeedback = [
    "Great session! Really helpful explanations.",
    `My tutor was excellent at explaining ${subject} concepts.`,
    "Very patient and knowledgeable tutor.",
    "Helped me understand topics I was struggling with.",
    "Clear explanations and good practice problems.",
    "Best tutoring session I've had!",
    "Tutor was well-prepared and engaging.",
  ];

  const neutralFeedback = [
    "Session was okay, covered the basics.",
    "Decent session but could have gone deeper.",
    "Tutor was helpful but a bit rushed.",
    "Learned some things, but still have questions.",
    "Good session overall.",
  ];

  const negativeFeedback = [
    "Tutor seemed unprepared.",
    "Session felt rushed and confusing.",
    "Didn't really understand the explanations.",
    "Tutor wasn't very patient.",
    "Expected more from this session.",
    "Hard to follow the tutor's explanations.",
  ];

  if (rating >= 4) return randomChoice(positiveFeedback);
  if (rating === 3) return randomChoice(neutralFeedback);
  return randomChoice(negativeFeedback);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Generate data
    console.log("📊 Generating synthetic data...");
    const tutors = generateTutors();
    console.log(`  ✓ Generated ${tutors.length} tutors`);

    const students = generateStudents();
    console.log(`  ✓ Generated ${students.length} students`);

    const generatedSessions = generateSessions(tutors, students);
    const sessions = generatedSessions.map((g) => g.session);
    console.log(`  ✓ Generated ${sessions.length} sessions`);

    // Calculate some stats
    const completedSessions = sessions.filter((s) => s.status === "completed").length;
    const noShows = sessions.filter((s) => s.status === "no_show").length;
    const rescheduled = sessions.filter((s) => s.status === "rescheduled").length;
    const firstSessions = sessions.filter((s) => s.isFirstSessionForStudent).length;

    console.log("\n📈 Session distribution:");
    console.log(`  • Completed: ${completedSessions} (${((completedSessions / NUM_SESSIONS) * 100).toFixed(1)}%)`);
    console.log(`  • No-shows: ${noShows} (${((noShows / NUM_SESSIONS) * 100).toFixed(1)}%)`);
    console.log(`  • Rescheduled: ${rescheduled} (${((rescheduled / NUM_SESSIONS) * 100).toFixed(1)}%)`);
    console.log(`  • First sessions: ${firstSessions} (${((firstSessions / NUM_SESSIONS) * 100).toFixed(1)}%)`);

    // Clear existing data
    console.log("\n🗑️  Clearing existing data...");
    await db.delete(schema.sessionAiEvaluations);
    await db.delete(schema.sessionTranscripts);
    await db.delete(schema.tutorMetrics);
    await db.delete(schema.sessions);
    await db.delete(schema.students);
    await db.delete(schema.tutors);
    console.log("  ✓ Cleared all tables");

    // Insert data
    console.log("\n💾 Inserting data into database...");

    // Insert tutors in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < tutors.length; i += BATCH_SIZE) {
      const batch = tutors.slice(i, i + BATCH_SIZE);
      await db.insert(schema.tutors).values(batch);
    }
    console.log(`  ✓ Inserted ${tutors.length} tutors`);

    // Insert students in batches
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      await db.insert(schema.students).values(batch);
    }
    console.log(`  ✓ Inserted ${students.length} students`);

    // Insert sessions in batches
    for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
      const batch = sessions.slice(i, i + BATCH_SIZE);
      await db.insert(schema.sessions).values(batch);
    }
    console.log(`  ✓ Inserted ${sessions.length} sessions`);

    console.log("\n✅ Database seeded successfully!");

    // Print summary stats
    const churned = sessions.filter((s) => s.studentChurnedAfterSession).length;
    const firstSessionChurned = sessions.filter(
      (s) => s.isFirstSessionForStudent && s.studentChurnedAfterSession
    ).length;

    console.log("\n📊 Churn statistics:");
    console.log(`  • Total student churns: ${churned} (${((churned / NUM_SESSIONS) * 100).toFixed(1)}%)`);
    console.log(
      `  • First session churns: ${firstSessionChurned}/${firstSessions} (${((firstSessionChurned / firstSessions) * 100).toFixed(1)}%)`
    );

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

