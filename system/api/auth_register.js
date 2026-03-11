const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase Client
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

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { email, username, password } = req.body;
    const salt = "j2st_salt";
    const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');

    // 1. Check if user/email exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq."${email}",username.eq."${username}"`)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, error: "Kullanıcı adı veya e-posta zaten kullanımda." });
    }

    // 2. Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: email,
          username: username,
          password_hash: passwordHash,
          display_name: username, // Default display name
          role: 'user',
          badges: JSON.stringify([{
            id: 'ea_badge',
            name: 'Early Access',
            icon_url: 'fa-solid fa-rocket'
          }])
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: "Hesap başarıyla oluşturuldu!"
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
