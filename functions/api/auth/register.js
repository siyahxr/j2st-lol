export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { email, username, password } = body;
    const id = crypto.randomUUID();

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

    await env.j2st_db.prepare(
      "INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, username, email, passwordHash, username)
    .run();

    return new Response(JSON.stringify({ success: true, uid: id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
