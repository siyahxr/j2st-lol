const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: JSON.stringify({ success: false, error: "Unauthorized" }) };

  try {
    const { userId: targetUserId } = JSON.parse(event.body);

    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (requesterError || !requester || (requester.role !== 'admin' && requester.role !== 'founder')) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: "Access Denied" }) };
    }

    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', targetUserId);

    if (deleteError) throw deleteError;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
