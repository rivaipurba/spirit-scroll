const url = "https://spirit-scroll-api.rivai22purba.workers.dev/api/media?page=1&limit=1";
console.log("Fetching", url);

// Self-executing async function to use await at top level if needed (though bun supports top-level await)
(async () => {
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        const text = await res.text();

        try {
            const json = JSON.parse(text);
            console.log("\n--- API RESPONSE ---");
            if (json.error) {
                console.error("ERROR:", json.error);
                if (json.stack) console.error("STACK:", json.stack);
                if (json.env_keys) console.log("ENV KEYS PRESENT:", json.env_keys);
            } else {
                console.log("SUCCESS:", JSON.stringify(json, null, 2));
            }
            console.log("--------------------\n");
        } catch (e) {
            console.log("Raw Body (Not JSON):", text);
        }
    } catch (e) {
        console.error("Network Error:", e);
    }
})();
