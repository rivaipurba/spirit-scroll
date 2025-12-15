import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { insertMediaSchema, patchMediaSchema } from "./db/zod";
import { createDb } from "./db";
import { media } from "./db/schema";
import { eq, or, count, like, and, desc, asc } from "drizzle-orm";

import { fetchCoverImage } from "./utils/scraper";
import { checkLatestChapter } from "./utils/update-checker";

type Bindings = {
    DATABASE_URL: string;
    DATABASE_AUTH_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
    "/*",
    cors({
        origin: '*', // Allow any origin for development
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type"],
        allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: true,
    })
);

// Simple rate limiting middleware
const rateLimitMap = new Map();
app.use("/*", async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
        const limit = rateLimitMap.get(ip);
        if (now > limit.resetTime) {
            limit.count = 1;
            limit.resetTime = now + windowMs;
        } else {
            limit.count++;
            if (limit.count > maxRequests) {
                return c.json({ error: 'Too many requests' }, 429);
            }
        }
    }

    await next();
});

const routes = app.basePath("/api")
    .get("/media", async (c) => {
        try {
            const page = Number(c.req.query("page")) || 1;
            const limit = Number(c.req.query("limit")) || 12;
            const type = c.req.query("type") as "MANHUA" | "DONGHUA" | undefined;
            const sortBy = c.req.query("sortBy") as "title" | "progress" | "recent" | "updates" | undefined;
            const search = c.req.query("search")?.trim();

            const offset = (page - 1) * limit;

            const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
            
            // Build where conditions
            const conditions = [];
            if (type) conditions.push(eq(media.type, type));
            if (search) conditions.push(like(media.title, `%${search}%`));
            
            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // For now, keep simple query structure and handle sorting client-side
            // TODO: Implement proper server-side sorting in future update
            const [data, totalResult] = await Promise.all([
                db.select().from(media).where(whereClause).limit(limit).offset(offset),
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
            return c.json({
                error: e.message,
                stack: e.stack,
                env_keys: Object.keys(c.env || {})
            }, 500);
        }
    })
    .post("/media", zValidator("json", insertMediaSchema), async (c) => {
        const data = c.req.valid("json");

        let coverUrl = data.coverUrl;
        if (data.sourceUrl && !coverUrl) {
            coverUrl = await fetchCoverImage(data.sourceUrl);
        }

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

        const result = await db.insert(media).values({
            ...data,
            coverUrl: coverUrl
        }).returning();
        return c.json(result[0], 201);
    })
    .patch("/media/:id", zValidator("json", patchMediaSchema), async (c) => {
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
    .post("/check-all", async (c) => {
        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
        const items = await db.select().from(media).where(
            or(eq(media.status, "READING"), eq(media.status, "ON_HOLD"))
        ); // Focusing on Reading/OnHold usually makes sense, but user said 'READING' or 'WATCHING' (which is status READING and type DONGHUA)
        // User said: "Select all media where status is 'READING' or 'WATCHING'."
        // 'WATCHING' isn't a DB status, it's UI for Type DONGHUA + Status READING. 
        // So checking READING is enough.

        // Let's filter effectively in memory or just grab READING.
        const targets = items.filter(m => m.status === 'READING' && m.sourceUrl);

        let updatedCount = 0;

        for (const item of targets) {
            if (!item.sourceUrl) continue;

            try {
                // 1.5s delay
                await new Promise(r => setTimeout(r, 1500));

                const latest = await checkLatestChapter(item.sourceUrl);
                if (latest !== null && latest > item.currentChapter) {
                    await db.update(media)
                        .set({ latestReleasedChapter: latest })
                        .where(eq(media.id, item.id));
                    updatedCount++;
                } else if (latest !== null) {
                    await db.update(media)
                        .set({ latestReleasedChapter: latest })
                        .where(eq(media.id, item.id));
                }
            } catch (e) {
                console.error(`Failed to check ${item.title}:`, e);
            }
        }

        return c.json({ success: true, updated: updatedCount });
    })
    .post("/import", zValidator("json", z.array(insertMediaSchema)), async (c) => {
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
            return c.json({
                error: e.message,
                stack: e.stack
            }, 500);
        }
    });

export type AppType = typeof routes;

export default {
    port: 3000,
    hostname: '0.0.0.0', // Allow access from network
    fetch: app.fetch,
};
