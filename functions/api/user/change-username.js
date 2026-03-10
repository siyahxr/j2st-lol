export async function onRequestPost({ request, env }) {
  const userId = request.headers.get("x-user-id");
  const data = await request.json();
  const { newUsername } = data;

  if (!userId || !newUsername) {
    return new Response(JSON.stringify({ success: false, error: "Missing data" }), { status: 400 });
  }

  // Validate username format (simple)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(newUsername)) {
    return new Response(JSON.stringify({ success: false, error: "Username must be 3-20 characters (letters, numbers, underscores)" }), { status: 400 });
  }

  try {
    // 1. Get current user info
    const user = await env.j2st_db.prepare(
      "SELECT username, last_username_change FROM users WHERE id = ?"
    )
    .bind(userId)
    .first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
    }

    // 2. Check cooldown (7 days)
    const now = Date.now();
    const lastChange = user.last_username_change ? parseInt(user.last_username_change) : 0;
    const cooldownMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (now - lastChange < cooldownMs) {
      const remaining = cooldownMs - (now - lastChange);
      const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      return new Response(JSON.stringify({ 
        success: false, 
        error: `HATA: Kullanıcı adını değiştirmek için ${days} gün daha beklemelisin.` 
      }), { status: 403 });
    }

    // 3. Check if new username is taken
    if (newUsername.toLowerCase() !== user.username.toLowerCase()) {
      const existing = await env.j2st_db.prepare(
        "SELECT id FROM users WHERE LOWER(username) = LOWER(?)"
      )
      .bind(newUsername)
      .first();

      if (existing) {
        return new Response(JSON.stringify({ success: false, error: "Bu kullanıcı adı zaten alınmış!" }), { status: 409 });
      }
    }

    // 4. Update
    await env.j2st_db.prepare(
      "UPDATE users SET username = ?, last_username_change = ? WHERE id = ?"
    )
    .bind(newUsername, now.toString(), userId)
    .run();

    return new Response(JSON.stringify({ success: true, message: "Kullanıcı adı başarıyla değiştirildi." }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
