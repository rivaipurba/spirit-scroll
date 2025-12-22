import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export const createDb = (url?: string, authToken?: string) => {
    // Use provided URL/token from Cloudflare Workers bindings
    const finalUrl = url || "file:spirit_scroll.sqlite";
    const finalToken = authToken;

    const client = createClient({
        url: finalUrl,
        authToken: finalToken,
    });

    return drizzle(client, { schema });
};


