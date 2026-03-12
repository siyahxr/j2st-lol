import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
        return new Response(JSON.stringify({ success: false, error: "Oturum gerekli" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    try {
        const body = await request.json();

        // Sadece güvenli alanları güncelle
        const allowedFields = [
            "display_name", "bio", "avatar_url", "banner_url",
            "profile_music_url", "custom_cursor_url",
            "accent_color", "icon_color", "name_font", "name_font_color",
            "bio_font", "bio_font_color",
            "card_style", "card_border", "card_opacity",
            "bg_effect", "entry_anim", "tilt_3d", "glitch_avatar",
            "links", "badges",
            "social_instagram", "social_x", "social_tiktok", "social_youtube"
        ];

        const updateData = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                // JSON string ise direkt ata, array/object ise stringifyla
                if (typeof body[field] === 'object') {
                    updateData[field] = JSON.stringify(body[field]);
                } else {
                    updateData[field] = body[field];
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return new Response(JSON.stringify({ success: false, error: "Güncellenecek veri yok" }), { status: 400, headers: corsHeaders });
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error("Update Error:", error);
            return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error("Server Error:", err);
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
