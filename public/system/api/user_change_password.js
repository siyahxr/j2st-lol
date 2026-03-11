const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Eksik bilgi." });
    }

    // 1. Get current hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı." });
    }

    // 2. Hash old password and compare
    const salt = "j2st_salt";
    const oldHash = crypto.createHash('sha256').update(oldPassword + salt).digest('hex');

    if (oldHash !== user.password_hash) {
      return res.status(403).json({ success: false, error: "Mevcut şifre yanlış." });
    }

    // 3. Hash new password and update
    const newHash = crypto.createHash('sha256').update(newPassword + salt).digest('hex');

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: "Şifre başarıyla güncellendi." });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
