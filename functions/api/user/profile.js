export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const username = url.searchParams.get("u");

  if (!username) {
    return new Response(JSON.stringify({ error: "Kullanıcı adı gerekli" }), { status: 400 });
  }

  try {
    const user = await env.j2st_db.prepare(
      "SELECT id, username, display_name, bio, avatar_url, banner_url, role, links, badges, banner_opacity, card_opacity, created_at FROM users WHERE username = ?"
    )
    .bind(username)
    .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Kullanıcı bulunamadı" }), { status: 404 });
    }

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
