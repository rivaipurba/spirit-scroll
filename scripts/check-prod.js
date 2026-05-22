const apiBase = (process.env.SPIRIT_SCROLL_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const url = `${apiBase}/api/media?page=1&limit=1`;

console.log("Fetching", url);

try {
    const res = await fetch(url);
    console.log("Status:", res.status);

    const text = await res.text();
    try {
        const json = JSON.parse(text);
        console.log(JSON.stringify(json, null, 2));
    } catch {
        console.log(text);
    }
} catch (error) {
    console.error("Network error:", error);
    process.exitCode = 1;
}
