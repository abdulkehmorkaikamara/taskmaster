// controllers/listsController.js
const pool = require('../db');
const emailController = require('./emailController');

/**
 * POST /lists/:listId/invite
 * Body: { email: string, role: 'viewer'|'editor' }
 */


exports.inviteMember = async (req, res) => {
  const { listId }      = req.params;
  const { email, role } = req.body;
  const inviter         = req.user?.email || req.cookies.Email;

  // 1) insert into DB
  await pool.query(
    `INSERT INTO list_memberships(list_id,member_email,role)
       VALUES($1,$2,$3)
       ON CONFLICT DO NOTHING`,
    [listId, email, role]
  );

  // 2) send the invitation email
  const subject = `${inviter} invited you to collaborate on a list`;
  const body    = `
    Hi there,
    
    ${inviter} has given you ${role} access to their TaskMaster list.
    Click here to view: ${process.env.CLIENT_URL}/?listId=${listId}
    
    — TaskMaster
  `;
  await emailController.sendEmail(email, subject, body);

  res.json({ success: true });
};

async function inviteMember(req, res) {
  const { listId } = req.params;
  const { email, role } = req.body;

  if (!email || !['viewer','editor'].includes(role)) {
    return res.status(400).json({ error: 'Must supply email and valid role' });
  }

  try {
    // You might want to check that the list exists, etc.
    await pool.query(
      `INSERT INTO list_memberships(list_id, member_email, role)
       VALUES($1,$2,$3)
       ON CONFLICT(list_id, member_email) DO UPDATE SET role = EXCLUDED.role;`,
      [listId, email, role]
    );
    res.json({ success: true, listId, invited: email, role });
  } catch (err) {
    console.error('❌ inviteMember error:', err);
    res.status(500).json({ error: 'Failed to invite member' });
  }
}

module.exports = { inviteMember };
