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
    if (name) name.textContent = user.display_name || user.username || 'User';
    if (handle) handle.textContent = '@' + (user.username || 'user');
    if (bio) bio.textContent = user.bio || '';

    // 2. Theme
    const container = document.getElementById('profile-container');
    document.documentElement.style.setProperty('--accent', user.accent_color || '#FFFFFF');
    document.documentElement.style.setProperty('--accent-primary', user.accent_color || '#FFFFFF');
    document.documentElement.style.setProperty('--card-bg-opacity', user.card_opacity !== undefined ? user.card_opacity : 0.7);
    if (container && user.card_style) {
        let classes = ['profile-card', user.card_style + '-style'];
        if (user.card_border === 'off') classes.push('border-off');
        container.className = classes.join(' ');
    }

    // 3. Social Media Badges (Main Badge Section)
    const socialLinksEl = document.getElementById('social-links-el');

    // Default social media platforms
    const socialPlatforms = [
        { id: 'discord', label: 'Discord', icon_url: 'fa-brands fa-discord', color: '#5865F2' },
        { id: 'twitter', label: 'Twitter/X', icon_url: 'fa-brands fa-x-twitter', color: '#000000' },
        { id: 'instagram', label: 'Instagram', icon_url: 'fa-brands fa-instagram', color: '#E4405F' },
        { id: 'youtube', label: 'YouTube', icon_url: 'fa-brands fa-youtube', color: '#FF0000' },
        { id: 'spotify', label: 'Spotify', icon_url: 'fa-brands fa-spotify', color: '#1DB954' },
        { id: 'twitch', label: 'Twitch', icon_url: 'fa-brands fa-twitch', color: '#9146FF' },
        { id: 'tiktok', label: 'TikTok', icon_url: 'fa-brands fa-tiktok', color: '#000000' },
        { id: 'snapchat', label: 'Snapchat', icon_url: 'fa-brands fa-snapchat', color: '#FFFC00' },
        { id: 'github', label: 'GitHub', icon_url: 'fa-brands fa-github', color: '#333333' },
        { id: 'steam', label: 'Steam', icon_url: 'fa-brands fa-steam', color: '#171a21' },
        { id: 'soundcloud', label: 'SoundCloud', icon_url: 'fa-brands fa-soundcloud', color: '#FF5500' },
        { id: 'linkedin', label: 'LinkedIn', icon_url: 'fa-brands fa-linkedin', color: '#0A66C2' }
    ];

    // Get user's social links from database
    let userSocialLinks = [];
    if (user.social_links && Array.isArray(user.social_links)) {
        userSocialLinks = user.social_links;
    } else if (typeof user.social_links === 'string') {
        try { userSocialLinks = JSON.parse(user.social_links); } catch (e) { userSocialLinks = []; }
    }

    if (socialLinksEl) {
        // Merge default platforms with user's social links
        const allSocialBadges = socialPlatforms.map(platform => {
            const userLink = userSocialLinks.find(s => s.id === platform.id);
            return {
                ...platform,
                url: userLink && userLink.url ? userLink.url : '',
                name: userLink && userLink.name ? userLink.name : platform.label
            };
        });

        // Only show badges that have URLs
        const filledBadges = allSocialBadges.filter(b => b.url && b.url.trim() !== '');

        if (filledBadges.length > 0) {
            socialLinksEl.innerHTML = filledBadges.map(b => {
                return `<a href="${b.url}" target="_blank" class="social-link-item" style="background: ${b.color};">
                    <i class="${b.icon_url}"></i>
                </a>`;
            }).join('');
        } else {
            socialLinksEl.innerHTML = '';
        }
    }

    // 4. Custom Links (Legacy)
    const linksEl = document.getElementById('links-el');
    if (linksEl && user.links) {
        let lList = user.links;
        if (typeof lList === 'string') try { lList = JSON.parse(lList); } catch (e) { lList = []; }

        if (Array.isArray(lList)) {
            linksEl.style.display = 'flex';
            linksEl.style.flexDirection = 'row';
            linksEl.style.justifyContent = 'center';
            linksEl.style.gap = '10px';
            linksEl.style.flexWrap = 'wrap';

            linksEl.innerHTML = lList.map(l => {
                if (l.isBadge) {
                    return `<a href="${l.url}" target="_blank" class="badge-item" data-label="${l.title}" style="width:38px;height:38px;">
                        <i class="${l.icon}" style="font-size:18px; color:${l.badgeColor || '#fff'};"></i>
                    </a>`;
                }
                return `<a href="${l.url}" target="_blank" class="badge-item" data-label="${l.title}">
                    <i class="${l.icon}" style="font-size:20px;"></i>
                </a>`;
            }).join('');
            if (window.twemoji) twemoji.parse(linksEl);
        }
    }

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
    if (user.music_embed && user.music_embed.includes('spotify')) {
        const musicContainer = document.getElementById('music-embed-container');
        if (musicContainer) {
            musicContainer.style.display = 'block';
            musicContainer.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed${user.music_embed.replace('https://open.spotify.com', '')}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
        }
    } else if (user.music_widget) {
        const musicWidget = document.getElementById('music-widget');
        const musicName = document.getElementById('music-name');
        if (musicWidget) {
            musicWidget.style.display = 'flex';
            if (musicName) musicName.textContent = user.music_widget;
        }
    }

    // 8. View Count
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
