import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { insertMediaSchema, patchMediaSchema } from "./db/zod";
import { db } from "./db";
import { media } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

app.use(
    "/*",
    cors({
        origin: (origin) => origin, // Allow any origin for development
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
        const result = await db.insert(media).values(data).returning();
        return c.json(result[0], 201);
    })
    .patch("/media/:id", zValidator("json", patchMediaSchema), async (c) => {
        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
        const data = c.req.valid("json");

        if (Object.keys(data).length === 0) return c.json({ error: "No data provided" }, 400);

        const result = await db
            .update(media)
            .set(data)
            .where(eq(media.id, id))
            .returning();

        if (result.length === 0) return c.json({ error: "Not found" }, 404);
        return c.json(result[0]);
    });

export type AppType = typeof routes;

export default {
    port: 3000,
    fetch: app.fetch,
};
