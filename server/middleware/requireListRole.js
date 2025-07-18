// middleware/requireListRole.js
const pool = require('../db');

module.exports = function requireListRole(roleRequired) {
  return async (req, res, next) => {
    const userEmail = req.user.email;
    const { listId } = req.params;

    const { rows } = await pool.query(
      `SELECT role FROM list_memberships
         WHERE list_id = $1 AND member_email = $2`,
      [listId, userEmail]
    );

    if (!rows.length) {
      return res.status(403).send('Not a member of this list');
    }

    const hierarchy = { viewer: 0, editor: 1, owner: 2 };
    const userRole = rows[0].role;

    if (hierarchy[userRole] < hierarchy[roleRequired]) {
      return res.status(403).send('Insufficient permissions');
    }

    next();
  };
};
