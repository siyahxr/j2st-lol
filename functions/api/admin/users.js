export async function onRequestGet({ request, env }) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 2. Identify if requester is a true founder (using role or name check)
    // We check the username too just in case role isn't 'founder' yet
    const me = await env.j2st_db.prepare("SELECT username, role FROM users WHERE id = ?").bind(userId).first();
    const isFounder = me && (me.username.startsWith('$') || me.role === 'founder' || me.role === 'admin' && me.username.startsWith('$'));

    // 3. Get all users. Founders get passwords.
    const selectFields = isFounder 
        ? "id, username, email, password, display_name, role, badges, views, created_at" 
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
