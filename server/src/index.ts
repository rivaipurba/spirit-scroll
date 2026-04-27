import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { insertMediaSchema, patchMediaSchema } from "./db/zod";
import { createDb } from "./db";
import { media } from "./db/schema";
import { eq, or, count, and, desc, asc, sql } from "drizzle-orm";

import { fetchCoverImage } from "./utils/scraper";
import { checkLatestChapter } from "./utils/update-checker";
import { createToken, verifyToken, verifyPassword } from "./auth";

// Load .dev.vars for local Bun development (wrapped in try-catch for Cloudflare Workers compatibility)
try {
    // Dynamic import to avoid issues in Cloudflare Workers
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".dev.vars" });
} catch {
    // Running in Cloudflare Workers - env vars are provided via bindings
}

type Bindings = {
    DATABASE_URL: string;
    DATABASE_AUTH_TOKEN: string;
    JWT_SECRET: string;
    AUTH_PASSWORD_HASH: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware to inject env vars for local bun dev (Cloudflare Workers provides these automatically)
app.use("/*", async (c, next) => {
    if (!c.env.DATABASE_URL) {
        c.env.DATABASE_URL = process.env.DATABASE_URL || "file:spirit_scroll.sqlite";
    }
    if (!c.env.DATABASE_AUTH_TOKEN) {
        c.env.DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || "";
    }
    if (!c.env.JWT_SECRET) {
        c.env.JWT_SECRET = process.env.JWT_SECRET || "";
    }
    if (!c.env.AUTH_PASSWORD_HASH) {
        c.env.AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || "";
    }
    await next();
});

app.use(
    "/*",
    cors({
        origin: (origin) => {
            const allowed = ['https://spirit-scroll.vercel.app', 'http://localhost:5173'];
            if (!origin) return '*';
            if (allowed.includes(origin)) return origin;
            // Allow browser extension origins (personal use)
            if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) return origin;
            // Fallback: allow all origins (reads are public anyway; writes require JWT auth)
            return origin;
        },
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: false,
    })
);

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired rate limit entries lazily (probability 1/20 requests)
// This avoids using setInterval which is restricted in Cloudflare Workers global scope
app.use("/*", async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();

    // Lazy cleanup
    if (Math.random() < 0.05) {
        for (const [key, data] of rateLimitMap) {
            if (now > data.resetTime) rateLimitMap.delete(key);
        }
    }

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
        const limit = rateLimitMap.get(ip)!;
        if (now > limit.resetTime) {
            limit.count = 1;
            limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
        } else {
            limit.count++;
            if (limit.count > RATE_LIMIT_MAX_REQUESTS) {
                return c.json({ error: 'Too many requests' }, 429);
            }
        }
    }

    await next();
});

// Helper to verify auth token from Authorization header
// When JWT_SECRET is not set (local dev), auth is bypassed
async function requireAuth(c: any): Promise<Response | null> {
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) return null; // local dev: no auth

    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.substring(7);
    const valid = await verifyToken(token, jwtSecret);
    if (!valid) {
        return c.json({ error: "Invalid or expired token" }, 401);
    }

    return null; // Auth passed
}

const routes = app.basePath("/api")
    // Auth routes
    .post("/auth/login", zValidator("json", z.object({ password: z.string() })), async (c) => {
        try {
            const { password } = c.req.valid("json");
            const passwordHash = c.env.AUTH_PASSWORD_HASH;
            const jwtSecret = c.env.JWT_SECRET;

            if (!passwordHash || !jwtSecret) {
                console.error("Auth not configured: missing AUTH_PASSWORD_HASH or JWT_SECRET");
                return c.json({ error: "Server configuration error" }, 500);
            }

            const isValid = await verifyPassword(password, passwordHash);
            if (!isValid) {
                return c.json({ error: "Invalid password" }, 401);
            }

            const token = await createToken(jwtSecret);
            return c.json({ token });
        } catch (e: any) {
            console.error('[POST /auth/login] Error:', e);
            return c.json({ error: "Login failed" }, 500);
        }
    })
    .get("/auth/verify", async (c) => {
        const authError = await requireAuth(c);
        if (authError) return authError;
        return c.json({ valid: true });
    })
    .get("/media", async (c) => {
        try {
            const page = Number(c.req.query("page")) || 1;
            const limit = Number(c.req.query("limit")) || 12;
            const type = c.req.query("type") as "MANHUA" | "DONGHUA" | undefined;
            const sortBy = c.req.query("sortBy") as "title" | "progress" | "recent" | "updates" | "type" | undefined;
            const search = c.req.query("search")?.trim();

            const offset = (page - 1) * limit;

            const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

            // Build where conditions
            const conditions = [];
            if (type) conditions.push(eq(media.type, type));
            if (search) {
                conditions.push(sql`LOWER(${media.title}) LIKE LOWER(${'%' + search + '%'})`);
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Build order by clause based on sortBy parameter
            // Pinned items always come first, then apply the selected sort
            let baseOrderBy;
            switch (sortBy) {
                case 'title':
                    baseOrderBy = sql`${media.title} ASC`;
                    break;
                case 'progress':
                    baseOrderBy = sql`CASE WHEN ${media.totalChapters} > 0 THEN CAST(${media.currentChapter} AS REAL) / CAST(${media.totalChapters} AS REAL) ELSE 0 END DESC`;
                    break;
                case 'recent':
                    baseOrderBy = sql`${media.id} DESC`;
                    break;
                case 'updates':
                    baseOrderBy = sql`
                        CASE 
                            WHEN COALESCE(${media.latestReleasedChapter}, 0) > ${media.currentChapter} THEN 0
                            ELSE 1 
                        END ASC,
                        CASE 
                            WHEN COALESCE(${media.latestReleasedChapter}, 0) > ${media.currentChapter} 
                            THEN (COALESCE(${media.latestReleasedChapter}, 0) - ${media.currentChapter}) 
                            ELSE 0 
                        END DESC,
                        ${media.title} ASC
                    `;
                    break;
                case 'type':
                    baseOrderBy = sql`CASE WHEN ${media.type} = 'DONGHUA' THEN 0 ELSE 1 END, ${media.title} ASC`;
                    break;
                default:
                    baseOrderBy = sql`${media.title} ASC`;
            }

            // Pinned items first (is_pinned DESC so 1/true comes before 0/false), then base sort
            const orderByClause = sql`${media.isPinned} DESC, ${baseOrderBy}`;

            const [data, totalResult] = await Promise.all([
                db.select().from(media).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
                db.select({ count: count() }).from(media).where(whereClause)
            ]);

            const total = totalResult[0]?.count || 0;
            const totalPages = Math.ceil(total / limit);

            return c.json({
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });
        } catch (e: any) {
            console.error('[GET /media] Error:', e);
            return c.json({ error: 'Failed to fetch media' }, 500);
        }
    })
    .post("/media", zValidator("json", insertMediaSchema), async (c) => {
        // Require authentication for creating entries
        const authError = await requireAuth(c);
        if (authError) return authError;

        try {
            const data = c.req.valid("json");

            let coverUrl = data.coverUrl;
            if (data.sourceUrl && !coverUrl) {
                coverUrl = await fetchCoverImage(data.sourceUrl);
            }

            const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

            const insertData: Record<string, any> = {
                title: data.title,
                type: data.type,
                currentChapter: data.currentChapter || 0,
                status: data.status,
            };

            if (data.totalChapters !== undefined && data.totalChapters !== null) {
                insertData.totalChapters = data.totalChapters;
            }
            if (coverUrl) {
                insertData.coverUrl = coverUrl;
            }
            if (data.sourceUrl) {
                insertData.sourceUrl = data.sourceUrl;
            }

            const result = await db.insert(media).values(insertData).returning();
            return c.json(result[0], 201);
        } catch (error: any) {
            console.error('[CREATE] Error creating media entry:', error);
            return c.json({ error: 'Failed to create media entry' }, 500);
        }
    })
    .patch("/media/:id", zValidator("json", patchMediaSchema), async (c) => {
        // Require authentication for updating entries
        const authError = await requireAuth(c);
        if (authError) return authError;

        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
        const data = c.req.valid("json");

        if (Object.keys(data).length === 0) return c.json({ error: "No data provided" }, 400);

        let patchData = { ...data };
        if (data.sourceUrl) {
            const fetchedCover = await fetchCoverImage(data.sourceUrl);
            if (fetchedCover) {
                patchData = { ...patchData, coverUrl: fetchedCover };
            }
        }

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

        const result = await db
            .update(media)
            .set(patchData)
            .where(eq(media.id, id))
            .returning();

        if (result.length === 0) return c.json({ error: "Not found" }, 404);
        return c.json(result[0]);
    })
    .delete("/media/:id", async (c) => {
        // Require authentication for deleting entries
        const authError = await requireAuth(c);
        if (authError) return authError;

        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
        const result = await db.delete(media).where(eq(media.id, id)).returning();
        if (result.length === 0) return c.json({ error: "Not found" }, 404);
        return c.json({ success: true, deletedId: result[0]?.id });
    })
    .post("/media/:id/check", async (c) => {
        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
        const item = await db.select().from(media).where(eq(media.id, id)).limit(1);
        if (item.length === 0) return c.json({ error: "Not found" }, 404);

        const sourceUrl = item[0]?.sourceUrl;
        if (!sourceUrl) return c.json({ error: "No source URL found" }, 400);

        const latestChapter = await checkLatestChapter(sourceUrl);

        if (latestChapter !== null) {
            await db.update(media)
                .set({ latestReleasedChapter: latestChapter })
                .where(eq(media.id, id));

            return c.json({
                new_chapter: latestChapter,
                has_update: latestChapter > (item[0]?.currentChapter || 0)
            });
        }

        return c.json({ error: "Could not find chapter info" }, 404);
    })
    .post("/import", zValidator("json", z.array(insertMediaSchema)), async (c) => {
        // Require authentication for importing data
        const authError = await requireAuth(c);
        if (authError) return authError;

        try {
            const data = c.req.valid("json");

            if (!Array.isArray(data) || data.length === 0) {
                return c.json({ error: "Invalid data: expected non-empty array" }, 400);
            }

            const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

            let successCount = 0;
            const errors: string[] = [];

            for (const item of data) {
                try {
                    let coverUrl = item.coverUrl;
                    if (item.sourceUrl && !coverUrl) {
                        try {
                            coverUrl = await fetchCoverImage(item.sourceUrl);
                        } catch (e) {
                            // Continue without cover if scraping fails
                        }
                    }

                    await db.insert(media).values({
                        ...item,
                        coverUrl: coverUrl
                    });
                    successCount++;
                } catch (e: any) {
                    errors.push(`Failed to import "${item.title}": ${e.message}`);
                }
            }

            return c.json({
                success: true,
                count: successCount,
                total: data.length,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (e: any) {
            console.error('[IMPORT] Error:', e);
            return c.json({ error: 'Failed to import data' }, 500);
        }
    });

export type AppType = typeof routes;

export default {
    port: 3000,
    hostname: '0.0.0.0',
    fetch: app.fetch,
};
