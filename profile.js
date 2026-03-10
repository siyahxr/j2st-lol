// Cloudflare D1 Backend for profile.js

document.addEventListener('DOMContentLoaded', async () => {

    // ── TAB SWITCHING ───────────────────────────────────────────────
    document.querySelectorAll('.p-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.p-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.p-tab-panel').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const panel = document.getElementById('ptab-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
    // ────────────────────────────────────────────────────────────────

    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('u');
    
    // Check pathname if no query param (e.g. j2st.icu/username)
    if (!username) {
        const path = window.location.pathname.substring(1).replace(/\/$/, ""); // Remove leading slash and trailing slash
        const reservedPaths = [
            "index.html", "dashboard.html", "auth.html", "admin.html", "home.html", "profile.html", "login.html", "register.html",
            "index", "dashboard", "auth", "admin", "home", "profile", "login", "register",
            "logout", "signup", "signin", "p", "api", "css", "js", "assets", "functions",
            "robots.txt", "sitemap.xml", "favicon.ico"
        ];
        
        if (path === "profile" || path === "") {
            const session = JSON.parse(localStorage.getItem("j2st_session_v2") || "null");
            if (session && session.username) {
                username = session.username;
            }
        } else if (path && !reservedPaths.includes(path.toLowerCase()) && !path.includes('.')) {
            username = path.startsWith('@') ? path.substring(1) : path;
        }
    }

    // Clean URL - remove query params and show /username
    if (username && window.location.search.includes('u=')) {
        const newUrl = window.location.origin + '/' + username;
        window.history.replaceState(null, '', newUrl);
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
            const cardOp = targetUser.card_opacity || 0.8;
            profileEl.style.backgroundColor = `rgba(10, 10, 15, ${cardOp})`;
        }
        document.title = `${targetUser.username} | j2st.icu`;

        // Render Text
        const nameEl = document.getElementById('name-el');
        if (nameEl) nameEl.textContent = targetUser.display_name || targetUser.username;
        
        const bioEl = document.getElementById('bio-el');
        if (bioEl) {
            bioEl.textContent = targetUser.bio || "";
            bioEl.style.display = targetUser.bio ? 'block' : 'none';
        }

        const roleEl = document.getElementById('role-el');
        if (roleEl) {
            const role = (targetUser.role || 'Member').toUpperCase();
            roleEl.textContent = targetUser.role === 'founder' ? '👑 SYSTEM FOUNDER' : `✦ ${role}`;
        }

        // Render Badges from Database
        const badgesEl = document.getElementById('badges-el');
        if (badgesEl) {
            let badgesArr = [];
            try { badgesArr = JSON.parse(targetUser.badges || "[]"); } catch(e) {}
            
            const badgeMap = {
                early_access: { icon: "⚡", name: "Early Access" },
                bug_hunter: { icon: "🐛", name: "Bug Hunter" },
                mod: { icon: "🔮", name: "Moderator" },
                vip: { icon: "👑", name: "VIP" },
                scammer: { icon: "🚫", name: "Blacklisted" }
            };

            let badgesHtml = '';
            // Basic roles
            if (targetUser.role === 'founder') {
                badgesHtml += '<span class="badge-pill" data-name="FOUNDER"><span class="b-icon">👑</span><span class="b-name">FOUNDER</span></span>';
            }
            if (targetUser.role === 'admin') {
                badgesHtml += '<span class="badge-pill" data-name="STAFF"><span class="b-icon">🛡️</span><span class="b-name">STAFF</span></span>';
            }
            
            // Custom badges
            badgesArr.forEach(bId => {
                const bInfo = badgeMap[bId];
                if (bInfo) {
                    const displayName = bId === 'early_access' ? 'EARLY' : bInfo.name.toUpperCase();
                    badgesHtml += `
                        <span class="badge-pill ${bId}" data-name="${bInfo.name}">
                            <span class="b-icon">${bInfo.icon}</span>
                            <span class="b-name">${displayName}</span>
                        </span>`;
                }
            });
            badgesEl.innerHTML = badgesHtml;
        }

        // Render Media
        const avatarEl = document.getElementById('avatar-el');
        if (avatarEl) avatarEl.src = targetUser.avatar_url || '/assets/icons/user_dragon.png';

        // Render Full Background (Banner)
        const fullBg = document.getElementById('full-bg');
        if (fullBg) {
            fullBg.style.opacity = targetUser.banner_opacity || 0.4;
            if (targetUser.banner_url) {
                fullBg.style.backgroundImage = `url(${targetUser.banner_url})`;
            } else {
                fullBg.style.background = 'linear-gradient(135deg, #050505, #101010)';
            }
        }

        // Render Links
        const linksEl = document.getElementById('links-el');
        if (linksEl) {
            let links = [];
            try { links = JSON.parse(targetUser.links || "[]"); } catch(e) {}
            
            if (links.length > 0) {
                linksEl.innerHTML = links.map(l => `
                    <a href="${l.url}" target="_blank" class="profile-link-btn">
                        <span>${l.name}</span>
                    </a>
                `).join('');
            } else {
                linksEl.innerHTML = '';
            }
        }

    } catch (e) {
        console.error(e);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'flex';
    }
});
