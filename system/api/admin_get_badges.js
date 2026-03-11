const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_global', true)
      .order('id', { ascending: false }); // Using ID for order since created_at is default current timestamp

    if (badgesError) throw badgesError;

    // Map icon back for legacy compatibility 
    const mapped = badges.map(b => ({
        ...b,
        icon_url: b.icon 
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
