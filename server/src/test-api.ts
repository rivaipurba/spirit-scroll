import app from "./index";
import type { AppType } from "./index";
import { hc } from "hono/client";

// Custom fetch adapter for local testing without running a real server
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    return app.fetch(req);
};

const client = hc<AppType>("http://localhost:3000", { fetch: customFetch });

async function main() {
    console.log("Creating media...");
    const createRes = await client.api.media.$post({
        json: {
            title: "Test Donghua",
            type: "DONGHUA",
            status: "READING",
            currentChapter: 0,
            totalChapters: 24,
        },
    });

    if (!createRes.ok) {
        console.error("Create failed", await createRes.text());
        return;
    }

    const created = await createRes.json();
    console.log("Created:", created);

    console.log("Getting all...");
    const listRes = await client.api.media.$get();
    const list = await listRes.json();
    console.log("List count:", list.length);

    console.log("Updating (PATCH)...");
    const updateRes = await client.api.media[":id"].$patch({
        param: { id: created.id.toString() },
        json: {
            status: "READING",
            currentChapter: 1,
        },
    });

    if (!updateRes.ok) {
        console.error("Update failed", await updateRes.text());
        return;
    }

    const updated = await updateRes.json();
    console.log("Updated:", updated);

    if (updated.status !== "READING" || updated.currentChapter !== 1) {
        console.error("Verification Failed: Partial update did not work correctly.");
    }

    console.log("AppType RPC verified.");
}

main().catch(console.error);
