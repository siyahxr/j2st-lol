export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase().replace(/\/$/, "");
  
  // Lang codes to support
  const langCodes = ["tr", "en", "de", "ru"];
  let currentLang = null;
  let cleanPath = path;

  // Check if path starts with a language code (e.g., /tr or /tr/login)
  const parts = path.substring(1).split("/");
  if (parts.length > 0 && langCodes.includes(parts[0])) {
    currentLang = parts[0];
    cleanPath = "/" + parts.slice(1).join("/");
    if (cleanPath === "/") cleanPath = "";
  }

  // 1. Is it an API call? (Always goes to functions)
  if (cleanPath.startsWith("/api/") || cleanPath === "/api") {
    return next();
  }

  // 2. Is it a system (static) path?
  const staticSystemPaths = [
    "/login", "/register", "/dashboard", "/admin", "/profile", "/index", "/home", "/404"
  ];
  const assetFolders = ["/assets", "/css", "/js", "/system", "/p"];

  const isStaticDoc = cleanPath === "" || staticSystemPaths.some(p => cleanPath === p || cleanPath.startsWith(p + "/"));
  const isAsset = assetFolders.some(p => cleanPath === p || cleanPath.startsWith(p + "/"));
  const hasExt = cleanPath.includes(".");

  if (isStaticDoc || isAsset || hasExt) {
    // If it's a known static document but has no extension, we might need to append .html for env.ASSETS.fetch
    // Only if it doesn't already have an extension or it's an asset folder
    if (currentLang) {
      const targetPath = cleanPath === "" ? "/index.html" : (hasExt ? cleanPath : `${cleanPath}.html`);
      const urlWithLang = new URL(targetPath, request.url);
      urlWithLang.searchParams.set("lang", currentLang);
      return env.ASSETS.fetch(urlWithLang);
    }

    // Even without currentLang, if it's a system path and has no extension, let's try next() 
    // Cloudflare Pages usually handles pretty URLs, but just in case:
    return next();
  }

  // 3. Fallback: Treat as username profile
  // Extract username after the leading slash
  const username = cleanPath.substring(1);
  if (!username) return next();

  const profileUrl = new URL("/profile.html", url.origin);
  profileUrl.searchParams.set("u", username);
  if (currentLang) profileUrl.searchParams.set("lang", currentLang);
  
  return env.ASSETS.fetch(profileUrl);
}
