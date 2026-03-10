exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      success: true, 
      message: "Supabase tables are managed via init_supabase.sql. Manual migration endpoint is retired." 
    })
  };
};
