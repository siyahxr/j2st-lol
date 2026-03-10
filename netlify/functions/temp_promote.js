const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  try {
    const targetEmail = 'chelamia92@gmail.com';
    
    // 1. Kullanıcıyı bul
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('email', targetEmail)
      .single();

    if (findError || !user) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: "Kullanıcı bulunamadı: " + targetEmail }) 
      };
    }

    // 2. Rolü admin yap
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        success: true, 
        message: `${user.username} (${targetEmail}) başarıyla Admin yapıldı!` 
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
