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
            if (response.status === 404) return response;

            console.warn(`[Scraper] Attempt ${i + 1} failed for ${url}: ${response.status}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        } catch (e) {
            console.warn(`[Scraper] Attempt ${i + 1} error for ${url}:`, e);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    return null;
}

export async function fetchCoverImage(url: string): Promise<string | null> {
    try {
        const response = await fetchWithRetry(url);

        if (!response || !response.ok) {
            console.error(`Failed to fetch URL: ${url}, status: ${response?.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Try specific selector for Animexin/WP sites
        const specificImg = $('img.ts-post-image.wp-post-image').attr('src');
        if (specificImg) return specificImg;

        // 2. Try Open Graph image
        const ogImg = $('meta[property="og:image"]').attr('content');
        if (ogImg) return ogImg;

        // 3. Try Twitter Card image
        const twitterImg = $('meta[name="twitter:image"]').attr('content');
        if (twitterImg) return twitterImg;

        return null;
    } catch (error) {
        console.error("Error scraping cover image:", error);
        return null;
    }
}
