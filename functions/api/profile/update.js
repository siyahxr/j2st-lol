import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const userId = request.headers.get("x-user-id");
    const { id } = body;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (!userId || userId !== id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

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

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-user-id'
        }
    });
}
