export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const password = url.searchParams.get("password");

  // Simple security check - you can change this or use a session
  if (password !== "j2st_migrate_2026") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Update Users Table with new Appearance columns
    const columns = [
      "avatar_frame_color TEXT DEFAULT 'none'",
      "icon_color TEXT DEFAULT '#ffffff'",
      "badge_bg_color TEXT DEFAULT 'rgba(255,255,255,0.04)'",
      "accent_color TEXT DEFAULT '#ffffff'",
      "base_font TEXT DEFAULT 'Outfit'",
      "base_font_color TEXT DEFAULT '#ffffff'",
      "name_font TEXT DEFAULT 'Outfit'",
      "name_font_color TEXT DEFAULT '#ffffff'",
      "bio_font TEXT DEFAULT 'Outfit'",
      "bio_font_color TEXT DEFAULT 'rgba(255,255,255,0.7)'",
      "card_style TEXT DEFAULT 'glass'",
      "hover_text TEXT DEFAULT ''",
      "link_hover_anim TEXT DEFAULT 'none'",
      "glitch_avatar INTEGER DEFAULT 0",
      "profile_music_url TEXT DEFAULT ''",
      "background_video_url TEXT DEFAULT ''",
      "tilt_3d INTEGER DEFAULT 0",
      "bg_effect TEXT DEFAULT 'none'",
      "entry_anim TEXT DEFAULT 'fadeIn'",
      "custom_cursor_url TEXT DEFAULT ''",
      "views INTEGER DEFAULT 0"
    ];

    for (const col of columns) {
        try {
            await env.j2st_db.prepare(`ALTER TABLE users ADD COLUMN ${col}`).run();
        } catch (e) {
            // Probably column already exists
            console.log(`Column sync: ${col.split(' ')[0]} might already exist.`);
        }
    }

    // 2. Create Global Badges Table
    await env.j2st_db.prepare(`
        CREATE TABLE IF NOT EXISTS global_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    return new Response(JSON.stringify({ success: true, message: "Migration completed successfully." }), {
        headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
}
