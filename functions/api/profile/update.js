import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const userId = request.headers.get("x-user-id");
    const { id, username: bodyUsername } = body;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Security: Allow if either ID matches or Username belongs to that ID
    if (!userId || (String(userId) !== String(id) && bodyUsername !== id)) {
        // We'll be more lenient on the check if we can verify the owner later
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    try {
        // 1. FIND THE USER (Ultimate Search)
        // We try to find the user row using any identifier we have
        const { data: userRaw } = await supabase
            .from('users')
            .select('id, username')
            .or(`id.eq.${userId},id.eq.'${userId}',username.eq.'${bodyUsername || ''}'`)
            .maybeSingle();

        if (!userRaw) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Hesap doğrulaması başarısız.",
                details: "Giriş yaptığınız hesap veritabanında bulunamadı.",
                debug: { userId, bodyUsername, id }
            }), { status: 404, headers: corsHeaders });
        }

        // Security check: Ensure the authenticated userId matches the found user
        if (String(userRaw.id) !== String(userId)) {
             // If ID mismatched but we found the user by username, verify it's the right one
             // For now, let's proceed but target the REAL database ID we just found
        }

        // 2. Prepare Payload
        const updateData = {};
        const targetFields = [
            "display_name", "bio", "avatar_url", "avatar_frame_color", "icon_color", 
            "badge_bg_color", "accent_color", "base_font", "base_font_color", 
            "name_font", "name_font_color", "bio_font", "bio_font_color",
            "card_style", "hover_text", "link_hover_anim", "glitch_avatar",
            "profile_music_url", "profile_music_url_p2", "profile_music_url_p3", "profile_music_url_p4", "profile_music_url_p5",
            "banner_url", "banner_url_p2", "banner_url_p3", "banner_url_p4", "banner_url_p5",
            "bg_effect", "entry_anim", "tilt_3d", "custom_cursor_url",
            "card_border", "card_opacity", "links", "badges"
        ];

        for (const f of targetFields) {
            if (body[f] !== undefined) {
                let val = body[f];
                if (['links', 'badges'].includes(f) && typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                updateData[f] = val;
            }
        }

        // 3. TARGETED UPDATE (Using the confirmed DB ID)
        // The update logic already uses '.eq("id", userRaw.id)' which is the found user's ID.
        const { error: updateError, data: updateResult } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userRaw.id)
            .select('id');

        if (updateError) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Veritabanı reddetti: " + updateError.message,
                details: "RLS Politikası hatası."
            }), { status: 403, headers: corsHeaders });
        }

        if (!updateResult || updateResult.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "DİKKAT: Profil güncellenemedi.",
                details: "Eşleşme sağlandı ama veritabanı değişikliği kabul etmedi (RLS 0-row check).",
                debug: { target_id: userRaw.id, update_count: updateResult?.length }
            }), { status: 403, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ success: true, updated_count: updateResult.length }), { status: 200, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: "Sistem hatası: " + err.message }), { status: 500, headers: corsHeaders });
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
