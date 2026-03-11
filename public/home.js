// Lang Switcher UI Logic
document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    
    if (langBtn && langDropdown) {
        langBtn.onclick = (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        };

        const langCodes = ["tr", "en", "de", "ru"];
        document.querySelectorAll('.lang-opt').forEach(opt => {
            opt.onclick = () => {
                const l = opt.getAttribute('data-lang');
                let currentPath = window.location.pathname.substring(1).split('/');
                if (langCodes.includes(currentPath[0])) currentPath.shift();
                window.location.href = "/" + l + "/" + currentPath.join("/");
            };
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });
    }
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        navbar.style.background = 'rgba(2,6,9,0.92)';
        navbar.style.top = '10px';
    } else {
        navbar.style.background = '';
        navbar.style.top = '16px';
    }
});

// Animated Number Counters
function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    if (isNaN(target)) return;
    let current = 0;
    const duration = 1800;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.floor(eased * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Scroll reveal + counter trigger
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Reveal animation
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // Counters
            entry.target.querySelectorAll('.counter-val[data-target]').forEach(animateCounter);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

// Observe sections
document.querySelectorAll('.hero, .feat-card, .cta-inner').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
});

// Session check
document.addEventListener('DOMContentLoaded', () => {
    try {
        const sessionStr = localStorage.getItem("j2st_session_v2");
        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            if (session && session.username) {
                const loginBtn = document.getElementById('nav-login');
                const regBtn = document.getElementById('nav-register');
                const userDashBtn = document.getElementById('nav-user-dash');
                
                if (loginBtn) loginBtn.style.display = 'none';
                if (regBtn) regBtn.style.display = 'none';
                if (userDashBtn) {
                    userDashBtn.style.display = 'inline-flex';
                    userDashBtn.textContent = session.username;
                }
                const featProfileLink = document.getElementById('feat-profile-link');
                                const openProfileBtn = document.querySelector('a.btn-primary.large[href="/"]');
                                if (featProfileLink) {
                                    featProfileLink.href = `/${session.username}`;
                                }
                                if (openProfileBtn && openProfileBtn.textContent.includes('Open Profile')) {
                                    openProfileBtn.href = `/${session.username}`;
                                }
            }
        }
    } catch (e) {
        console.error("Session parse error", e);
    }
});
