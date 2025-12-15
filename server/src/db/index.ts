import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export const createDb = (url?: string, authToken?: string) => {
    // Fallback to local file if no URL provided (for local dev)
    const finalUrl = url || process.env.DATABASE_URL || "file:spirit_scroll.sqlite";
    const finalToken = authToken || process.env.DATABASE_AUTH_TOKEN;

    const client = createClient({
        url: finalUrl,
        authToken: finalToken,
    });

    return drizzle(client, { schema });
};

// For local scripts (seed.ts) that run in Node/Bun environment
export const db = createDb();
