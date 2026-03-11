const routes = {
  'auth_login': require('../system/api/auth_login.js'),
  'auth_register': require('../system/api/auth_register.js'),
  'admin_users': require('../system/api/admin_users.js'),
  'admin_create_badge': require('../system/api/admin_create_badge.js'),
  'admin_delete_user': require('../system/api/admin_delete_user.js'),
  'admin_get_badges': require('../system/api/admin_get_badges.js'),
  'admin_set_badges': require('../system/api/admin_set_badges.js'),
  'admin_set_role': require('../system/api/admin_set_role.js'),
  'admin_migrate': require('../system/api/admin_migrate.js'),
  'user_profile': require('../system/api/user_profile.js'),
  'user_change_username': require('../system/api/user_change_username.js'),
  'user_change_password': require('../system/api/user_change_password.js'),
  'profile_update': require('../system/api/profile_update.js'),
  'temp_promote': require('../system/api/temp_promote.js'),
  'admin_delete_badge': require('../system/api/admin_delete_badge.js')
};

module.exports = async (req, res) => {
  try {
    const { action } = req.query;
    
    if (!action) {
      return res.status(400).json({ error: "Missing action parameter" });
    }

    const handler = routes[action];

    if (!handler) {
      return res.status(404).json({ error: `Action ${action} not found` });
    }

    return await handler(req, res);

  } catch (err) {
    console.error(`Error handling API request:`, err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};
