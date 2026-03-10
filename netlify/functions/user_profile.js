const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

  const { u: usernameParam } = event.queryStringParameters || {};
  if (!usernameParam) return { statusCode: 400, body: JSON.stringify({ error: "Username required" }) };

  let username = usernameParam;
  if (username.startsWith('@')) username = username.substring(1);

  try {
    // 1. Fetch User Data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (userError || !user) {
      return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
    }

    // 2. Fetch Global Badges for resolution
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_global', true);

    const globalList = allBadges || [];

    // 3. Resolve Badges (User stores IDs in a JSONB array)
    let userBadgeIds = [];
    try {
        userBadgeIds = Array.isArray(user.badges) ? user.badges : JSON.parse(user.badges || "[]");
    } catch(e) { userBadgeIds = [] }

    const resolvedBadges = userBadgeIds.map(bId => {
        const found = globalList.find(gb => gb.id == bId || gb.name == bId);
        return found ? { id: found.id, label: found.name, icon_url: found.icon } : null;
    }).filter(b => b !== null);

    // 4. View Count Logic (Throttled by cookie)
    const cookieHeader = event.headers["cookie"] || "";
    const viewMark = `v_${user.id}`;
    let updatedViews = user.views || 0;
    let setCookie = null;

    if (!cookieHeader.includes(viewMark)) {
      // Not viewed in this session/hour, increment in DB
      await supabase.from('users').update({ views: updatedViews + 1 }).eq('id', user.id);
      updatedViews++;
      setCookie = `${viewMark}=1; Max-Age=3600; Path=/; SameSite=Lax`;
    }

    const responseData = { 
      ...user, 
      views: updatedViews, 
      badges: resolvedBadges,
      available_badges: globalList 
    };

    // Remove sensitive data
    delete responseData.password_hash;

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        ...(setCookie && { "Set-Cookie": setCookie })
      },
      body: JSON.stringify(responseData)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
