import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { insertMediaSchema, patchMediaSchema } from "./db/zod";
import { createDb } from "./db";
import { media } from "./db/schema";
import { eq, or, count, like, and, desc, asc, sql } from "drizzle-orm";

import { fetchCoverImage } from "./utils/scraper";
import { checkLatestChapter } from "./utils/update-checker";
import { searchMALAnime, getMALAnimeDetails, shouldUpdateMALData } from "./utils/mal-api";
import { z } from "zod";

type Bindings = {
    DATABASE_URL: string;
    DATABASE_AUTH_TOKEN: string;
    MAL_CLIENT_ID: string;
    MAL_CLIENT_SECRET: string;
    MAL_ACCESS_TOKEN?: string;
    MAL_REFRESH_TOKEN?: string;
    MAL_REDIRECT_URI?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
    "/*",
    cors({
        origin: ['https://spirit-scroll.vercel.app', 'http://localhost:5173', '*'], // Explicit origins
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: false, // Set to false for wildcard origins
    })
);

// Explicit OPTIONS handler for preflight requests
app.options("/*", (c) => {
    return c.text("", 200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    });
});

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

// Helper function to fetch and update MAL data
async function updateMALData(title: string, type: "MANHUA" | "DONGHUA") {
    try {
        // Only search for DONGHUA (anime) content on MAL
        if (type !== "DONGHUA") {
            return {};
        }

        const malData = await searchMALAnime(title);
        if (!malData) {
            return {};
        }

        return {
            malId: malData.id,
            malScore: malData.mean || null,
            malRank: malData.rank || null,
            malPopularity: malData.popularity || null,
            malSynopsis: malData.synopsis || null,
            malGenres: malData.genres ? JSON.stringify(malData.genres) : null,
            malStatus: malData.status || null,
            malStartDate: malData.start_date || null,
            malEndDate: malData.end_date || null,
            malLastUpdated: Date.now(),
        };
    } catch (error) {
        console.error('[MAL] Error updating MAL data:', error);
        return {};
    }
}

const routes = app.basePath("/api")
    // MAL OAuth2 endpoints
    .get("/mal/auth-url", async (c) => {
        const clientId = c.env.MAL_CLIENT_ID;
        if (!clientId) {
            return c.json({ error: "MAL Client ID not configured" }, 500);
        }

        // Generate a proper PKCE code verifier (43-128 characters)
        // Using A-Z, a-z, 0-9, and -._~ characters as per OAuth2 spec
        const codeVerifier = Array.from({ length: 64 }, () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
        
        // Generate a random state and encode the code verifier in it
        // Format: randomState.base64EncodedCodeVerifier
        const randomState = Math.random().toString(36).substring(2, 15);
        const encodedVerifier = btoa(codeVerifier); // Base64 encode
        const state = `${randomState}.${encodedVerifier}`;
        
        // For MAL, code_challenge = code_verifier (plain method)
        const authUrl = `https://myanimelist.net/v1/oauth2/authorize?` +
            `response_type=code&` +
            `client_id=${clientId}&` +
            `state=${encodeURIComponent(state)}&` +
            `redirect_uri=${encodeURIComponent(c.env.MAL_REDIRECT_URI || 'http://localhost:3000/api/mal/callback')}&` +
            `code_challenge=${codeVerifier}&` +
            `code_challenge_method=plain`;

        // Debug logging
        console.log('[MAL] Generated code verifier length:', codeVerifier.length);
        console.log('[MAL] Generated auth URL:', authUrl);

        return c.json({ 
            authUrl,
            state: randomState, // Only return the random part for display
            debug: {
                codeVerifierLength: codeVerifier.length,
                codeVerifier: codeVerifier.substring(0, 10) + '...' // Show first 10 chars for debugging
            }
        });
    })
    .get("/mal/callback", async (c) => {
        const code = c.req.query("code");
        const state = c.req.query("state");
        
        if (!code) {
            return c.json({ error: "Authorization code not provided" }, 400);
        }

        if (!state) {
            return c.json({ error: "State parameter not provided" }, 400);
        }

        // Decode the code verifier from the state parameter
        try {
            const [randomState, encodedVerifier] = state.split('.');
            if (!encodedVerifier) {
                return c.json({ error: "Invalid state format" }, 400);
            }
            
            const codeVerifier = atob(encodedVerifier); // Base64 decode
            
            if (codeVerifier.length < 43 || codeVerifier.length > 128) {
                return c.json({ error: "Invalid code verifier length" }, 400);
            }

            const clientId = c.env.MAL_CLIENT_ID;
            const clientSecret = c.env.MAL_CLIENT_SECRET;
            const redirectUri = c.env.MAL_REDIRECT_URI || 'http://localhost:3000/api/mal/callback';

            if (!clientId || !clientSecret) {
                return c.json({ error: "MAL credentials not configured" }, 500);
            }

            const tokenResponse = await fetch('https://myanimelist.net/v1/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('[MAL] Token exchange failed:', errorText);
                return c.json({ 
                    error: "Failed to exchange code for token",
                    details: errorText,
                    status: tokenResponse.status
                }, 400);
            }

            const tokenData = await tokenResponse.json();
            
            // Return the tokens so you can set them as environment variables
            return c.json({
                success: true,
                message: "MAL authentication successful! Please save these tokens as environment variables.",
                tokens: {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_in: tokenData.expires_in,
                    token_type: tokenData.token_type
                },
                instructions: {
                    access_token: "Set MAL_ACCESS_TOKEN environment variable",
                    refresh_token: "Set MAL_REFRESH_TOKEN environment variable"
                }
            });
        } catch (error) {
            console.error('[MAL] OAuth2 callback error:', error);
            return c.json({ error: "Failed to decode state parameter" }, 400);
        }
    })
    .get("/mal/test-verifier", async (c) => {
        // Test code verifier generation
        const codeVerifier = Array.from({ length: 64 }, () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
        
        return c.json({
            codeVerifier,
            length: codeVerifier.length,
            isValidLength: codeVerifier.length >= 43 && codeVerifier.length <= 128
        });
    })
    .get("/mal/status", async (c) => {
        const clientId = c.env.MAL_CLIENT_ID;
        const accessToken = c.env.MAL_ACCESS_TOKEN;
        
        return c.json({
            configured: !!clientId,
            authenticated: !!accessToken,
            clientId: clientId ? `${clientId.substring(0, 8)}...` : null,
            hasToken: !!accessToken
        });
    })
    .get("/media", async (c) => {
        try {
            const page = Number(c.req.query("page")) || 1;
            const limit = Number(c.req.query("limit")) || 12;
            const type = c.req.query("type") as "MANHUA" | "DONGHUA" | undefined;
            const sortBy = c.req.query("sortBy") as "title" | "progress" | "recent" | "updates" | "type" | undefined;
            const search = c.req.query("search")?.trim();

            const offset = (page - 1) * limit;

            const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
            
            // Build where conditions
            const conditions = [];
            if (type) conditions.push(eq(media.type, type));
            if (search) {
                // Use case-insensitive search
                conditions.push(sql`LOWER(${media.title}) LIKE LOWER(${'%' + search + '%'})`);
            }
            
            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Build order by clause based on sortBy parameter
            let orderByClause;
            switch (sortBy) {
                case 'title':
                    orderByClause = asc(media.title);
                    break;
                case 'progress':
                    // Sort by progress percentage (currentChapter/totalChapters), nulls last
                    orderByClause = desc(sql`CASE WHEN ${media.totalChapters} > 0 THEN CAST(${media.currentChapter} AS REAL) / CAST(${media.totalChapters} AS REAL) ELSE 0 END`);
                    break;
                case 'recent':
                    // Sort by id (most recent entries first) since we don't have updatedAt
                    orderByClause = desc(media.id);
                    break;
                case 'updates':
                    // Complex sorting for updates: 
                    // 1. Items with updates (gap > 0) come first, ordered by gap size (larger gaps first)
                    // 2. Items without updates come after, ordered by title
                    orderByClause = sql`
                        CASE 
                            WHEN COALESCE(${media.latestReleasedChapter}, 0) > ${media.currentChapter} THEN 0
                            ELSE 1 
                        END ASC,
                        CASE 
                            WHEN COALESCE(${media.latestReleasedChapter}, 0) > ${media.currentChapter} 
                            THEN (COALESCE(${media.latestReleasedChapter}, 0) - ${media.currentChapter}) 
                            ELSE 0 
                        END DESC,
                        ${media.title} ASC
                    `;
                    break;
                case 'type':
                    // Sort by type (DONGHUA first, then MANHUA), then by title
                    orderByClause = sql`CASE WHEN ${media.type} = 'DONGHUA' THEN 0 ELSE 1 END, ${media.title} ASC`;
                    break;
                default:
                    orderByClause = asc(media.title);
            }

            const [data, totalResult] = await Promise.all([
                db.select().from(media).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
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

        // Fetch MAL data for DONGHUA content
        const malData = await updateMALData(data.title, data.type);

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);

        const result = await db.insert(media).values({
            ...data,
            coverUrl: coverUrl,
            ...malData,
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
    .get("/media/:id/refresh-mal", async (c) => {
        // GET version for testing
        return c.json({ message: "MAL refresh endpoint is working", method: "GET" });
    })
    .post("/media/:id/refresh-mal", async (c) => {
        const id = Number(c.req.param("id"));
        if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

        const db = createDb(c.env.DATABASE_URL, c.env.DATABASE_AUTH_TOKEN);
        const item = await db.select().from(media).where(eq(media.id, id)).limit(1);
        if (item.length === 0) return c.json({ error: "Not found" }, 404);

        const mediaItem = item[0];
        
        // Only fetch MAL data for DONGHUA content
        if (mediaItem.type !== "DONGHUA") {
            return c.json({ error: "MAL data only available for DONGHUA content" }, 400);
        }

        const malData = await updateMALData(mediaItem.title, mediaItem.type);
        
        if (Object.keys(malData).length === 0) {
            return c.json({ error: "Could not fetch MAL data" }, 404);
        }

        const result = await db.update(media)
            .set(malData)
            .where(eq(media.id, id))
            .returning();

        return c.json({
            success: true,
            malData: {
                score: malData.malScore,
                rank: malData.malRank,
                popularity: malData.malPopularity,
                status: malData.malStatus,
            }
        });
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

        const response = c.json({ success: true, updated: updatedCount });
        // Add explicit CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type");
        return response;
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
