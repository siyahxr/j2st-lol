export async function onRequestGet({ request, env }) {
  try {
    const badges = await env.j2st_db.prepare("SELECT * FROM global_badges ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(badges.results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
