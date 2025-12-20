import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

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
    
    // MyAnimeList integration fields
    malId: integer("mal_id"),
    malScore: real("mal_score"), // MAL rating (0-10)
    malRank: integer("mal_rank"), // MAL ranking
    malPopularity: integer("mal_popularity"), // Popularity ranking
    malSynopsis: text("mal_synopsis"), // Description/synopsis
    malGenres: text("mal_genres"), // JSON string of genres
    malStatus: text("mal_status"), // MAL status (finished_airing, currently_airing, etc.)
    malStartDate: text("mal_start_date"), // Start date
    malEndDate: text("mal_end_date"), // End date
    malLastUpdated: integer("mal_last_updated"), // Timestamp of last MAL data fetch
});
