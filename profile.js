/**
 * J2ST.ICU — VOID PROFILE RENDERER (v5.0)
 * Ultra-Premium 3D Aura & Dynamic Bio Stream
 */

async function initProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('u');
    if (!username) {
        username = window.location.pathname.split('/').filter(Boolean).pop() || 'j2st';
    }
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

        // Show profile first, then render
        if (container) container.style.display = '';

        // Remove enter overlay immediately and show profile
        const overlay = document.getElementById('click-enter');
        if (overlay) {
            overlay.style.display = 'none';
        }
        document.body.classList.add('profile-entered');

        renderProfile(data, true);
        if (loadingEl) {
            loadingEl.style.opacity = "0";
            loadingEl.style.transition = "opacity 0.5s ease";
            setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
        }

    } catch (e) {
        console.error("Profile Failed:", e);
    }
}

function renderProfile(user) {
    // 1. Identity
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

    // 2. Theme & Styling
    const container = document.getElementById('profile-container');
    const accent = user.accent_color || '#FFFFFF';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-glow', accent + '33');
    document.documentElement.style.setProperty('--card-bg-opacity', user.card_opacity !== undefined ? user.card_opacity : 0.7);
    
    if (container && user.card_style) {
        let classes = ['profile-card', user.card_style + '-style'];
        if (user.card_border === 'off') classes.push('border-off');
        container.className = classes.join(' ');
    }

    if (avatar) {
        const frameColor = user.avatar_frame_color || 'rgba(255,255,255,0.1)';
        avatar.style.borderColor = frameColor;
        avatar.style.boxShadow = `0 0 20px ${frameColor}`;
        if (user.glitch_avatar) avatar.classList.add('glitch-fx');
    }

    // 3. Badges (Achievements / Personal Badges)
    const badgesEl = document.getElementById('badges-el');
    if (badgesEl) {
        let userBadges = [];
        if (user.badges) {
            if (typeof user.badges === 'string') {
                try { userBadges = JSON.parse(user.badges); } catch(e) { userBadges = []; }
            } else if (Array.isArray(user.badges)) {
                userBadges = user.badges;
            }
        }

        if (userBadges.length > 0) {
            badgesEl.innerHTML = userBadges.map(b => {
                let iconContent = '';
                if (b.icon_url && b.icon_url.startsWith('fa-')) {
                    iconContent = `<i class="${b.icon_url}" style="font-size: 20px; color: #fff;"></i>`;
                } else if (b.icon_url) {
                    iconContent = `<img src="${b.icon_url}" class="badge-icon">`;
                } else {
                    iconContent = `<i class="fa-solid fa-award" style="font-size: 20px; color: #fff;"></i>`;
                }

                return `
                    <div class="badge-item" data-label="${b.name || 'Badge'}">
                        ${iconContent}
                    </div>
                `;
            }).join('');
        } else {
            badgesEl.innerHTML = '';
        }
    }

    // 4. Social & Custom Links
    const linksEl = document.getElementById('links-el');
    if (linksEl) {
        let userLinks = [];
        if (user.links) {
            if (typeof user.links === 'string') {
                try { userLinks = JSON.parse(user.links); } catch(e) { userLinks = []; }
            } else if (Array.isArray(user.links)) {
                userLinks = user.links;
            }
        }

        if (userLinks.length > 0) {
            linksEl.innerHTML = userLinks.map(l => {
                const color = l.badgeColor || accent;
                const isBadge = l.isBadge;

                if (isBadge) {
                    // Small badge-style link
                    return `
                        <a href="${l.url}" target="_blank" class="badge-item" data-label="${l.title}" style="background: ${color}15; border: 1px solid ${color}33;">
                            <i class="${l.icon || 'fa-solid fa-link'}" style="font-size: 18px; color: ${color};"></i>
                        </a>
                    `;
                } else {
                    // Main button-style link
                    return `
                        <a href="${l.url}" target="_blank" class="profile-link-btn" style="--item-color: ${color}">
                            <div class="link-btn-glow"></div>
                            <div class="link-btn-content">
                                <i class="${l.icon || 'fa-solid fa-link'}"></i>
                                <span>${l.title}</span>
                            </div>
                            <i class="fa-solid fa-chevron-right arrow-icon"></i>
                        </a>
                    `;
                }
            }).join('');
            
            if (window.twemoji) twemoji.parse(linksEl);
        } else {
            linksEl.innerHTML = '';
        }
    }

    // 5. Cleanup redundant social section
    const socialLinksEl = document.getElementById('social-links-el');
    if (socialLinksEl) socialLinksEl.innerHTML = '';


    // 5. 3D Tilt
    const card = document.getElementById('profile-container');
    if (card) setup3DTilt(card);

    // 6. Effects
    const bannerVideo = document.getElementById('banner-video');
    const fullBg = document.getElementById('full-bg');
    const fullBannerUrl = user.banner_url;

    if (fullBannerUrl) {
        const isVideo = fullBannerUrl.includes('video/') || fullBannerUrl.endsWith('.mp4') || fullBannerUrl.endsWith('.webm') || fullBannerUrl.startsWith('data:video/');

        if (isVideo && bannerVideo) {
            bannerVideo.src = fullBannerUrl;
            bannerVideo.style.display = 'block';
            bannerVideo.play();
            if (fullBg) fullBg.style.display = 'none';
        } else if (fullBg) {
            fullBg.style.background = `url('${fullBannerUrl}') center/cover no-repeat`;
            fullBg.style.display = 'block';
            if (bannerVideo) bannerVideo.style.display = 'none';
        }
    }

    // 7. Music
    const musicContainer = document.getElementById('music-embed-container');
    if (musicContainer) {
        if (user.music_embed && user.music_embed.includes('spotify')) {
            musicContainer.style.display = 'block';
            musicContainer.style.height = '80px';
            musicContainer.style.marginBottom = '20px';
            musicContainer.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed${user.music_embed.replace('https://open.spotify.com', '')}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        } else {
            musicContainer.style.display = 'none';
        }
    }

    // 8. Tab Logic
    const tabs = document.querySelectorAll('.p-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.onclick = () => {
            const target = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === 'section-' + target) p.classList.add('active');
            });
        };
    });

    // 9. View Count
    const viewsEl = document.getElementById('views-el');
    if (viewsEl) {
        const viewSpan = viewsEl.querySelector('span');
        if (viewSpan) viewSpan.textContent = (user.views || 0) + ' views';
    }
}

function setup3DTilt(card) {
    if (!card) return;

    document.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    document.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
}

function enterProfile() {
    const overlay = document.getElementById('click-enter');
    if (overlay) {
        overlay.classList.add('clicked');
        setTimeout(() => {
            overlay.classList.add('fade-out');
            document.body.classList.add('profile-entered');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }, 300);
    }
}

// Expose to global
window.enterProfile = enterProfile;

// Auto-init
initProfile();
