const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetEmail = 'chelamia92@gmail.com';

    // 1. Kullanıcıyı bul
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('email', targetEmail)
      .single();

    if (findError || !user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı: " + targetEmail });
    }

    // 2. Rolü admin yap
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: `${user.username} (${targetEmail}) başarıyla Admin yapıldı!`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
