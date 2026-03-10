const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const requesterId = event.headers["x-user-id"];
  if (!requesterId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  try {
    const { userId, badges } = JSON.parse(event.body);

    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return { statusCode: 403, body: JSON.stringify({ error: "Access Denied" }) };
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
