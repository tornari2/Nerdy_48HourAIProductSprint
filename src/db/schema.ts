import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// TUTORS TABLE
// ============================================
export const tutors = pgTable("tutors", {
  tutorId: varchar("tutor_id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  subjects: jsonb("subjects").$type<string[]>(), // e.g. ["SAT Math", "Chemistry"]
  yearsExperience: integer("years_experience"),
  timezone: text("timezone"),
  hireDate: date("hire_date"),
});

// ============================================
// STUDENTS TABLE
// ============================================
export const students = pgTable("students", {
  studentId: varchar("student_id", { length: 255 }).primaryKey(),
  gradeLevel: integer("grade_level"),
  segment: text("segment"), // e.g. "SAT", "AP", "Homework Help"
});

// ============================================
// SESSIONS TABLE
// ============================================
export const sessions = pgTable("sessions", {
  sessionId: varchar("session_id", { length: 255 }).primaryKey(),
  tutorId: varchar("tutor_id", { length: 255 })
    .notNull()
    .references(() => tutors.tutorId),
  studentId: varchar("student_id", { length: 255 })
    .notNull()
    .references(() => students.studentId),
  subject: text("subject").notNull(),
  scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }).notNull(),
  actualStartAt: timestamp("actual_start_at", { withTimezone: true }), // NULL if no-show
  durationMinutes: integer("duration_minutes").notNull(), // 0 for no-show
  status: text("status").notNull(), // "completed", "no_show", "rescheduled"
  isFirstSessionForStudent: boolean("is_first_session_for_student").notNull(),
  rescheduleInitiator: text("reschedule_initiator"), // "tutor", "student", NULL
  rescheduledFromSessionId: varchar("rescheduled_from_session_id", { length: 255 }),
  studentRating: integer("student_rating"), // 1-5, nullable
  studentFeedback: text("student_feedback"),
  studentChurnedAfterSession: boolean("student_churned_after_session").notNull(),
  tutorChurnedWithin30d: boolean("tutor_churned_within_30d").notNull(),
  hasTranscript: boolean("has_transcript").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// SESSION TRANSCRIPTS TABLE
// ============================================
export const sessionTranscripts = pgTable("session_transcripts", {
  sessionId: varchar("session_id", { length: 255 })
    .primaryKey()
    .references(() => sessions.sessionId),
  transcriptText: text("transcript_text").notNull(), // "Tutor: ...\nStudent: ..."
});

// ============================================
// TUTOR METRICS TABLE
// ============================================
export const tutorMetrics = pgTable("tutor_metrics", {
  tutorId: varchar("tutor_id", { length: 255 })
    .primaryKey()
    .references(() => tutors.tutorId),
  totalSessionsLast30d: integer("total_sessions_last_30d").notNull(),
  firstSessionsLast30d: integer("first_sessions_last_30d").notNull(),
  firstSessionDropoutRate: doublePrecision("first_session_dropout_rate").notNull(), // 0.0-1.0
  tutorRescheduleRate: doublePrecision("tutor_reschedule_rate").notNull(), // 0.0-1.0
  tutorNoShowRate: doublePrecision("tutor_no_show_rate").notNull(), // 0.0-1.0
  avgStudentRatingLast30d: doublePrecision("avg_student_rating_last_30d"),
  aiAvgQualityScore: doublePrecision("ai_avg_quality_score"),
  churnRiskLabel: text("churn_risk_label"), // "low", "medium", "high"
  noShowRiskLabel: text("no_show_risk_label"), // "low", "medium", "high"
  highReschedulerFlag: boolean("high_rescheduler_flag").notNull().default(false),
  poorFirstSessionFlag: boolean("poor_first_session_flag").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// SESSION AI EVALUATIONS TABLE
// ============================================
export const sessionAiEvaluations = pgTable("session_ai_evaluations", {
  sessionId: varchar("session_id", { length: 255 })
    .primaryKey()
    .references(() => sessions.sessionId),
  qualityScore: integer("quality_score").notNull(), // 1-5
  strengths: jsonb("strengths").$type<string[]>().notNull(), // ["Tutor checked for understanding", ...]
  areasForImprovement: jsonb("areas_for_improvement").$type<string[]>().notNull(), // ["Could slow down pacing", ...]
  riskTags: jsonb("risk_tags").$type<string[]>().notNull(), // ["rushed_pacing", "low_student_talk_ratio"]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const tutorsRelations = relations(tutors, ({ many, one }) => ({
  sessions: many(sessions),
  metrics: one(tutorMetrics, {
    fields: [tutors.tutorId],
    references: [tutorMetrics.tutorId],
  }),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  tutor: one(tutors, {
    fields: [sessions.tutorId],
    references: [tutors.tutorId],
  }),
  student: one(students, {
    fields: [sessions.studentId],
    references: [students.studentId],
  }),
  transcript: one(sessionTranscripts, {
    fields: [sessions.sessionId],
    references: [sessionTranscripts.sessionId],
  }),
  aiEvaluation: one(sessionAiEvaluations, {
    fields: [sessions.sessionId],
    references: [sessionAiEvaluations.sessionId],
  }),
}));

export const sessionTranscriptsRelations = relations(sessionTranscripts, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTranscripts.sessionId],
    references: [sessions.sessionId],
  }),
}));

export const tutorMetricsRelations = relations(tutorMetrics, ({ one }) => ({
  tutor: one(tutors, {
    fields: [tutorMetrics.tutorId],
    references: [tutors.tutorId],
  }),
}));

export const sessionAiEvaluationsRelations = relations(sessionAiEvaluations, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionAiEvaluations.sessionId],
    references: [sessions.sessionId],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type Tutor = typeof tutors.$inferSelect;
export type NewTutor = typeof tutors.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionTranscript = typeof sessionTranscripts.$inferSelect;
export type NewSessionTranscript = typeof sessionTranscripts.$inferInsert;
export type TutorMetric = typeof tutorMetrics.$inferSelect;
export type NewTutorMetric = typeof tutorMetrics.$inferInsert;
export type SessionAiEvaluation = typeof sessionAiEvaluations.$inferSelect;
export type NewSessionAiEvaluation = typeof sessionAiEvaluations.$inferInsert;

