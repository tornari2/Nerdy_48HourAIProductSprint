import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy-load database connection to avoid build-time errors
let sqlInstance: NeonQueryFunction<false, false> | null = null;
let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please configure your database connection."
      );
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getSql(), { schema });
  }
  return dbInstance;
}

// For backwards compatibility - lazy getter
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
  },
});

// Export schema for convenience
export * from "./schema";
