/**
 * J2ST.ICU — VOID PROFILE RENDERER (v5.3)
 */
console.log("J2ST Profile Script v5.3 Loaded.");

// 1. Global Entry Function (Defensive)
window.enterProfile = function() {
    const overlay = document.getElementById('click-enter');
    const layoutMain = document.querySelector('.profile-layout-main');
    const musicPlayer = document.getElementById('profile-music-player');
    
    if (overlay) {
        overlay.classList.add('clicked');
        
        // Music Start (Try-catch for browser blocks)
        if (musicPlayer && musicPlayer.src) {
            musicPlayer.play().catch(e => console.log("Autoplay blocked", e));
        }

        setTimeout(() => {
            overlay.classList.add('fade-out');
            document.body.classList.add('profile-entered');
            
            // Show main layout with fade
            if (layoutMain) {
                layoutMain.style.display = 'flex';
                setTimeout(() => layoutMain.style.opacity = '1', 50);
            }

            setTimeout(() => {
                overlay.style.display = 'none';
            }, 800);
        }, 300);
    }
};

// 2. Profile Initialization
async function initProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('u');
    if (!username) {
        username = window.location.pathname.split('/').filter(Boolean).pop();
    }
    // Final fallback
    if (!username || username === 'profile.html' || username === '$') username = 'j2st';

    console.log("Initializing profile for:", username);

    const overlay = document.getElementById('click-enter');
    const overlayText = document.getElementById('overlay-text');
    const overlayContent = document.getElementById('overlay-content');

    let initialized = false;

    // Ready State Transition
    function setReady() {
        if (initialized) return;
        initialized = true;
        console.log("Profile state: READY");
        if (overlayText) overlayText.textContent = "CLICK TO ENTER";
        if (overlayContent) {
            overlayContent.classList.remove('loading');
            overlayContent.classList.add('ready');
        }
        if (overlay) {
            overlay.onclick = window.enterProfile;
            overlay.style.cursor = 'pointer';
        }
    }

    // FAILSAFE: If anything takes more than 4 seconds, force the button to show
    setTimeout(setReady, 4000);

    // 3. Cache Recovery
    const cacheKey = `profile_cache_${username}`;
    let cachedData = null;
    try {
        cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            safeRender(parsed);
            setReady();
        }
    } catch (e) { console.warn("Cache access error", e); }

    // 4. Fresh Fetch
    try {
        const res = await fetch(`/api/user/profile?u=${username}`);
        const data = await res.json();

        if (data && !data.error) {
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e){}
            safeRender(data);
            setReady();
        } else if (!cachedData) {
            // Show 404
            const err = document.getElementById('error-container');
            if (err) err.style.display = 'flex';
            if (overlay) overlay.style.display = 'none';
        }
    } catch (e) {
        console.error("Fetch failed:", e);
        if (cachedData) setReady();
        else {
            const err = document.getElementById('error-container');
            if (err) err.style.display = 'flex';
            if (overlay) overlay.style.display = 'none';
        }
    }
}

function safeRender(data) {
    try {
        renderProfile(data);
    } catch (e) {
        console.error("Render failure", e);
    }
}

// 5. Core Rendering Logic
function renderProfile(user) {
    // Identity
    const avatar = document.getElementById('avatar-el');
    const name = document.getElementById('name-el');
    const handle = document.getElementById('handle-el');
    const bio = document.getElementById('bio-el');

    if (avatar && user.avatar_url) avatar.src = user.avatar_url;
    if (name) {
        name.textContent = user.display_name || user.username || 'User';
        if (user.name_font) name.style.fontFamily = user.name_font;
        if (user.name_font_color) name.style.color = user.name_font_color;
    }
    if (handle) handle.textContent = '@' + (user.username || 'user');
    if (bio) {
        bio.textContent = user.bio || '';
        if (user.bio_font) bio.style.fontFamily = user.bio_font;
        if (user.bio_font_color) bio.style.color = user.bio_font_color;
    }

    // Theme Variables
    const accent = user.accent_color || '#FFFFFF';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-glow', accent + '33');
    
    // Card Style
    const container = document.getElementById('profile-container');
    if (container && user.card_style) {
        let classes = ['profile-card', user.card_style + '-style'];
        if (user.card_border === 'off') classes.push('border-off');
        container.className = classes.join(' ');
    }

    // Badges Injection
    const badgesEl = document.getElementById('badges-el');
    if (badgesEl && user.badges) {
        let bList = [];
        try { bList = (typeof user.badges === 'string') ? JSON.parse(user.badges) : user.badges; } catch(e){}
        
        if (Array.isArray(bList)) {
            badgesEl.innerHTML = bList.map(b => `
                <div class="badge-item" data-label="${b.name}">
                    ${b.icon_url && b.icon_url.startsWith('fa-') ? `<i class="${b.icon_url}"></i>` : `<img src="${b.icon_url}" class="badge-icon">`}
                </div>
            `).join('');
        }
    }

    // Links Injection
    const linksEl = document.getElementById('links-el');
    if (linksEl && user.links) {
        let lList = [];
        try { lList = (typeof user.links === 'string') ? JSON.parse(user.links) : user.links; } catch(e){}
        
        if (Array.isArray(lList)) {
            linksEl.innerHTML = lList.map(l => {
                const c = l.badgeColor || accent;
                if (l.isBadge) {
                    return `
                        <a href="${l.url}" target="_blank" class="badge-item" data-label="${l.title}" style="background:${c}15;border:1px solid ${c}33;">
                            <i class="${l.icon || 'fa-solid fa-link'}" style="color:${c}"></i>
                        </a>`;
                } else {
                    return `
                        <a href="${l.url}" target="_blank" class="profile-link-btn" style="--item-color:${c}">
                            <div class="link-btn-content">
                                <i class="${l.icon || 'fa-solid fa-link'}"></i>
                                <span>${l.title}</span>
                            </div>
                            <i class="fa-solid fa-chevron-right arrow-icon"></i>
                        </a>`;
                }
            }).join('');
            if (window.twemoji) twemoji.parse(linksEl);
        }
    }

    // Banner Logic
    const bannerVideo = document.getElementById('banner-video');
    const fullBg = document.getElementById('full-bg');
    if (user.banner_url) {
        const isVid = user.banner_url.includes('.mp4') || user.banner_url.includes('.webm');
        if (isVid && bannerVideo) {
            bannerVideo.src = user.banner_url;
            bannerVideo.style.display = 'block';
            bannerVideo.play().catch(e => console.warn("Video blocked"));
        } else if (fullBg) {
            fullBg.style.background = `url('${user.banner_url}') center/cover no-repeat`;
            fullBg.style.display = 'block';
        }
    }

    // Music Logic
    const musicPlayer = document.getElementById('profile-music-player');
    if (musicPlayer && user.music_url) {
        musicPlayer.src = user.music_url;
        musicPlayer.loop = true;
        musicPlayer.volume = 0.5;
    }

    // Tabs Event Bindings
    const tabs = document.querySelectorAll('.p-tab');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(t => {
        t.onclick = () => {
            const target = t.getAttribute('data-tab');
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === 'section-' + target) p.classList.add('active');
            });
        };
    });

    // 3D Tilt Setup
    if (container) setup3DTilt(container);
}

// 6. Tilt Effect Function
function setup3DTilt(card) {
    if (!card) return;
    document.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${y * -15}deg) rotateY(${x * 15}deg) scale(1.02)`;
    });
    document.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

// 7. Execution Start
initProfile();
