import * as cheerio from 'cheerio';

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://asuracomic.net/",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0"
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (response.ok) return response;

            // Should valid 404s retry? Probably not, but 500s yes.
            if (response.status === 404) return response;

            console.warn(`[UpdateChecker] Attempt ${i + 1} failed for ${url}: ${response.status}`);

            // Wait before retry (1s, 2s, etc.)
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        } catch (e) {
            console.warn(`[UpdateChecker] Attempt ${i + 1} error for ${url}:`, e);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    return null;
}

export async function checkLatestChapter(url: string): Promise<number | null> {
    try {
        const response = await fetchWithRetry(url);

        if (!response || !response.ok) {
            console.error(`Failed to fetch URL after retries: ${url}, status: ${response?.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Targeted selectors for Animexin / WordPress / Grid layouts

        // Strategy 1: The "New Episode" box (Animexin/Theme specific)
        // Structure: <span class="epcur epcurlast">Episode 9</span>
        const quickLink = $('.lastend .inepcx .epcurlast').first();
        if (quickLink.length) {
            const text = quickLink.text().trim();
            const match = text.match(/(?:episode|ep|ch|chapter)?\s*(\d+(\.\d+)?)/i);
            if (match) {
                const num = parseFloat(match[1]);
                if (!isNaN(num)) {
                    console.log(`[UpdateChecker] Strategy: Animexin/Epcur match (${num}) for ${url}`);
                    return num;
                }
            }
        }

        // Strategy 2: Asura Scans "New Chapter" Box
        // Structure: <div class="grid..."><a...>First Chapter</a><a...>New Chapter... <h3>Chapter 65</h3></a></div>
        const asuraQuickLink = $('.grid.grid-cols-2 a:last-child h3.font-bold').first();
        if (asuraQuickLink.length) {
            const text = asuraQuickLink.text().trim(); // Gets "Chapter 65"
            const match = text.match(/(\d+(\.\d+)?)/);
            if (match) {
                const num = parseFloat(match[1]);
                if (!isNaN(num)) {
                    console.log(`[UpdateChecker] Strategy: Asura Grid match (${num}) for ${url}`);
                    return num;
                }
            }
        }

        // Strategy 3: Fallback lists
        const selectors = [
            '.latest-chapter',
            '.eplister li a .epl-num', // Specific to Animexin for episode number
            '.eplister li a .epl-title', // Sometimes in title
            '.clstyle li .chapternum',
            '#chapterlist li .chapternum',
            '.eplister li a', // Generic fallback
            '.clstyle li',
            '#chapterlist li'
        ];

        for (const selector of selectors) {
            const firstItem = $(selector).first();
            if (firstItem.length > 0) {
                const text = firstItem.text().trim();
                const match = text.match(/(?:episode|ep|ch|chapter)?\s*(\d+(\.\d+)?)/i);

                if (match && match.length > 0) {
                    // Get the first captured group which is the number
                    const num = parseFloat(match[1]);
                    if (!isNaN(num)) {
                        console.log(`[UpdateChecker] Strategy: List selector '${selector}' match (${num}) for ${url}`);
                        return num;
                    }
                }
            }
        }

        console.log(`[UpdateChecker] No strategy matched for ${url}`);
        return null;

    } catch (error) {
        console.error("Error checking latest chapter:", error);
        return null;
    }
}
