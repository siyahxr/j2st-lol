export async function onRequestGet({ request, env }) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 1. Check if requester is admin/founder
    const requester = await env.j2st_db.prepare(
      "SELECT role FROM users WHERE id = ?"
    )
    .bind(userId)
    .first();

    if (!requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // 2. If authorized, get all users
    const users = await env.j2st_db.prepare(
      "SELECT id, username, email, display_name, role, badges, created_at FROM users ORDER BY created_at DESC"
    ).all();

    return new Response(JSON.stringify(users.results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
