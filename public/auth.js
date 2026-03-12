// Vercel Backend for auth.js

// Immediate session check
(function checkExistingSession() {
    try {
        const sessionStr = localStorage.getItem("j2st_session_v2");
        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            // Unified session check
            const isValid = session && (session.id || session.username || (session.user && (session.user.id || session.user.username)));
            
            if (isValid) {
                console.log("Session found, redirecting to dashboard...");
                window.location.replace("/dashboard");
            }
        }
    } catch (e) {
        console.error("Session check error:", e);
        localStorage.removeItem("j2st_session_v2");
    }
})();


// UI Helpers
window.showTab = function (tab) {
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");

    if (formLogin) {
        formLogin.style.display = tab === "login" ? "block" : "none";
    }
    if (formRegister) {
        formRegister.style.display = tab === "register" ? "block" : "none";
    }
    if (tabLogin) tabLogin.classList.toggle("active", tab === "login");
    if (tabRegister) tabRegister.classList.toggle("active", tab === "register");
};



window.togglePw = function (id, btn) {
    const el = document.getElementById(id);
    el.type = el.type === "password" ? "text" : "password";
    btn.textContent = el.type === "password" ? "👁" : "🙈";
};

// Form Handlers
function setErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function setOk(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function setLoading(id, on) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? "Bekle..." : (id === "btn-login" ? "GIRIŞ YAP" : "HESABI UYANDIR");
}

// LOGIN
window.handleLogin = async function (e) {
    e.preventDefault();
    setErr("login-error", ""); setOk("login-info", "");

    const emailOrUser = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!emailOrUser || !password) {
        setErr("login-error", "✗ Lütfen tüm alanları doldurun."); return;
    }

    setLoading("btn-login", true);

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrUser, password })
        });

        const contentType = res.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error(`Sunucu hatası (${res.status}): ${text.substring(0, 100)}`);
        }

        if (!res.ok) throw new Error(data.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");

        setOk("login-info", "✓ Giriş başarılı! Yönlendiriliyor...");
        localStorage.setItem("j2st_session_v2", JSON.stringify(data.user || data));
        setTimeout(() => window.location.href = "/dashboard", 700);

    } catch (err) {
        console.error("Login hatası:", err);
        setErr("login-error", "✗ Hata: " + err.message);
    } finally {
        setLoading("btn-login", false);
    }
};

// REGISTER
window.handleRegister = async function (e) {
    e.preventDefault();
    setErr("reg-error", ""); setOk("reg-success", "");

    const username = document.getElementById("reg-user").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-pass").value;
    const confirm = document.getElementById("reg-pass2").value;

    if (!username || !email || !password || !confirm) {
        setErr("reg-error", "✗ Lütfen tüm alanları doldurun."); return;
    }

    if (password !== confirm) {
        setErr("reg-error", "✗ Şifreler eşleşmiyor."); return;
    }

    if (username.length < 3) {
        setErr("reg-error", "✗ Kullanıcı adı en az 3 karakter olmalıdır."); return;
    }

    if (password.length < 8) {
        setErr("reg-error", "✗ Şifre en az 8 karakter olmalı."); return;
    }

    setLoading("btn-register", true);

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password })
        });

        const contentType = res.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error(`Sunucu hatası (${res.status}): ${text.substring(0, 100)}`);
        }

        if (!res.ok) throw new Error(data.error || "Kayıt sırasında bir hata oluştu.");

        setOk("reg-success", "✓ Hesap başarıyla oluşturuldu! Giriş yapılıyor...");
        
        // Auto Login
        localStorage.setItem("j2st_session_v2", JSON.stringify(data.user || data));
        setTimeout(() => window.location.href = "/dashboard", 1200);

    } catch (err) {
        console.error("Register hatası:", err);
        setErr("reg-error", "✗ " + err.message);
    } finally {
        setLoading("btn-register", false);
    }
};

// Password strength UI
const passInput = document.getElementById("reg-pass");
if (passInput) {
    passInput.addEventListener("input", () => {
        const v = passInput.value, bar = document.getElementById("pw-strength");
        if (!bar) return;
        let s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^a-zA-Z0-9]/.test(v)) s++;
        bar.textContent = ["", "Zayıf", "Orta", "İyi", "Güçlü"][s] || "";
        bar.style.color = ["", "#ef4444", "#f59e0b", "#22c55e", "#38bdf8"][s] || "";
    });
}

// Initial tab check
document.addEventListener("DOMContentLoaded", () => {
    const hash = window.location.hash.substring(1);
    const path = window.location.pathname;

    if (hash === "register" || path.includes("/register")) {
        window.showTab("register");
    } else {
        window.showTab("login");
    }
});
