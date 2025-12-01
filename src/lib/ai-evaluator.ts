import OpenAI from "openai";

// ============================================
// TYPES
// ============================================
export interface SessionMetadata {
  sessionId: string;
  subject: string;
  isFirstSession: boolean;
  studentRating: number | null;
  studentFeedback: string | null;
  status: "completed" | "no_show" | "rescheduled";
  durationMinutes: number;
}

export interface EvaluationResult {
  qualityScore: number; // 1-5
  strengths: string[];
  areasForImprovement: string[];
  riskTags: string[];
}

export interface EvaluationResponse {
  success: boolean;
  evaluation?: EvaluationResult;
  error?: string;
  cached?: boolean;
}

// ============================================
// PROMPT TEMPLATE
// ============================================
const SYSTEM_PROMPT = `You are an expert tutor quality evaluator for an online tutoring platform. Your role is to assess tutoring session transcripts and provide actionable feedback.

EVALUATION CRITERIA (use these to determine the quality score):

Score 5 - Excellent:
- Tutor demonstrates exceptional patience and clarity
- Actively checks for student understanding throughout
- Adjusts explanations based on student responses
- Creates engaging, interactive learning environment
- Student shows clear progress and understanding

Score 4 - Good:
- Tutor is generally clear and helpful
- Checks understanding at key points
- Responds appropriately to student questions
- Good rapport building
- Student shows understanding of most concepts

Score 3 - Adequate:
- Basic explanations provided
- Some checking for understanding
- Occasional missed opportunities for clarification
- Neutral or minimal rapport building
- Student understands some concepts but may have lingering questions

Score 2 - Below Average:
- Explanations are unclear or rushed
- Rarely checks for student understanding
- May ignore student questions or confusion
- Little rapport building or patience shown
- Student frequently seems confused

Score 1 - Poor:
- Tutor is unprepared or disengaged
- No checking for understanding
- Ignores student needs
- Creates negative learning environment
- Student shows no progress or increased confusion

RISK TAGS to consider:
- "rushed_pacing" - Tutor moves too quickly through material
- "ignored_student_questions" - Tutor doesn't address student questions
- "poor_explanation_quality" - Explanations are unclear or confusing
- "low_student_engagement" - Student is not actively participating
- "excellent_rapport_building" - Tutor builds great connection with student
- "strong_scaffolding" - Tutor breaks down concepts effectively
- "adaptive_teaching" - Tutor adjusts to student's level
- "missed_teachable_moments" - Tutor misses opportunities to deepen understanding
- "unprepared_tutor" - Tutor seems unfamiliar with material
- "excellent_student_engagement" - Student is actively learning and participating

For FIRST SESSIONS, pay extra attention to:
- Initial rapport building
- Assessment of student's current level
- Setting expectations for future sessions
- Making the student feel comfortable

IMPORTANT: You MUST respond with valid JSON only. No explanations or text outside the JSON.`;

const USER_PROMPT_TEMPLATE = `Evaluate this tutoring session transcript and provide your assessment.

SESSION METADATA:
- Subject: {{subject}}
- First Session: {{isFirstSession}}
- Duration: {{durationMinutes}} minutes
- Student Rating Given: {{studentRating}}
{{#if studentFeedback}}- Student Feedback: "{{studentFeedback}}"{{/if}}

TRANSCRIPT:
{{transcript}}

Provide your evaluation in this exact JSON format:
{
  "quality_score": <number 1-5>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "areas_for_improvement": ["<area 1>", "<area 2>", ...],
  "risk_tags": ["<tag 1>", "<tag 2>", ...]
}

Response (JSON only):`;

// ============================================
// EVALUATOR CLASS
// ============================================
export class AIEvaluator {
  private openai: OpenAI;
  private model: string;
  private evaluationCache: Map<string, EvaluationResult>;

  constructor(apiKey?: string, model: string = "gpt-4o") {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = model;
    this.evaluationCache = new Map();
  }

  /**
   * Evaluate a session transcript
   * Includes idempotency check via cache
   */
  async evaluateSession(
    metadata: SessionMetadata,
    transcript: string
  ): Promise<EvaluationResponse> {
    const startTime = Date.now();
    
    // Log the request
    console.log(`[AIEvaluator] Evaluating session ${metadata.sessionId}`);
    console.log(`  Subject: ${metadata.subject}`);
    console.log(`  First Session: ${metadata.isFirstSession}`);
    console.log(`  Duration: ${metadata.durationMinutes} min`);

    // Check cache for idempotency
    if (this.evaluationCache.has(metadata.sessionId)) {
      console.log(`  ✓ Using cached result`);
      return {
        success: true,
        evaluation: this.evaluationCache.get(metadata.sessionId)!,
        cached: true,
      };
    }

    try {
      // Build the prompt
      const userPrompt = this.buildUserPrompt(metadata, transcript);

      // Make the API call with retry logic
      const evaluation = await this.callWithRetry(userPrompt);

      // Cache the result
      this.evaluationCache.set(metadata.sessionId, evaluation);

      const duration = Date.now() - startTime;
      console.log(`  ✓ Evaluation complete (${duration}ms)`);
      console.log(`  Score: ${evaluation.qualityScore}/5`);
      console.log(`  Tags: ${evaluation.riskTags.join(", ") || "none"}`);

      return {
        success: true,
        evaluation,
        cached: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`  ✗ Evaluation failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Build the user prompt from template
   */
  private buildUserPrompt(metadata: SessionMetadata, transcript: string): string {
    let prompt = USER_PROMPT_TEMPLATE;
    
    prompt = prompt.replace("{{subject}}", metadata.subject);
    prompt = prompt.replace("{{isFirstSession}}", metadata.isFirstSession ? "Yes" : "No");
    prompt = prompt.replace("{{durationMinutes}}", metadata.durationMinutes.toString());
    prompt = prompt.replace(
      "{{studentRating}}",
      metadata.studentRating !== null ? `${metadata.studentRating}/5` : "Not provided"
    );
    
    if (metadata.studentFeedback) {
      prompt = prompt.replace(
        "{{#if studentFeedback}}- Student Feedback: \"{{studentFeedback}}\"{{/if}}",
        `- Student Feedback: "${metadata.studentFeedback}"`
      );
    } else {
      prompt = prompt.replace(
        "{{#if studentFeedback}}- Student Feedback: \"{{studentFeedback}}\"{{/if}}",
        ""
      );
    }
    
    prompt = prompt.replace("{{transcript}}", transcript);

    return prompt;
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callWithRetry(
    userPrompt: string,
    maxRetries: number = 3
  ): Promise<EvaluationResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3, // Lower temperature for more consistent evaluations
          max_tokens: 1000,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from OpenAI");
        }

        // Parse and validate the response
        const parsed = JSON.parse(content);
        return this.validateAndNormalizeResponse(parsed);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`  Retry ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Validate and normalize the API response
   */
  private validateAndNormalizeResponse(response: unknown): EvaluationResult {
    const obj = response as Record<string, unknown>;

    // Validate quality_score
    const qualityScore = Number(obj.quality_score);
    if (isNaN(qualityScore) || qualityScore < 1 || qualityScore > 5) {
      throw new Error(`Invalid quality_score: ${obj.quality_score}`);
    }

    // Validate and normalize arrays
    const strengths = this.normalizeStringArray(obj.strengths, "strengths");
    const areasForImprovement = this.normalizeStringArray(
      obj.areas_for_improvement,
      "areas_for_improvement"
    );
    const riskTags = this.normalizeStringArray(obj.risk_tags, "risk_tags");

    return {
      qualityScore: Math.round(qualityScore),
      strengths,
      areasForImprovement,
      riskTags,
    };
  }

  /**
   * Normalize array fields
   */
  private normalizeStringArray(value: unknown, fieldName: string): string[] {
    if (!Array.isArray(value)) {
      console.warn(`  Warning: ${fieldName} is not an array, defaulting to empty`);
      return [];
    }

    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Clear the evaluation cache (for re-evaluation)
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Clear cache for a specific session
   */
  clearSessionCache(sessionId: string): void {
    this.evaluationCache.delete(sessionId);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
let evaluatorInstance: AIEvaluator | null = null;

export function getAIEvaluator(): AIEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new AIEvaluator();
  }
  return evaluatorInstance;
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================
export async function evaluateSessionTranscript(
  metadata: SessionMetadata,
  transcript: string
): Promise<EvaluationResponse> {
  const evaluator = getAIEvaluator();
  return evaluator.evaluateSession(metadata, transcript);
}

