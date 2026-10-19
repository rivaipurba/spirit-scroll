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

// Parse an episode/chapter number from a label such as "Episode 20 End",
// "37 [245]" or "Chapter 65". Returns null for non-episode posts ("Hiatus").
export function parseEpisodeNumber(text: string): number | null {
    const normalized = text.replace(/\s+/g, ' ').trim();

    // Multi-season numbering: "37 [245]" — the bracketed number is the cumulative
    // episode across all seasons, which is how the library tracks progress.
    const bracket = normalized.match(/\[(\d+(?:\.\d+)?)\]/);
    if (bracket) return parseFloat(bracket[1]!);

    // A number at the start ("288", "Episode 288") or right after a keyword.
    // Bare numbers elsewhere (e.g. dates like "October 1, 2026") are ignored.
    const match = normalized.match(/^(?:(?:episode|ep|chapter|ch)\.?\s*)?(\d+(?:\.\d+)?)\b/i)
        || normalized.match(/\b(?:episode|ep|chapter|ch)\.?\s*(\d+(?:\.\d+)?)\b/i);
    if (!match) return null;

    const num = parseFloat(match[1]!);
    return isNaN(num) ? null : num;
}

// Highest episode number among all elements matching selector, skipping
// entries without one (announcement posts, "Hiatus", etc.)
function maxEpisodeNumber($: cheerio.CheerioAPI, selector: string): number | null {
    let max: number | null = null;
    $(selector).each((_, el) => {
        const num = parseEpisodeNumber($(el).text());
        if (num !== null && (max === null || num > max)) max = num;
    });
    return max;
}

// Highest chapter number among links to the page's own chapters, using the
// series path from <link rel="canonical">
function maxAsuraChapter($: cheerio.CheerioAPI): number | null {
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) return null;

    let seriesPath: string;
    try {
        seriesPath = new URL(canonical, 'https://asurascans.com').pathname.replace(/\/+$/, '');
    } catch {
        return null;
    }
    if (!seriesPath) return null;

    const prefix = `${seriesPath}/chapter/`;
    let max: number | null = null;
    $('a[href*="/chapter/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        let path: string;
        try {
            path = new URL(href, 'https://asurascans.com').pathname;
        } catch {
            return;
        }
        if (!path.startsWith(prefix)) return;

        const label = $(el).find('.font-medium').first();
        const num = parseEpisodeNumber(label.length ? label.text() : $(el).text());
        if (num !== null && (max === null || num > max)) max = num;
    });
    return max;
}

// Asura moved from asuracomic.net/series/<slug> to asurascans.com/comics/<slug>;
// the old domain now redirects to the homepage. Stale hash suffixes on the new
// domain redirect to the current one, so the slug can be kept as-is.
export function normalizeSourceUrl(url: string): string {
    const match = url.match(/^https?:\/\/(?:www\.)?asuracomic\.net\/series\/([^/?#]+)/i);
    if (!match) return url;
    return `https://asurascans.com/comics/${match[1]}`;
}

export function parseLatestChapter(html: string): number | null {
    const $ = cheerio.load(html);

    // Strategy 1: The "New Episode" box (Animexin/Theme specific)
    // Structure: <span class="epcur epcurlast">Episode 9</span>
    // During a hiatus this reads "Episode Hiatus" and yields no number.
    const quickLink = $('.lastend .inepcx .epcurlast').first();
    if (quickLink.length) {
        const num = parseEpisodeNumber(quickLink.text());
        if (num !== null) {
            console.log(`[UpdateChecker] Strategy: Animexin/Epcur match (${num})`);
            return num;
        }
    }

    // Strategy 2: Asura Scans "New Chapter" Box
    // Structure: <div class="grid..."><a...>First Chapter</a><a...>New Chapter... <h3>Chapter 65</h3></a></div>
    const asuraQuickLink = $('.grid.grid-cols-2 a:last-child h3.font-bold').first();
    if (asuraQuickLink.length) {
        const num = parseEpisodeNumber(asuraQuickLink.text());
        if (num !== null) {
            console.log(`[UpdateChecker] Strategy: Asura Grid match (${num})`);
            return num;
        }
    }

    // Strategy 3: Asura Scans (asurascans.com) chapter list
    // Structure: <a href="/comics/<slug>/chapter/281">...<span class="font-medium">Chapter 281</span>...</a>
    // Only count links under the page's own canonical path — the homepage (where
    // dead asuracomic.net URLs used to land) lists chapters of many series.
    const asuraChapter = maxAsuraChapter($);
    if (asuraChapter !== null) {
        console.log(`[UpdateChecker] Strategy: Asura chapter list match (${asuraChapter})`);
        return asuraChapter;
    }

    // Strategy 4: Episode/chapter lists — take the highest number across all
    // items, since the first item may be an announcement post
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
        const num = maxEpisodeNumber($, selector);
        if (num !== null) {
            console.log(`[UpdateChecker] Strategy: List selector '${selector}' match (${num})`);
            return num;
        }
    }

    console.log(`[UpdateChecker] No strategy matched`);
    return null;
}

export async function checkLatestChapter(url: string): Promise<number | null> {
    try {
        const fetchUrl = normalizeSourceUrl(url);
        const response = await fetchWithRetry(fetchUrl);

        if (!response || !response.ok) {
            console.error(`Failed to fetch URL after retries: ${fetchUrl}, status: ${response?.status}`);
            return null;
        }

        const html = await response.text();
        const latest = parseLatestChapter(html);
        console.log(`[UpdateChecker] ${fetchUrl} → ${latest}`);
        return latest;
    } catch (error) {
        console.error("Error checking latest chapter:", error);
        return null;
    }
}
