export async function onRequestPost({ request, env }) {
  const userId = request.headers.get("x-user-id");
  const { oldPassword, newPassword } = await request.json();

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  if (!userId || !oldPassword || !newPassword) {
    return new Response(JSON.stringify({ success: false, error: "Eksik bilgi." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Get user
    const user = await env.j2st_db.prepare(
      "SELECT password_hash FROM users WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Kullanıcı bulunamadı." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Hash old password and compare
    // We use a simple SHA-256 with 'j2st_salt' as seen in the register/login logic
    const encoder = new TextEncoder();
    const data = encoder.encode(oldPassword + "j2st_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const oldHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (oldHash !== user.password_hash) {
      return new Response(JSON.stringify({ success: false, error: "Mevcut şifre yanlış." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Hash new password and update
    const newData = encoder.encode(newPassword + "j2st_salt");
    const newHashBuffer = await crypto.subtle.digest("SHA-256", newData);
    const newHashArray = Array.from(new Uint8Array(newHashBuffer));
    const newHash = newHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    await env.j2st_db.prepare(
      "UPDATE users SET password_hash = ? WHERE id = ?"
    )
      .bind(newHash, userId)
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
