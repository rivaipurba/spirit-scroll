import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createToken } from "./auth";
import app from "./index";

const JWT_SECRET = "test-secret";
const tempDir = mkdtempSync(join(tmpdir(), "spirit-scroll-routes-"));
const DATABASE_URL = `file:${join(tempDir, "test.sqlite")}`;
const env = { DATABASE_URL, DATABASE_AUTH_TOKEN: "", JWT_SECRET, AUTH_PASSWORD_HASH: "" };

let sqlite: Client;
let token: string;
let outboundUrls: string[] = [];
const realFetch = globalThis.fetch;

// Every request goes through app.fetch directly, so any call to global fetch is an outbound scrape
function request(method: string, path: string, body?: unknown): Promise<Response> {
    return app.fetch(
        new Request(`http://localhost${path}`, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: body === undefined ? undefined : JSON.stringify(body),
        }),
        env,
    );
}

async function getRow(id: number) {
    const result = await sqlite.execute({ sql: "SELECT * FROM media WHERE id = ?", args: [id] });
    return result.rows[0];
}

beforeAll(async () => {
    token = await createToken(JWT_SECRET);
    sqlite = createClient({ url: DATABASE_URL });
});

afterAll(() => {
    sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
});

beforeEach(async () => {
    await sqlite.execute("DROP TABLE IF EXISTS media");
    await sqlite.execute(`
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

    outboundUrls = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
        outboundUrls.push(String(input instanceof Request ? input.url : input));
        return new Response("<html></html>", { status: 200 });
    }) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("POST /api/media", () => {
    it("creates an entry with a source URL without any outbound request", async () => {
        const res = await request("POST", "/api/media", {
            title: "Has Source",
            type: "MANHUA",
            status: "READING",
            sourceUrl: "https://example.com/series/has-source",
        });

        expect(res.status).toBe(201);
        const created = await res.json() as any;
        expect(created.sourceUrl).toBe("https://example.com/series/has-source");
        expect(created.coverUrl).toBeNull();
        expect(outboundUrls).toEqual([]);
    });

    it("saves the status that was sent instead of defaulting to READING", async () => {
        const res = await request("POST", "/api/media", {
            title: "Planned",
            type: "DONGHUA",
            status: "PLAN_TO_READ",
        });

        expect(res.status).toBe(201);
        const created = await res.json() as any;
        expect(created.status).toBe("PLAN_TO_READ");
        expect((await getRow(created.id))?.status).toBe("PLAN_TO_READ");
    });
});

describe("PATCH /api/media/:id", () => {
    it("edits an entry with a source URL without any outbound request and leaves coverUrl alone", async () => {
        await sqlite.execute(`
            INSERT INTO media (title, type, status, cover_url, source_url)
            VALUES ('Existing', 'MANHUA', 'READING', 'https://old.example.com/cover.jpg', 'https://example.com/old')`);

        const res = await request("PATCH", "/api/media/1", {
            title: "Renamed",
            sourceUrl: "https://example.com/new",
        });

        expect(res.status).toBe(200);
        const row = await getRow(1);
        expect(row?.title).toBe("Renamed");
        expect(row?.source_url).toBe("https://example.com/new");
        expect(row?.cover_url).toBe("https://old.example.com/cover.jpg");
        expect(outboundUrls).toEqual([]);
    });
});

describe("POST /api/import", () => {
    it("imports entries with source URLs without outbound requests and keeps an explicit coverUrl", async () => {
        const res = await request("POST", "/api/import", [
            { title: "Imported A", type: "MANHUA", status: "READING", sourceUrl: "https://example.com/a" },
            { title: "Imported B", type: "DONGHUA", status: "COMPLETED", sourceUrl: "https://example.com/b", coverUrl: "https://cdn.example.com/b.jpg" },
        ]);

        expect(res.status).toBe(200);
        expect(outboundUrls).toEqual([]);
        expect((await getRow(1))?.cover_url).toBeNull();
        expect((await getRow(2))?.cover_url).toBe("https://cdn.example.com/b.jpg");
    });
});
