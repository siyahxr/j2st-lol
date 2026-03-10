/**
 * J2ST.ICU — VOID PROFILE RENDERER (v4.0)
 * Ultra-Premium 3D Aura & Dynamic Bio Stream
 */

async function initProfile() {
    const username = window.location.pathname.split('/').pop() || 'j2st';
    const container = document.getElementById('profile-container');
    const loadingEl = document.getElementById('loading');
    
    try {
        const res = await fetch(`/api/user/profile?u=${username}`);
        const data = await res.json();

        if (data.error) {
            document.getElementById('error-container').style.display = 'flex';
            loadingEl.style.display = 'none';
            return;
        }

        renderProfile(data);
        if (loadingEl) loadingEl.style.fadeOut = "all 0.5s";
        setTimeout(() => { if (loadingEl) loadingEl.style.display = 'none'; }, 500);

    } catch (e) {
        console.error("Profile Failed:", e);
    }
}

function renderProfile(user) {
    // 1. Identity
    const avatar = document.getElementById('avatar-el');
    const name = document.getElementById('name-el');
    const bio = document.getElementById('bio-el');
    const handle = document.getElementById('handle-el');
    const banner = document.getElementById('full-bg');

    if (avatar) avatar.src = user.avatar_url || '/assets/icons/user_dragon.png';
    if (name) {
        name.textContent = user.display_name || user.username;
        name.style.fontFamily = user.name_font || 'Outfit';
        name.style.color = user.name_font_color || '#FFFFFF';
    }
    if (handle) handle.textContent = `@${user.username}`;
    if (bio) {
        bio.textContent = user.bio || "";
        bio.style.fontFamily = user.bio_font || 'Outfit';
        bio.style.color = user.bio_font_color || '#FFFFFF';
    }

    // 2. Background / Visuals
    if (banner && user.banner_url) {
        if (user.banner_url.endsWith('.mp4') || user.banner_url.endsWith('.webm')) {
            banner.innerHTML = `<video autoplay muted loop playsinline class="bg-video"><source src="${user.banner_url}" type="video/mp4"></video>`;
        } else {
            banner.style.backgroundImage = `url(${user.banner_url})`;
        }
    }

    // 3. Colors & Theme
    const container = document.getElementById('profile-container');
    document.documentElement.style.setProperty('--accent', user.accent_color || '#FFFFFF');
    document.documentElement.style.setProperty('--accent-primary', user.accent_color || '#FFFFFF');
    if (container && user.card_style) {
        container.className = 'profile-card ' + user.card_style + '-style';
    }
    
    // 4. Links & Badges
    const linksEl = document.getElementById('links-el');
    if (linksEl && user.links) {
        linksEl.innerHTML = user.links.map(l => `
            <a href="${l.url}" target="_blank" class="link-btn">
                <span>${l.title}</span>
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        `).join('');
    }

    // 5. 3D Tilt (Always On)
    const card = document.getElementById('profile-container');
    if (card) setup3DTilt(card);

    // 6. Effects
    if (user.bg_effect === 'particles') initParticles();
    if (user.glitch_avatar) avatar.classList.add('glitch-fx');
    
    // 7. Avatar Frame
    if (user.avatar_frame_color) {
        avatar.style.borderColor = user.avatar_frame_color;
        avatar.style.borderWidth = '3px';
        avatar.style.borderStyle = 'solid';
        avatar.style.boxShadow = `0 0 20px ${user.avatar_frame_color}44`;
    }

    // 8. Stats (Views)
    const viewsEl = document.querySelector('#views-el span');
    if (viewsEl) viewsEl.textContent = `${user.views || 0} views`;
}

function setup3DTilt(el) {
    const parent = el.parentElement;
    parent.style.perspective = "1200px";
    el.style.transformStyle = "preserve-3d";
    el.style.transition = "transform 0.1s ease-out";

    document.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        el.style.transform = `rotateX(${y * -20}deg) rotateY(${x * 20}deg) translateZ(10px)`;

        // Aura tracking
        const aura = document.querySelector('.dynamic-aura');
        if (aura) {
            aura.style.left = `${e.clientX - 200}px`;
            aura.style.top = `${e.clientY - 200}px`;
        }
    });
}

function initParticles() {
    // Simple particle injection
    const c = document.createElement('canvas');
    c.id = 'particle-canvas';
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.zIndex = '-1';
    document.body.appendChild(c);
    // ... particle logic would go here if needed ...
}

initProfile();
