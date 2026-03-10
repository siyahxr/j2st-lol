const SES_KEY = "j2st_session_v2";

function getSession() {
    try { return JSON.parse(localStorage.getItem(SES_KEY) || "null"); } 
    catch { return null; }
}

let allUsers = [];
let currentEditingUserId = null;

// --- UI Logic ---
window.switchSection = function(el, id) {
    document.querySelectorAll(".asb-item").forEach(a => a.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    if (el) el.classList.add("active");
    const sec = document.getElementById("sec-" + id);
    if (sec) sec.classList.add("active");

    if (id === "users") loadUsers();
};

async function loadUsers(filter = "") {
    const tbody = document.getElementById("users-tbody");
    const currentSession = getSession();
    
    console.log("> ACCESSING_DATA_STREAM...");

    try {
        const res = await fetch("/api/admin/users", {
            headers: { "x-user-id": currentSession?.id || "" }
        });
        allUsers = await res.json();

        const filtered = filter
            ? allUsers.filter(u => u.username?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase()))
            : allUsers;

        if (tbody) {
            tbody.innerHTML = filtered.map(u => {
                const joinDate = u.created_at ? new Date(u.created_at).toLocaleDateString("tr-TR") : "—";
                const badgeList = JSON.parse(u.badges || "[]");
                const badgeIcons = badgeList.map(b => getBadgeEmoji(b)).join(" ");

                const isFounder = u.role === 'founder';

                return `<tr>
                    <td>
                        <div class="td-user">
                            <span style="color:${isFounder ? 'red' : 'white'}">${u.username}</span>
                        </div>
                    </td>
                    <td><span class="role-tag ${u.role}">${u.role.toUpperCase()}</span></td>
                    <td style="font-size:18px;">${badgeIcons || "—"}</td>
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

function getBadgeEmoji(id) {
    const map = {
        early_access: "⚡",
        bug_hunter: "🐛",
        mod: "🔮",
        vip: "👑",
        scammer: "🚫"
    };
    return map[id] || "❓";
}

// --- Badge Management ---
window.openBadgeModal = function(userId, username) {
    currentEditingUserId = userId;
    const user = allUsers.find(u => u.id === userId);
    const existingBadges = JSON.parse(user?.badges || "[]");

    document.getElementById("badge-modal").style.display = "flex";
    document.getElementById("badge-modal-user").textContent = `TARGET_ID: ${username}`;

    document.querySelectorAll(".badge-opt").forEach(opt => {
        const badgeId = opt.getAttribute("data-id");
        if (existingBadges.includes(badgeId)) {
            opt.classList.add("selected");
        } else {
            opt.classList.remove("selected");
        }
        
        opt.onclick = () => opt.classList.toggle("selected");
    });
};

window.closeBadgeModal = function() {
    document.getElementById("badge-modal").style.display = "none";
};

window.saveUserBadges = async function() {
    console.log("> INJECTING_TOKENS...");
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
            console.log("> OPERATION_SUCCESSFUL.");
            closeBadgeModal();
            loadUsers();
        } else {
            console.error("> INJECTION_FAILED.");
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
    } catch (e) {
        console.error(e);
    }
};

window.filterUsers = function(val) { loadUsers(val); };

(function init() {
    console.log("> SYSTEM_INITIALIZED");
    loadUsers();
})();
