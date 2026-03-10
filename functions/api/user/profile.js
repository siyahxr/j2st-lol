export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  let username = url.searchParams.get("u");

  if (!username) {
    return new Response(JSON.stringify({ error: "Username required" }), { status: 400 });
  }

  // Sanitize '@'
  if (username.startsWith('@')) username = username.substring(1);

  try {
    const user = await env.j2st_db.prepare(`
      SELECT 
        id, username, display_name, bio, avatar_url, banner_url, role, links, badges, 
        avatar_frame_color, icon_color, badge_bg_color, accent_color,
        base_font, base_font_color, name_font, name_font_color, bio_font, bio_font_color,
        card_style, hover_text, link_hover_anim, glitch_avatar,
        profile_music_url, bg_effect, entry_anim, tilt_3d, views, created_at
      FROM users WHERE username = ?
    `)
    .bind(username)
    .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // --- RESOLVE BADGES ---
    let resolvedBadges = [];
    let globalList = [];
    try {
      const allGlobal = await env.j2st_db.prepare("SELECT * FROM global_badges").all();
      globalList = allGlobal.results || [];

      const badgeIds = JSON.parse(user.badges || "[]");
      resolvedBadges = badgeIds.map(bId => {
        const found = globalList.find(gb => gb.id == bId || gb.name == bId);
        return found ? { id: found.id, label: found.name, icon_url: found.icon_url } : null;
      }).filter(b => b !== null);
    } catch (e) {
      console.error("Badge resolution failed:", e);
    }

    // --- VIEW COUNT LOGIC (Unique-ish) ---
    const cookie = request.headers.get("Cookie") || "";
    const viewMark = `v_${user.id}`;
    let updatedViews = user.views || 0;

    if (!cookie.includes(viewMark)) {
      // Not viewed in this session/hour, increment in DB
      await env.j2st_db.prepare("UPDATE users SET views = views + 1 WHERE id = ?").bind(user.id).run();
      updatedViews++;
    }

    const responseData = { 
      ...user, 
      views: updatedViews, 
      badges: resolvedBadges,
      available_badges: globalList 
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 
        "Content-Type": "application/json",
        "Set-Cookie": `${viewMark}=1; Max-Age=3600; Path=/; SameSite=Lax`
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
