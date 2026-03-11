const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const userId = req.headers["x-user-id"];
  const body = req.body;
  const { id } = body;

  if (!userId || userId !== id) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const fields = [
      "display_name", "bio", "avatar_url",
      "avatar_frame_color", "icon_color", "badge_bg_color", "accent_color",
      "base_font", "base_font_color", "name_font", "name_font_color", "bio_font", "bio_font_color",
      "card_style", "hover_text", "link_hover_anim", "glitch_avatar",
      "profile_music_url", "profile_music_url_p2", "profile_music_url_p3", "profile_music_url_p4", "profile_music_url_p5",
      "banner_url", "banner_url_p2", "banner_url_p3", "banner_url_p4", "banner_url_p5",
      "bg_effect", "entry_anim", "tilt_3d", "custom_cursor_url",
      "card_border", "card_opacity", "links", "badges"
    ];

    const updateData = {};
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
