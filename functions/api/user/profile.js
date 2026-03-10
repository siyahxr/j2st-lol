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

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
