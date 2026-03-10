export async function onRequestPost({ request, env }) {
  const requesterId = request.headers.get("x-user-id");
  const { userId, badges } = await request.json();

  if (!requesterId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 1. Check if requester is authorized
    const requester = await env.j2st_db.prepare(
      "SELECT role FROM users WHERE id = ?"
    )
    .bind(requesterId)
    .first();

    if (!requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403 });
    }

    // 2. Perform update
    // 'badges' should be a JSON string like '["badge1", "badge2"]'
    await env.j2st_db.prepare(
      "UPDATE users SET badges = ? WHERE id = ?"
    )
    .bind(JSON.stringify(badges), userId)
    .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
