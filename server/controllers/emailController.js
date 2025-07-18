// server/controllers/emailController.js
const pool       = require('../db');
const nodemailer = require('nodemailer');

// make sure dotenv is loaded (you already do this in server.js)
require('dotenv').config();

// create a reusable transporter with your .env SMTP_* settings
const transporter = nodemailer.createTransport({
  host:     process.env.SMTP_HOST,
  port:     Number(process.env.SMTP_PORT),
  secure:   process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})


exports.sendEmail = async (to, subject, text) => {
  return transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to,
    subject,
    text,
  })
}

// helper to send outbound mail
async function sendEmail(to, subject, text) {
  await transporter.sendMail({
    from:    process.env.SMTP_FROM, // e.g. "TaskMaster <no-reply@yourdomain.com>"
    to,
    subject,
    text
  });
}

// inbound (Mailgun, SendGrid, etc.) webhook handler
async function parseIncomingEmail(req, res) {
  const { to, from, subject, text } = req.body;
  const userEmail = to; // or parse aliases if you’re doing “task+alias@…” routing

  try {
    await pool.query(
      `INSERT INTO todos(user_email, title, progress, date)
       VALUES($1, $2, 0, NOW())`,
      [userEmail, `📧 ${subject}`]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error inserting email todo:", err);
    res.sendStatus(500);
  }
}

module.exports = {
  sendEmail,
  parseIncomingEmail
};
