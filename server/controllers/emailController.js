// server/controllers/emailController.js
const pool = require('../db')

//const lookupUserFromAlias = require('../utils/lookupUserFromAlias');



exports.parseIncomingEmail = async (req, res) => {
  const { to, from, subject, text } = req.body
  const userEmail = to // TEMP: just use `to` directly until alias parsing is added

  try {
    await pool.query(
      `INSERT INTO todos(user_email, title, progress, date)
       VALUES($1, $2, 0, NOW())`,
      [userEmail, `📧 ${subject}`]
    )
    res.sendStatus(200)
  } catch (err) {
    console.error("❌ Error inserting email todo:", err)
    res.sendStatus(500)
  }
}
