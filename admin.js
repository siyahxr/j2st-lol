const SES_KEY = "j2st_session_v2";

function getSession() {
    try { return JSON.parse(localStorage.getItem(SES_KEY) || "null"); } 
    catch { return null; }
}

let allUsers = [];
let globalBadges = [];
let currentEditingUserId = null;
let badgeBase64 = null;

// --- UI Logic ---
window.switchSection = function(el, id) {
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
        
        // Fetch global badges if not loaded
        if (globalBadges.length === 0) await loadGlobalBadges(false);

        const filtered = filter
            ? allUsers.filter(u => u.username?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase()))
            : allUsers;

        if (tbody) {
            tbody.innerHTML = filtered.map(u => {
                const badgeList = JSON.parse(u.badges || "[]");
                const badgeIcons = badgeList.map(bId => {
                    const b = globalBadges.find(gb => gb.id == bId || gb.name == bId);
                    return b ? `<img src="${b.icon_url}" style="width:18px; height:18px; filter:none; margin:0 2px;">` : "";
                }).join("");

                const isFounder = u.role === 'founder';

                return `<tr>
                    <td>
                        <div class="td-user">
                            <span style="color:${isFounder ? 'red' : 'white'}">${u.username}</span>
                        </div>
                    </td>
                    <td><span class="role-tag ${u.role}">${u.role.toUpperCase()}</span></td>
                    <td>${badgeIcons || "—"}</td>
                    <td>
                        <div class="td-actions">
                            <button class="ta-btn" onclick="openBadgeModal('${u.id}', '${u.username}')">MOD_TOKENS</button>
                            ${!isFounder ? `<button class="ta-btn ban" onclick="setRole('${u.id}','${u.role === 'admin' ? 'member' : 'admin'}')">${u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}</button>` : ''}
                        </div>
                    </td>
                </tr>`;
            }).join("");
        }
    } catch (e) {
        console.error("> ERR_DATA_CORRUPTION:", e);
    }
}

// --- GLOBAL BADGE MANAGEMENT ---
async function loadGlobalBadges(render = true) {
    const currentSession = getSession();
    try {
        const res = await fetch("/api/admin/get_badges", {
            headers: { "x-user-id": currentSession?.id || "" }
        });
        globalBadges = await res.json();

        if (render) {
            const list = document.getElementById("global-badges-list");
            if (list) {
                list.innerHTML = globalBadges.map(b => `
                    <div class="global-badge-item">
                        <img src="${b.icon_url}" alt="${b.name}">
                        <p class="global-badge-name">${b.name}</p>
                    </div>
                `).join("");
            }
        }
    } catch (e) { console.error(e); }
}

// Handle Badge Icon Upload
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'badge-icon-file') {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            badgeBase64 = ev.target.result;
            document.getElementById('badge-upload-status').textContent = file.name + " (READY)";
        };
        reader.readAsDataURL(file);
    }
});

window.deployBadge = async function() {
    const name = document.getElementById("new-badge-name").value;
    if (!name || !badgeBase64) return alert("MISSING_DATA");

    const currentSession = getSession();
    try {
        const res = await fetch("/api/admin/create_badge", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-user-id": currentSession?.id || ""
            },
            body: JSON.stringify({ name, icon_url: badgeBase64 })
        });
        if (res.ok) {
            document.getElementById("new-badge-name").value = "";
            badgeBase64 = null;
            document.getElementById('badge-upload-status').textContent = "CLICK TO UPLOAD PNG/SVG";
            loadGlobalBadges();
        }
    } catch (e) { console.error(e); }
};

// --- Badge Assignment Modal ---
window.openBadgeModal = function(userId, username) {
    currentEditingUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    const existingBadges = JSON.parse(user?.badges || "[]");

    document.getElementById("badge-modal").style.display = "flex";
    document.getElementById("badge-modal-user").textContent = `TARGET_ID: ${username}`;

    const list = document.getElementById("badge-options-list");
    list.innerHTML = globalBadges.map(b => `
        <div class="badge-opt ${existingBadges.includes(String(b.id)) || existingBadges.includes(b.name) ? 'selected' : ''}" data-id="${b.id}" onclick="this.classList.toggle('selected')">
            <img src="${b.icon_url}" style="width:24px; height:24px; filter:none;"> ${b.name}
        </div>
    `).join("") || "<p>NO_TOKENS_FOUND</p>";
};

window.closeBadgeModal = function() {
    document.getElementById("badge-modal").style.display = "none";
};

window.saveUserBadges = async function() {
    const selectedBadges = Array.from(document.querySelectorAll(".badge-opt.selected"))
        .map(opt => opt.getAttribute("data-id"));

    const currentSession = getSession();
    try {
        const res = await fetch("/api/admin/set_badges", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-user-id": currentSession?.id || ""
            },
            body: JSON.stringify({ userId: currentEditingUserId, badges: selectedBadges })
        });

        if (res.ok) {
            closeBadgeModal();
            loadUsers();
        }
    } catch (e) {
        console.error("> ERR_UPLINK:", e);
    }
};

window.setRole = async function(userId, newRole) {
    if (!confirm(`CONFIRM_LEVEL_SHIFT_${newRole.toUpperCase()}?`)) return;
    const currentSession = getSession();
    try {
        const res = await fetch("/api/admin/set_role", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-user-id": currentSession?.id || ""
            },
            body: JSON.stringify({ userId, role: newRole })
        });
        if (res.ok) loadUsers();
    } catch (e) { console.error(e); }
};

window.filterUsers = function(val) { loadUsers(val); };

(function init() {
    loadUsers();
})();
