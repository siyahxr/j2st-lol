const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  try {
    // 1. Authorization check
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', userId)
      .single();

    if (meError || !me) return { statusCode: 403, body: JSON.stringify({ error: "Access Denied" }) };

    const isFounder = me.username.startsWith('$') || me.role === 'founder';
    const isAdmin = me.role === 'admin';

    if (!isAdmin && !isFounder) {
      return { statusCode: 403, body: JSON.stringify({ error: "Access Denied" }) };
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
