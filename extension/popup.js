// SpiritScroll Tracker - Popup Script

const ACTION_LABELS = {
    update: { text: 'Updated', cls: 'green' },
    create: { text: 'Added', cls: 'blue' },
    not_found: { text: 'Not Found', cls: 'yellow' },
    skip: { text: 'Skipped', cls: 'muted' },
};

function timeAgo(ms) {
    const diff = Date.now() - ms;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function renderActivity(log) {
    const list = document.getElementById('activity-list');
    if (!log.length) {
        list.innerHTML = '<p class="empty">No recent activity.</p>';
        return;
    }
    list.innerHTML = log.map(entry => {
        const label = ACTION_LABELS[entry.action] || { text: entry.action, cls: 'muted' };
        return `
            <div class="activity-item">
                <div class="activity-top">
                    <span class="activity-title">${entry.title || 'Unknown'}</span>
                    <span class="tag ${label.cls}">${label.text}</span>
                </div>
                <div class="activity-bottom">
                    ${entry.episode ? `Ep. ${entry.episode}` : ''}
                    <span class="time">${timeAgo(entry.time)}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function updateStatusBadge() {
    const badge = document.getElementById('status-badge');
    const data = await chrome.storage.local.get(['authToken', 'apiUrl']);
    if (data.authToken && data.apiUrl) {
        badge.textContent = 'Active';
        badge.className = 'badge green';
    } else {
        badge.textContent = 'Setup Required';
        badge.className = 'badge yellow';
    }
}

async function loadSettings() {
    const data = await chrome.storage.local.get(['apiUrl', 'autoAdd']);
    if (data.apiUrl) document.getElementById('api-url').value = data.apiUrl;
    document.getElementById('auto-add').checked = data.autoAdd ?? false;
}

function showMsg(text, isError = false) {
    const el = document.getElementById('login-msg');
    el.textContent = text;
    el.className = `msg ${isError ? 'error' : 'success'}`;
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.remove('hidden');
    });
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
    let apiUrl = document.getElementById('api-url').value.trim().replace(/\/$/, '');
    if (apiUrl && !/^https?:\/\//i.test(apiUrl)) apiUrl = 'https://' + apiUrl;
    document.getElementById('api-url').value = apiUrl;
    const password = document.getElementById('password').value;

    if (!apiUrl) return showMsg('Enter API URL first.', true);
    if (!password) return showMsg('Enter password.', true);

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    await chrome.storage.local.set({ apiUrl });

    chrome.runtime.sendMessage({ type: 'LOGIN', apiUrl, password }, (res) => {
        btn.disabled = false;
        btn.textContent = 'Login';
        if (res?.success) {
            showMsg('Logged in successfully!');
            updateStatusBadge();
        } else {
            showMsg(res?.error || 'Login failed.', true);
        }
    });
});

// Auto-add toggle
document.getElementById('auto-add').addEventListener('change', (e) => {
    chrome.storage.local.set({ autoAdd: e.target.checked });
});

// API URL save on blur
document.getElementById('api-url').addEventListener('blur', (e) => {
    let val = e.target.value.trim().replace(/\/$/, '');
    if (val && !/^https?:\/\//i.test(val)) val = 'https://' + val;
    if (val) { e.target.value = val; chrome.storage.local.set({ apiUrl: val }); }
});

// Init
(async () => {
    await Promise.all([loadSettings(), updateStatusBadge()]);

    chrome.runtime.sendMessage({ type: 'GET_ACTIVITY' }, (res) => {
        renderActivity(res?.log || []);
    });
})();
