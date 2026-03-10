export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase().replace(/\/$/, "");
  
  // 1. Her zaman izin verilen (sistem) yolları
  const systemPaths = [
    "/login", "/register", "/dashboard", "/admin", "/profile", "/index", "/home", "/404",
    "/api", "/assets", "/css", "/js", "/functions"
  ];

  // Eğer yol boşsa (root), login, register veya bir dosya (nokta içeriyorsa) ise dokunma
  if (path === "" || systemPaths.some(p => path === p || path.startsWith(p + "/")) || path.includes(".")) {
    return next();
  }

  // 2. Diğer her şeyi kullanıcı profil adı olarak gör
  // Kullanıcı adını al (/username -> username)
  const username = path.substring(1); 
  
  // profile.html içeriğini bu URL için servis et ama URL'yi bozma
  // Not: query param 'u' ile profile.js'in anlamasını sağlıyoruz
  const profileUrl = new URL("/profile.html", url.origin);
  profileUrl.searchParams.set("u", username);
  
  // Bu içeriği çekip dönüyoruz (rewrite)
  return env.ASSETS.fetch(profileUrl);
}
