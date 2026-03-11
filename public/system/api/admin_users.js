const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Authorization check
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', userId)
      .single();

    if (meError || !me) return res.status(403).json({ error: "Access Denied" });

    const isFounder = me.username.startsWith('$') || me.role === 'founder';
    const isAdmin = me.role === 'admin';

    if (!isAdmin && !isFounder) {
      return res.status(403).json({ error: "Access Denied" });
    }

    // 2. Get all users. Founders get password hash. 
    const selectFields = isFounder
      ? "id, username, email, password_hash, display_name, role, badges, views, created_at"
      : "id, username, email, display_name, role, badges, views, created_at";

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(selectFields)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Map password_hash to password for legacy compatibility if needed
    if (isFounder) {
      users.forEach(u => {
        u.password = u.password_hash;
        delete u.password_hash;
      });
    }

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
