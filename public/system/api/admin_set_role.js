const { createClient } = require('@supabase/supabase-js');

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

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const requesterId = req.headers["x-user-id"];
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { userId, role } = req.body;

    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: role })
      .eq('id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
