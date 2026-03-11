const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    const { badgeId } = req.body;
    if (!badgeId) return res.status(400).json({ success: false, error: "Badge ID missing" });

    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (requesterError || !requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    const { error: deleteError } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
