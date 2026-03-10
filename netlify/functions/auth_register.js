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
    const { email, username, password } = JSON.parse(event.body);
    const salt = "j2st_salt";
    const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');

    // 1. Check if user/email exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq."${email}",username.eq."${username}"`)
      .maybeSingle();

    if (existingUser) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Kullanıcı adı veya e-posta zaten kullanımda." })
      };
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
          role: 'user'
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        success: true, 
        message: "Hesap başarıyla oluşturuldu!" 
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
