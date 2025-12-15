import { createDb } from "./db";
const db = createDb();
import { media } from "./db/schema";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
// Note: We'll use drizzle-kit push for schema creation, so migrate might not be needed if we push first.
// But for a seed script, it's good to assume the DB schema defaults.

async function main() {
    console.log("Seeding database...");

    await db.insert(media).values({
        title: "Martial Peak",
        type: "MANHUA",
        currentChapter: 3500,
        totalChapters: 6000, // Estimation
        status: "READING",
        coverUrl: null
    });

    console.log("Seeding complete.");
}

main().catch(console.error);
