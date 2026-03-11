const path = require('path');

module.exports = async (req, res) => {
  const { action } = req.query;
  
  if (!action) {
    return res.status(400).json({ error: "Missing action parameter" });
  }

  try {
    // Map of actions to their respective logic files in system/api/
    const routes = {
      'auth_login': '../system/api/auth_login.js',
      'auth_register': '../system/api/auth_register.js',
      'admin_users': '../system/api/admin_users.js',
      'admin_create_badge': '../system/api/admin_create_badge.js',
      'admin_delete_user': '../system/api/admin_delete_user.js',
      'admin_get_badges': '../system/api/admin_get_badges.js',
      'admin_set_badges': '../system/api/admin_set_badges.js',
      'admin_set_role': '../system/api/admin_set_role.js',
      'admin_migrate': '../system/api/admin_migrate.js',
      'user_profile': '../system/api/user_profile.js',
      'user_change_username': '../system/api/user_change_username.js',
      'user_change_password': '../system/api/user_change_password.js',
      'profile_update': '../system/api/profile_update.js',
      'temp_promote': '../system/api/temp_promote.js',
      'admin_delete_badge': '../system/api/admin_delete_badge.js'
    };

    const targetFile = routes[action];

    if (!targetFile) {
      return res.status(404).json({ error: `Action ${action} not found` });
    }

    // Require the logic file and call it
    const handler = require(targetFile);
    return await handler(req, res);

  } catch (err) {
    console.error(`Error handling action ${action}:`, err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};
