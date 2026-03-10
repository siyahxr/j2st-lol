const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  const { newUsername } = JSON.parse(event.body);

  if (!userId || !newUsername) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing data" }) };
  }

  // Validate username format (simple)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(newUsername)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Username must be 3-20 characters (letters, numbers, underscores)" }) };
  }

  try {
    // 1. Get current user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, last_username_change')
      .eq('id', userId)
      .single();

    if (userError || !user) {
        return { statusCode: 404, body: JSON.stringify({ success: false, error: "User not found" }) };
    }

    // 2. Check cooldown (7 days)
    const now = Date.now();
    const lastChange = user.last_username_change ? parseInt(user.last_username_change) : 0;
    const cooldownMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (now - lastChange < cooldownMs) {
      const remaining = cooldownMs - (now - lastChange);
      const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      return { 
        statusCode: 403, 
        body: JSON.stringify({ 
          success: false, 
          error: `HATA: Kullanıcı adını değiştirmek için ${days} gün daha beklemelisin.` 
        })
      };
    }

    // 3. Check if new username is taken
    if (newUsername.toLowerCase() !== user.username.toLowerCase()) {
      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('id')
        .ilike('username', newUsername)
        .maybeSingle();

      if (existing) {
        return { statusCode: 409, body: JSON.stringify({ success: false, error: "Bu kullanıcı adı zaten alınmış!" }) };
      }
    }

    // 4. Update
    const { error: updateError } = await supabase
        .from('users')
        .update({ username: newUsername, last_username_change: now })
        .eq('id', userId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "Kullanıcı adı başarıyla değiştirildi." })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
