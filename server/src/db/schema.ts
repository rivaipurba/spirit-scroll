import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const media = sqliteTable("media", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    type: text("type", { enum: ["MANHUA", "DONGHUA"] }).notNull(),
    currentChapter: integer("current_chapter").default(0).notNull(),
    totalChapters: integer("total_chapters"),
    status: text("status", { enum: ["READING", "COMPLETED", "ON_HOLD", "DROPPED", "PLAN_TO_READ"] }).notNull(),
    coverUrl: text("cover_url"),
    sourceUrl: text("source_url"),
    latestReleasedChapter: integer("latest_released_chapter"),
});

