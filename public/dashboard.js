/**
 * J2ST.ICU — VOID DASHBOARD LOGIC (v4.0)
 * Rebuilt for Stability, Speed & Premium Aesthetics
 */

// --- SESSION & AUTH ---
const SES_KEY = "j2st_session_v2";
const sessionStr = localStorage.getItem(SES_KEY);
if (!sessionStr) window.location.replace("/login");

let session = sessionStr ? JSON.parse(sessionStr) : null;
const isValid = session && (session.id || session.username || (session.user && (session.user.id || session.user.username)));

if (!isValid) {
    if (sessionStr) localStorage.removeItem(SES_KEY);
    window.location.replace("/login");
}
// Normalize session object
if (!session.id && session.user?.id) session.id = session.user.id;
if (!session.username && session.user?.username) session.username = session.user.username;
if (!session.role && session.user?.role) session.role = session.user.role;

// --- STATE ---
let userDataState = {
    display_name: "",
    bio: "",
    avatar_url: "/assets/icons/user_dragon.png",
    banner_url: "",
    links: [],
    badges: [],
    available_badges: [],
    accent_color: "#3b82f6",
    icon_color: "#ffffff",
    avatar_frame_color: "rgba(255,255,255,1)",
    name_font: "Outfit",
    name_font_color: "#FFFFFF",
    bio_font: "Outfit",
    bio_font_color: "rgba(255,255,255,0.55)",
    badge_bg_color: "rgba(255,255,255,0.05)",
    card_style: "solid",
    bg_effect: "none",
    entry_anim: "fadeIn",
    glitch_avatar: 0,
    role: "member",
    views: 0,
    created_at: new Date().toISOString()
};
let dataLoaded = false;
let avatarBase64 = null;
let bannerBase64 = null;
let musicBase64 = null;
let cursorBase64 = null;

const PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: 'fa-brands fa-instagram', color: '#E4405F' },
    { id: 'x', name: 'X', icon: 'fa-brands fa-x-twitter', color: '#ffffff' },
    { id: 'tiktok', name: 'TikTok', icon: 'fa-brands fa-tiktok', color: '#000000' },
    { id: 'youtube', name: 'YouTube', icon: 'fa-brands fa-youtube', color: '#FF0000' },
    { id: 'twitch', name: 'Twitch', icon: 'fa-brands fa-twitch', color: '#9146FF' },
    { id: 'discord', name: 'Discord', icon: 'fa-brands fa-discord', color: '#5865F2' },
    { id: 'github', name: 'GitHub', icon: 'fa-brands fa-github', color: '#ffffff' },
    { id: 'spotify', name: 'Spotify', icon: 'fa-brands fa-spotify', color: '#1DB954' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', color: '#0A66C2' },
    { id: 'telegram', name: 'Telegram', icon: 'fa-brands fa-telegram', color: '#26A5E4' },
    { id: 'snapchat', name: 'Snapchat', icon: 'fa-brands fa-snapchat', color: '#FFFC00' },
    { id: 'reddit', name: 'Reddit', icon: 'fa-brands fa-reddit', color: '#FF4500' },
    { id: 'pinterest', name: 'Pinterest', icon: 'fa-brands fa-pinterest', color: '#BD081C' },
    { id: 'steam', name: 'Steam', icon: 'fa-brands fa-steam', color: '#ffffff' },
    { id: 'website', name: 'Web Sitesi', icon: 'fa-solid fa-globe', color: '#ffffff' },
    { id: 'email', name: 'E-posta', icon: 'fa-solid fa-envelope', color: '#ffffff' },
    { id: 'kick', name: 'Kick', icon: 'fa-solid fa-k', color: '#53FC18' },
    { id: 'custom', name: 'Özel', icon: 'fa-solid fa-link', color: '#ffffff' }
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
        document.querySelectorAll(`.nav-item[onclick*="'${tabName}'"]`).forEach(i => i.classList.add('active'));
    }

    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');

    if (tabName === 'analytics') loadAnalytics();
};

// --- CORE LOGIC ---
async function init() {
    try {
        const res = await fetch(`/api/user/profile?u=${session.username}&t=${Date.now()}`);
        const data = await res.json();

        if (!data.error) {
            userDataState = { ...userDataState, ...data };

            if (typeof userDataState.links === 'string') userDataState.links = JSON.parse(userDataState.links);
            if (!userDataState.links) userDataState.links = [];

            if (typeof userDataState.badges === 'string') userDataState.badges = JSON.parse(userDataState.badges);
            if (!userDataState.badges) userDataState.badges = [];
            
            if (data.id) {
                session.id = data.id;
                localStorage.setItem(SES_KEY, JSON.stringify(session));
            }

            dataLoaded = true;
            syncUI();
            setupEventListeners();
            updateOverview();
            loadAnalytics();
            
            // Render specific tabs
            renderPlatformGrid();
            syncActiveLinks();
            renderBadges();
        } else {
            showToast("Hata: Profil verileri yüklenemedi.", "error");
        }
    } catch (e) {
        console.error("Dashboard Init Error:", e);
    }
}

function syncUI() {
    if (!userDataState) return;

    // Identity & Sidebar
    const nameEl = document.getElementById('profile-display-name');
    if (nameEl) nameEl.value = userDataState.display_name || "";
    
    const bioEl = document.getElementById('profile-bio');
    if (bioEl) bioEl.value = userDataState.bio || "";

    const userImg = userDataState.avatar_url || '/assets/icons/user_dragon.png';
    document.querySelectorAll('#footer-avatar, #header-avatar-img, #preview-avatar-img').forEach(img => {
        img.src = userImg;
    });

    document.getElementById('footer-username').textContent = userDataState.display_name || session.username;
    document.getElementById('footer-handle').textContent = "@" + session.username;
    if (document.getElementById('welcome-msg')) document.getElementById('welcome-msg').textContent = `Tekrar hoş geldin, ${session.username}`;
    if (document.getElementById('profile-url-display')) document.getElementById('profile-url-display').textContent = `csbl.lol/${session.username}`;

    // Appearance & Advanced
    const frameData = parseRgba(userDataState.avatar_frame_color);
    if (document.getElementById('avatar-frame-hex')) document.getElementById('avatar-frame-hex').value = frameData.hex;
    if (document.getElementById('avatar-frame-opacity')) document.getElementById('avatar-frame-opacity').value = frameData.opacity;
    if (document.getElementById('icon-hex')) document.getElementById('icon-hex').value = userDataState.icon_color || "#FFFFFF";
    if (document.getElementById('badge-bg-color')) document.getElementById('badge-bg-color').value = userDataState.badge_bg_color || "rgba(255,255,255,0.04)";
    if (document.getElementById('accent-hex')) document.getElementById('accent-hex').value = userDataState.accent_color || "#3b82f6";
    
    // Fonts & Effects
    if (document.getElementById('base-font')) document.getElementById('base-font').value = userDataState.base_font || "Outfit";
    if (document.getElementById('base-font-color')) document.getElementById('base-font-color').value = userDataState.base_font_color || "#FFFFFF";
    if (document.getElementById('name-font')) document.getElementById('name-font').value = userDataState.name_font || "Outfit";
    if (document.getElementById('name-font-color')) document.getElementById('name-font-color').value = userDataState.name_font_color || "#FFFFFF";
    if (document.getElementById('bio-font')) document.getElementById('bio-font').value = userDataState.bio_font || "Outfit";
    if (document.getElementById('bio-font-color')) document.getElementById('bio-font-color').value = userDataState.bio_font_color || "rgba(255,255,255,0.55)";
    if (document.getElementById('name-effect')) document.getElementById('name-effect').value = userDataState.name_effect || "none";
    
    // Card & Interaction
    if (document.getElementById('card-style')) {
        const val = userDataState.card_style || "glass";
        document.getElementById('card-style').value = val;
        // Also update button active states
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(`'${val}'`)) btn.classList.add('active');
        });
    }
    if (document.getElementById('hover-text')) document.getElementById('hover-text').value = userDataState.hover_text || "";
    if (document.getElementById('link-hover-anim')) document.getElementById('link-hover-anim').value = userDataState.link_hover_anim || "float";
    if (document.getElementById('bg-effect')) document.getElementById('bg-effect').value = userDataState.bg_effect || "none";
    if (document.getElementById('entry-anim')) document.getElementById('entry-anim').value = userDataState.entry_anim || "fadeIn";
    
    // Toggles
    if (document.getElementById('glitch-avatar')) document.getElementById('glitch-avatar').checked = !!userDataState.glitch_avatar;
    if (document.getElementById('tilt-3d')) document.getElementById('tilt-3d').checked = !!userDataState.tilt_3d;
    if (document.getElementById('discord-status-toggle')) document.getElementById('discord-status-toggle').checked = !!userDataState.discord_status;

    // Media
    if (document.getElementById('avatar-url-direct')) document.getElementById('avatar-url-direct').value = userDataState.avatar_url || "";
    if (document.getElementById('banner-url-direct')) document.getElementById('banner-url-direct').value = userDataState.banner_url || "";
    if (document.getElementById('music-url-direct')) document.getElementById('music-url-direct').value = userDataState.profile_music_url || "";
    if (document.getElementById('cursor-url-direct')) document.getElementById('cursor-url-direct').value = userDataState.custom_cursor_url || "";
    
    // Social Media Tab
    if (document.getElementById('social-instagram')) document.getElementById('social-instagram').value = userDataState.social_instagram || "";
    if (document.getElementById('social-x')) document.getElementById('social-x').value = userDataState.social_x || "";
    if (document.getElementById('social-tiktok')) document.getElementById('social-tiktok').value = userDataState.social_tiktok || "";
    if (document.getElementById('social-youtube')) document.getElementById('social-youtube').value = userDataState.social_youtube || "";

    checkAdminVisibility();
}

function updateOverview() {
    // Stats
    const viewsEl = document.getElementById('stat-views');
    if (viewsEl) viewsEl.textContent = userDataState.views || 0;
    
    const linksEl = document.getElementById('stat-links');
    if (linksEl) linksEl.textContent = userDataState.links?.length || 0;
    
    const badgesEl = document.getElementById('stat-badges');
    if (badgesEl) badgesEl.textContent = userDataState.badges?.length || 0;
    
    // Role & Date
    const roleMap = { founder: 'Kurucu', admin: 'Admin', premium: 'Premium', member: 'Ücretsiz' };
    const roleEl = document.getElementById('user-role-display');
    if (roleEl) roleEl.textContent = roleMap[userDataState.role] || 'Ücretsiz';
    
    if (userDataState.created_at) {
        const date = new Date(userDataState.created_at);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('user-join-date');
        if (dateEl) dateEl.textContent = date.toLocaleDateString('tr-TR', options);
    }

    updateProfileProgress();
}

function updateProfileProgress() {
    let score = 0;
    const items = {
        'check-name': !!userDataState.display_name,
        'check-bio': !!userDataState.bio,
        'check-media': !!userDataState.banner_url,
        'check-links': userDataState.links?.length > 0,
        'check-music': !!userDataState.profile_music_url
    };

    let done = 0;
    let total = Object.keys(items).length;

    for (const [id, isDone] of Object.entries(items)) {
        const el = document.getElementById(id);
        if (el) {
            if (isDone) {
                el.classList.add('done');
                done++;
            } else {
                el.classList.remove('done');
            }
        }
    }

    const perc = Math.round((done / total) * 100);
    const percEl = document.getElementById('profile-completion-perc');
    if (percEl) percEl.textContent = perc + "%";
    
    const barEl = document.getElementById('profile-completion-bar');
    if (barEl) barEl.style.width = perc + "%";
}

function checkAdminVisibility() {
    const adminNav = document.getElementById('admin-nav-wrapper');
    if (!adminNav) return;
    
    const userRole = userDataState.role || session.role || 'member';
    const userName = session.username || '';
    const isAdmin = userRole === 'admin' || userRole === 'founder';
    const isFounder = (userName && userName.startsWith('$')) || userRole === 'founder';
    
    if (isAdmin || isFounder) {
        adminNav.style.display = 'flex';
        adminNav.classList.add('visible');
    } else {
        adminNav.style.display = 'none';
    }
}

function syncColor(id, val) {
    const hex = document.getElementById(id + '-hex');
    if (hex) {
        hex.value = val;
        // Trigger live update if it's the accent color
        if (id === 'accent') {
            document.documentElement.style.setProperty('--accent', val);
        }
        updatePreview();
    }
}
window.syncColor = syncColor;

window.setCardStyle = (style) => {
    const select = document.getElementById('card-style');
    if (select) select.value = style;
    
    // Update active state on buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${style}'`)) {
            btn.classList.add('active');
        }
    });
    
    updatePreview();
};

window.copyProfileLink = () => {
    const url = `csbl.lol/${session.username}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast("Link panoya kopyalandı!");
    });
};

window.removeAvatar = () => {
    avatarBase64 = null;
    const defaultAvatar = "/assets/icons/user_dragon.png";
    document.getElementById('avatar-url-direct').value = "";
    document.querySelectorAll('#preview-avatar-img, #header-avatar-img, #footer-avatar').forEach(img => img.src = defaultAvatar);
    userDataState.avatar_url = defaultAvatar;
    updatePreview();
    showToast("Avatar sıfırlandı.");
};

function setupEventListeners() {
    // 1. Live Input Listeners for Overview & State Sync
    const liveIds = [
        'profile-display-name', 'profile-bio', 'accent-hex', 'icon-hex',
        'avatar-frame-hex', 'badge-bg-color', 'name-font', 'name-font-color',
        'bio-font', 'bio-font-color', 'glitch-avatar', 'banner-url-direct',
        'music-url-direct', 'cursor-url-direct', 'card-style', 'card-border',
        'card-opacity', 'link-hover-anim', 'bg-effect', 'entry-anim',
        'name-effect', 'hover-text', 'tilt-3d', 'discord-status-toggle'
    ];

    liveIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                // Clear media buffers if direct URL is typed
                if (id === 'avatar-url-direct') avatarBase64 = null;
                if (id === 'banner-url-direct') bannerBase64 = null;
                if (id === 'music-url-direct') musicBase64 = null;
                if (id === 'cursor-url-direct') cursorBase64 = null;

                updatePreview();
                updateProfileProgress();
            });
            // Also listen to change for selects
            if (el.tagName === 'SELECT' || el.type === 'checkbox') {
                el.addEventListener('change', () => {
                    updatePreview();
                    updateProfileProgress();
                });
            }
        }
    });

    // 2. Media Uploads
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

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            return showToast("Dosya çok büyük (Maks 20MB)", "error");
        }

        const reader = new FileReader();
        reader.onload = (rev) => {
            const b64 = rev.target.result;
            if (type === 'avatar') {
                avatarBase64 = b64;
                document.querySelectorAll('#preview-avatar-img, #header-avatar-img, #footer-avatar').forEach(img => img.src = b64);
            }
            if (type === 'banner') {
                bannerBase64 = b64;
                document.getElementById('banner-url-direct').value = "[DOSYA SEÇİLDİ]";
            }
            if (type === 'music') {
                musicBase64 = b64;
                document.getElementById('music-url-direct').value = "[DOSYA SEÇİLDİ]";
                document.getElementById('music-file-info').textContent = file.name;
            }
            if (type === 'cursor') {
                cursorBase64 = b64;
                document.getElementById('cursor-url-direct').value = "[DOSYA SEÇİLDİ]";
            }
            updatePreview();
            updateProfileProgress();
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

// Badge listesi - link olarak eklenebilecek
const BADGE_PLATFORMS = [
    { id: 'badge_verify', name: 'Verified', icon: 'fa-solid fa-check-circle', color: '#00D9FF' },
    { id: 'badge_premium', name: 'Premium', icon: 'fa-solid fa-crown', color: '#FFD700' },
    { id: 'badge_early', name: 'Early Access', icon: 'fa-solid fa-rocket', color: '#FF6B35' },
    { id: 'badge_supporter', name: 'Supporter', icon: 'fa-solid fa-heart', color: '#FF4D4D' },
    { id: 'badge_staff', name: 'Staff', icon: 'fa-solid fa-shield-halved', color: '#4CAF50' },
    { id: 'badge_partner', name: 'Partner', icon: 'fa-solid fa-handshake', color: '#9C27B0' }
];

function renderBadgeGrid() {
    // This previously rendered the badge platform selector for links.
    // Removed as requested.
}

window.createPersonalBadge = () => {
    const name = document.getElementById('custom-badge-name').value.trim();
    const icon = document.getElementById('custom-badge-icon').value.trim();

    if (!name || !icon) return showToast("İsim ve İkon gereklidir", "error");

    if (!userDataState.badges) userDataState.badges = [];
    if (userDataState.badges.length >= 20) return showToast("Maksimum rozet sayısına ulaşıldı", "error");

    userDataState.badges.push({
        id: 'user_' + Date.now(),
        name: name,
        icon_url: icon,
        is_personal: true
    });

    document.getElementById('custom-badge-name').value = "";
    document.getElementById('custom-badge-icon').value = "";

    renderBadges();
    updatePreview();
    showToast("Rozet Eklendi!", "success");
};

window.removePersonalBadge = (id) => {
    userDataState.badges = userDataState.badges.filter(b => b.id !== id);
    renderBadges();
    updatePreview();
    showToast("Rozet Kaldırıldı", "success");
};

let activeModalData = null;

window.addBadgeLink = (badgeId) => {
    const badge = BADGE_PLATFORMS.find(x => x.id === badgeId);
    if (!badge) return;
    if (userDataState.links.length >= 20) return showToast("Maksimum link sayısına ulaşıldı!", "error");
    openLinkModal(badge, true);
};

window.addLink = (platId) => {
    const p = PLATFORMS.find(x => x.id === platId);
    if (!p) return;
    if (userDataState.links.length >= 20) return showToast("Maksimum link sayısına ulaşıldı!", "error");
    openLinkModal(p, false);
};

window.editLink = (id) => {
    const link = (userDataState.links || []).find(l => String(l.id) === String(id));
    if (!link) return;

    // Find platform info
    let platform = PLATFORMS.find(p => p.id === link.type);
    if (!platform && link.isBadge) {
        platform = ALL_BADGES.find(b => b.id === link.type);
    }
    
    if (!platform) platform = { id: link.type, name: link.title, icon: link.icon };

    openLinkModal(platform, link.isBadge, link);
};

window.openLinkModal = (p, isBadge, existingLink = null) => {
    activeModalData = { ...p, isBadge, editId: existingLink ? existingLink.id : null };
    const modal = document.getElementById('link-modal');
    const platName = document.getElementById('modal-platform-name');
    const titleInput = document.getElementById('modal-link-title');
    const urlInput = document.getElementById('modal-link-url');
    
    if (!modal) return;
    
    platName.textContent = existingLink ? `DÜZENLE: ${p.name}` : p.name;
    titleInput.value = existingLink ? existingLink.title : p.name;
    urlInput.value = existingLink ? existingLink.url : "";
    
    modal.classList.add('active');
    urlInput.focus();
};

window.closeLinkModal = () => {
    const modal = document.getElementById('link-modal');
    if (modal) modal.classList.remove('active');
    activeModalData = null;
};

window.confirmAddLink = () => {
    if (!activeModalData) return;
    
    const title = document.getElementById('modal-link-title').value.trim();
    const url = document.getElementById('modal-link-url').value.trim();
    
    if (!url) {
        showToast("Lütfen bir URL girin!", "error");
        return;
    }

    if (activeModalData.editId) {
        // EDIT MODE
        const index = userDataState.links.findIndex(l => String(l.id) === String(activeModalData.editId));
        if (index !== -1) {
            userDataState.links[index].title = title || activeModalData.name;
            userDataState.links[index].url = url;
            showToast("Bağlantı güncellendi!", "success");
        }
    } else {
        // ADD MODE
        if (userDataState.links.length >= 20) return showToast("Maksimum link sayısına ulaşıldı!", "error");
        
        userDataState.links.push({
            id: Date.now(),
            type: activeModalData.id,
            title: title || activeModalData.name,
            icon: activeModalData.icon,
            url: url,
            isBadge: activeModalData.isBadge,
            badgeColor: activeModalData.color
        });
        showToast(`${activeModalData.name} eklendi!`, "success");
    }

    syncActiveLinks();
    updatePreview();
    highlightNewItem();
    closeLinkModal();
};

function highlightNewItem() {
    const list = document.getElementById('dashboard-links-list');
    if (!list) return;
    const last = list.lastElementChild;
    if (last) {
        last.classList.add('flash-item');
        last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

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
const ALL_BADGES = [
    { id: 'early', name: 'Erken Destekçi', icon: 'fa-solid fa-bat' }, // Batman-like or bat
    { id: 'premium', name: 'Premium', icon: 'fa-solid fa-skull-crossbones' }, // Skull with crown placeholder
    { id: 'verified', name: 'Doğrulanmış', icon: 'fa-solid fa-eye' },
    { id: 'admin', name: 'Admin', icon: 'fa-solid fa-bolt' },
    { id: 'influencer', name: 'Etkileyici', icon: 'fa-solid fa-rose' },
    { id: 'creator', name: 'İçerik Üreticisi', icon: 'fa-solid fa-hand-holding-heart' }
];

function renderBadges() {
    const grid = document.getElementById('badges-collection-grid');
    if (!grid) return;

    const userBadges = userDataState.badges || [];
    
    grid.innerHTML = ALL_BADGES.map(b => {
        const isOwned = userBadges.some(ub => ub.id === b.id || ub === b.id);
        return `
            <div class="badge-card">
                <div class="badge-card-icon" style="color: ${isOwned ? 'var(--accent)' : 'var(--text-muted)'}">
                    <i class="${b.icon}"></i>
                </div>
                <div class="badge-card-name">${b.name}</div>
                <div class="badge-status ${isOwned ? 'owned' : 'locked'}">
                    ${isOwned ? '<i class="fa-solid fa-circle-check"></i> Sahip' : '<i class="fa-solid fa-lock"></i> Kilitli'}
                </div>
            </div>
        `;
    }).join('');
}

function syncActiveLinks() {
    const container = document.getElementById('dashboard-links-list');
    const countEl = document.getElementById('social-link-count');
    if (!container) return;
    
    const links = userDataState.links || [];
    if (countEl) countEl.textContent = links.length;

    if (links.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; opacity:0.3; font-size:13px;">Aktif bağlantı yok.</div>`;
        return;
    }

    container.innerHTML = links.map(l => `
        <div class="link-row">
            <div class="link-row-icon"><i class="${l.icon}"></i></div>
            <div class="link-row-info">
                <span class="link-row-title">${l.title}</span>
                <span class="link-row-url">${l.url}</span>
            </div>
            <div class="link-row-stats">0 views</div>
            <div class="link-row-actions">
                <button class="action-btn" onclick="editLink('${l.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="removeLink('${l.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function syncSocials() {
    const payload = {
        social_instagram: document.getElementById('social-instagram').value,
        social_x: document.getElementById('social-x').value,
        social_tiktok: document.getElementById('social-tiktok').value,
        social_youtube: document.getElementById('social-youtube').value
    };
    
    // In a real app, this would be a specialized API or part of profile update
    userDataState = { ...userDataState, ...payload };
    saveProfileChanges(); // Trigger actual save
}

function loadAnalytics() {
    if (document.getElementById('total-views')) document.getElementById('total-views').textContent = userDataState.views || 0;
    // Other stats would come from a specialized analytics API
    if (document.getElementById('total-posts')) document.getElementById('total-posts').textContent = 0;
    if (document.getElementById('total-comments')) document.getElementById('total-comments').textContent = 0;
    if (document.getElementById('active-days')) document.getElementById('active-days').textContent = 4;
}

// --- BADGES ---
function renderBadges() {
    const grid = document.getElementById('dashboard-badges-grid');
    if (!grid) return;

    if (!userDataState.badges || userDataState.badges.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 40px; color:var(--text-muted);">Henüz bir kişisel rozetiniz yok. Bir tane oluşturun!</div>`;
        return;
    }

    grid.innerHTML = userDataState.badges.map(b => {
        let iconHtml = '';
        if (b.icon_url && b.icon_url.startsWith('fa-')) {
            iconHtml = `<i class="${b.icon_url}" style="font-size: 24px;"></i>`;
        } else {
            iconHtml = `<img src="${b.icon_url}" style="width:32px; height:32px; object-fit:contain;">`;
        }

        return `
            <div class="glass-card stat-card compact" style="padding: 16px; border-color: var(--accent-border);">
                <div class="stat-icon">${iconHtml}</div>
                <div class="stat-val" style="font-size:13px;">${b.name || b.label}</div>
                <button onclick="removePersonalBadge('${b.id}')" style="margin-top:10px; background:rgba(255,77,77,0.1); color:var(--danger); border:none; padding:4px 10px; border-radius:6px; font-size:10px; cursor:pointer;">KALDIR</button>
            </div>
        `;
    }).join('');
}

// --- PREVIEW ---
function updatePreview() {
    const d = userDataState || {};
    const root = document.getElementById('profile-preview-root');
    if (!root) return;

    // Standard high-end structure
    const accent = document.getElementById('accent-hex')?.value || "#3b82f6";
    const name = document.getElementById('profile-display-name')?.value || "User";
    const bio = document.getElementById('profile-bio')?.value || "Biological data stream...";
    const nameFont = document.getElementById('name-font')?.value || "Outfit";
    const bioFont = document.getElementById('bio-font')?.value || "Outfit";
    const nameColor = document.getElementById('name-font-color')?.value || "#FFFFFF";
    const bioColor = document.getElementById('bio-font-color')?.value || "#FFFFFF";
    
    const fullAvatar = avatarBase64 || document.getElementById('avatar-url-direct')?.value || d.avatar_url || '/assets/icons/user_dragon.png';
    const fullBanner = bannerBase64 || document.getElementById('banner-url-direct')?.value || (d.banner_url || "");
    const isBannerVideo = fullBanner && (fullBanner.includes('video/') || fullBanner.endsWith('.mp4'));

    root.innerHTML = `
        <div class="p-preview-card" style="--accent: ${accent}">
            <div class="p-banner">
                ${isBannerVideo ? `<video src="${fullBanner}" muted loop autoplay></video>` : `<img src="${fullBanner}" onerror="this.style.display='none'">`}
                <div class="p-banner-gradient"></div>
            </div>
            <div class="p-content">
                <div class="p-avatar-wrap">
                    <img src="${fullAvatar}" class="p-avatar ${document.getElementById('glitch-avatar')?.checked ? 'glitch' : ''}" 
                        style="border-color: ${accent}; box-shadow: 0 0 20px ${accent}40">
                </div>
                
                <h1 style="font-family: '${nameFont}'; color: ${nameColor}">${name}</h1>
                <p class="p-handle">@${session.username}</p>
                
                <div class="p-badges" id="p-badges-list"></div>
                
                <div class="p-bio" style="font-family: '${bioFont}'; color: ${bioColor}">${bio}</div>
                
                <div class="p-social-profiles" id="p-social-list"></div>

                <div class="p-links" id="p-links-list"></div>
            </div>
        </div>
    `;

    // Render Social Profiles
    const pSocials = document.getElementById('p-social-list');
    if (pSocials) {
        const socials = [
            { id: 'instagram', icon: 'fa-brands fa-instagram', val: document.getElementById('social-instagram')?.value || d.social_instagram },
            { id: 'x', icon: 'fa-brands fa-x-twitter', val: document.getElementById('social-x')?.value || d.social_x },
            { id: 'tiktok', icon: 'fa-brands fa-tiktok', val: document.getElementById('social-tiktok')?.value || d.social_tiktok },
            { id: 'youtube', icon: 'fa-brands fa-youtube', val: document.getElementById('social-youtube')?.value || d.social_youtube }
        ].filter(s => s.val);
        
        pSocials.innerHTML = socials.map(s => `
            <div class="p-social-icon"><i class="${s.icon}"></i></div>
        `).join('');
    }

    // Render Badges
    const pBadges = document.getElementById('p-badges-list');
    if (pBadges) {
        pBadges.innerHTML = (d.badges || []).map(b => {
            const icon = b.icon_url || 'fa-solid fa-star';
            return `<div class="p-badge-item" title="${b.name}">
                ${icon.includes('fa-') ? `<i class="${icon}"></i>` : `<img src="${icon}">`}
            </div>`;
        }).join('');
    }

    // Render Links
    const pLinks = document.getElementById('p-links-list');
    if (pLinks) {
        pLinks.innerHTML = (d.links || []).map(l => `
            <div class="p-link-btn" style="background: ${accent}15; border: 1px solid ${accent}30; color: #fff;">
                <i class="${l.icon}"></i>
                <span>${l.title}</span>
            </div>
        `).join('');
    }
}

// --- ACTIONS ---
window.saveProfileChanges = async () => {
    const btn = document.getElementById('save-profile-btn');
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> SAVING...';

    if (!dataLoaded) {
        showToast("Hata: Veriler henüz yüklenmedi! Lütfen sayfayı yenileyip tekrar deneyin.", "error");
        btn.disabled = false;
        btn.innerHTML = originalContent;
        return;
    }

    // Creating payload with absolute zero risk of undefined values
    const safeGet = (id, fallback = "") => {
        const el = document.getElementById(id);
        if (!el) return fallback;
        if (el.type === 'checkbox') return el.checked ? 1 : 0;
        return (el.value || fallback).trim();
    };
    const musicInput = safeGet('music-url-direct');
    const bannerInput = safeGet('banner-url-direct');
    const avatarInput = safeGet('avatar-url-direct');
    const cursorInput = safeGet('cursor-url-direct');

    try {
        // Priority Cleanup: Only kill buffers if the user MANUALLY provided a new URL
        const isURL = (s) => s.startsWith('http') || s.startsWith('data:');
        if (isURL(musicInput)) musicBase64 = null;
        if (isURL(bannerInput)) bannerBase64 = null;
        if (isURL(avatarInput)) avatarBase64 = null;
        if (isURL(cursorInput)) cursorBase64 = null;

        // Priority: 1. Locally uploaded Base64, 2. Manual URL Input, 3. Old State (Joined from parts)
        const oldMusic = (userDataState.profile_music_url || "") + (userDataState.profile_music_url_p2 || "") + (userDataState.profile_music_url_p3 || "") + (userDataState.profile_music_url_p4 || "") + (userDataState.profile_music_url_p5 || "");
        const oldBanner = (userDataState.banner_url || "") + (userDataState.banner_url_p2 || "") + (userDataState.banner_url_p3 || "") + (userDataState.banner_url_p4 || "") + (userDataState.banner_url_p5 || "");
        
        const payload = {
            id: session.id,
            username: session.username,
            display_name: safeGet('profile-display-name'),
            bio: safeGet('profile-bio'),
            
            accent_color: document.getElementById('accent-hex')?.value || "#3b82f6",
            icon_color: document.getElementById('icon-hex')?.value || "#FFFFFF",
            avatar_frame_color: hexToRgba(document.getElementById('avatar-frame-hex')?.value || "#FFFFFF", document.getElementById('avatar-frame-opacity')?.value || 1),
            badge_bg_color: document.getElementById('badge-bg-color')?.value || "rgba(255,255,255,0.05)",
            
            base_font: safeGet('base-font', 'Outfit'),
            base_font_color: safeGet('base-font-color', '#FFFFFF'),
            name_font: safeGet('name-font', 'Outfit'),
            name_font_color: safeGet('name-font-color', '#FFFFFF'),
            bio_font: safeGet('bio-font', 'Outfit'),
            bio_font_color: safeGet('bio-font-color', 'rgba(255,255,255,0.55)'),
            name_effect: safeGet('name-effect', 'none'),
            
            card_style: document.getElementById('card-style')?.value || "glass",
            card_border: document.getElementById('card-border')?.value || "on",
            card_opacity: parseFloat(document.getElementById('card-opacity')?.value || 0.7),
            hover_text: safeGet('hover-text', ''),
            link_hover_anim: safeGet('link-hover-anim', 'float'),
            
            bg_effect: safeGet('bg-effect', 'none'),
            entry_anim: safeGet('entry-anim', 'fadeIn'),
            glitch_avatar: document.getElementById('glitch-avatar')?.checked ? 1 : 0,
            tilt_3d: document.getElementById('tilt-3d')?.checked ? 1 : 0,
            discord_status: document.getElementById('discord-status-toggle')?.checked ? 1 : 0,
            
            social_instagram: document.getElementById('social-instagram')?.value || "",
            social_x: document.getElementById('social-x')?.value || "",
            social_tiktok: document.getElementById('social-tiktok')?.value || "",
            social_youtube: document.getElementById('social-youtube')?.value || "",
            
            links: userDataState.links || [],
            badges: (userDataState.badges || []).map(b => typeof b === 'object' ? (b.id || b.name) : b),
        };

        if (avatarBase64) payload.avatar_url = avatarBase64;
        if (bannerBase64) payload.banner_url = bannerBase64;
        if (musicBase64) payload.profile_music_url = musicBase64;
        if (cursorBase64) payload.custom_cursor_url = cursorBase64;

        const res = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': String(session.id) },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
            showToast("Değişiklikler başarıyla kaydedildi!");
            setTimeout(() => {
                window.location.href = window.location.pathname + '?v=' + Date.now();
            }, 1000);
        } else {
            throw new Error(result.message || "Bağlantı hatası");
        }
    } catch (e) {
        showToast("Hata: " + e.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}
window.saveProfileChanges = saveProfileChanges; // Re-assign to window object

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
            showToast("Şifre başarıyla güncellendi.", "success");
            document.getElementById('set-old-pass').value = document.getElementById('set-new-pass').value = "";
        } else {
            showToast(res.error || "Şifre güncellenemedi.", "error");
        }
    } catch (e) {
        showToast("Server error", "error");
    }
};

window.toggleUpdates = () => {
    const sidebar = document.getElementById('update-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        const btn = document.querySelector('.ta-btn');
        if (btn) btn.style.boxShadow = sidebar.classList.contains('active') ? '0 0 20px rgba(255,255,255,0.2)' : '';
    }
};

window.changeUsername = async () => {
    const newU = document.getElementById('set-new-username').value.trim();
    if (!newU) return showToast("Geçerli bir kullanıcı adı girin", "error");

    const btn = document.querySelector('[onclick="changeUsername()"]');
    btn.disabled = true;

    try {
        const r = await fetch("/api/user/change-username", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": session.id },
            body: JSON.stringify({ newUsername: newU })
        });
        const res = await r.json();
        if (res.success) {
            showToast("Kullanıcı adı başarıyla güncellendi!", "success");
            // Update session and redirect
            session.username = newU;
            localStorage.setItem("j2st_session_v2", JSON.stringify(session));
            setTimeout(() => window.location.href = "/dashboard", 1500);
        } else {
            showToast(res.error, "error");
        }
    } catch (e) {
        showToast("Sunucu hatası", "error");
    } finally {
        btn.disabled = false;
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
    } catch (e) { }
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
