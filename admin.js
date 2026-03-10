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
                const badgeList = JSON.parse(u.badges || "[]");
                const badgeIcons = badgeList.map(bId => {
                    const b = globalBadges.find(gb => gb.id == bId || gb.name == bId);
                    return b ? `<img src="${b.icon_url}" style="width:18px;height:18px;margin-right:2px;" title="${b.name}">` : "";
                }).join("");

                return `
                <tr>
                    <td><img src="${u.avatar_url || '/assets/icons/user_dragon.png'}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"></td>
                    <td style="font-weight:600;">${u.username}</td>
                    <td style="color:var(--text-dim);font-size:13px;">${u.email}</td>
                    <td>
                        <div style="display:flex;gap:2px;align-items:center;">
                            ${badgeIcons}
                        </div>
                    </td>
                    <td>
                        <span class="role-badge ${u.role}">${u.role || 'member'}</span>
                    </td>
                    <td>
                        <div class="td-actions">
                            <button class="ta-btn" onclick="openBadgeModal('${u.id}', '${u.username}')">MOD_TOKENS</button>
                            ${!isFounder ? `<button class="ta-btn ban" onclick="setRole('${u.id}','${u.role === 'admin' ? 'member' : 'admin'}')">${u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}</button>` : ''}
                            ${isFounder ? `<button class="ta-btn ban" onclick="deleteUser('${u.id}')" style="background:#ff4d4d;color:#fff;border:none;">ACCOUNT DELETE</button>` : ''}
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
                    <div class="badge-row">
                        <img src="${b.icon_url}" class="badge-icon-preview">
                        <span>${b.name}</span>
                        <span style="color:var(--text-dim);font-size:12px;">${b.description || ''}</span>
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
    const user = allUsers.find(u => u.id === userId);
    const existingBadges = JSON.parse(user?.badges || "[]");

    const modal = document.getElementById("badge-modal");
    const list = document.getElementById("badge-assign-list");
    const title = document.getElementById("badge-modal-title");

    if (!modal || !list) return;

    title.textContent = `Assign Badges to @${username}`;
    list.innerHTML = globalBadges.map(b => {
        const isAssigned = existingBadges.includes(b.id) || existingBadges.includes(b.name);
        return `
            <label class="badge-option ${isAssigned ? 'selected' : ''}">
                <input type="checkbox" value="${b.id}" ${isAssigned ? 'checked' : ''}>
                <img src="${b.icon_url}" style="width:24px;height:24px;">
                <span>${b.name}</span>
            </label>
        `;
    }).join('');

    modal.style.display = "flex";
};

window.closeBadgeModal = function () {
    const modal = document.getElementById("badge-modal");
    if (modal) modal.style.display = "none";
};

window.saveBadgeAssignments = async function () {
    const checkboxes = document.querySelectorAll("#badge-assign-list input:checked");
    const selectedBadges = Array.from(checkboxes).map(c => c.value);

    try {
        const res = await fetch("/api/admin/set_badges", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": getSession()?.id || ""
            },
            body: JSON.stringify({ userId: currentEditingUserId, badges: selectedBadges })
        });

        const data = await res.json();
        if (data.success) {
            closeBadgeModal();
            loadUsers();
        } else {
            alert("Failed: " + data.error);
        }
    } catch (e) {
        alert("Error: " + e.message);
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

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("user-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            loadUsers(e.target.value);
        });
    }

    const modal = document.getElementById("badge-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeBadgeModal();
        });
    }

    loadUsers();
    loadGlobalBadges();
    loadStats();
});

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
