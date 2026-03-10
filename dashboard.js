/**
 * J2ST.ICU — VOID DASHBOARD LOGIC (v4.0)
 * Redesigned for Absolute Performance & Reliability
 */

// --- SESSION CHECK ---
const sessionStr = localStorage.getItem("j2st_session_v2");
if (!sessionStr) window.location.replace("/login");

let session = JSON.parse(sessionStr);
if (!session?.username && !session?.id && !session?.user) {
    localStorage.removeItem("j2st_session_v2");
    window.location.replace("/login");
}
// Normalize
if (!session.id && session.user?.id) session.id = session.user.id;
if (!session.username && session.user?.username) session.username = session.user.username;

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

function hexToRgba(hex, opacity) {
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
    if (el) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');

    const titles = {
        overview: ['dash_title_overview', 'Overview essence'],
        profile: ['dash_title_profile', 'Customize your presence'],
        links: ['dash_title_links', 'Manage your connectivity'],
        media: ['dash_title_media', 'Upload atmosphere assets'],
        badges: ['dash_title_badges', 'Showcase achievements'],
        settings: ['dash_title_settings', 'Account core management']
    };

    const t = document.getElementById('tab-title');
    const s = document.getElementById('tab-sub');
    if (t && titles[tabName]) {
        t.setAttribute('data-i18n', titles[tabName][0]);
        s.textContent = titles[tabName][1];
        if (window.applyLanguage) applyLanguage();
    }
};

// --- INITIALIZATION ---
async function init() {
    try {
        const res = await fetch(`/api/user/profile?u=${session.username}`);
        userDataState = await res.json();
        if (userDataState.error) throw new Error(userDataState.error);

        syncUI();
        setupControls();
        setupLivePreview();
        setupUploaders();
        setupTiltPreview();
        renderPlatformGrid();
    } catch (e) {
        console.error("Init failed:", e);
    }
}

function renderPlatformGrid() {
    const grid = document.getElementById('social-platform-grid');
    if (!grid) return;
    grid.innerHTML = PLATFORMS.map(p => `
        <div class="social-platform-item" title="${p.name}" onclick="addPlatformLink('${p.id}')">
            <i class="${p.icon}"></i>
        </div>
    `).join('');
}

window.addPlatformLink = (platId) => {
    const plat = PLATFORMS.find(p => p.id === platId);
    if (!plat) return;

    if (!userDataState.links) userDataState.links = [];
    if (typeof userDataState.links === 'string') userDataState.links = JSON.parse(userDataState.links);

    // Check if already exists to prevent duplicates (optional, but good)
    const exists = userDataState.links.some(l => l.type === platId);
    if (exists && platId !== 'custom') return showToast("Already added", "error");

    const newL = {
        id: Date.now(),
        type: plat.id,
        title: plat.name,
        icon: plat.icon,
        url: ''
    };
    userDataState.links.push(newL);
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

    let lList = userDataState.links || [];
    if (typeof lList === 'string') try { lList = JSON.parse(lList); } catch (e) { lList = []; }

    container.innerHTML = lList.map(l => `
        <div class="glass-card" style="display:flex; align-items:center; gap:15px; background: rgba(255,255,255,0.02); margin-bottom:10px; padding: 15px;">
            <i class="${l.icon}" style="font-size:20px; width:24px; text-align:center;"></i>
            <div style="flex:1">
                <p style="font-weight:700; font-size:13px;">${l.title}</p>
                <input type="text" value="${l.url}" placeholder="https://..." 
                    class="form-input" style="padding: 6px 10px; font-size:11px; margin-top:5px; width:100%"
                    oninput="updateLinkUrl(${l.id}, this.value)">
            </div>
            <button class="form-input" style="padding: 8px; border-color:rgba(255,77,77,0.2)" onclick="removeLink(${l.id})">
                <i class="fa-solid fa-trash" style="color:#ff4d4d"></i>
            </button>
        </div>
    `).join('');
}

function syncBadgesCollection() {
    const container = document.getElementById('dashboard-badges-grid');
    if (!container || !userDataState.available_badges) return;

    const userBadgeIds = (userDataState.badges || []).map(b => b.id);
    const all = userDataState.available_badges;

    container.innerHTML = all.map(b => {
        const isOwned = userBadgeIds.includes(b.id);
        const desc = b.description || "Kurucu tarafından verilir.";

        return `
            <div class="glass-card badge-collect-item ${isOwned ? 'owned' : 'locked'}" style="text-align:center; padding: 20px; transition: 0.3s;">
                <div class="badge-status-icon">
                    ${isOwned ? `<img src="${b.icon_url}" style="width:48px; height:48px; object-fit:contain;">` : `<i class="fa-solid fa-lock" style="font-size:32px; opacity:0.3;"></i>`}
                </div>
                <p style="font-weight:800; margin-top:12px;">${b.name}</p>
                <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:5px;">${desc}</span>
                ${isOwned ? '<span style="font-size:10px; color:#fff; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; margin-top:8px; display:inline-block;">OWNED</span>' : ''}
            </div>
        `;
    }).join('');
}

function syncUI() {
    if (!userDataState) return;
    syncActiveLinks();
    syncBadgesCollection();

    // Header & Info
    document.querySelectorAll('.chip-img, #preview-avatar-img, #preview-avatar').forEach(img => {
        img.src = userDataState.avatar_url || '/assets/icons/user_dragon.png';
    });
    document.querySelectorAll('.chip-name, #preview-name').forEach(el => {
        el.textContent = userDataState.display_name || userDataState.username;
    });

    // Profile Fields
    document.getElementById('profile-display-name').value = userDataState.display_name || "";
    document.getElementById('profile-bio').value = userDataState.bio || "";

    // Colors
    syncColor('accent', userDataState.accent_color || '#FFFFFF');
    syncColor('icon', userDataState.icon_color || '#A1A1AA');

    const frameData = parseRgba(userDataState.avatar_frame_color || '#000000');
    syncColor('avatar-frame', frameData.hex);
    document.getElementById('avatar-frame-opacity').value = frameData.opacity;

    document.getElementById('badge-bg-color').value = userDataState.badge_bg_color || "rgba(255,255,255,0.05)";

    // Fonts
    document.getElementById('name-font').value = userDataState.name_font || "Outfit";
    document.getElementById('name-font-color').value = userDataState.name_font_color || "#FFFFFF";
    document.getElementById('bio-font').value = userDataState.bio_font || "Outfit";
    document.getElementById('bio-font-color').value = userDataState.bio_font_color || "#FFFFFF";

    // Effects
    document.getElementById('bg-effect').value = userDataState.bg_effect || "none";
    document.getElementById('entry-anim').value = userDataState.entry_anim || "fadeIn";
    document.getElementById('glitch-avatar').checked = !!userDataState.glitch_avatar;
    document.getElementById('card-style').value = userDataState.card_style || "glass";

    // Media
    document.getElementById('banner-url-direct').value = userDataState.banner_url || "";
    document.getElementById('music-url-direct').value = userDataState.profile_music_url || "";
    document.getElementById('cursor-url-direct').value = userDataState.custom_cursor_url || "";

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

function setupControls() {
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
    document.getElementById('avatar-frame-opacity').oninput = updatePreview;

    // Color pickers for fonts
    ['name-font-color'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updatePreview;
    });
}

function setupLivePreview() {
    const ids = [
        'profile-display-name', 'profile-bio', 'name-font', 'bio-font',
        'bio-font-color', 'banner-url-direct', 'glitch-avatar', 'card-style',
        'avatar-frame-opacity'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updatePreview;
    });
}

function updatePreview() {
    if (!userDataState) return;

    const name = document.getElementById('preview-name');
    const bio = document.getElementById('preview-bio');
    const banner = document.getElementById('preview-banner');

    if (name) {
        name.textContent = document.getElementById('profile-display-name').value || userDataState.username;
        name.style.fontFamily = document.getElementById('name-font').value;
        name.style.color = document.getElementById('name-font-color').value;
    }
    if (bio) {
        bio.textContent = document.getElementById('profile-bio').value || "Bio stream...";
        bio.style.fontFamily = document.getElementById('bio-font').value;
        bio.style.color = document.getElementById('bio-font-color').value;
    }

    // Avatar Frame Preview
    const avPreview = document.getElementById('preview-avatar');
    if (avPreview) {
        const fHex = document.getElementById('avatar-frame-hex').value;
        const fOp = document.getElementById('avatar-frame-opacity').value;
        avPreview.style.borderColor = hexToRgba(fHex, fOp);
    }

    // Badges Preview
    const badgesPreview = document.getElementById('preview-badges');
    if (badgesPreview && userDataState.badges && Array.isArray(userDataState.badges)) {
        badgesPreview.innerHTML = userDataState.badges.map(b => `
            <div class="badge-item" data-label="${b.label || ''}" style="width:24px; height:24px;">
                <img src="${b.icon_url}" alt="${b.label}" class="badge-icon">
            </div>
        `).join('');
    }

    // Links Preview
    const linksPreview = document.getElementById('preview-links');
    if (linksPreview) {
        let lList = userDataState.links || [];
        if (typeof lList === 'string') try { lList = JSON.parse(lList); } catch (e) { lList = []; }
        linksPreview.innerHTML = lList.map(l => `
            <div class="badge-item" data-label="${l.title}" style="width:24px; height:24px;">
                <i class="${l.icon}" style="font-size:14px;"></i>
            </div>
        `).join('');
    }

    const bUrl = bannerBase64 || document.getElementById('banner-url-direct').value || userDataState.banner_url;
    if (banner && bUrl) banner.style.backgroundImage = `url(${bUrl})`;

    const phone = document.querySelector('.phone-content');
    const aura = document.querySelector('.phone-content .dynamic-aura');
    const cStyle = document.getElementById('card-style').value;
    const accent = document.getElementById('accent-hex').value;

    if (phone) {
        phone.className = 'phone-content ' + cStyle + '-style';
        phone.style.setProperty('--accent', accent);
    }
    if (aura) {
        aura.style.background = accent;
    }
}

function setupTiltPreview() {
    const ph = document.querySelector('.phone');
    if (ph) {
        ph.style.transform = "none";
        ph.style.transformStyle = "flat";
    }
}

function setupUploaders() {
    const map = {
        'avatar-upload': 'avatar',
        'banner-upload': 'banner',
        'audio-upload-btn': 'music',
        'cursor-upload': 'cursor'
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const res = ev.target.result;
                    if (id === 'avatar-upload') {
                        avatarBase64 = res;
                        document.getElementById('preview-avatar-img').src = res;
                        document.getElementById('preview-avatar').src = res;
                    } else if (id === 'banner-upload') {
                        bannerBase64 = res;
                        document.getElementById('preview-banner').style.backgroundImage = `url(${res})`;
                    } else if (id === 'audio-upload-btn') {
                        musicBase64 = res;
                    } else if (id === 'cursor-upload') {
                        cursorBase64 = res;
                    }
                };
                reader.readAsDataURL(file);
            };
        }
    });
}

window.saveProfileChanges = async () => {
    const btn = document.getElementById('main-save-btn');
    const msg = document.getElementById('save-msg');

    if (!btn) return;
    const lang = localStorage.getItem('j2st_lang') || 'en';
    btn.textContent = i18n_dict[lang]?.dash_btn_saving || "SAVING...";
    btn.disabled = true;

    const payload = {
        id: session.id,
        display_name: document.getElementById('profile-display-name')?.value || "",
        bio: document.getElementById('profile-bio')?.value || "",
        avatar_url: avatarBase64 || userDataState?.avatar_url || null,
        banner_url: bannerBase64 || document.getElementById('banner-url-direct')?.value || userDataState?.banner_url || null,
        accent_color: document.getElementById('accent-hex')?.value || "#FFFFFF",
        icon_color: document.getElementById('icon-hex')?.value || "#A1A1AA",
        avatar_frame_color: hexToRgba(document.getElementById('avatar-frame-hex')?.value || "#000000", document.getElementById('avatar-frame-opacity')?.value || "1"),
        badge_bg_color: document.getElementById('badge-bg-color')?.value || "rgba(255,255,255,0.05)",
        name_font: document.getElementById('name-font')?.value || "Outfit",
        name_font_color: document.getElementById('name-font-color')?.value || "#FFFFFF",
        bio_font: document.getElementById('bio-font')?.value || "Outfit",
        bio_font_color: document.getElementById('bio-font-color')?.value || "#FFFFFF",
        bg_effect: document.getElementById('bg-effect')?.value || "none",
        entry_anim: document.getElementById('entry-anim')?.value || "fadeIn",
        glitch_avatar: document.getElementById('glitch-avatar')?.checked ? 1 : 0,
        profile_music_url: musicBase64 || document.getElementById('music-url-direct')?.value || userDataState?.profile_music_url || null,
        custom_cursor_url: cursorBase64 || document.getElementById('cursor-url-direct')?.value || userDataState?.custom_cursor_url || null,
        base_font: userDataState?.base_font || "Inter",
        base_font_color: userDataState?.base_font_color || "#FFFFFF",
        card_style: document.getElementById('card-style')?.value || "glass",
        hover_text: userDataState?.hover_text || "Void Entity",
        link_hover_anim: userDataState?.link_hover_anim || "float",
        tilt_3d: userDataState?.tilt_3d ?? 1,
        links: JSON.stringify(userDataState.links || [])
    };

    try {
        const r = await fetch("/api/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": session.id },
            body: JSON.stringify(payload)
        });

        const result = await r.json();

        if (r.ok && result.success) {
            userDataState = { ...userDataState, ...payload };
            showToast(i18n_dict[lang]?.dash_toast_saved || "Saved!", "success");
            if (msg) msg.textContent = "CHANGES SECURED.";
        } else {
            throw new Error(result.error || "Save failed");
        }
    } catch (e) {
        console.error("Save Error:", e);
        showToast(i18n_dict[lang]?.dash_toast_error || "Error", "error");
        if (msg) msg.textContent = "SAVE FAILED: " + e.message;
    } finally {
        btn.textContent = i18n_dict[lang]?.dash_save_btn || "SAVE CHANGES";
        btn.disabled = false;
    }
};

function showToast(m, type) {
    const t = document.getElementById('toast');
    const tm = document.getElementById('toast-msg');
    if (!t || !tm) return;
    tm.textContent = m;
    t.className = "toast-notif active " + (type === 'error' ? 'error' : '');
    setTimeout(() => t.classList.remove('active'), 3000);
}

window.viewProfile = () => window.location.href = '/' + (userDataState?.username || session.username);
window.logout = () => { localStorage.removeItem("j2st_session_v2"); window.location.replace("/login"); };

init();
