import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('u');

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (!usernameParam) {
        return new Response(JSON.stringify({ error: "Username required" }), { status: 400, headers: corsHeaders });
    }

    let username = usernameParam;
    if (username.startsWith('@')) username = username.substring(1);

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    try {
        // 1. Fetch User
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
        }

        // 2. Resolve Badges
        const { data: allBadges } = await supabase
            .from('badges')
            .select('*')
            .eq('is_global', true);

        const globalList = allBadges || [];
        let userBadgeIds = [];
        try {
            userBadgeIds = Array.isArray(user.badges) ? user.badges : JSON.parse(user.badges || "[]");
        } catch (e) { userBadgeIds = []; }

        const resolvedBadges = userBadgeIds.map(bId => {
            const found = globalList.find(gb => gb.id == bId || gb.name == bId);
            return found ? { id: found.id, label: found.name, icon_url: found.icon } : null;
        }).filter(b => b !== null);

        // 3. View Logic (Simple for Workers)
        let updatedViews = (user.views || 0) + 1;
        await supabase.from('users').update({ views: updatedViews }).eq('id', user.id);

        const responseData = {
            ...user,
            views: updatedViews,
            badges: resolvedBadges,
            available_badges: globalList,
            social_links: user.social_links || []
        };

        delete responseData.password_hash;

        return new Response(JSON.stringify(responseData), { status: 200, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
