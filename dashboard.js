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
let userDataState = {
    display_name: "",
    bio: "",
    avatar_url: "/assets/icons/user_dragon.png",
    banner_url: "",
    links: [],
    badges: [],
    available_badges: [],
    accent_color: "#FFFFFF",
    icon_color: "#A1A1AA",
    avatar_frame_color: "rgba(0,0,0,1)",
    name_font: "Outfit",
    name_font_color: "#FFFFFF",
    bio_font: "Outfit",
    bio_font_color: "#FFFFFF",
    badge_bg_color: "rgba(255,255,255,0.05)",
    card_style: "glass",
    bg_effect: "none",
    entry_anim: "fadeIn",
    glitch_avatar: 0
};
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
        const data = await res.json();
        
        if (!data.error) {
            // Merge with default state
            userDataState = { ...userDataState, ...data };
            
            // Normalize data
            if (typeof userDataState.links === 'string') userDataState.links = JSON.parse(userDataState.links);
            if (!userDataState.links) userDataState.links = [];
            
            if (typeof userDataState.badges === 'string') userDataState.badges = JSON.parse(userDataState.badges);
            if (!userDataState.badges) userDataState.badges = [];
        }

        syncUI();
        setupEventListeners();
        renderPlatformGrid();
        loadStats();
    } catch (e) {
        console.error("Dashboard Init Error:", e);
        // Even if API fails, let's keep going with defaults
        setupEventListeners();
        renderPlatformGrid();
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
        'bg-effect', 'entry-anim', 'glitch-avatar', 'banner-url-direct',
        'badge-bg-color', 'accent-hex', 'icon-hex', 'avatar-frame-hex'
    ];
    liveIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updatePreview);
            el.addEventListener('change', updatePreview);
        }
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
        
        // D1 has a tight limit (usually 1MB per row/string)
        // Let's be strict: Images max 500KB, Audio max 750KB
        const maxBytes = type === 'music' ? 750 * 1024 : 500 * 1024;
        if (file.size > maxBytes && type === 'music') {
            return showToast("Audio too large for DB (Max 750KB)", "error");
        }

        const reader = new FileReader();
        reader.onload = (rev) => {
            const b64 = rev.target.result;
            
            if (type === 'avatar' || type === 'banner') {
                // Compress Image
                const img = new Image();
                img.src = b64;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = type === 'avatar' ? 400 : 800; // Avatar smaller than Banner
                    
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height *= maxDim / width;
                            width = maxDim;
                        } else {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedB64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality jpeg
                    
                    if (type === 'avatar') {
                        avatarBase64 = compressedB64;
                        document.querySelectorAll('#preview-avatar-img, #preview-avatar').forEach(i => i.src = compressedB64);
                    } else {
                        bannerBase64 = compressedB64;
                        const pb = document.getElementById('preview-banner');
                        if (pb) pb.style.backgroundImage = `url(${compressedB64})`;
                    }
                    updatePreview();
                    showToast("Asset optimized & ready", "success");
                };
            } else {
                if (type === 'music') {
                    musicBase64 = b64;
                    const status = document.getElementById('audio-status-text');
                    if (status) status.textContent = "LOADED: " + file.name;
                } else if (type === 'cursor') {
                    cursorBase64 = b64;
                }
                updatePreview();
                showToast("Asset ready", "success");
            }
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
    if (l) {
        l.url = val;
        updatePreview();
    }
};

function syncActiveLinks() {
    const container = document.getElementById('dashboard-links-list');
    if (!container) return;
    container.innerHTML = userDataState.links.map(l => `
        <div class="glass-card link-editor-item" style="display:flex; align-items:center; gap:15px; background: rgba(255,255,255,0.02); margin-bottom:10px; padding: 15px;">
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
    // We can preview even with default/empty state
    const d = userDataState || {};

    const name = document.getElementById('preview-name');
    const bio = document.getElementById('preview-bio');
    const handle = document.getElementById('preview-handle');
    const banner = document.getElementById('preview-banner');
    const avatar = document.getElementById('preview-avatar');
    const phone = document.querySelector('.phone-content');

    if (name) {
        name.textContent = document.getElementById('profile-display-name')?.value || "User";
        name.style.fontFamily = document.getElementById('name-font')?.value || "Outfit";
        name.style.color = document.getElementById('name-font-color')?.value || "#FFFFFF";
    }
    if (bio) {
        bio.textContent = document.getElementById('profile-bio')?.value || "Biological data stream...";
        bio.style.fontFamily = document.getElementById('bio-font')?.value || "Outfit";
        bio.style.color = document.getElementById('bio-font-color')?.value || "#FFFFFF";
    }
    if (handle) handle.textContent = "@" + (session.username || "user");

    const bUrl = bannerBase64 || document.getElementById('banner-url-direct')?.value || userDataState.banner_url;
    if (banner) {
        banner.style.backgroundImage = bUrl ? `url("${bUrl}")` : 'none';
    }

    if (avatar) {
        avatar.src = avatarBase64 || d.avatar_url || '/assets/icons/user_dragon.png';
        const fHex = document.getElementById('avatar-frame-hex')?.value || "#000000";
        const fOp = document.getElementById('avatar-frame-opacity')?.value || "1";
        avatar.style.borderColor = hexToRgba(fHex, fOp);
        avatar.classList.toggle('glitch', document.getElementById('glitch-avatar')?.checked || false);
    }

    // Card style & Accent
    const cStyle = document.getElementById('card-style')?.value || "glass";
    const accent = document.getElementById('accent-hex')?.value || "#FFFFFF";
    if (phone) {
        phone.className = `phone-content ${cStyle}-style`;
        phone.style.setProperty('--accent', accent);
    }

    // Backends might need to know about the badge bg
    const badgeBg = document.getElementById('badge-bg-color')?.value || "rgba(255,255,255,0.05)";
    const badgesPreview = document.getElementById('preview-badges');
    if (badgesPreview) {
        badgesPreview.innerHTML = (d.badges || []).map(b => `
            <div class="badge-item" data-label="${b.name}" style="background: ${badgeBg}; border-radius: 4px;">
                <img src="${b.icon_url}" class="badge-icon">
            </div>
        `).join('');
    }

    // Links Preview
    const linksPreview = document.getElementById('preview-links');
    if (linksPreview) {
        linksPreview.innerHTML = (d.links || []).map(l => `
            <div class="badge-item" data-label="${l.title}" style="background: ${badgeBg}; border-radius: 4px;">
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
    const originalText = btn.textContent;
    btn.textContent = "SAVING...";

    // Creating payload with absolute zero risk of undefined values
    const safeGet = (id, fallback = "") => {
        const el = document.getElementById(id);
        if (!el) return fallback;
        if (el.type === 'checkbox') return el.checked ? 1 : 0;
        return (el.value || fallback).trim();
    };

    const payload = {
        id: String(session.id || ""),
        display_name: safeGet('profile-display-name'),
        bio: safeGet('profile-bio'),
        avatar_url: String(avatarBase64 || userDataState.avatar_url || ""),
        banner_url: String(bannerBase64 || safeGet('banner-url-direct') || userDataState.banner_url || ""),
        accent_color: safeGet('accent-hex', '#FFFFFF'),
        icon_color: safeGet('icon-hex', '#A1A1AA'),
        avatar_frame_color: String(hexToRgba(safeGet('avatar-frame-hex', '#000000'), safeGet('avatar-frame-opacity', '1'))),
        badge_bg_color: safeGet('badge-bg-color', 'rgba(255,255,255,0.05)'),
        name_font: safeGet('name-font', 'Outfit'),
        name_font_color: safeGet('name-font-color', '#FFFFFF'),
        bio_font: safeGet('bio-font', 'Outfit'),
        bio_font_color: safeGet('bio-font-color', '#FFFFFF'),
        bg_effect: safeGet('bg-effect', 'none'),
        entry_anim: safeGet('entry-anim', 'fadeIn'),
        glitch_avatar: safeGet('glitch-avatar') === 1 ? 1 : 0,
        profile_music_url: String(musicBase64 || safeGet('music-url-direct') || userDataState.profile_music_url || ""),
        custom_cursor_url: String(cursorBase64 || safeGet('cursor-url-direct') || userDataState.custom_cursor_url || ""),
        card_style: safeGet('card-style', 'glass'),
        links: JSON.stringify(userDataState.links || []),
        
        // Metadata fields for DB match
        hover_text: safeGet('hover-text', 'Click to interact'),
        link_hover_anim: safeGet('link-hover-anim', 'float'),
        tilt_3d: safeGet('tilt-3d') === 1 ? 1 : 0,
        base_font: safeGet('base-font', 'Outfit'),
        base_font_color: safeGet('base-font-color', '#FFFFFF')
    };

    try {
        const r = await fetch("/api/profile/update", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-user-id": String(session.id || "")
            },
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
