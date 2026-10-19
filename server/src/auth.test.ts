import { afterEach, describe, expect, it, setSystemTime } from "bun:test";
import { checkAuth, createToken, hashPassword, timingSafeEqual, verifyPassword } from "./auth";

const SECRET = "test-secret";
const REMOTE_DB = "libsql://spirit-scroll.example.turso.io";
const LOCAL_DB = "file:spirit_scroll.sqlite";

afterEach(() => {
    setSystemTime();
});

describe("timingSafeEqual", () => {
    it("returns true for identical strings", () => {
        expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    });

    it("returns false for strings that differ in one character", () => {
        expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    });

    it("returns false for strings of different length", () => {
        expect(timingSafeEqual("abc", "abcd")).toBe(false);
    });
});

describe("verifyPassword", () => {
    it("accepts the right password and rejects a wrong one", async () => {
        const hash = await hashPassword("hunter2");
        expect(await verifyPassword("hunter2", hash)).toBe(true);
        expect(await verifyPassword("hunter3", hash)).toBe(false);
    });
});

describe("checkAuth", () => {
    it("allows a request with no secret when the database is a local file: URL", async () => {
        expect(await checkAuth({ authHeader: undefined, jwtSecret: "", databaseUrl: LOCAL_DB })).toBeNull();
    });

    it("fails closed with 500 when the secret is missing and the database is remote", async () => {
        const result = await checkAuth({ authHeader: undefined, jwtSecret: "", databaseUrl: REMOTE_DB });
        expect(result?.status).toBe(500);
    });

    it("returns 401 when the Authorization header is missing", async () => {
        const result = await checkAuth({ authHeader: undefined, jwtSecret: SECRET, databaseUrl: REMOTE_DB });
        expect(result?.status).toBe(401);
    });

    it("returns 401 when the Authorization header is not a Bearer token", async () => {
        const token = await createToken(SECRET);
        const result = await checkAuth({ authHeader: `Basic ${token}`, jwtSecret: SECRET, databaseUrl: REMOTE_DB });
        expect(result?.status).toBe(401);
    });

    it("returns 401 for a token signed with a different secret", async () => {
        const token = await createToken("other-secret");
        const result = await checkAuth({ authHeader: `Bearer ${token}`, jwtSecret: SECRET, databaseUrl: REMOTE_DB });
        expect(result?.status).toBe(401);
    });

    it("returns 401 for an expired token", async () => {
        setSystemTime(new Date(Date.now() - 48 * 60 * 60 * 1000));
        const token = await createToken(SECRET);
        setSystemTime();

        const result = await checkAuth({ authHeader: `Bearer ${token}`, jwtSecret: SECRET, databaseUrl: REMOTE_DB });
        expect(result?.status).toBe(401);
    });

    it("allows a valid token", async () => {
        const token = await createToken(SECRET);
        expect(await checkAuth({ authHeader: `Bearer ${token}`, jwtSecret: SECRET, databaseUrl: REMOTE_DB })).toBeNull();
    });
});
