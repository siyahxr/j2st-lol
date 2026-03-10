export async function onRequestPost({ request, env }) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const user = await env.j2st_db.prepare("SELECT role FROM users WHERE id = ?").bind(userId).first();
    if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
      return new Response("Forbidden", { status: 403 });
    }

    const { name, icon_url } = await request.json();
    if (!name || !icon_url) return new Response("Missing fields", { status: 400 });

    await env.j2st_db.prepare(
      "INSERT INTO global_badges (name, icon_url) VALUES (?, ?)"
    ).bind(name, icon_url).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
