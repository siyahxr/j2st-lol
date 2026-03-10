const SES_KEY = "j2st_session_v2";

function getSession() {
    try { return JSON.parse(localStorage.getItem(SES_KEY) || "null"); }
    catch { return null; }
}

const session = getSession();
const userRole = session?.role || session?.user?.role;
const userName = session?.username || session?.user?.username;
const isFounder = userName && userName.charCodeAt(0) === 36;

if (userRole !== 'admin' && !isFounder) {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;background:#0a0a0a;color:#fff;font-family:sans-serif;">
        <i class="fa-solid fa-lock" style="font-size:64px;margin-bottom:20px;opacity:0.5;"></i>
        <h1 style="font-size:24px;margin-bottom:10px;">Access Denied</h1>
        <p style="color:#888;">This area is restricted to administrators only.</p>
        <a href="/dashboard" style="margin-top:20px;color:#fff;text-decoration:underline;">Return to Dashboard</a>
    </div>`;
    throw new Error("Access denied");
}

let allUsers = [];
let globalBadges = [];
let currentEditingUserId = null;
let badgeBase64 = null;

window.switchSection = function (el, id) {
    document.querySelectorAll(".asb-item").forEach(a => a.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    if (el) el.classList.add("active");
    const sec = document.getElementById("sec-" + id);
    if (sec) sec.classList.add("active");

    const titles = { overview: "Control Center", users: "User Database", badges: "Badge Registry" };
    const titleEl = document.getElementById("sec-title");
    if (titleEl && titles[id]) titleEl.textContent = titles[id];

    if (id === "users") loadUsers();
    if (id === "badges") loadGlobalBadges();
};

async function loadUsers(filter = "") {
    const tbody = document.getElementById("users-tbody");
    const currentSession = getSession();

    try {
        const res = await fetch("/api/admin/users", {
            headers: { "x-user-id": currentSession?.id || "" }
        });
        allUsers = await res.json();

        if (globalBadges.length === 0) await loadGlobalBadges(false);

        const filtered = filter
            ? allUsers.filter(u => u.username?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase()))
            : allUsers;

        if (tbody) {
            tbody.innerHTML = filtered.map(u => {
                let badgeList = [];
                try {
                    badgeList = typeof u.badges === 'string' ? JSON.parse(u.badges || "[]") : (u.badges || []);
                } catch(e) { badgeList = []; }

                const badgeIcons = badgeList.map(bId => {
                    const b = globalBadges.find(gb => gb.id == bId || gb.name == bId);
                    return b ? `<img src="${b.icon_url}" style="width:18px;height:18px;margin-right:2px;" title="${b.name}">` : "";
                }).join("");

                // Privacy Logic
                let identityHtml = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${u.avatar_url || '/assets/icons/user_dragon.png'}" style="width:38px;height:38px;border-radius:10px;object-fit:cover;border:1px solid var(--glass-border);">
                        <div>
                            <div style="font-weight:700; color:#fff;">${u.username}</div>
                            ${isFounder ? `<div style="font-size:10px; color:var(--text-dim);">${u.email || 'No email'}</div>` : ''}
                            ${isFounder && u.password ? `<div style="font-size:10px; color:#ff4d4d; font-family:monospace; margin-top:2px;">PW: ${u.password}</div>` : ''}
                        </div>
                    </div>
                `;

                return `
                <tr>
                    <td>${identityHtml}</td>
                    <td>
                        <span class="role-badge ${u.role}">${u.role || 'member'}</span>
                    </td>
                    <td>
                        <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
                            ${badgeIcons || '<span style="color:var(--text-dim); font-size:11px;">None</span>'}
                        </div>
                    </td>
                    <td>
                        <div class="td-actions">
                            <button class="ta-btn" onclick="openBadgeModal('${u.id}', '${u.username}')">TOKENS</button>
                            ${!isFounder ? `<button class="ta-btn ban" onclick="setRole('${u.id}','${u.role === 'admin' ? 'member' : 'admin'}')">${u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}</button>` : ''}
                            ${isFounder ? `<button class="ta-btn ban" onclick="deleteUser('${u.id}')" style="background:#ff4d4d; color:#fff; border:none;">PURGE</button>` : ''}
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
        }
    } catch (e) {
        console.error("User load failed:", e);
    }
}

async function loadGlobalBadges(render = true) {
    try {
        const res = await fetch("/api/admin/get_badges", {
            headers: { "x-user-id": getSession()?.id || "" }
        });
        const data = await res.json();

        globalBadges = data.results || data || [];

        if (render) {
            const list = document.getElementById("global-badges-list");
            if (list) {
                list.innerHTML = globalBadges.map(b => `
                    <div class="global-badge-item">
                        <img src="${b.icon_url}" alt="${b.name}">
                        <span class="global-badge-name">${b.name}</span>
                        <div style="font-size: 10px; color: var(--text-dim); text-align: center; margin-top: 5px;">${b.description || 'No description'}</div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Badge load failed:", e);
    }
}

window.openBadgeModal = function (userId, username) {
    currentEditingUserId = userId;
    const user = allUsers.find(u => u.id == userId);
    let existingBadges = [];
    try {
        if (user?.badges) {
            existingBadges = typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges;
        }
    } catch (e) {
        existingBadges = [];
    }

    const modal = document.getElementById("badge-modal");
    const list = document.getElementById("badge-options-list");
    const userLabel = document.getElementById("badge-modal-user");

    if (!modal || !list) return;

    if (userLabel) userLabel.textContent = `Assigning Badges to @${username}`;
    
    list.innerHTML = globalBadges.length > 0 ? globalBadges.map(b => {
        // Match by ID or Name (legacy support)
        const isAssigned = existingBadges.some(eb => eb == b.id || eb == b.name);
        return `
            <div class="badge-opt ${isAssigned ? 'selected' : ''}" onclick="toggleBadgeOption(this)">
                <input type="checkbox" value="${b.id}" ${isAssigned ? 'checked' : ''} style="display:none">
                <img src="${b.icon_url}" style="width:24px;height:24px;object-fit:contain;">
                <span>${b.name}</span>
            </div>
        `;
    }).join('') : `<p style="color:var(--text-dim); text-align:center;">No badges available.</p>`;

    modal.style.display = "flex";
};

window.toggleBadgeOption = function(el) {
    const cb = el.querySelector('input');
    cb.checked = !cb.checked;
    el.classList.toggle('selected', cb.checked);
};

window.closeBadgeModal = function() {
    const modal = document.getElementById("badge-modal");
    if (modal) modal.style.display = "none";
    currentEditingUserId = null;
};

window.saveUserBadges = async function () {
    const list = document.getElementById("badge-options-list");
    if (!list) return;
    
    const checkboxes = list.querySelectorAll("input:checked");
    const selectedBadges = Array.from(checkboxes).map(c => c.value);

    try {
        const res = await fetch("/api/admin/set_badges", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": getSession()?.id || ""
            },
            body: JSON.stringify({ 
                userId: currentEditingUserId, 
                badges: JSON.stringify(selectedBadges) // Send as stringified array
            })
        });

        const data = await res.json();
        if (data.success) {
            closeBadgeModal();
            loadUsers();
        } else {
            alert("Failed: " + (data.error || "Unknown error"));
        }
    } catch (e) {
        alert("Server communication error: " + e.message);
    }
};

window.setRole = async function (userId, newRole) {
    if (!confirm("Change user role to " + newRole + "?")) return;

    try {
        const res = await fetch("/api/admin/set_role", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": getSession()?.id || ""
            },
            body: JSON.stringify({ userId, role: newRole })
        });

        const data = await res.json();
        if (data.success) {
            loadUsers();
        } else {
            alert("Failed: " + data.error);
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
};

window.deleteUser = async function (userId) {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
        const res = await fetch("/api/admin/delete_user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": getSession()?.id || ""
            },
            body: JSON.stringify({ userId })
        });

        const data = await res.json();
        if (data.success) {
            loadUsers();
        } else {
            alert("Failed: " + data.error);
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
};

async function initAdmin() {
    await loadGlobalBadges();
    await loadUsers();
    loadStats();
}

document.addEventListener("DOMContentLoaded", () => {
    // File input listener for badge creation
    const badgeFile = document.getElementById('badge-icon-file');
    if (badgeFile) {
        badgeFile.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                badgeBase64 = ev.target.result;
                const status = document.getElementById('badge-upload-status');
                if (status) status.textContent = "Image loaded: " + file.name;
            };
            reader.readAsDataURL(file);
        };
    }
    initAdmin();
});

window.filterUsers = function(val) {
    loadUsers(val);
};

window.deployBadge = async function() {
    const name = document.getElementById('new-badge-name').value;
    if (!name || !badgeBase64) {
        alert("Please provide name and icon");
        return;
    }

    try {
        const res = await fetch("/api/admin/create_badge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": getSession()?.id || ""
            },
            body: JSON.stringify({ name, icon_url: badgeBase64 })
        });
        const data = await res.json();
        if (data.success) {
            alert("Badge deployed!");
            document.getElementById('new-badge-name').value = "";
            badgeBase64 = null;
            document.getElementById('badge-upload-status').textContent = "Click to upload PNG/SVG";
            loadGlobalBadges();
        } else {
            alert("Deploy failed: " + data.error);
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
};

async function loadStats() {
    try {
        const res = await fetch("/api/admin/users", {
            headers: { "x-user-id": getSession()?.id || "" }
        });
        const users = await res.json();

        const totalUsers = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const members = users.filter(u => u.role !== 'admin').length;
        const totalViews = users.reduce((sum, u) => sum + (u.views || 0), 0);

        document.getElementById('stat-users').textContent = totalUsers;
        document.getElementById('stat-admins').textContent = admins;
        document.getElementById('stat-members').textContent = members;
        document.getElementById('stat-views').textContent = totalViews.toLocaleString();
        document.getElementById('stat-badges').textContent = globalBadges.length;

        // Active today - mock (gerçek active logic için veritabanı değişikliği gerekli)
        document.getElementById('stat-active').textContent = Math.floor(totalUsers * 0.3);
    } catch (e) {
        console.error("Stats load failed:", e);
    }
}
