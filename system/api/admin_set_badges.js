const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const requesterId = req.headers["x-user-id"];
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId, badges } = req.body;

    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return res.status(403).json({ error: "Access Denied" });
    }

    let badgeList = badges;
    try {
        if (typeof badges === 'string') badgeList = JSON.parse(badges);
    } catch(e) {}

    // Supabase allows JSONB column, so we can pass an object or array directly.
    const { error: updateError } = await supabase
      .from('users')
      .update({ badges: badgeList })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
