export async function onRequestPost({ request, env }) {
  const userId = request.headers.get("x-user-id");
  const { id, display_name, bio, avatar_url, banner_url, banner_opacity, card_opacity } = await request.json();

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  // Verify user can only update their own profile
  if (userId !== id) {
    return new Response(JSON.stringify({ success: false, error: "Access denied: You can only update your own profile" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    await env.j2st_db.prepare(
      "UPDATE users SET display_name = ?, bio = ?, avatar_url = ?, banner_url = ?, banner_opacity = ?, card_opacity = ? WHERE id = ?"
    )
      .bind(display_name, bio, avatar_url, banner_url, banner_opacity, card_opacity, id)
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
