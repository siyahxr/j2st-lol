const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapped)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
