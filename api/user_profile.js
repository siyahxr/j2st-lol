const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const { u: usernameParam } = req.query || {};
  if (!usernameParam) return res.status(400).json({ error: "Username required" });

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
      return res.status(404).json({ error: "User not found" });
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
    const cookieHeader = req.headers["cookie"] || "";
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

    return res.status(200).json(responseData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
