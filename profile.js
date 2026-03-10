// Cloudflare D1 Backend for profile.js

document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('u');
    
    // Check pathname if no query param (e.g. j2st.icu/username)
    if (!username) {
        const path = window.location.pathname.substring(1).replace(/\/$/, ""); 
        const reservedPaths = [
            "index.html", "dashboard.html", "auth.html", "admin.html", "home.html", "profile.html", "login.html", "register.html",
            "index", "dashboard", "auth", "admin", "home", "profile", "login", "register",
            "logout", "signup", "signin", "p", "api", "css", "js", "assets", "functions"
        ];
        
        if (path === "profile" || path === "") {
            const session = JSON.parse(localStorage.getItem("j2st_session_v2") || "null");
            if (session && session.username) username = session.username;
        } else if (path && !reservedPaths.includes(path.toLowerCase()) && !path.includes('.')) {
            username = path.startsWith('@') ? path.substring(1) : path;
        }
    }

    // Clean URL
    if (username && window.location.search.includes('u=')) {
        window.history.replaceState(null, '', '/' + username);
    }

    if (!username) {
        window.location.replace('/');
        return;
    }

    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-container');
    const profileEl = document.getElementById('profile-container');

    try {
        const res = await fetch(`/api/user/profile?u=${username}`);
        const targetUser = await res.json();

        if (loadingEl) loadingEl.style.display = 'none';

        if (targetUser.error) {
            if (errorEl) errorEl.style.display = 'flex';
            return;
        }

        if (profileEl) {
            profileEl.style.display = 'flex';
        }
        document.title = `${targetUser.username} | j2st.icu`;

        // Render Text
        const nameEl = document.getElementById('name-el');
        if (nameEl) nameEl.textContent = targetUser.display_name || targetUser.username;
        
        const handleEl = document.getElementById('handle-el');
        if (handleEl) handleEl.textContent = `@${targetUser.username}`;

        const bioEl = document.getElementById('bio-el');
        if (bioEl) {
            bioEl.textContent = targetUser.bio || "";
            bioEl.style.display = targetUser.bio ? 'block' : 'none';
        }

        // Render Badges (Font Awesome)
        const badgesEl = document.getElementById('badges-el');
        if (badgesEl) {
            let badgesArr = [];
            try { badgesArr = JSON.parse(targetUser.badges || "[]"); } catch(e) {}
            
            const badgeMap = {
                early_access: { icon: "fa-rocket", name: "Early Access", color: "#ffaa00" },
                bug_hunter: { icon: "fa-bug", name: "Bug Hunter", color: "#3b82f6" },
                mod: { icon: "fa-user-shield", name: "Moderator", color: "#8b5cf6" },
                vip: { icon: "fa-crown", name: "VIP", color: "#fbbf24" },
                scammer: { icon: "fa-ban", name: "Blacklisted", color: "#ef4444" },
                verified: { icon: "fa-circle-check", name: "Verified", color: "#3b82f6" }
            };

            let badgesHtml = '';
            // Role Badges
            if (targetUser.role === 'founder') {
                badgesHtml += `<div class="badge-item" data-tooltip="Founder"><i class="fa-solid fa-crown" style="color: #ffda44;"></i></div>`;
            } else if (targetUser.role === 'admin') {
                badgesHtml += `<div class="badge-item" data-tooltip="Staff"><i class="fa-solid fa-shield-halved" style="color: #10b981;"></i></div>`;
            }
            
            // Custom badges
            badgesArr.forEach(bId => {
                const bInfo = badgeMap[bId];
                if (bInfo) {
                    badgesHtml += `
                        <div class="badge-item" data-tooltip="${bInfo.name}">
                            <i class="fa-solid ${bInfo.icon}" style="color: ${bInfo.color};"></i>
                        </div>`;
                }
            });
            badgesEl.innerHTML = badgesHtml;
        }

        // Render Media
        const avatarEl = document.getElementById('avatar-el');
        if (avatarEl) avatarEl.src = targetUser.avatar_url || '/assets/icons/user_dragon.png';

        // Background
        const fullBg = document.getElementById('full-bg');
        if (fullBg) {
            if (targetUser.banner_url) {
                fullBg.style.backgroundImage = `url(${targetUser.banner_url})`;
                fullBg.style.filter = `blur(8px) brightness(${targetUser.banner_opacity || 0.6})`;
            } else {
                fullBg.style.background = 'linear-gradient(135deg, #050505, #101010)';
            }
        }

        // Render Links
        const linksEl = document.getElementById('links-el');
        if (linksEl) {
            let links = [];
            try { links = JSON.parse(targetUser.links || "[]"); } catch(e) {}
            
            const getIcon = (url) => {
                const u = url.toLowerCase();
                if (u.includes('github')) return 'fa-github';
                if (u.includes('discord')) return 'fa-discord';
                if (u.includes('spotify')) return 'fa-spotify';
                if (u.includes('tiktok')) return 'fa-tiktok';
                if (u.includes('instagram')) return 'fa-instagram';
                if (u.includes('twitter') || u.includes('x.com')) return 'fa-x-twitter';
                if (u.includes('youtube')) return 'fa-youtube';
                if (u.includes('twitch')) return 'fa-twitch';
                return 'fa-link';
            };

            if (links.length > 0) {
                linksEl.innerHTML = links.map(l => `
                    <a href="${l.url}" target="_blank" class="profile-link-btn">
                        <i class="fa-brands ${getIcon(l.url)}"></i>
                        <span>${l.name}</span>
                    </a>
                `).join('');
                // Fix icon class if it's fa-link
                linksEl.querySelectorAll('.fa-link').forEach(icon => {
                    icon.classList.remove('fa-brands');
                    icon.classList.add('fa-solid');
                });
            } else {
                linksEl.innerHTML = '';
            }
        }

        // Views
        const viewsEl = document.getElementById('views-el');
        if (viewsEl) {
            const count = targetUser.views || Math.floor(Math.random() * 100); // Fallback if views not in DB yet
            viewsEl.querySelector('span').textContent = `${count} views`;
        }

    } catch (e) {
        console.error(e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'flex';
    }
});
