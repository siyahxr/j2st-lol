const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (meError || !me || (me.role !== 'admin' && me.role !== 'founder')) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const { name, icon_url } = req.body;
    if (!name || !icon_url) return res.status(400).json({ error: "Missing fields" });

    const { error: insertError } = await supabase
      .from('badges')
      .insert([{ name, icon: icon_url, is_global: true }]); // icon_url mapped to legacy icon field

    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
