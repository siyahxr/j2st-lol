export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase().replace(/\/$/, "");
  
  // Lang codes to support
  const langCodes = ["tr", "en", "de", "ru"];
  let currentLang = null;
  let cleanPath = path;

  // Check if path starts with a language code (e.g., /tr or /tr/login)
  const parts = path.substring(1).split("/");
  if (langCodes.includes(parts[0])) {
    currentLang = parts[0];
    cleanPath = "/" + parts.slice(1).join("/");
    if (cleanPath === "/") cleanPath = "";
  }

  // 1. Her zaman izin verilen (sistem) yolları
  const systemPaths = [
    "/login", "/register", "/dashboard", "/admin", "/profile", "/index", "/home", "/404",
    "/api", "/assets", "/css", "/js", "/functions"
  ];

  if (cleanPath === "" || systemPaths.some(p => cleanPath === p || cleanPath.startsWith(p + "/")) || cleanPath.includes(".")) {
    if (currentLang) {
        // Rewrite to the actual file but keep lang param
        const targetPath = cleanPath === "" ? "/index.html" : (cleanPath.includes(".") ? cleanPath : `${cleanPath}.html`);
        const urlWithLang = new URL(targetPath, request.url);
        urlWithLang.searchParams.set("lang", currentLang);
        return env.ASSETS.fetch(urlWithLang);
    }
    return next();
  }

  // 2. Diğer her şeyi kullanıcı profil adı olarak gör
  const username = cleanPath.substring(1); 
  const profileUrl = new URL("/profile.html", url.origin);
  profileUrl.searchParams.set("u", username);
  if (currentLang) profileUrl.searchParams.set("lang", currentLang);
  
  return env.ASSETS.fetch(profileUrl);
}
