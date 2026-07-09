// SpiritScroll Tracker - Background Service Worker

async function getConfig() {
    const data = await chrome.storage.local.get(['apiUrl', 'authToken', 'autoAdd']);
    return {
        apiUrl: (data.apiUrl || '').replace(/\/$/, ''),
        authToken: data.authToken || '',
        autoAdd: data.autoAdd ?? false,
    };
}

async function login(apiUrl, password) {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Login failed: ${res.status}`);
    }
    const { token } = await res.json();
    await chrome.storage.local.set({ authToken: token });
    return token;
}

async function fetchLibrary(apiUrl, authToken) {
    const res = await fetch(`${apiUrl}/api/media?limit=1000`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch library: ${res.status}`);
    const data = await res.json();
    return data.data || [];
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function findMatch(library, title) {
    const needle = normalizeTitle(title);

    // 1. Exact match
    const exact = library.find(m => normalizeTitle(m.title) === needle);
    if (exact) return exact;

    // 2. One contains the other
    const contains = library.find(m => {
        const hay = normalizeTitle(m.title);
        return hay.includes(needle) || needle.includes(hay);
    });
    if (contains) return contains;

    // 3. Word overlap >= 70%
    const needleWords = needle.split(' ').filter(w => w.length > 2);
    let bestScore = 0;
    let bestMatch = null;
    for (const m of library) {
        const hayWords = normalizeTitle(m.title).split(' ').filter(w => w.length > 2);
        const overlap = needleWords.filter(w => hayWords.includes(w)).length;
        const score = overlap / Math.max(needleWords.length, hayWords.length, 1);
        if (score > bestScore && score >= 0.7) {
            bestScore = score;
            bestMatch = m;
        }
    }
    return bestMatch;
}

async function updateProgress(apiUrl, authToken, id, chapter) {
    const res = await fetch(`${apiUrl}/api/media/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentChapter: chapter }),
    });
    if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
    return res.json();
}

async function createEntry(apiUrl, authToken, entry) {
    const res = await fetch(`${apiUrl}/api/media`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
    return res.json();
}

async function logActivity(entry) {
    const data = await chrome.storage.local.get(['activityLog']);
    const log = data.activityLog || [];
    log.unshift({ ...entry, time: Date.now() });
    if (log.length > 30) log.length = 30;
    await chrome.storage.local.set({ activityLog: log });
}

function notify(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title,
        message,
    });
}

async function handleTrack({ title, episode, mediaType, sourceUrl, seriesUrl }) {
    const { apiUrl, authToken, autoAdd } = await getConfig();

    if (!apiUrl) return { success: false, error: 'API URL not configured. Open the extension popup to set it up.' };
    if (!authToken) return { success: false, error: 'Not logged in. Open the extension popup to log in.' };

    let library;
    try {
        library = await fetchLibrary(apiUrl, authToken);
    } catch (e) {
        return { success: false, error: e.message };
    }

    const match = findMatch(library, title);

    if (match) {
        if (episode <= match.currentChapter) {
            await logActivity({ action: 'skip', title: match.title, episode, reason: 'already ahead' });
            return { success: true, action: 'skip', message: `Already at episode ${match.currentChapter}` };
        }

        try {
            await updateProgress(apiUrl, authToken, match.id, episode);
            await logActivity({ action: 'update', title: match.title, episode });
            notify('SpiritScroll Updated', `${match.title} \u2192 Episode ${episode}`);
            return { success: true, action: 'update', title: match.title, episode };
        } catch (e) {
            return { success: false, error: e.message };
        }
    } else {
        if (autoAdd) {
            try {
                await createEntry(apiUrl, authToken, {
                    title,
                    type: mediaType,
                    currentChapter: episode,
                    status: 'READING',
                    sourceUrl: seriesUrl || sourceUrl,
                });
                await logActivity({ action: 'create', title, episode });
                notify('SpiritScroll - New Entry Added', `"${title}" added at Episode ${episode}`);
                return { success: true, action: 'create', title, episode };
            } catch (e) {
                return { success: false, error: e.message };
            }
        } else {
            await logActivity({ action: 'not_found', title, episode });
            notify('SpiritScroll - Not in Library', `"${title}" Ep.${episode} not tracked. Enable auto-add in settings.`);
            return { success: true, action: 'not_found', title };
        }
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRACK_EPISODE') {
        handleTrack(message)
            .then(sendResponse)
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (message.type === 'LOGIN') {
        login(message.apiUrl, message.password)
            .then(token => sendResponse({ success: true, token }))
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (message.type === 'GET_ACTIVITY') {
        chrome.storage.local.get(['activityLog'])
            .then(data => sendResponse({ log: data.activityLog || [] }));
        return true;
    }
});
