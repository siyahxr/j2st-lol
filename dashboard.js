/**
 * J2ST.ICU — VOID DASHBOARD LOGIC
 * Refined and Modularized for 2026
 */

// --- SESSION CHECK ---
const sessionStr = localStorage.getItem("j2st_session_v2");
if (!sessionStr) {
    window.location.replace("/login");
}
let session = null;
try {
    session = JSON.parse(sessionStr);
    // More flexible check - accept any valid user object
    if (!session || (!session.username && !session.id && !session.user)) {
        throw new Error("Invalid session");
    }
    // Normalize session data
    if (!session.username && session.user && session.user.username) {
        session.username = session.user.username;
    }
    if (!session.id && session.user && session.user.id) {
        session.id = session.user.id;
    }
} catch (e) {
    localStorage.removeItem("j2st_session_v2");
    window.location.replace("/login");
}

// --- GLOBAL STATE ---
let userDataState = null;
let avatarBase64 = null;
let bannerBase64 = null;

// --- TAB SWITCHING SYSTEM ---
window.switchTab = function (el, tabName) {
    // UI Update - Navigation
    if (el) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }

    // UI Update - Panels
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    const targetPanel = document.getElementById('tab-' + tabName);
    if (targetPanel) {
        targetPanel.classList.add('active');
        // Reset scroll position
        targetPanel.scrollTop = 0;
    }

    // Header Updates
    const titlesMap = {
        overview: ['Overview', 'Your bio dashboard at a glance.'],
        profile: ['Profile Editor', 'Manage your public identity and branding.'],
        links: ['Manage Links', 'Your personalized link gallery.'],
        media: ['Sound & Files', 'Upload custom audio and shareable content.'],
        badges: ['Your Badges', 'Showcase your achievements on the void.'],
        settings: ['Account Settings', 'Manage your security and session.']
    };

    const titleEl = document.getElementById('tab-title');
    const subEl = document.getElementById('tab-sub');

    if (titlesMap[tabName] && titleEl && subEl) {
        titleEl.textContent = titlesMap[tabName][0];
        subEl.textContent = titlesMap[tabName][1];
    }
};

// --- INITIALIZATION ---
async function initDashboard() {
    try {
        const res = await fetch(`/api/user/profile?u=${session.username}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);
        userDataState = data;

        // Apply Data to UI
        updateUI();
        initLivePreview();
        initUploader();
        initStatCounters(); // Bonus: animate numbers

    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

// --- UI UPDATER ---
function updateUI() {
    if (!userDataState) return;

    // Avatar & Name Chips
    const chips = document.querySelectorAll('.chip-img, #preview-avatar-img, .phone-avatar');
    chips.forEach(img => {
        if (userDataState.avatar_url) img.src = userDataState.avatar_url;
        else img.src = '/assets/icons/user_dragon.png';
    });

    const nameEls = document.querySelectorAll('.chip-name, #preview-name');
    nameEls.forEach(el => {
        el.textContent = userDataState.display_name || userDataState.username;
    });

    // Sidebar Staff Check
    const adminNavLink = document.getElementById('admin-nav-link');
    const adminSecLabel = document.getElementById('admin-sec-label');
    const role = (userDataState.role || 'member').toLowerCase();
    const isStaff = role === 'admin' || role === 'founder';

    if (adminNavLink) adminNavLink.style.display = isStaff ? 'flex' : 'none';
    if (adminSecLabel) adminSecLabel.style.display = isStaff ? 'block' : 'none';

    // Inputs
    const dispNameInp = document.getElementById('profile-display-name');
    const bioInp = document.getElementById('profile-bio');
    const bannerOpacityInp = document.getElementById('banner-opacity');
    const cardOpacityInp = document.getElementById('card-opacity');

    if (dispNameInp) dispNameInp.value = userDataState.display_name || "";
    if (bioInp) bioInp.value = userDataState.bio || "";
    if (bannerOpacityInp) bannerOpacityInp.value = userDataState.banner_opacity || 0.4;
    if (cardOpacityInp) cardOpacityInp.value = userDataState.card_opacity || 0.8;

    // Initial Preview
    updatePreviewLayer();
}

// --- LIVE PREVIEW ENGINE ---
function initLivePreview() {
    const inputs = [
        'profile-display-name',
        'profile-bio',
        'banner-opacity',
        'card-opacity'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePreviewLayer);
    });
}

function updatePreviewLayer() {
    const nameVal = document.getElementById('profile-display-name')?.value || "Your Name";
    const bioVal = document.getElementById('profile-bio')?.value || "Bio teaser appears here...";

    const previewName = document.getElementById('preview-name');
    const previewBio = document.getElementById('preview-bio');
    const previewHandle = document.getElementById('preview-handle');
    const previewBadges = document.getElementById('preview-badges');
    const previewLinks = document.getElementById('preview-links');
    const previewBanner = document.getElementById('preview-banner');

    if (previewName) previewName.textContent = nameVal;
    if (previewBio) previewBio.textContent = bioVal;
    if (previewHandle) previewHandle.textContent = `@${userDataState?.username || 'username'}`;
    
    // Badges Preview
    if (previewBadges && userDataState) {
        let badgesHtml = '';
        const role = (userDataState.role || 'member').toLowerCase();
        if (role === 'founder') badgesHtml += '<i class="fa-solid fa-crown" style="color:#ffda44; font-size:12px;"></i>';
        else if (role === 'admin') badgesHtml += '<i class="fa-solid fa-shield-halved" style="color:#10b981; font-size:12px;"></i>';
        
        let badges = [];
        try { badges = JSON.parse(userDataState.badges || "[]"); } catch(e) {}
        
        const bMap = {
            early_access: "#ffaa00",
            bug_hunter: "#3b82f6",
            mod: "#8b5cf6",
            vip: "#fbbf24",
            scammer: "#ef4444",
            verified: "#3b82f6"
        };
        const bIcons = {
            early_access: "fa-rocket",
            bug_hunter: "fa-bug",
            mod: "fa-user-shield",
            vip: "fa-crown",
            scammer: "fa-ban",
            verified: "fa-circle-check"
        };

        badges.forEach(b => {
             if (bMap[b]) badgesHtml += `<i class="fa-solid ${bIcons[b]}" style="color:${bMap[b]}; font-size:12px;"></i>`;
        });
        previewBadges.innerHTML = badgesHtml;
    }

    // Links Preview
    if (previewLinks && userDataState) {
        let links = [];
        try { links = JSON.parse(userDataState.links || "[]"); } catch(e) {}
        previewLinks.innerHTML = links.map(l => `<div class="link-mock">${l.name}</div>`).join('');
    }

    if (bannerBase64 && previewBanner) {
        previewBanner.style.backgroundImage = `url(${bannerBase64})`;
    } else if (userDataState?.banner_url && previewBanner) {
        previewBanner.style.backgroundImage = `url(${userDataState.banner_url})`;
    }

    if (previewBanner) {
        const opacity = document.getElementById('banner-opacity')?.value || 0.4;
        previewBanner.style.filter = `blur(2px) brightness(${opacity})`;
    }
}

// --- IMAGE UPLOADERS ---
function initUploader() {
    const avatarInp = document.getElementById('avatar-upload');
    const bannerInp = document.getElementById('banner-upload');

    if (avatarInp) {
        avatarInp.addEventListener('change', (e) => handleImageUpload(e, 'avatar'));
    }
    if (bannerInp) {
        bannerInp.addEventListener('change', (e) => handleImageUpload(e, 'banner'));
    }

    // Save Button
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfileChanges);
    }
}

async function handleImageUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Image too large! (Limit: 2MB)");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        if (type === 'avatar') {
            avatarBase64 = ev.target.result;
            if (previewAvatar) {
                previewAvatar.src = avatarBase64 || '/assets/user_dragon.png';
            }
            if (previewAvatarImg) {
                previewAvatarImg.src = avatarBase64 || '/assets/user_dragon.png';
            }
        } else {
            bannerBase64 = ev.target.result;
            const selector = document.getElementById('banner-selector');
            if (selector) {
                selector.style.backgroundImage = `url(${bannerBase64})`;
                selector.textContent = "";
            }
            const prevBanner = document.getElementById('preview-banner');
            if (prevBanner) prevBanner.style.backgroundImage = `url(${bannerBase64})`;
        }
    };
    reader.readAsDataURL(file);
}

// --- SAVE PROFILE ---
async function saveProfileChanges() {
    const btn = document.querySelector('.save-btn');
    const originalText = btn.textContent;
    btn.textContent = "SAVING...";
    btn.disabled = true;

    const payload = {
        id: session.id,
        display_name: document.getElementById('profile-display-name').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: avatarBase64 || userDataState.avatar_url,
        banner_url: bannerBase64 || userDataState.banner_url,
        banner_opacity: parseFloat(document.getElementById('banner-opacity').value),
        card_opacity: parseFloat(document.getElementById('card-opacity').value)
    };

    try {
        const res = await fetch("/api/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            btn.textContent = "SAVED! ✓";
            btn.style.background = "#00e676";
            btn.style.color = "#000";

            // Re-fetch data to sync state
            const refreshRes = await fetch(`/api/user/profile?u=${session.username}`);
            userDataState = await refreshRes.json();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "";
                btn.style.color = "";
                btn.disabled = false;
            }, 2000);
        } else {
            throw new Error("API Error");
        }
    } catch (err) {
        console.error(err);
        btn.textContent = "ERROR";
        btn.style.background = "#ff4d4d";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
            btn.disabled = false;
        }, 3000);
    }
}

// --- SECURITY & ACCOUNT ---
window.changeUserPassword = async function () {
    const oldPass = document.getElementById('set-old-pass').value;
    const newPass = document.getElementById('set-new-pass').value;
    const newPass2 = document.getElementById('set-new-pass2').value;
    const msgEl = document.getElementById('pw-change-msg');

    if (!oldPass || !newPass || !newPass2) {
        showMsg(msgEl, "Please fill all fields.", "error");
        return;
    }

    if (newPass !== newPass2) {
        showMsg(msgEl, "New passwords do not match.", "error");
        return;
    }

    if (newPass.length < 8) {
        showMsg(msgEl, "Password must be at least 8 characters.", "error");
        return;
    }

    showMsg(msgEl, "Processing...", "");

    try {
        const res = await fetch("/api/profile/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: session.id,
                oldPassword: oldPass,
                newPassword: newPass
            })
        });

        const data = await res.json();
        if (data.success) {
            showMsg(msgEl, "Password updated successfully!", "success");
            document.getElementById('set-old-pass').value = "";
            document.getElementById('set-new-pass').value = "";
            document.getElementById('set-new-pass2').value = "";
        } else {
            showMsg(msgEl, data.error || "Failed to update password.", "error");
        }
    } catch (err) {
        showMsg(msgEl, "Connection error.", "error");
    }
};

function showMsg(el, text, type) {
    el.textContent = text;
    el.className = "pw-change-msg " + type;
    setTimeout(() => {
        if (type === 'success') el.className = "pw-change-msg";
    }, 4000);
}

window.logout = function () {
    localStorage.removeItem("j2st_session_v2");
    window.location.replace("/login");
};

window.viewProfile = function () {
    const sessionStr = localStorage.getItem("j2st_session_v2");
    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session && session.username) {
            window.location.href = '/' + session.username;
        } else {
            window.location.href = '/';
        }
    } else {
        window.location.replace("/login");
    }
};

// --- COUNTER ANIMATION ---
function initStatCounters() {
    const counters = document.querySelectorAll('.stat-value');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        if (!target) return;

        let count = 0;
        const inc = target / 50; // speed

        const updateCount = () => {
            if (count < target) {
                count += inc;
                counter.innerText = Math.ceil(count).toLocaleString();
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCount();
    });
}

// --- BOOT ---
initDashboard();
