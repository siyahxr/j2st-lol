export async function onRequestGet({ request, env }) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const user = await env.j2st_db.prepare("SELECT role FROM users WHERE id = ?").bind(userId).first();
    if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
      return new Response("Forbidden", { status: 403 });
    }

    const badges = await env.j2st_db.prepare("SELECT * FROM global_badges ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(badges.results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
