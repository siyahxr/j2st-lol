const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { emailOrUser, password } = JSON.parse(event.body);
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
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Geçersiz kullanıcı adı veya şifre." })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email, role: user.role } 
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
