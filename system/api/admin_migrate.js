module.exports = async (req, res) => {
  return res.status(200).json({ 
      success: true, 
      message: "Supabase tables are managed via init_supabase.sql. Manual migration endpoint is retired." 
    });
};
