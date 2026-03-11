import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const adminId = request.headers.get("x-admin-id");

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-id',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (!adminId) {
        return new Response(JSON.stringify({ error: "Missing admin identity" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    try {
        const { data: adminUser } = await supabase.from('users').select('role').eq('id', adminId).single();
        if (!adminUser || adminUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
        }

        const { data: users, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        return new Response(JSON.stringify(users), { status: 200, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
}
