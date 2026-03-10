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
        initStatCounters(); 
        initPremiumControls(); // New premium logic

    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

// --- UI UPDATER ---
function updateUI() {
    if (!userDataState) return;

    // Basic Info
    const chips = document.querySelectorAll('.chip-img, #preview-avatar-img');
    chips.forEach(img => {
        if (userDataState.avatar_url) img.src = userDataState.avatar_url;
        else img.src = '/assets/icons/user_dragon.png';
    });

    const nameEls = document.querySelectorAll('.chip-name, #preview-name');
    nameEls.forEach(el => {
        el.textContent = userDataState.display_name || userDataState.username;
    });

    // Inputs Sync
    document.getElementById('profile-display-name').value = userDataState.display_name || "";
    document.getElementById('profile-bio').value = userDataState.bio || "";
    
    // Colors & Fonts
    syncColorInput('avatar-frame-color', 'avatar-frame-hex', userDataState.avatar_frame_color);
    syncColorInput('icon-color', 'icon-color-hex', userDataState.icon_color);
    document.getElementById('badge-bg-color').value = userDataState.badge_bg_color || "rgba(255,255,255,0.04)";
    syncColorInput('accent-color', 'accent-color-hex', userDataState.accent_color);
    
    document.getElementById('base-font').value = userDataState.base_font || "Outfit";
    document.getElementById('base-font-color').value = userDataState.base_font_color || "#ffffff";
    document.getElementById('name-font').value = userDataState.name_font || "Outfit";
    document.getElementById('name-font-color').value = userDataState.name_font_color || "#ffffff";
    document.getElementById('bio-font').value = userDataState.bio_font || "Outfit";
    document.getElementById('bio-font-color').value = userDataState.bio_font_color || "rgba(255,255,255,0.7)";

    // Card & Interaction
    const styles = document.querySelectorAll('.style-opt-btn');
    styles.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.style === (userDataState.card_style || 'glass')) btn.classList.add('active');
    });
    document.getElementById('hover-text').value = userDataState.hover_text || "";
    document.getElementById('link-hover-anim').value = userDataState.link_hover_anim || "none";
    document.getElementById('glitch-avatar').checked = !!userDataState.glitch_avatar;

    // Effects
    document.getElementById('bg-effect').value = userDataState.bg_effect || "none";
    document.getElementById('entry-anim').value = userDataState.entry_anim || "fadeIn";
    document.getElementById('tilt-3d').checked = !!userDataState.tilt_3d;
    
    // Media URLs
    document.getElementById('banner-url-direct').value = userDataState.banner_url || "";
    document.getElementById('music-url-direct').value = userDataState.profile_music_url || "";

    updatePreviewLayer();
}

function syncColorInput(pickerId, hexId, value) {
    const picker = document.getElementById(pickerId);
    const hex = document.getElementById(hexId);
    const prev = document.getElementById(pickerId + '-prev');
    if (!value || value === 'none') {
        value = '#ffffff';
    }
    if (picker) picker.value = value;
    if (hex) hex.value = value;
    if (prev) prev.style.background = value;
}

// --- PREMIUM LOGIC (Color Pickers, Style Buttons) ---
function initPremiumControls() {
    // 1. Color Pickers Sync
    ['avatar-frame', 'icon', 'accent'].forEach(prefix => {
        const picker = document.getElementById(prefix + '-color');
        const hex = document.getElementById(prefix + '-hex');
        const prev = document.getElementById(prefix + '-prev');

        if (prev && picker) prev.onclick = () => picker.click();
        
        if (picker && hex) {
            picker.oninput = () => {
                hex.value = picker.value;
                if (prev) prev.style.background = picker.value;
                updatePreviewLayer();
            };
            hex.oninput = () => {
                if (hex.value.startsWith('#') && hex.value.length === 7) {
                    picker.value = hex.value;
                    if (prev) prev.style.background = hex.value;
                    updatePreviewLayer();
                }
            };
        }
    });

    // 2. Card Style Buttons
    document.querySelectorAll('.style-opt-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.style-opt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updatePreviewLayer();
        };
    });
}

// --- LIVE PREVIEW ENGINE ---
function initLivePreview() {
    const ids = [
        'profile-display-name', 'profile-bio', 'badge-bg-color', 'base-font', 
        'base-font-color', 'name-font', 'name-font-color', 'bio-font', 
        'bio-font-color', 'hover-text', 'link-hover-anim', 'glitch-avatar',
        'bg-effect', 'entry-anim', 'tilt-3d', 'banner-url-direct', 'music-url-direct'
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updatePreviewLayer;
    });
}

function updatePreviewLayer() {
    if (!userDataState) return;

    const previewName = document.getElementById('preview-name');
    const previewBio = document.getElementById('preview-bio');
    const previewHandle = document.getElementById('preview-handle');
    const previewBadges = document.getElementById('preview-badges');
    const previewLinks = document.getElementById('preview-links');
    const previewBanner = document.getElementById('preview-banner');
    const phoneBody = document.querySelector('.phone-body');

    // Values
    const nameVal = document.getElementById('profile-display-name').value;
    const bioVal = document.getElementById('profile-bio').value;
    const accentVal = document.getElementById('accent-color').value;
    const styleVal = document.querySelector('.style-opt-btn.active')?.dataset.style || 'glass';

    if (previewName) {
        previewName.textContent = nameVal || "Your Name";
        previewName.style.fontFamily = document.getElementById('name-font').value;
        previewName.style.color = document.getElementById('name-font-color').value;
    }
    if (previewBio) {
        previewBio.textContent = bioVal || "Bio teaser...";
        previewBio.style.fontFamily = document.getElementById('bio-font').value;
        previewBio.style.color = document.getElementById('bio-font-color').value;
    }
    if (previewHandle) previewHandle.textContent = `@${userDataState.username}`;
    
    // Background / Banner
    const directUrl = document.getElementById('banner-url-direct').value;
    if (bannerBase64) {
        previewBanner.style.backgroundImage = `url(${bannerBase64})`;
    } else if (directUrl) {
        previewBanner.style.backgroundImage = `url(${directUrl})`;
    } else if (userDataState.banner_url) {
        previewBanner.style.backgroundImage = `url(${userDataState.banner_url})`;
    }

    // Mock Badges
    if (previewBadges) {
        let bHtml = `<i class="fa-solid fa-shield-halved" style="color:${accentVal}; font-size:12px;"></i>`;
        bHtml += `<i class="fa-solid fa-circle-check" style="color:${accentVal}; font-size:12px; opacity:0.6;"></i>`;
        previewBadges.innerHTML = bHtml;
    }

    // Mock Links
    if (previewLinks) {
        previewLinks.innerHTML = `
            <div class="link-mock" style="border-color:${accentVal}33">Discord</div>
            <div class="link-mock" style="border-color:${accentVal}33">Twitter</div>
        `;
    }
}

// --- IMAGE UPLOADERS (MAX 50MB) ---
function initUploader() {
    const avatarInp = document.getElementById('avatar-upload');
    const bannerInp = document.getElementById('banner-upload');
    const audioInp = document.getElementById('audio-upload-btn');
    const cursorInp = document.getElementById('cursor-upload');

    const handleFile = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            alert("File too large! (Limit: 50MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target.result;
            if (type === 'avatar') {
                avatarBase64 = result;
                document.getElementById('preview-avatar-img').src = result;
                document.getElementById('preview-avatar').src = result;
            } else if (type === 'banner') {
                bannerBase64 = result;
                if (file.type.startsWith('image/')) {
                    document.getElementById('banner-selector').style.backgroundImage = `url(${result})`;
                    document.getElementById('preview-banner').style.backgroundImage = `url(${result})`;
                } else {
                    document.getElementById('banner-selector').querySelector('span').textContent = "Video selected!";
                }
            } else if (type === 'audio') {
                document.getElementById('audio-upload-btn').nextElementSibling.textContent = file.name;
                // Store base64 or prepare for upload
            }
        };
        reader.readAsDataURL(file);
    };

    if (avatarInp) avatarInp.onchange = (e) => handleFile(e, 'avatar');
    if (bannerInp) bannerInp.onchange = (e) => handleFile(e, 'banner');
    if (audioInp) audioInp.onchange = (e) => handleFile(e, 'audio');
    if (cursorInp) cursorInp.onchange = (e) => handleFile(e, 'cursor');
}

// --- SAVE PROFILE ---
async function saveProfileChanges() {
    const btn = document.querySelector('.save-btn');
    const msg = document.getElementById('save-msg');
    const orig = btn.textContent;
    
    btn.textContent = "INJECTING DATA...";
    btn.disabled = true;

    const payload = {
        id: session.id,
        display_name: document.getElementById('profile-display-name').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: avatarBase64 || userDataState.avatar_url,
        banner_url: bannerBase64 || document.getElementById('banner-url-direct').value || userDataState.banner_url,
        
        // Premium Fields
        avatar_frame_color: document.getElementById('avatar-frame-hex').value,
        icon_color: document.getElementById('icon-color-hex').value,
        badge_bg_color: document.getElementById('badge-bg-color').value,
        accent_color: document.getElementById('accent-color-hex').value,
        
        base_font: document.getElementById('base-font').value,
        base_font_color: document.getElementById('base-font-color').value,
        name_font: document.getElementById('name-font').value,
        name_font_color: document.getElementById('name-font-color').value,
        bio_font: document.getElementById('bio-font').value,
        bio_font_color: document.getElementById('bio-font-color').value,
        
        card_style: document.querySelector('.style-opt-btn.active')?.dataset.style || 'glass',
        hover_text: document.getElementById('hover-text').value,
        link_hover_anim: document.getElementById('link-hover-anim').value,
        glitch_avatar: document.getElementById('glitch-avatar').checked ? 1 : 0,
        
        profile_music_url: document.getElementById('music-url-direct').value,
        bg_effect: document.getElementById('bg-effect').value,
        entry_anim: document.getElementById('entry-anim').value,
        tilt_3d: document.getElementById('tilt-3d').checked ? 1 : 0
    };

    try {
        const res = await fetch("/api/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": session.id },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            msg.textContent = "> SYSTEM_SYNC_SUCCESSFUL";
            msg.style.color = "#00e676";
            setTimeout(() => {
                btn.textContent = orig;
                btn.disabled = false;
                msg.textContent = "";
            }, 2000);
        } else {
            throw new Error("API_ERROR");
        }
    } catch (err) {
        msg.textContent = "> ERR_INJECTION_FAILED";
        msg.style.color = "#ff4d4d";
        btn.disabled = false;
        btn.textContent = orig;
    }
}

// --- OTHERS ---
function initStatCounters() { /* ... unchanged ... */ }
window.logout = function () { /* ... unchanged ... */ };
window.viewProfile = function () { /* ... unchanged ... */ };

initDashboard();

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
