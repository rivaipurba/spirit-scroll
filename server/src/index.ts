import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { insertMediaSchema, patchMediaSchema } from "./db/zod";
import { db } from "./db";
import { media } from "./db/schema";
import { eq, or } from "drizzle-orm";

import { fetchCoverImage } from "./utils/scraper";
import { checkLatestChapter } from "./utils/update-checker";

const app = new Hono();

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

const routes = app.basePath("/api")
    .get("/media", async (c) => {
        const result = await db.select().from(media);
        return c.json(result);
    })
    .post("/media", zValidator("json", insertMediaSchema), async (c) => {
        const data = c.req.valid("json");

        let coverUrl = data.coverUrl;
        if (data.sourceUrl && !coverUrl) {
            coverUrl = await fetchCoverImage(data.sourceUrl);
        }

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

        const result = await db.delete(media).where(eq(media.id, id)).returning();
        if (result.length === 0) return c.json({ error: "Not found" }, 404);
        return c.json({ success: true, deletedId: result[0].id });
    })
    .post("/media/:id/check", async (c) => {
        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

        const item = await db.select().from(media).where(eq(media.id, id)).limit(1);
        if (item.length === 0) return c.json({ error: "Not found" }, 404);

        const sourceUrl = item[0].sourceUrl;
        if (!sourceUrl) return c.json({ error: "No source URL found" }, 400);

        const latestChapter = await checkLatestChapter(sourceUrl);

        if (latestChapter !== null) {
            await db.update(media)
                .set({ latestReleasedChapter: latestChapter })
                .where(eq(media.id, id));

            return c.json({
                new_chapter: latestChapter,
                has_update: latestChapter > item[0].currentChapter
            });
        }

        return c.json({ error: "Could not find chapter info" }, 404);
    })
    .post("/check-all", async (c) => {
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
                    // Update latest chapter even if not new, to keep it current? 
                    // User only asked for updates count. 
                    // Usually good to sync the latest chapter anyway.
                    await db.update(media)
                        .set({ latestReleasedChapter: latest })
                        .where(eq(media.id, item.id));
                }
            } catch (e) {
                console.error(`Failed to check ${item.title}:`, e);
            }
        }

        return c.json({ success: true, updated: updatedCount });
    });

export type AppType = typeof routes;

export default {
    port: 3000,
    hostname: '0.0.0.0', // Allow access from network
    fetch: app.fetch,
};
