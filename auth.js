// Cloudflare D1 Backend for auth.js

// Immediate session check
(function checkExistingSession() {
    const sessionStr = localStorage.getItem("j2st_session_v2");
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            if (session && session.id && session.username) {
                window.location.replace("/dashboard");
            }
        } catch (e) {
            localStorage.removeItem("j2st_session_v2");
        }
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
    btn.textContent = on ? "Bekle..." : (id === "btn-login" ? "Sign In →" : "Create Account →");
}

function isTurnstileOk() {
    try { return window.turnstile ? !!window.turnstile.getResponse() : true; }
    catch { return true; }
}

// LOGIN
window.handleLogin = async function (e) {
    e.preventDefault();
    setErr("login-error", ""); setOk("login-info", "");

    if (!isTurnstileOk()) {
        setErr("login-error", "✗ Cloudflare doğrulamasını tamamla."); return;
    }

    const emailOrUser = document.getElementById("login-email").value.trim(); // Username shouldn't be lowercased by default
    const password = document.getElementById("login-pass").value;

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
            throw new Error(`Sunucu hatası (${res.status}): Beklenmedik yanıt formatı. Yanıt: ${text.substring(0, 100)}`);
        }

        if (!res.ok) throw new Error(data.error || "Giriş başarısız.");

        setOk("login-info", "✓ Giriş başarılı! Yönlendiriliyor...");
        localStorage.setItem("j2st_session_v2", JSON.stringify(data.user));
        setTimeout(() => window.location.href = "/dashboard", 700);

    } catch (err) {
        console.error("Login hatası:", err);
        setErr("login-error", "✗ Hata: " + err.message);
        if (window.turnstile) window.turnstile.reset();
    } finally {
        setLoading("btn-login", false);
    }
};

// REGISTER
window.handleRegister = async function (e) {
    e.preventDefault();
    setErr("reg-error", ""); setOk("reg-success", "");

    if (!isTurnstileOk()) {
        setErr("reg-error", "✗ Cloudflare doğrulamasını tamamla."); return;
    }

    const username = document.getElementById("reg-user").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-pass").value;
    const confirm = document.getElementById("reg-pass2").value;

    if (password !== confirm) {
        setErr("reg-error", "✗ Şifreler eşleşmiyor."); return;
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
            throw new Error(`Sunucu hatası (${res.status}): Beklenmedik yanıt formatı. Yanıt: ${text.substring(0, 100)}`);
        }

        if (!res.ok) throw new Error(data.error || "Kayıt başarısız.");

        setOk("reg-success", "✓ Hesap oluşturuldu! Giriş yapın.");
        setTimeout(() => window.location.href = "/login", 1500);

    } catch (err) {
        console.error("Register hatası:", err);
        setErr("reg-error", "✗ Hata: " + err.message);
        if (window.turnstile) window.turnstile.reset();
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

