import { beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { media } from "./schema";
import { STATUS_FILTERS, buildMediaWhere, getMediaStats, type MediaFilters } from "./media-queries";

type Row = typeof media.$inferInsert;

function createTestDb() {
    const sqlite = new Database(":memory:");
    sqlite.run(`
        CREATE TABLE media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            current_chapter INTEGER NOT NULL DEFAULT 0,
            total_chapters INTEGER,
            status TEXT NOT NULL,
            cover_url TEXT,
            source_url TEXT,
            latest_released_chapter INTEGER,
            is_pinned INTEGER NOT NULL DEFAULT 0
        )`);
    return drizzle(sqlite);
}

// One row per edge case; titles describe what the row is for
const FIXTURE: Row[] = [
    { title: "Manhua Reading", type: "MANHUA", status: "READING", currentChapter: 10, totalChapters: 100, latestReleasedChapter: 15 },
    { title: "Manhua Reading Unknown Total", type: "MANHUA", status: "READING", currentChapter: 50, totalChapters: null, latestReleasedChapter: 52 },
    { title: "Manhua Reading Zero Total", type: "MANHUA", status: "READING", currentChapter: 5, totalChapters: 0 },
    { title: "Manhua Reading All Read", type: "MANHUA", status: "READING", currentChapter: 80, totalChapters: 80 },
    { title: "Donghua Watching", type: "DONGHUA", status: "READING", currentChapter: 3, totalChapters: 24, latestReleasedChapter: 10 },
    { title: "Donghua Watching All Read", type: "DONGHUA", status: "READING", currentChapter: 30, totalChapters: 24 },
    { title: "Donghua Completed Unknown Total", type: "DONGHUA", status: "COMPLETED", currentChapter: 12, totalChapters: null },
    { title: "Manhua On Hold", type: "MANHUA", status: "ON_HOLD", currentChapter: 7, totalChapters: 40, latestReleasedChapter: 9 },
    { title: "Manhua On Hold All Read", type: "MANHUA", status: "ON_HOLD", currentChapter: 40, totalChapters: 40 },
    { title: "Donghua Dropped", type: "DONGHUA", status: "DROPPED", currentChapter: 1, totalChapters: null, latestReleasedChapter: 1 },
    { title: "Manhua Dropped All Read", type: "MANHUA", status: "DROPPED", currentChapter: 20, totalChapters: 20 },
    { title: "Manhua Plan", type: "MANHUA", status: "PLAN_TO_READ", currentChapter: 0, totalChapters: null, latestReleasedChapter: 30 },
    { title: "Donghua Plan", type: "DONGHUA", status: "PLAN_TO_READ", currentChapter: 0, totalChapters: 12, latestReleasedChapter: 4 },
];

let db: ReturnType<typeof createTestDb>;

async function titles(filters: MediaFilters): Promise<string[]> {
    const rows = await db.select({ title: media.title }).from(media).where(buildMediaWhere(filters));
    return rows.map(r => r.title).sort();
}

beforeEach(async () => {
    db = createTestDb();
    await db.insert(media).values(FIXTURE);
});

describe("buildMediaWhere status filter", () => {
    it("returns every row for no status, ALL or an unknown status", async () => {
        const all = FIXTURE.map(r => r.title).sort();
        expect(await titles({})).toEqual(all);
        expect(await titles({ status: "ALL" })).toEqual(all);
        expect(await titles({ status: "nonsense" })).toEqual(all);
    });

    it("READING returns unfinished MANHUA entries with status READING", async () => {
        expect(await titles({ status: "READING" })).toEqual([
            "Manhua Reading",
            "Manhua Reading Unknown Total",
            "Manhua Reading Zero Total",
        ]);
    });

    it("WATCHING returns unfinished DONGHUA entries with status READING", async () => {
        expect(await titles({ status: "WATCHING" })).toEqual(["Donghua Watching"]);
    });

    it("moves READING entries with all chapters read to COMPLETED", async () => {
        const completed = await titles({ status: "COMPLETED" });
        expect(completed).toContain("Manhua Reading All Read");
        expect(completed).toContain("Donghua Watching All Read");
        expect(await titles({ status: "READING" })).not.toContain("Manhua Reading All Read");
        expect(await titles({ status: "WATCHING" })).not.toContain("Donghua Watching All Read");
    });

    it("never treats a 0 or null chapter total as finished", async () => {
        const completed = await titles({ status: "COMPLETED" });
        expect(completed).not.toContain("Manhua Reading Unknown Total");
        expect(completed).not.toContain("Manhua Reading Zero Total");
    });

    it("COMPLETED includes COMPLETED rows with an unknown chapter total", async () => {
        expect(await titles({ status: "COMPLETED" })).toEqual([
            "Donghua Completed Unknown Total",
            "Donghua Watching All Read",
            "Manhua Dropped All Read",
            "Manhua On Hold All Read",
            "Manhua Reading All Read",
        ]);
    });

    it("ON_HOLD, DROPPED and PLAN_TO_READ exclude finished rows", async () => {
        expect(await titles({ status: "ON_HOLD" })).toEqual(["Manhua On Hold"]);
        expect(await titles({ status: "DROPPED" })).toEqual(["Donghua Dropped"]);
        expect(await titles({ status: "PLAN_TO_READ" })).toEqual(["Donghua Plan", "Manhua Plan"]);
    });

    it("combines with the type and search filters", async () => {
        expect(await titles({ status: "PLAN_TO_READ", type: "DONGHUA" })).toEqual(["Donghua Plan"]);
        expect(await titles({ status: "COMPLETED", type: "MANHUA" })).toEqual([
            "Manhua Dropped All Read",
            "Manhua On Hold All Read",
            "Manhua Reading All Read",
        ]);
        expect(await titles({ status: "READING", search: "unknown" })).toEqual(["Manhua Reading Unknown Total"]);
        expect(await titles({ status: "COMPLETED", search: "DONGHUA" })).toEqual([
            "Donghua Completed Unknown Total",
            "Donghua Watching All Read",
        ]);
    });
});

describe("getMediaStats", () => {
    it("matches the row count of each status filter", async () => {
        const stats = await getMediaStats(db);
        for (const status of STATUS_FILTERS) {
            expect(stats.counts[status]).toBe((await titles({ status })).length);
        }
    });

    it("matches the status filter counts when type and search are set", async () => {
        const filters = { type: "MANHUA" as const, search: "read" };
        const stats = await getMediaStats(db, filters);
        expect(stats.total).toBe((await titles(filters)).length);
        for (const status of STATUS_FILTERS) {
            expect(stats.counts[status]).toBe((await titles({ ...filters, status })).length);
        }
    });

    it("status buckets and type buckets each add up to total", async () => {
        const stats = await getMediaStats(db);
        const statusSum = STATUS_FILTERS.reduce((sum, s) => sum + stats.counts[s], 0);
        expect(stats.total).toBe(FIXTURE.length);
        expect(statusSum).toBe(stats.total);
        expect(stats.counts.MANHUA + stats.counts.DONGHUA).toBe(stats.total);
    });

    it("sums chapters read and counts entries with updates", async () => {
        const stats = await getMediaStats(db);
        const chapters = FIXTURE.reduce((sum, r) => sum + (r.currentChapter ?? 0), 0);
        const withUpdates = FIXTURE.filter(r => r.latestReleasedChapter != null && r.latestReleasedChapter > (r.currentChapter ?? 0)).length;
        expect(stats.chaptersRead).toBe(chapters);
        expect(stats.withUpdates).toBe(withUpdates);
    });

    it("lists at most 5 latest updates, largest gap first, without zero gaps", async () => {
        const { latestUpdates } = await getMediaStats(db);
        expect(latestUpdates.map(m => m.title)).toEqual([
            "Manhua Plan",
            "Donghua Watching",
            "Manhua Reading",
            "Donghua Plan",
            // Gap of 2 ties with "Manhua Reading Unknown Total"; ties sort by title
            "Manhua On Hold",
        ]);
        expect(latestUpdates.map(m => m.title)).not.toContain("Donghua Dropped");
        expect(latestUpdates[0]).toEqual({ id: 12, title: "Manhua Plan", type: "MANHUA", currentChapter: 0, latestReleasedChapter: 30 });
    });

    it("returns zeros and no updates for an empty library", async () => {
        const stats = await getMediaStats(createTestDb());
        expect(stats).toEqual({
            total: 0,
            counts: { READING: 0, WATCHING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_READ: 0, MANHUA: 0, DONGHUA: 0 },
            chaptersRead: 0,
            withUpdates: 0,
            latestUpdates: [],
        });
    });
});
