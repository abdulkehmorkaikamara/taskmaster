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
const PORT          = process.env.PORT || 8000;
const FRONTEND_URL  = process.env.FRONTEND_URL || 'http://localhost:3000';

// ===================================================================
// FINAL CORS CONFIGURATION
// ===================================================================
const whitelist = (process.env.CLIENT_ORIGIN || '').split(',');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Request from origin ${origin} was blocked.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// ── APP INITIALISATION ────────────────────────────────────────────
const app = express();
app.use(cors(corsOptions));
app.use(cookieParser());

/* -----------------------------------------------------------------
   STRIPE WEBHOOK - This must come before express.json()
   ----------------------------------------------------------------- */
app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
});

app.use(express.json());

// ===================================================================
// PROTECTED ROUTES (Using requireAuth middleware)
// ===================================================================

// --- USER SETTINGS ---
app.put('/users/settings', requireAuth, async (req, res) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Settings object is required.' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET settings = settings || $1 WHERE email = $2 RETURNING settings',
      [settings, req.user.email]
    );
    res.status(200).json(rows[0].settings);
  } catch (err) {
    console.error('❌ Save settings error:', err);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

app.get('/users/settings', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT settings FROM users WHERE email = $1', [req.user.email]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.status(200).json(rows[0].settings || {});
    } catch (err) {
        console.error('❌ Get settings error:', err);
        res.status(500).json({ error: 'Failed to get settings.' });
    }
});

// --- BILLING ---
app.post('/billing/checkout', requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${FRONTEND_URL}/profile?upgrade=success`,
      cancel_url:  `${FRONTEND_URL}/profile?upgrade=cancel`
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// --- USER INFO ---
app.get('/users/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT email, is_premium FROM users WHERE email = $1', [req.user.email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Fetch /users/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// --- TODOS ---
app.get("/todos/:userEmail", requireAuth, async (req, res) => {
  if (req.params.userEmail !== req.user.email) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const { rows } = await pool.query(`SELECT * FROM todos WHERE user_email = $1 ORDER BY start_at ASC NULLS LAST`, [req.user.email]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch todos error:", err);
    res.status(500).json([]);
  }
});

app.post("/todos", requireAuth, async (req, res) => {
  const { title, progress, start_at, is_urgent, is_important, list_name, tags, subtasks, reminder_offset } = req.body;
  const id = uuidv4();
  try {
    const query = `INSERT INTO todos (id, user_email, title, progress, start_at, is_urgent, is_important, list_name, tags, subtasks, reminder_offset, reminder_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false) RETURNING *`;
    const { rows } = await pool.query(query, [id, req.user.email, title, progress, start_at, is_urgent, is_important, list_name, tags, JSON.stringify(subtasks), reminder_offset]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Create todo error:", err);
    res.status(500).json({ error: err.detail || err.message });
  }
});

app.put("/todos/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, progress, start_at, is_urgent, is_important, list_name, tags, subtasks, reminder_offset } = req.body;
  try {
    const query = `UPDATE todos SET title = $1, progress = $2, start_at = $3, is_urgent = $4, is_important = $5, list_name = $6, tags = $7, subtasks = $8, reminder_offset = $9, reminder_sent = CASE WHEN $2 < 100 THEN false ELSE reminder_sent END WHERE id = $10 AND user_email = $11 RETURNING *`;
    const { rows } = await pool.query(query, [title, progress, start_at, is_urgent, is_important, list_name, tags, JSON.stringify(subtasks), reminder_offset, id, req.user.email]);
    if (rows.length === 0) return res.status(404).json({ error: "Task not found or you do not have permission to edit it." });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Update todo error:", err);
    res.status(500).json({ error: err.detail || err.message });
  }
});

app.delete('/todos/:id', requireAuth, async (req, res) => {
  try {
    const deleteQuery = await pool.query('DELETE FROM todos WHERE id=$1 AND user_email = $2', [req.params.id, req.user.email]);
    if (deleteQuery.rowCount === 0) {
        return res.status(404).json({ message: 'Todo not found or you do not have permission to delete it.' });
    }
    res.status(200).json({ message: 'Todo deleted successfully!' });
  } catch (err) {
    console.error('❌ Delete todo error:', err);
    res.status(500).json({ error: 'Failed to delete todo due to a server error.' });
  }
});

// ===================================================================
// PUBLIC ROUTES
// ===================================================================

// --- AUTHENTICATION ---
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });
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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(404).json({ detail: 'User not found.' });
    const passwordMatch = await bcrypt.compare(password, rows[0].hashed_password);
    if (!passwordMatch) return res.status(401).json({ detail: 'Invalid credentials.' });
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ email: rows[0].email, token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ===================================================================
// CRON REMINDERS
// ===================================================================
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Daily overdue task check');
  try {
    const { rows } = await pool.query(`SELECT id, user_email, title FROM todos WHERE progress < 100 AND start_at < NOW()`);
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
