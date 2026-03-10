export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { emailOrUser, password } = body;

    const encoder = new TextEncoder();
    const data = encoder.encode(password + "j2st_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (!env.j2st_db) {
      return new Response(JSON.stringify({ success: false, error: "Database binding missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await env.j2st_db.prepare(
      "SELECT * FROM users WHERE (email = ? OR username = ?) AND password_hash = ?"
    )
    .bind(emailOrUser, emailOrUser, passwordHash)
    .first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Geçersiz bilgiler" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role } 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
