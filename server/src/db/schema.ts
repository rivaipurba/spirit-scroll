import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const media = sqliteTable("media", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    type: text("type", { enum: ["MANHUA", "DONGHUA"] }).notNull(),
    currentChapter: integer("current_chapter").default(0).notNull(),
    totalChapters: integer("total_chapters").notNull(),
    status: text("status", { enum: ["READING", "COMPLETED"] }).notNull(),
    coverUrl: text("cover_url"),
});
