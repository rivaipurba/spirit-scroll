import { and, desc, eq, not, sql, type SQL } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { media } from "./schema";

// Status filters as shown in the sidebar. READING is split by type:
// MANHUA entries are "Reading", DONGHUA entries are "Watching".
export const STATUS_FILTERS = ["READING", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED", "PLAN_TO_READ"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export type MediaType = "MANHUA" | "DONGHUA";

export interface MediaFilters {
    type?: MediaType;
    search?: string;
    status?: string;
}

// An entry counts as finished when marked COMPLETED or when every known chapter is read.
// COALESCE keeps the expression non-NULL so NOT(isFinished) works for unknown totals.
export const isFinished = sql`(${media.status} = 'COMPLETED' OR (COALESCE(${media.totalChapters}, 0) > 0 AND ${media.currentChapter} >= ${media.totalChapters}))`;

export function isStatusFilter(value: unknown): value is StatusFilter {
    return typeof value === "string" && (STATUS_FILTERS as readonly string[]).includes(value);
}

// Returns the where condition for a sidebar status filter, or undefined for ALL/unknown values
export function statusCondition(status?: string): SQL | undefined {
    if (!isStatusFilter(status)) return undefined;

    switch (status) {
        case "COMPLETED":
            return isFinished;
        case "READING":
            return and(eq(media.status, "READING"), eq(media.type, "MANHUA"), not(isFinished));
        case "WATCHING":
            return and(eq(media.status, "READING"), eq(media.type, "DONGHUA"), not(isFinished));
        default:
            return and(eq(media.status, status), not(isFinished));
    }
}

export function buildMediaWhere({ type, search, status }: MediaFilters): SQL | undefined {
    const conditions: SQL[] = [];
    if (type) conditions.push(eq(media.type, type));
    if (search) {
        conditions.push(sql`LOWER(${media.title}) LIKE LOWER(${'%' + search + '%'})`);
    }
    const statusSql = statusCondition(status);
    if (statusSql) conditions.push(statusSql);

    return conditions.length > 0 ? and(...conditions) : undefined;
}

export interface MediaStats {
    total: number;
    counts: Record<StatusFilter | MediaType, number>;
    chaptersRead: number;
    withUpdates: number;
    latestUpdates: {
        id: number;
        title: string;
        type: MediaType;
        currentChapter: number;
        latestReleasedChapter: number | null;
    }[];
}

const countWhere = (condition: SQL | undefined) =>
    sql<number>`COALESCE(SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END), 0)`.mapWith(Number);

const updateGap = sql`(COALESCE(${media.latestReleasedChapter}, 0) - ${media.currentChapter})`;

export async function getMediaStats(
    db: BaseSQLiteDatabase<any, any, any>,
    filters: Omit<MediaFilters, "status"> = {}
): Promise<MediaStats> {
    const where = buildMediaWhere(filters);

    const [aggregateRows, latestUpdates] = await Promise.all([
        db
            .select({
                total: sql<number>`COUNT(*)`.mapWith(Number),
                READING: countWhere(statusCondition("READING")),
                WATCHING: countWhere(statusCondition("WATCHING")),
                COMPLETED: countWhere(statusCondition("COMPLETED")),
                ON_HOLD: countWhere(statusCondition("ON_HOLD")),
                DROPPED: countWhere(statusCondition("DROPPED")),
                PLAN_TO_READ: countWhere(statusCondition("PLAN_TO_READ")),
                MANHUA: countWhere(eq(media.type, "MANHUA")),
                DONGHUA: countWhere(eq(media.type, "DONGHUA")),
                chaptersRead: sql<number>`COALESCE(SUM(${media.currentChapter}), 0)`.mapWith(Number),
                withUpdates: countWhere(sql`${media.latestReleasedChapter} > ${media.currentChapter}`),
            })
            .from(media)
            .where(where),
        db
            .select({
                id: media.id,
                title: media.title,
                type: media.type,
                currentChapter: media.currentChapter,
                latestReleasedChapter: media.latestReleasedChapter,
            })
            .from(media)
            .where(and(where, sql`${updateGap} > 0`))
            .orderBy(desc(updateGap), media.title)
            .limit(5),
    ]);

    const { total, chaptersRead, withUpdates, ...counts } = aggregateRows[0] ?? {
        total: 0, chaptersRead: 0, withUpdates: 0,
        READING: 0, WATCHING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_READ: 0, MANHUA: 0, DONGHUA: 0,
    };

    return { total, counts, chaptersRead, withUpdates, latestUpdates };
}
