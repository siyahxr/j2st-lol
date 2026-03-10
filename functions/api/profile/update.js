export async function onRequestPost({ request, env }) {
  const userId = request.headers.get("x-user-id");
  const data = await request.json();
  const { id } = data;

  if (!userId || userId !== id) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const fields = [
      "display_name", "bio", "avatar_url", "banner_url",
      "avatar_frame_color", "icon_color", "badge_bg_color", "accent_color",
      "base_font", "base_font_color", "name_font", "name_font_color", "bio_font", "bio_font_color",
      "card_style", "hover_text", "link_hover_anim", "glitch_avatar",
      "profile_music_url", "bg_effect", "entry_anim", "tilt_3d", "custom_cursor_url"
    ];

    let query = "UPDATE users SET ";
    query += fields.map(f => `${f} = ?`).join(", ");
    query += " WHERE id = ?";

    const values = fields.map(f => data[f]);
    values.push(id);

    await env.j2st_db.prepare(query).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
