document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('u');
    
    // Path-based username detection
    if (!username) {
        const path = window.location.pathname.substring(1).replace(/\/$/, ""); 
        if (path === "profile" || path === "") {
            const session = JSON.parse(localStorage.getItem("j2st_session_v2") || "null");
            if (session && session.username) username = session.username;
        } else if (path && !path.includes('.') && !path.includes('/')) {
            username = path.startsWith('@') ? path.substring(1) : path;
        }
    }

    if (!username) return window.location.replace('/');

    const loadingEl = document.getElementById('loading');
    const profileEl = document.getElementById('profile-container');
    const errorEl = document.getElementById('error-container');

    try {
        const [userRes, badgeRes] = await Promise.all([
            fetch(`/api/user/profile?u=${username}`),
            fetch(`/api/admin/get_badges`) // Load global badges to map icons
        ]);

        const targetUser = await userRes.json();
        const globalBadges = await badgeRes.json();

        if (targetUser.error) throw new Error("User not found");

        if (loadingEl) loadingEl.style.display = 'none';
        if (profileEl) profileEl.style.display = 'flex';
        document.title = `${targetUser.display_name || targetUser.username} | j2st.icu`;

        // 1. APPLY TYPOGRAPHY & COLORS
        const root = document.documentElement;
        if (targetUser.accent_color) root.style.setProperty('--accent-silver', targetUser.accent_color);
        if (targetUser.icon_color) root.style.setProperty('--accent-silver', targetUser.icon_color); // Simplified for icons

        const nameEl = document.getElementById('name-el');
        const bioEl = document.getElementById('bio-el');
        const cardHeader = document.querySelector('.profile-card');

        if (nameEl) {
            nameEl.textContent = targetUser.display_name || targetUser.username;
            if (targetUser.name_font) nameEl.style.fontFamily = `'${targetUser.name_font}', sans-serif`;
            if (targetUser.name_font_color) nameEl.style.color = targetUser.name_font_color;
        }

        if (bioEl) {
            bioEl.textContent = targetUser.bio || "";
            if (targetUser.bio_font) bioEl.style.fontFamily = `'${targetUser.bio_font}', sans-serif`;
            if (targetUser.bio_font_color) bioEl.style.color = targetUser.bio_font_color;
        }

        // 2. APPLY CARD STYLE
        if (cardHeader && targetUser.card_style) {
            cardHeader.className = `profile-card ${targetUser.card_style}-style`;
        }

        // 3. RENDER BADGES (Dynamic + Global)
        const badgesEl = document.getElementById('badges-el');
        if (badgesEl) {
            let userBadgeIds = [];
            try { userBadgeIds = JSON.parse(targetUser.badges || "[]"); } catch(e) {}
            
            let badgesHtml = '';
            // Founders / Staff
            if (targetUser.role === 'founder') {
                badgesHtml += `<div class="badge-item" data-tooltip="FOUNDER"><i class="fa-solid fa-crown" style="color:#ffda44"></i></div>`;
            } else if (targetUser.role === 'admin') {
                badgesHtml += `<div class="badge-item" data-tooltip="STAFF"><i class="fa-solid fa-shield-halved" style="color:#00e676"></i></div>`;
            }

            userBadgeIds.forEach(bId => {
                const b = globalBadges.find(gb => gb.id == bId || gb.name == bId);
                if (b) {
                    badgesHtml += `<div class="badge-item" data-tooltip="${b.name.toUpperCase()}"><img src="${b.icon_url}" style="width:22px;height:22px; filter:none; object-fit:contain;"></div>`;
                }
            });
            badgesEl.innerHTML = badgesHtml;
        }

        // 4. MEDIA & BACKGROUNDS
        const avatarEl = document.getElementById('avatar-el');
        if (avatarEl) {
            avatarEl.src = targetUser.avatar_url || '/assets/icons/user_dragon.png';
            if (targetUser.avatar_frame_color) avatarEl.style.borderColor = targetUser.avatar_frame_color;
            if (targetUser.glitch_avatar) avatarEl.classList.add('glitch-fx');
        }

        const fullBg = document.getElementById('full-bg');
        if (fullBg && targetUser.banner_url) {
            if (targetUser.banner_url.includes('.mp4') || targetUser.banner_url.includes('.webm')) {
                fullBg.innerHTML = `<video autoplay loop muted playsinline class="bg-video-media"><source src="${targetUser.banner_url}"></video>`;
            } else {
                fullBg.style.backgroundImage = `url(${targetUser.banner_url})`;
                fullBg.style.filter = `blur(10px) brightness(0.5)`;
            }
        }

        // 5. EFFECTS LOOP (Snow, Aura, Particles)
        if (targetUser.bg_effect && targetUser.bg_effect !== 'none') {
            initBackgroundEffect(targetUser.bg_effect);
        }

        // 6. MUSIC PLAYER
        if (targetUser.profile_music_url) {
            initMusicPlayer(targetUser.profile_music_url);
        }

        // 7. LINKS
        renderLinks(targetUser.links || "[]", targetUser.accent_color);

        // Views count
        const vCount = document.getElementById('views-el')?.querySelector('span');
        if (vCount) vCount.textContent = `${targetUser.views || 0} VIEWS`;

        // Interaction Hints
        // 8. CUSTOM CURSOR
        if (targetUser.custom_cursor_url) {
            const style = document.createElement('style');
            style.innerHTML = `* { cursor: url(${targetUser.custom_cursor_url}), auto !important; }`;
            document.head.appendChild(style);
        }

        // 9. 3D TILT EFFECT
        if (targetUser.tilt_3d) {
            init3DTilt(cardHeader);
        }

    } catch (e) {
        console.error(e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'flex';
    }
});

function renderLinks(linksJson, accent) {
    const el = document.getElementById('links-el');
    if (!el) return;
    let links = [];
    try { links = JSON.parse(linksJson); } catch(e) {}

    el.innerHTML = links.map(l => `
        <a href="${l.url}" target="_blank" class="profile-link-btn" style="border-color:${accent}1a">
            <i class="fa-brands ${getLinkIcon(l.url)}"></i>
            <span>${l.name}</span>
        </a>
    `).join('');
}

function getLinkIcon(url) {
    const u = url.toLowerCase();
    if (u.includes('github')) return 'fa-github';
    if (u.includes('discord')) return 'fa-discord';
    if (u.includes('spotify')) return 'fa-spotify';
    if (u.includes('twitter') || u.includes('x.com')) return 'fa-x-twitter';
    if (u.includes('youtube')) return 'fa-youtube';
    return 'fa-link';
}

function initMusicPlayer(url) {
    const audio = new Audio(url);
    audio.loop = true;
    document.body.onclick = () => {
        audio.play().catch(() => {});
        document.body.onclick = null;
    };
}

function initBackgroundEffect(type) {
    const canvas = document.createElement('canvas');
    canvas.id = "fx-canvas";
    document.body.prepend(canvas);
}

function init3DTilt(el) {
    if (!el) return;
    el.style.transition = "transform 0.1s ease-out";
    el.parentElement.style.perspective = "1000px";

    document.addEventListener("mousemove", (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const xRotation = ((clientY / innerHeight) - 0.5) * 20; // 10 degree max
        const yRotation = ((clientX / innerWidth) - 0.5) * -20; // 10 degree max

        el.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
    });

    document.addEventListener("mouseleave", () => {
        el.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
}
