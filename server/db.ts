import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use Neon serverless configuration (suitable for Replit environment)
neonConfig.webSocketConstructor = ws;
// Clean the DATABASE_URL by removing any psql command prefix/suffix
let cleanDatabaseUrl = process.env.DATABASE_URL;
if (cleanDatabaseUrl.startsWith("psql '")) {
  cleanDatabaseUrl = cleanDatabaseUrl.replace("psql '", "").replace(/'+$/, "");
}

const pool = new Pool({ 
  connectionString: cleanDatabaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzleNeon({ client: pool, schema });

console.log('🔗 Connected to Neon serverless database');