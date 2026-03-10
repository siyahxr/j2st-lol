/**
 * J2ST.ICU — VOID DASHBOARD LOGIC (v4.0)
 * Rebuilt for Stability, Speed & Premium Aesthetics
 */

// --- SESSION & AUTH ---
const SES_KEY = "j2st_session_v2";
const sessionStr = localStorage.getItem(SES_KEY);
if (!sessionStr) window.location.replace("/login");

let session = JSON.parse(sessionStr);
if (!session?.username && !session?.id && !session?.user) {
    localStorage.removeItem(SES_KEY);
    window.location.replace("/login");
}
// Normalize session object
if (!session.id && session.user?.id) session.id = session.user.id;
if (!session.username && session.user?.username) session.username = session.user.username;

// --- STATE ---
let userDataState = null;
let avatarBase64 = null;
let bannerBase64 = null;
let musicBase64 = null;
let cursorBase64 = null;

const PLATFORMS = [
    { id: 'snapchat', name: 'Snapchat', icon: 'fa-brands fa-snapchat' },
    { id: 'youtube', name: 'YouTube', icon: 'fa-brands fa-youtube' },
    { id: 'discord', name: 'Discord', icon: 'fa-brands fa-discord' },
    { id: 'spotify', name: 'Spotify', icon: 'fa-brands fa-spotify' },
    { id: 'instagram', name: 'Instagram', icon: 'fa-brands fa-instagram' },
    { id: 'x', name: 'X', icon: 'fa-brands fa-x-twitter' },
    { id: 'tiktok', name: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { id: 'telegram', name: 'Telegram', icon: 'fa-brands fa-telegram' },
    { id: 'soundcloud', name: 'SoundCloud', icon: 'fa-brands fa-soundcloud' },
    { id: 'paypal', name: 'PayPal', icon: 'fa-brands fa-paypal' },
    { id: 'github', name: 'GitHub', icon: 'fa-brands fa-github' },
    { id: 'roblox', name: 'Roblox', icon: 'fa-solid fa-ghost' },
    { id: 'cashapp', name: 'CashApp', icon: 'fa-solid fa-dollar-sign' },
    { id: 'apple-music', name: 'Apple Music', icon: 'fa-brands fa-apple' },
    { id: 'gitlab', name: 'GitLab', icon: 'fa-brands fa-gitlab' },
    { id: 'twitch', name: 'Twitch', icon: 'fa-brands fa-twitch' },
    { id: 'reddit', name: 'Reddit', icon: 'fa-brands fa-reddit' },
    { id: 'vk', name: 'VK', icon: 'fa-brands fa-vk' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
    { id: 'steam', name: 'Steam', icon: 'fa-brands fa-steam' },
    { id: 'kick', name: 'Kick', icon: 'fa-solid fa-k' },
    { id: 'pinterest', name: 'Pinterest', icon: 'fa-brands fa-pinterest' },
    { id: 'lastfm', name: 'Last.fm', icon: 'fa-brands fa-lastfm' },
    { id: 'facebook', name: 'Facebook', icon: 'fa-brands fa-facebook' },
    { id: 'threads', name: 'Threads', icon: 'fa-brands fa-threads' },
    { id: 'patreon', name: 'Patreon', icon: 'fa-brands fa-patreon' },
    { id: 'signal', name: 'Signal', icon: 'fa-solid fa-comment' },
    { id: 'bitcoin', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin' },
    { id: 'ethereum', name: 'Ethereum', icon: 'fa-brands fa-ethereum' },
    { id: 'litecoin', name: 'Litecoin', icon: 'fa-solid fa-l' },
    { id: 'solana', name: 'Solana', icon: 'fa-solid fa-s' },
    { id: 'monero', name: 'Monero', icon: 'fa-solid fa-m' },
    { id: 'email', name: 'Email', icon: 'fa-solid fa-envelope' },
    { id: 'custom', name: 'Custom', icon: 'fa-solid fa-link' }
];

// --- UTILS ---
function hexToRgba(hex, opacity) {
    if (!hex) return `rgba(0,0,0,${opacity})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function parseRgba(rgba) {
    if (!rgba) return { hex: '#000000', opacity: 1 };
    if (!rgba.startsWith('rgba')) return { hex: rgba, opacity: 1 };
    const parts = rgba.match(/[\d.]+/g);
    if (!parts || parts.length < 4) return { hex: '#000000', opacity: 1 };
    const r = parseInt(parts[0]).toString(16).padStart(2, '0');
    const g = parseInt(parts[1]).toString(16).padStart(2, '0');
    const b = parseInt(parts[2]).toString(16).padStart(2, '0');
    return { hex: `#${r}${g}${b}`, opacity: parseFloat(parts[3]) };
}

// --- TAB SYSTEM ---
window.switchTab = (el, tabName) => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
        // Fallback for logic-driven switches
        document.querySelectorAll(`.nav-item[href="#${tabName}"]`).forEach(i => i.classList.add('active'));
    }

    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');

    const meta = {
        overview: { title: 'dash_overview', sub: 'Void essence dashboard.' },
        profile: { title: 'dash_profile', sub: 'Customize your presence.' },
        links: { title: 'dash_links', sub: 'Manage your connectivity.' },
        media: { title: 'dash_media', sub: 'Upload atmosphere assets.' },
        badges: { title: 'dash_badges', sub: 'Showcase achievements.' },
        settings: { title: 'dash_settings', sub: 'Account core management.' }
    };

    const t = document.getElementById('tab-title');
    const s = document.getElementById('tab-sub');
    if (t && meta[tabName]) {
        t.setAttribute('data-i18n', meta[tabName].title);
        s.textContent = meta[tabName].sub;
        if (window.applyLanguage) applyLanguage();
    }
};

// --- CORE LOGIC ---
async function init() {
    try {
        const res = await fetch(`/api/user/profile?u=${session.username}`);
        userDataState = await res.json();
        if (userDataState.error) throw new Error(userDataState.error);

        // Normalize data
        if (typeof userDataState.links === 'string') userDataState.links = JSON.parse(userDataState.links);
        if (!userDataState.links) userDataState.links = [];
        
        // Parse badges if string (though usually array from API)
        if (typeof userDataState.badges === 'string') userDataState.badges = JSON.parse(userDataState.badges);
        if (!userDataState.badges) userDataState.badges = [];

        syncUI();
        setupEventListeners();
        renderPlatformGrid();
        loadStats();
    } catch (e) {
        console.error("Dashboard Init Error:", e);
        showToast("Session error. Please login again.", "error");
    }
}

function syncUI() {
    if (!userDataState) return;

    // Admin Access Control
    const userRole = session?.role || session?.user?.role;
    const adminLink = document.getElementById('admin-nav-link');
    if (adminLink) {
        const isStaff = userRole === 'admin' || session.username.charCodeAt(0) === 36;
        adminLink.style.display = isStaff ? 'flex' : 'none';
    }

    // Identity
    document.getElementById('profile-display-name').value = userDataState.display_name || "";
    document.getElementById('profile-bio').value = userDataState.bio || "";
    document.querySelectorAll('.chip-img, #preview-avatar-img').forEach(img => {
        img.src = userDataState.avatar_url || '/assets/icons/user_dragon.png';
    });
    document.querySelectorAll('.chip-name').forEach(el => el.textContent = userDataState.display_name || userDataState.username);

    // Styling
    syncColor('accent', userDataState.accent_color || '#FFFFFF');
    syncColor('icon', userDataState.icon_color || '#A1A1AA');
    
    const frame = parseRgba(userDataState.avatar_frame_color || 'rgba(0,0,0,1)');
    syncColor('avatar-frame', frame.hex);
    document.getElementById('avatar-frame-opacity').value = frame.opacity;
    document.getElementById('badge-bg-color').value = userDataState.badge_bg_color || "rgba(255,255,255,0.05)";
    document.getElementById('card-style').value = userDataState.card_style || "glass";

    // Typography
    document.getElementById('name-font').value = userDataState.name_font || "Outfit";
    document.getElementById('name-font-color').value = userDataState.name_font_color || "#FFFFFF";
    document.getElementById('bio-font').value = userDataState.bio_font || "Outfit";
    document.getElementById('bio-font-color').value = userDataState.bio_font_color || "#FFFFFF";

    // Atmosphere
    document.getElementById('bg-effect').value = userDataState.bg_effect || "none";
    document.getElementById('entry-anim').value = userDataState.entry_anim || "fadeIn";
    document.getElementById('glitch-avatar').checked = !!userDataState.glitch_avatar;

    // Media
    document.getElementById('banner-url-direct').value = userDataState.banner_url || "";
    document.getElementById('music-url-direct').value = userDataState.profile_music_url || "";
    document.getElementById('cursor-url-direct').value = userDataState.custom_cursor_url || "";

    syncActiveLinks();
    syncBadgesCollection();
    updatePreview();
}

function syncColor(id, val) {
    const hex = document.getElementById(id + '-hex');
    const pick = document.getElementById(id + '-color');
    const prev = document.getElementById(id + '-prev');
    if (hex) hex.value = val;
    if (pick) pick.value = val;
    if (prev) prev.style.background = val;
}

function setupEventListeners() {
    // Live color updates
    ['accent', 'icon', 'avatar-frame'].forEach(id => {
        const hex = document.getElementById(id + '-hex');
        const pick = document.getElementById(id + '-color');
        const prev = document.getElementById(id + '-prev');

        if (prev && pick) prev.onclick = () => pick.click();
        if (pick && hex) {
            pick.oninput = () => {
                hex.value = pick.value;
                if (prev) prev.style.background = pick.value;
                updatePreview();
            };
            hex.oninput = () => {
                if (hex.value.match(/^#[0-9A-F]{6}$/i)) {
                    pick.value = hex.value;
                    if (prev) prev.style.background = hex.value;
                    updatePreview();
                }
            };
        }
    });

    // Input changes for live preview
    const liveIds = [
        'profile-display-name', 'profile-bio', 'name-font', 'name-font-color',
        'bio-font', 'bio-font-color', 'avatar-frame-opacity', 'card-style',
        'bg-effect', 'entry-anim', 'glitch-avatar', 'banner-url-direct'
    ];
    liveIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updatePreview;
    });

    // File Uploaders
    setupFilePicker('avatar-upload', 'avatar');
    setupFilePicker('banner-upload', 'banner');
    setupFilePicker('audio-upload-btn', 'music');
    setupFilePicker('cursor-upload', 'cursor');
}

function setupFilePicker(inputId, type) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'music' && !file.type.includes('audio') && !file.name.endsWith('.mp3')) {
            return showToast("Only MP3 files allowed", "error");
        }
        if (file.size > 5 * 1024 * 1024) return showToast("File too large (Max 5MB)", "error");

        const reader = new FileReader();
        reader.onload = (rev) => {
            const b64 = rev.target.result;
            if (type === 'avatar') {
                avatarBase64 = b64;
                document.getElementById('preview-avatar-img').src = b64;
            } else if (type === 'banner') {
                bannerBase64 = b64;
            } else if (type === 'music') {
                musicBase64 = b64;
                document.getElementById('audio-status-text').textContent = "LOADED: " + file.name;
            } else if (type === 'cursor') {
                cursorBase64 = b64;
            }
            updatePreview();
            showToast("Asset ready to deploy", "success");
        };
        reader.readAsDataURL(file);
    };
}

// --- LINKS ---
function renderPlatformGrid() {
    const grid = document.getElementById('social-platform-grid');
    if (!grid) return;
    grid.innerHTML = PLATFORMS.map(p => `
        <div class="social-platform-item" title="${p.name}" onclick="addLink('${p.id}')">
            <i class="${p.icon}"></i>
        </div>
    `).join('');
}

window.addLink = (platId) => {
    const p = PLATFORMS.find(x => x.id === platId);
    if (!p) return;
    
    // Max links check
    if (userDataState.links.length >= 20) return showToast("Max links reached", "error");

    userDataState.links.push({
        id: Date.now(),
        type: p.id,
        title: p.name,
        icon: p.icon,
        url: ''
    });
    syncActiveLinks();
    updatePreview();
};

window.removeLink = (id) => {
    userDataState.links = userDataState.links.filter(l => l.id !== id);
    syncActiveLinks();
    updatePreview();
};

window.updateLinkUrl = (id, val) => {
    const l = userDataState.links.find(x => x.id === id);
    if (l) l.url = val;
    updatePreview();
};

function syncActiveLinks() {
    const container = document.getElementById('dashboard-links-list');
    if (!container) return;
    container.innerHTML = userDataState.links.map(l => `
        <div class="glass-card" style="display:flex; align-items:center; gap:15px; background: rgba(255,255,255,0.02); margin-bottom:10px; padding: 15px;">
            <i class="${l.icon}" style="font-size:20px; width:24px; text-align:center;"></i>
            <div style="flex:1">
                <p style="font-weight:700; font-size:13px;">${l.title}</p>
                <input type="text" value="${l.url}" placeholder="https://..." 
                    class="form-input" style="padding: 6px 10px; font-size:11px; margin-top:5px; width:100%"
                    oninput="updateLinkUrl(${l.id}, this.value)">
            </div>
            <button class="form-input" style="padding: 8px; border-color:rgba(255,77,77,0.2); cursor:pointer;" onclick="removeLink(${l.id})">
                <i class="fa-solid fa-trash" style="color:#ff4d4d"></i>
            </button>
        </div>
    `).join('');
}

// --- BADGES ---
function syncBadgesCollection() {
    const grid = document.getElementById('dashboard-badges-grid');
    if (!grid || !userDataState.available_badges) return;

    const ownedIds = (userDataState.badges || []).map(b => parseInt(b.id) || b.id);
    
    grid.innerHTML = userDataState.available_badges.map(b => {
        const isOwned = ownedIds.includes(parseInt(b.id) || b.id);
        return `
            <div class="glass-card badge-collect-item ${isOwned ? 'owned' : 'locked'}" style="text-align:center; padding: 20px;">
                <div class="badge-status-icon">
                    ${isOwned ? `<img src="${b.icon_url}" style="width:48px;height:48px;object-fit:contain;">` : `<i class="fa-solid fa-lock" style="font-size:32px; opacity:0.3;"></i>`}
                </div>
                <p style="font-weight:800; margin-top:12px; font-size:13px;">${b.name}</p>
                <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:5px;">${b.description || 'Awarded by system'}</span>
                ${isOwned ? '<span style="font-size:9px; color:#fff; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; margin-top:10px; display:inline-block; font-weight:800;">OWNED</span>' : ''}
            </div>
        `;
    }).join('');
}

// --- PREVIEW ---
function updatePreview() {
    const name = document.getElementById('preview-name');
    const bio = document.getElementById('preview-bio');
    const handle = document.getElementById('preview-handle');
    const banner = document.getElementById('preview-banner');
    const avatar = document.getElementById('preview-avatar');
    const phone = document.querySelector('.phone-content');

    if (name) {
        name.textContent = document.getElementById('profile-display-name').value || "User";
        name.style.fontFamily = document.getElementById('name-font').value;
        name.style.color = document.getElementById('name-font-color').value;
    }
    if (bio) {
        bio.textContent = document.getElementById('profile-bio').value || "Biological data stream...";
        bio.style.fontFamily = document.getElementById('bio-font').value;
        bio.style.color = document.getElementById('bio-font-color').value;
    }
    if (handle) handle.textContent = "@" + session.username;

    if (avatar) {
        avatar.src = avatarBase64 || userDataState.avatar_url || '/assets/icons/user_dragon.png';
        const fHex = document.getElementById('avatar-frame-hex').value;
        const fOp = document.getElementById('avatar-frame-opacity').value;
        avatar.style.borderColor = hexToRgba(fHex, fOp);
        avatar.classList.toggle('glitch', document.getElementById('glitch-avatar').checked);
    }

    const bUrl = bannerBase64 || document.getElementById('banner-url-direct').value || userDataState.banner_url;
    if (banner && bUrl) banner.style.backgroundImage = `url(${bUrl})`;

    // Card style & Accent
    const cStyle = document.getElementById('card-style').value;
    const accent = document.getElementById('accent-hex').value;
    if (phone) {
        phone.className = `phone-content ${cStyle}-style`;
        phone.style.setProperty('--accent', accent);
    }

    // Badges Preview
    const badgesPreview = document.getElementById('preview-badges');
    if (badgesPreview) {
        badgesPreview.innerHTML = (userDataState.badges || []).map(b => `
            <div class="badge-item" data-label="${b.name}">
                <img src="${b.icon_url}" class="badge-icon">
            </div>
        `).join('');
    }

    // Links Preview
    const linksPreview = document.getElementById('preview-links');
    if (linksPreview) {
        linksPreview.innerHTML = userDataState.links.map(l => `
            <div class="badge-item" data-label="${l.title}">
                <i class="${l.icon}" style="font-size:14px; color:var(--accent);"></i>
            </div>
        `).join('');
    }
}

// --- ACTIONS ---
window.saveProfileChanges = async () => {
    const btn = document.getElementById('main-save-btn');
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    btn.textContent = "SAVING...";

    const payload = {
        id: session.id,
        display_name: document.getElementById('profile-display-name').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: avatarBase64 || userDataState.avatar_url,
        banner_url: bannerBase64 || document.getElementById('banner-url-direct').value,
        accent_color: document.getElementById('accent-hex').value,
        icon_color: document.getElementById('icon-hex').value,
        avatar_frame_color: hexToRgba(document.getElementById('avatar-frame-hex').value, document.getElementById('avatar-frame-opacity').value),
        badge_bg_color: document.getElementById('badge-bg-color').value,
        name_font: document.getElementById('name-font').value,
        name_font_color: document.getElementById('name-font-color').value,
        bio_font: document.getElementById('bio-font').value,
        bio_font_color: document.getElementById('bio-font-color').value,
        bg_effect: document.getElementById('bg-effect').value,
        entry_anim: document.getElementById('entry-anim').value,
        glitch_avatar: document.getElementById('glitch-avatar').checked ? 1 : 0,
        profile_music_url: musicBase64 || document.getElementById('music-url-direct').value,
        custom_cursor_url: cursorBase64 || document.getElementById('cursor-url-direct').value,
        card_style: document.getElementById('card-style').value,
        links: JSON.stringify(userDataState.links)
    };

    try {
        const r = await fetch("/api/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": session.id },
            body: JSON.stringify(payload)
        });
        const res = await r.json();
        if (res.success) {
            showToast("Changes Secured.", "success");
            userDataState = { ...userDataState, ...payload };
            // Reset base64s to save memory
            avatarBase64 = bannerBase64 = musicBase64 = cursorBase64 = null;
        } else {
            throw new Error(res.error);
        }
    } catch (e) {
        showToast("Error: " + e.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "SAVE CHANGES";
    }
};

window.changeUserPassword = async () => {
    const oldP = document.getElementById('set-old-pass').value;
    const newP = document.getElementById('set-new-pass').value;
    if (!oldP || !newP) return showToast("Enter passwords", "error");

    try {
        const r = await fetch("/api/user/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": session.id },
            body: JSON.stringify({ userId: session.id, oldPassword: oldP, newPassword: newP })
        });
        const res = await r.json();
        if (res.success) {
            showToast("Password updated.", "success");
            document.getElementById('set-old-pass').value = document.getElementById('set-new-pass').value = "";
        } else {
            showToast(res.error, "error");
        }
    } catch (e) {
        showToast("Server error", "error");
    }
};

async function loadStats() {
    try {
        const sViews = document.getElementById('stat-views');
        const sLinks = document.getElementById('stat-links');
        const sBadges = document.getElementById('stat-badges');

        if (sViews) sViews.textContent = userDataState.views || 0;
        if (sLinks) sLinks.textContent = userDataState.links.length;
        if (sBadges) sBadges.textContent = userDataState.badges.length;
    } catch (e) {}
}

function showToast(m, type) {
    const t = document.getElementById('toast');
    const tm = document.getElementById('toast-msg');
    if (!t || !tm) return;
    tm.textContent = m;
    t.className = "toast-notif active " + (type === 'error' ? 'error' : '');
    setTimeout(() => t.classList.remove('active'), 3000);
}

window.viewProfile = () => window.location.href = '/' + session.username;
window.logout = () => { localStorage.removeItem(SES_KEY); window.location.replace("/login"); };

// BOOT
init();
