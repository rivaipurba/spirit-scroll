// SpiritScroll Tracker - Content Script
// Detects episode/chapter info on supported media sites and reports to background

const SITE_CONFIGS = [
    {
        // Animexin - Donghua streaming site
        // Episode URL: https://animexin.dev/renegade-immortal-episode-42/
        hostnames: ['animexin.dev', 'animexin.vip'],
        mediaType: 'DONGHUA',
        waitMs: 30000, // 30s - user is likely watching the episode

        extract(url) {
            // Pattern: /slug-episode-N/ or /slug-episode-N-sub/
            const urlMatch = url.match(/\/([a-z0-9]+(?:-[a-z0-9]+)*)-episode-(\d+)/i);
            if (urlMatch) {
                const slug = urlMatch[1];
                const episode = parseInt(urlMatch[2], 10);
                const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const seriesUrl = `${window.location.origin}/${slug}/`;
                return { title, episode, seriesUrl };
            }

            // Fallback: page title "Title Name Episode 42 - Animexin"
            const titleMatch = document.title.match(/^(.+?)\s+Episode\s+(\d+)/i);
            if (titleMatch) {
                return { title: titleMatch[1].trim(), episode: parseInt(titleMatch[2], 10) };
            }

            // Fallback: <h1> on page
            const h1 = document.querySelector('h1.entry-title, h1.posttitle, h1');
            if (h1) {
                const h1Match = h1.textContent.match(/^(.+?)\s+Episode\s+(\d+)/i);
                if (h1Match) {
                    return { title: h1Match[1].trim(), episode: parseInt(h1Match[2], 10) };
                }
            }

            return null;
        },
    },
    {
        // Asura Scans - Manhua
        // Chapter URL: https://asuracomic.net/series/title-abc123/chapter/42
        hostnames: ['asuracomic.net', 'asurascans.com'],
        mediaType: 'MANHUA',
        waitMs: 10000, // 10s - user started reading the chapter

        extract(url) {
            const urlMatch = url.match(/\/series\/([^/]+)\/chapter\/(\d+)/i);
            if (urlMatch) {
                const fullSlug = urlMatch[1];
                const chapter = parseInt(urlMatch[2], 10);
                // Asura slugs often end with a random ID like "-abc123" - strip it
                const slug = fullSlug.replace(/-[a-z0-9]{6,}$/, '');
                const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const seriesUrl = `${window.location.origin}/series/${fullSlug}`;
                return { title, episode: chapter, seriesUrl };
            }

            // Fallback: page title "Title Name Chapter 42 - Asura Scans"
            const titleMatch = document.title.match(/^(.+?)\s+Chapter\s+(\d+)/i);
            if (titleMatch) {
                return { title: titleMatch[1].trim(), episode: parseInt(titleMatch[2], 10) };
            }

            return null;
        },
    },
];

function getSiteConfig() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    return SITE_CONFIGS.find(cfg => cfg.hostnames.some(h => hostname === h || hostname.endsWith('.' + h)));
}

function tryTrack(config) {
    const info = config.extract(window.location.href);
    if (!info || !info.title || !info.episode) return;

    console.log(`[SpiritScroll] Detected: "${info.title}" - Episode/Chapter ${info.episode}. Tracking in ${config.waitMs / 1000}s...`);

    const trackedUrl = window.location.href;

    setTimeout(() => {
        // Confirm user is still on the same page
        if (window.location.href !== trackedUrl) return;

        const recheck = config.extract(window.location.href);
        if (!recheck || recheck.episode !== info.episode) return;

        chrome.runtime.sendMessage({
            type: 'TRACK_EPISODE',
            title: info.title,
            episode: info.episode,
            mediaType: config.mediaType,
            sourceUrl: window.location.href,
            seriesUrl: info.seriesUrl || null,
        }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response?.success) {
                console.log(`[SpiritScroll] ${response.action}: ${response.title || info.title} Ep.${info.episode}`);
            } else {
                console.warn('[SpiritScroll] Track failed:', response?.error);
            }
        });
    }, config.waitMs);
}

function init() {
    const config = getSiteConfig();
    if (!config) return;

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => tryTrack(config));
    } else {
        tryTrack(config);
    }

    // Handle SPA/client-side navigation
    let lastUrl = window.location.href;
    const navObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            setTimeout(() => tryTrack(config), 1500);
        }
    });
    navObserver.observe(document.documentElement, { childList: true, subtree: true });
}

init();
