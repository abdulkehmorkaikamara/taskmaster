// server/controllers/userController.js
const pool = require("../db");

const updateUserProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    if (!name && !avatar) {
      return res.status(400).json({ error: 'No update fields provided.' });
    }

    const updateFields = [];
    const updateValues = [];
    let i = 1;

    if (name) {
      updateFields.push(`name = $${i++}`);
      updateValues.push(name);
    }

    if (avatar) {
      updateFields.push(`avatar = $${i++}`);
      updateValues.push(avatar);
    }

    updateValues.push(req.user.email); // For WHERE clause

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE email = $${i} RETURNING name, avatar`;
    const result = await pool.query(query, updateValues);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { updateUserProfile };
