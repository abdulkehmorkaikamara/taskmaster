require('dotenv').config();

// ── LIBRARY IMPORTS ────────────────────────────────────────────────
const express        = require('express');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt         = require('bcrypt');
const jwt            = require('jsonwebtoken');
const cron           = require('node-cron');
const { google }     = require('googleapis');
const ical           = require('ical-generator');
const { Parser }     = require('json2csv');
const fetch          = require('node-fetch');
const crypto         = require('crypto');
const stripe         = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OpenAI         = require('openai');

// ── PROJECT IMPORTS ───────────────────────────────────────────────
const pool             = require('./db');
const emailController  = require('./controllers/emailController');
const requireAuth      = require('./middleware/requireAuth');
const requireListRole  = require('./middleware/requireListRole');
const { inviteMember } = require('./controllers/listsController');

// ── OPENAI INITIALISATION ─────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── CONSTANTS & CONFIG ────────────────────────────────────────────
const PORT         = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── APP INITIALISATION ────────────────────────────────────────────
const app = express();

// ── CORS CONFIGURATION ────────────────────────────────────────────
const whitelist = [FRONTEND_URL];
const corsOptions = {
  origin: whitelist,
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── COOKIE PARSER ─────────────────────────────────────────────────
app.use(cookieParser());

// ── STRIPE WEBHOOK (RAW BODY PARSER) ──────────────────────────────
app.post(
  '/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const email = event.data.object.customer_details.email;
      try {
        await pool.query('UPDATE users SET is_premium = TRUE WHERE email = $1', [email]);
        console.log(`✅ ${email} marked premium`);
      } catch (e) {
        console.error('❌ DB update error:', e);
      }
    }
    res.json({ received: true });
  }
);

// ── JSON BODY PARSER ──────────────────────────────────────────────
app.use(express.json());

// ===================================================================
// PUBLIC ROUTES
// ===================================================================

// TAG CLASSIFICATION
app.post('/todos/classify-tags', async (req, res) => {
  try {
    const prompt = `Given a task title, return a JSON array of tags (choose from work, personal, email, phone, urgent). Title: "${req.body.title}" Return exactly like: [\"work\",\"email\"]`;
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 50,
      temperature: 0.2,
    });
    res.json({ tags: JSON.parse(response.choices[0].text) });
  } catch (err) {
    console.error('❌ Tag classification error:', err);
    res.status(500).json({ error: 'Failed to classify tags.' });
  }
});

// SIGNUP
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    await pool.query('INSERT INTO users(email,hashed_password) VALUES($1,$2)', [email, hash]);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ email, token });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: 'Signup failed. Email may already be in use.' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) {
      return res.status(404).json({ detail: 'User not found.' });
    }
    const valid = await bcrypt.compare(password, rows[0].hashed_password);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid credentials.' });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ email: rows[0].email, token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// FORGOT PASSWORD
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (!rows.length) {
    return res.status(404).json({ error: 'No such user.' });
  }
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);
  await pool.query('INSERT INTO password_resets(email,token,expires_at) VALUES($1,$2,$3)', [email, token, expires]);
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  await emailController.sendEmail(
    email,
    'TaskMaster password reset',
    `Click to reset your password:\n\n${link}\n\nExpires in 1 hour.`
  );
  res.json({ message: 'Password reset email sent.' });
});

// RESET PASSWORD
app.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const { rows } = await pool.query('SELECT email,expires_at FROM password_resets WHERE token = $1', [token]);
  if (!rows.length) {
    return res.status(400).json({ error: 'Invalid token.' });
  }
  if (new Date() > rows[0].expires_at) {
    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
    return res.status(400).json({ error: 'Token expired.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET hashed_password = $1 WHERE email = $2', [hash, rows[0].email]);
  await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
  res.json({ message: 'Password has been reset.' });
});

// ===================================================================
// CRON REMINDERS
// ===================================================================
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Daily overdue task check');
  try {
    const { rows } = await pool.query(
      `SELECT id, user_email, title FROM todos WHERE progress < 100 AND start_at < NOW()`
    );
    for (const t of rows) {
      if (!t.user_email) continue;
      await emailController.sendEmail(t.user_email, 'Overdue Task', `Your task \"${t.title}\" is overdue.`);
    }
  } catch (err) {
    console.error('❌ Overdue cron error:', err);
  }
});

cron.schedule('* * * * *', async () => {
  console.log('⏰ Checking for upcoming tasks...');
  try {
    const { rows } = await pool.query(
      `SELECT id, user_email, title FROM todos
       WHERE progress < 100
         AND reminder_sent = false
         AND start_at BETWEEN NOW() AND NOW() + INTERVAL '5 minutes'`
    );
    for (const t of rows) {
      if (!t.user_email) continue;
      await emailController.sendEmail(t.user_email, '⏰ Upcoming Task Reminder', `Your task \"${t.title}\" starts soon!`);
      await pool.query('UPDATE todos SET reminder_sent = true WHERE id = $1', [t.id]);
    }
  } catch (err) {
    console.error('❌ Upcoming task cron error:', err);
  }
});

// ── START SERVER ────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
