/**
 * J2ST.LOL — DASHBOARD LOGIC (v5.0)
 */

// --- AUTH CHECK ---
const SES_KEY = "j2st_session_v2";
const sessionStr = localStorage.getItem(SES_KEY);
if (!sessionStr) window.location.replace("/login");

const session = JSON.parse(sessionStr);
if (!session.id && session.user?.id) session.id = session.user.id;
if (!session.username && session.user?.username) session.username = session.user.username;

// --- STATE ---
let userData = {
    display_name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    links: [],
    badges: [],
    accent_color: "#7c3aed",
    views: 0
};

// --- INITIALIZATION ---
async function initDashboard() {
    try {
        const res = await fetch(`/api/user/profile?u=${session.username}&t=${Date.now()}`);
        const data = await res.json();

        if (data && !data.error) {
            userData = { ...userData, ...data };
            
            // Parse strings if needed
            if (typeof userData.links === 'string') userData.links = JSON.parse(userData.links);
            if (!userData.links) userData.links = [];
            
            if (typeof userData.badges === 'string') userData.badges = JSON.parse(userData.badges);
            if (!userData.badges) userData.badges = [];

            // Sync UI
            syncFields();
            renderLinks();
            updatePreview();
        }
    } catch (e) {
        console.error("Dashboard Load Error:", e);
    }
}

function syncFields() {
    document.getElementById('profile-display-name').value = userData.display_name || "";
    document.getElementById('profile-bio').value = userData.bio || "";
    document.getElementById('avatar-url-direct').value = userData.avatar_url || "";
    document.getElementById('banner-url-direct').value = userData.banner_url || "";
    
    const myProfileLink = document.getElementById('view-my-profile');
    if (myProfileLink) myProfileLink.href = `/${session.username}`;
}

// --- TAB SWITCHING ---
window.switchTab = (tab) => {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Panels
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    const target = document.getElementById('tab-' + tab);
    if (target) target.style.display = 'block';

    // Header sync
    const titles = {
        'profile': 'Profilini Yönet',
        'links': 'Bağlantılarını Düzenle',
        'design': 'Görünümü Kişiselleştir',
        'analytics': 'Verilerini Analiz Et',
        'settings': 'Hesap Ayarları'
    };
    const descs = {
        'profile': 'Kimliğini ve dijital varlığını kişiselleştir.',
        'links': 'Ziyaretçilerinin sana ulaşabileceği tüm yolları ekle.',
        'design': 'Profiline Obsidian dokunuşunu ekle.',
        'analytics': 'Profilinin etkisini sayılarla gör.',
        'settings': 'Güvenlik ve genel ayarlarını yönet.'
    };
    document.getElementById('tab-title').textContent = titles[tab] || titles['profile'];
    document.getElementById('tab-desc').textContent = descs[tab] || descs['profile'];
};

// --- LINK MANAGEMENT ---
window.renderLinks = () => {
    const list = document.getElementById('links-list');
    if (!list) return;

    if (userData.links.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--text-muted);">Henüz hiç bağlantı eklemedin.</div>`;
        return;
    }

    list.innerHTML = userData.links.map((l, index) => `
        <div class="glass-panel" style="padding: 20px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="${l.icon || 'fa-solid fa-link'}"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700;">${l.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${l.url}</div>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="removeLink(${index})" style="background:none; border:none; color: var(--brand-accent); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
};

window.openAddLinkModal = () => {
    document.getElementById('link-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('link-modal').style.display = 'none';
};

window.addLinkToList = () => {
    const title = document.getElementById('modal-link-title').value.trim();
    const url = document.getElementById('modal-link-url').value.trim();

    if (!title || !url) return alert("Lütfen tüm alanları doldur.");

    userData.links.push({
        id: Date.now(),
        title,
        url,
        icon: 'fa-solid fa-link'
    });

    document.getElementById('modal-link-title').value = "";
    document.getElementById('modal-link-url').value = "";
    
    renderLinks();
    updatePreview();
    closeModal();
};

window.removeLink = (index) => {
    userData.links.splice(index, 1);
    renderLinks();
    updatePreview();
};

// --- PREVIEW ---
window.updatePreview = () => {
    const frame = document.getElementById('preview-frame');
    if (!frame || !frame.contentWindow) return;

    // Build current data object
    const previewData = {
        ...userData,
        display_name: document.getElementById('profile-display-name').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: document.getElementById('avatar-url-direct').value,
        banner_url: document.getElementById('banner-url-direct').value
    };

    // Send to iframe
    frame.contentWindow.postMessage({ type: 'UPDATE_PREVIEW', data: previewData }, window.location.origin);
};

// --- SAVE ---
window.saveProfileChanges = async () => {
    const btn = document.getElementById('save-btn');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

    const payload = {
        id: session.id,
        username: session.username,
        display_name: document.getElementById('profile-display-name').value,
        bio: document.getElementById('profile-bio').value,
        avatar_url: document.getElementById('avatar-url-direct').value,
        banner_url: document.getElementById('banner-url-direct').value,
        links: JSON.stringify(userData.links),
        badges: JSON.stringify(userData.badges)
    };

    try {
        const res = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-id': String(session.id)
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            btn.style.background = '#10b981';
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Başarıyla Kaydedildi!';
            setTimeout(() => {
                btn.disabled = false;
                btn.style.background = 'var(--brand-primary)';
                btn.innerHTML = originalText;
            }, 2000);
        } else {
            throw new Error(data.error || "Bilinmeyen hata");
        }
    } catch (e) {
        alert("Kaydetme sırasında bir hata oluştu: " + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

window.logout = () => {
    localStorage.removeItem(SES_KEY);
    window.location.href = "/";
};

// Start
initDashboard();
