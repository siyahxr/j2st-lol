const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: JSON.stringify({ success: false, error: "Unauthorized" }) };

  try {
    const { oldPassword, newPassword } = JSON.parse(event.body);

    if (!oldPassword || !newPassword) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Eksik bilgi." }) };
    }

    // 1. Get current hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: "Kullanıcı bulunamadı." }) };
    }

    // 2. Hash old password and compare
    const salt = "j2st_salt";
    const oldHash = crypto.createHash('sha256').update(oldPassword + salt).digest('hex');

    if (oldHash !== user.password_hash) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: "Mevcut şifre yanlış." }) };
    }

    // 3. Hash new password and update
    const newHash = crypto.createHash('sha256').update(newPassword + salt).digest('hex');

    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "Şifre başarıyla güncellendi." })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
