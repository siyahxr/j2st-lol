const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { emailOrUser, password } = req.body;
    const salt = "j2st_salt";
    const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');

    // Query Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq."${emailOrUser}",username.eq."${emailOrUser}"`)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: "Geçersiz kullanıcı adı veya şifre." });
    }

    return res.status(200).json({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email, role: user.role } 
      });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
