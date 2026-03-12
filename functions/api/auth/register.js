import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { email, username, password } = body;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (!email || !username || !password) {
        return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    try {
        const salt = "j2st_salt";
        
        // Native Web Crypto API
        const msgBuffer = new TextEncoder().encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const passwordHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // 1. Check if user/email exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq."${email}",username.eq."${username}"`)
            .maybeSingle();

        if (existingUser) {
            return new Response(JSON.stringify({ success: false, error: "Kullanıcı adı veya e-posta zaten kullanımda." }), { status: 400, headers: corsHeaders });
        }

        // 2. Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    email: email,
                    username: username,
                    password_hash: passwordHash,
                    display_name: username,
                    role: 'user',
                    badges: [ 'ea_badge' ] // Store as array
                }
            ])
            .select('id, username, email, role')
            .single();

        if (insertError) throw insertError;

        return new Response(JSON.stringify({
            success: true,
            message: "Hesap başarıyla oluşturuldu!",
            user: newUser
        }), { status: 200, headers: corsHeaders });

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
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
