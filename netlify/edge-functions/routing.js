export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase().replace(/\/$/, "");

  // Lang codes to support
  const langCodes = ["tr", "en", "de", "ru"];
  let currentLang = null;
  let cleanPath = path;

  // Check for language code
  const parts = path.substring(1).split("/");
  if (parts.length > 0 && langCodes.includes(parts[0])) {
    currentLang = parts[0];
    cleanPath = "/" + parts.slice(1).join("/");
    if (cleanPath === "/") cleanPath = "";
  }

  // Exclude API, Assets, and existing static docs
  const staticDocs = ["/login", "/register", "/dashboard", "/admin", "/profile", "/index", "/home", "/404"];
  const assetFolders = ["/assets", "/css", "/js", "/system", "/p"];
  
  const isDoc = cleanPath === "" || staticDocs.some(p => cleanPath === p || cleanPath.startsWith(p + "/"));
  const isAsset = assetFolders.some(p => cleanPath === p || cleanPath.startsWith(p + "/"));
  const hasExt = cleanPath.includes(".");
  
  if (isDoc || isAsset || hasExt || cleanPath.startsWith("/api/")) {
    return; // Let Netlify handle these via standard routing / _redirects
  }

  // Fallback: Profile routing (e.g. j2st.lol/username)
  const username = cleanPath.substring(1);
  if (!username) return;

  const profileUrl = new URL("/profile.html", url.origin);
  profileUrl.searchParams.set("u", username);
  if (currentLang) profileUrl.searchParams.set("lang", currentLang);

  return profileUrl;
};

export const config = {
  path: "/*",
  excludedPath: ["/assets/*", "/css/*", "/js/*", "/system/*", "/api/*", "/_next/*", "/.netlify/*"]
};
