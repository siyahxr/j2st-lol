/**
 * J2ST.LOL — PROFILE RENDERER (v5.0)
 */

console.log("J2ST Profile v5.0 Loaded.");

let isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

// 1. Initialization
async function initProfile() {
    if (isPreview) {
        // Handle postMessage for live updates
        window.addEventListener('message', (event) => {
            if (event.data.type === 'UPDATE_PREVIEW') {
                renderProfileSpec(event.data.data);
                // Reveal card immediately in preview
                const card = document.getElementById('profile-card');
                if (card) {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                    card.style.pointerEvents = 'auto';
                }
                const overlay = document.getElementById('click-enter');
                if (overlay) overlay.style.display = 'none';
            }
        });
        return;
    }

    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const username = segments[segments.length - 1];

    if (!username || ['login', 'register', 'dashboard', 'admin'].includes(username)) return;

    try {
        const res = await fetch(`/api/user/profile?u=${username}&t=${Date.now()}`);
        const data = await res.json();

        if (data && !data.error) {
            renderProfileSpec(data);
            setupEntrance();
        } else {
            document.body.innerHTML = `<div style="height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px;">
                <h1 style="font-size:80px; font-weight:900; opacity:0.1;">404</h1>
                <p style="color:rgba(255,255,255,0.4);">Bu ruh henüz uyanmamış.</p>
                <a href="/" style="color:#fff; text-decoration:none; font-weight:700; border:1px solid rgba(255,255,255,0.1); padding:10px 20px; border-radius:10px;">Geri Dön</a>
            </div>`;
        }
    } catch (e) {
        console.error("Profile Load Error:", e);
    }
}

// 2. Rendering Spec
function renderProfileSpec(user) {
    // Identity
    const avatar = document.getElementById('avatar-el');
    const name = document.getElementById('name-el');
    const bio = document.getElementById('bio-el');
    const views = document.getElementById('views-el');

    if (avatar) avatar.src = user.avatar_url || '/assets/icons/user_dragon.png';
    if (name) name.textContent = user.display_name || user.username || 'User';
    if (bio) bio.textContent = user.bio || '';
    if (views) views.textContent = user.views || 0;

    // Background
    const fullBg = document.getElementById('full-bg');
    if (fullBg && user.banner_url) {
        fullBg.style.backgroundImage = `url('${user.banner_url}')`;
    }

    // Links
    const linksEl = document.getElementById('links-el');
    if (linksEl) {
        let lList = user.links;
        if (typeof lList === 'string') {
            try { lList = JSON.parse(lList); } catch(e) { lList = []; }
        }
        
        if (Array.isArray(lList)) {
            linksEl.innerHTML = lList.map(l => `
                <a href="${l.url}" target="_blank" class="link-btn">
                    <span style="display:flex; align-items:center; gap:15px;">
                        <i class="${l.icon || 'fa-solid fa-link'} link-icon"></i>
                        ${l.title}
                    </span>
                    <i class="fa-solid fa-chevron-right" style="font-size:12px; opacity:0.3;"></i>
                </a>
            `).join('');
        }
    }

    // Badges
    const badgesEl = document.getElementById('badges-el');
    if (badgesEl) {
        let bList = user.badges;
        if (typeof bList === 'string') {
            try { bList = JSON.parse(bList); } catch(e) { bList = []; }
        }
        if (Array.isArray(bList) && bList.length > 0) {
            badgesEl.innerHTML = bList.map(b => `
                <div class="badge-item" title="${b.label || b.name}">
                    <i class="${b.icon_url || 'fa-solid fa-star'}" style="color:var(--accent);"></i>
                </div>
            `).join('');
        } else {
            badgesEl.innerHTML = '';
        }
    }

    // Theme Update
    if (user.accent_color) {
        document.documentElement.style.setProperty('--accent', user.accent_color);
        document.documentElement.style.setProperty('--accent-glow', user.accent_color + '4D');
    }

    // Interactive Effects
    setupInteractiveEffects();
}

// 3. Systems
function setupEntrance() {
    const overlay = document.getElementById('click-enter');
    const card = document.getElementById('profile-card');
    const audio = document.getElementById('profile-music-player');

    if (overlay) {
        overlay.onclick = () => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => overlay.style.display = 'none', 1000);
            
            if (card) {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                card.style.pointerEvents = 'auto';
            }

            if (audio && audio.src) {
                audio.play().catch(e => console.log("Music blocked"));
            }
        };
    }
}

function setupInteractiveEffects() {
    const card = document.getElementById('profile-card');
    const aura = document.getElementById('aura');

    if (!card) return;

    document.addEventListener('mousemove', (e) => {
        // 3D Tilt
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        card.style.transform = `perspective(1000px) rotateX(${y * -15}deg) rotateY(${x * 15}deg) scale(1.02)`;

        // Liquid Aura
        if (aura) {
            aura.style.left = `${e.clientX - 300}px`;
            aura.style.top = `${e.clientY - 300}px`;
        }
    });

    document.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

// Initialize
initProfile();
