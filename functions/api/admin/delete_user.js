export async function onRequestPost({ request, env }) {
    const userId = request.headers.get("x-user-id");
    const data = await request.json();
    const { userId: targetUserId } = data;

    if (!userId) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    try {
        // Check if requester is admin
        const requester = await env.j2st_db.prepare("SELECT role FROM users WHERE id = ?").bind(userId).first();

        // Only allow delete if requester is admin or founder
        if (requester?.role !== 'admin') {
            return new Response(JSON.stringify({ success: false, error: "Only admins can delete users" }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        // Delete user
        await env.j2st_db.prepare("DELETE FROM users WHERE id = ?").bind(targetUserId).run();

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
