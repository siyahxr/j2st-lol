export async function onRequestGet({ request, env }) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 1. Authorization check
    const me = await env.j2st_db.prepare("SELECT username, role FROM users WHERE id = ?").bind(userId).first();
    const isFounder = me && (me.username.startsWith('$') || me.role === 'founder');
    const isAdmin = me && me.role === 'admin';

    if (!me || (!isAdmin && !isFounder)) {
      return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // 2. Get all users. Founders get password hash. 
    const selectFields = isFounder 
        ? "id, username, email, password_hash as password, display_name, role, badges, views, created_at" 
        : "id, username, email, display_name, role, badges, views, created_at";

    const users = await env.j2st_db.prepare(
      `SELECT ${selectFields} FROM users ORDER BY created_at DESC`
    ).all();

    return new Response(JSON.stringify(users.results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
