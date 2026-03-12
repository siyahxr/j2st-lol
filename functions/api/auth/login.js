import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { emailOrUser, password } = body;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (!emailOrUser || !password) {
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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq."${emailOrUser}",username.eq."${emailOrUser}"`)
            .eq('password_hash', passwordHash)
            .maybeSingle();

        if (error || !user) {
            console.error("Login attempt failed:", error || "User not found");
            return new Response(JSON.stringify({ success: false, error: "E-posta/Kullanıcı adı veya şifre hatalı." }), { status: 401, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            success: true,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
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
