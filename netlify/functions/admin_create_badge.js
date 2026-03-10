const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  try {
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (meError || !me || (me.role !== 'admin' && me.role !== 'founder')) {
      return { statusCode: 403, body: JSON.stringify({ error: "Access Denied" }) };
    }

    const { name, icon_url } = JSON.parse(event.body);
    if (!name || !icon_url) return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };

    const { error: insertError } = await supabase
      .from('badges')
      .insert([{ name, icon: icon_url, is_global: true }]); // icon_url mapped to legacy icon field

    if (insertError) throw insertError;

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
