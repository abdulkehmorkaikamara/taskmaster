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

// ── CONSTANTS ─────────────────────────────────────────────────────
const PORT          = process.env.PORT || 8000;
const FRONTEND      = process.env.FRONTEND_URL || 'http://localhost:3000';
const CLIENT_ORIGIN = (process.env.CLIENT_URL || FRONTEND)
  .split(',')
  .map(o => o.trim());

// ── APP INITIALISATION ────────────────────────────────────────────
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());

/* -----------------------------------------------------------------
   STRIPE WEBHOOK – This is a public endpoint from Stripe.
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
    console.error('⚠️  Stripe webhook signature error:', err.message);
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
// PUBLIC API & WEBHOOKS (Restored Section)
// ===================================================================
function requireApiKey(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.MY_API_KEY) return res.status(401).json({ error: 'Invalid API Key' });
  next();
}

const webhooks = [];
function fireWebhooks(event, payload) {
  webhooks.filter(w => w.event === event).forEach(w => {
    fetch(w.url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ event, payload }) }).catch(console.error);
  });
}

app.get('/api/tasks', requireApiKey, async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM todos');
  res.json(rows);
});

app.post('/api/webhooks/register', requireApiKey, (req, res) => {
  const { url, event } = req.body;
  webhooks.push({ url, event });
  res.json({ success: true });
});


// ===================================================================
// PROTECTED ROUTES (Using requireAuth middleware)
// ===================================================================

// ── BILLING ENDPOINTS ─────────────────────────────────────────────
app.post('/billing/checkout', requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${FRONTEND}/profile?upgrade=success`,
      cancel_url:  `${FRONTEND}/profile?upgrade=cancel`
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// Authenticated user info
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

// ── GOOGLE CALENDAR SYNC ──────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${FRONTEND}/integrations/google/callback`
);

app.get('/integrations/google/connect', requireAuth, (req, res) => {
  const state = Buffer.from(JSON.stringify({ email: req.user.email })).toString('base64');
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: state
  });
  res.redirect(url);
});

app.get('/integrations/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!state) throw new Error("State parameter missing from Google callback");
    const { email } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
    const { tokens } = await oauth2Client.getToken(code);
    await pool.query('UPDATE users SET google_tokens = $1 WHERE email = $2', [tokens, email]);
    res.redirect(`${FRONTEND}/settings/integration?connected=google`);
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(`${FRONTEND}/settings/integration?error=true`);
  }
});

async function pushToGoogleCalendar(userEmail, task) {
    const { rows } = await pool.query('SELECT google_tokens FROM users WHERE email=$1', [userEmail]);
    if (!rows[0]?.google_tokens) return;
    oauth2Client.setCredentials(rows[0].google_tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    if (!task.start_at) {
      if (task.external_event_id) {
          try {
              await calendar.events.delete({ calendarId: 'primary', eventId: task.external_event_id });
              await pool.query('UPDATE todos SET external_event_id = NULL WHERE id = $1', [task.id]);
          } catch(err) {
              if (err.code !== 410) console.error("Could not delete GCal event:", err.message);
          }
      }
      return;
    }
    const event = {
      summary:     task.title,
      description: (task.tags || []).join(', '),
      start:       { dateTime: task.start_at },
      end:         { dateTime: new Date(new Date(task.start_at).getTime() + 3600000).toISOString() }
    };
    try {
      if (task.external_event_id) {
        await calendar.events.update({ calendarId: 'primary', eventId: task.external_event_id, requestBody: event });
      } else {
        const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
        await pool.query('UPDATE todos SET external_event_id=$1 WHERE id=$2', [created.data.id, task.id]);
      }
    } catch (err) {
        console.error("❌ GCal sync error:", err.message);
    }
}

// --- USER SETTINGS ---
app.put('/users/settings', requireAuth, async (req, res) => {
  // We expect the body to be an object with the settings to update
  // e.g., { "widgets": { "showCalendar": true, "showAnalytics": false } }
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ error: 'Settings object is required.' });
  }

  try {
    // The '||' operator merges the existing JSON with the new JSON
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

// Also, add a route to GET the settings
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


// ── ICAL & CSV EXPORT ─────────────────────────────────────────────
app.get('/export/tasks.csv', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id,title,progress,start_at,list_name,tags FROM todos WHERE user_email=$1', [req.user.email]);
  const parser = new Parser({ fields: ['id','title','progress','start_at','list_name','tags'] });
  res.header('Content-Type','text/csv');
  res.attachment('tasks.csv');
  res.send(parser.parse(rows));
});

app.get('/export/tasks.ics', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id,title,start_at FROM todos WHERE user_email=$1 AND start_at IS NOT NULL', [req.user.email]);
  const cal = ical({ name: 'TaskMaster To-Dos' });
  rows.forEach(t => cal.createEvent({ uid: t.id, start: new Date(t.start_at), end: new Date(new Date(t.start_at).getTime()+3600000), summary: t.title }));
  res.header('Content-Type','text/calendar');
  res.attachment('tasks.ics');
  cal.serve(res);
});

// ── LIST SHARING ─────────────────────────────────────────────────
app.post('/lists/:listId/invite', requireAuth, requireListRole('owner'), inviteMember);

// ── TODOS CRUD ───────────────────────────────────────────────────
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
    const newTask = rows[0];
    res.status(201).json(newTask);
    fireWebhooks("task.created", newTask);
    pushToGoogleCalendar(req.user.email, newTask).catch(console.error);
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
    const updatedTask = rows[0];
    res.json(updatedTask);
    fireWebhooks("task.updated", updatedTask);
    pushToGoogleCalendar(req.user.email, updatedTask).catch(console.error);
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
    fireWebhooks('task.deleted', { id: req.params.id });
  } catch (err) {
    console.error('❌ Delete todo error:', err);
    res.status(500).json({ error: 'Failed to delete todo due to a server error.' });
  }
});

// ── ANALYTICS & GAMIFICATION (Protected) ───────────────────────────
app.get('/analytics/productivity', requireAuth, async (req, res) => {
    const productivityQuery = `SELECT DATE(start_at) as day, COUNT(*) FILTER (WHERE progress = 100) as completed, COUNT(*) FILTER (WHERE progress < 100 AND start_at IS NOT NULL) as pending FROM todos WHERE user_email = $1 AND start_at IS NOT NULL GROUP BY DATE(start_at) ORDER BY day;`;
    try {
        const { rows } = await pool.query(productivityQuery, [req.user.email]);
        res.json({ series: rows, avgCompletionMinutes: 0 });
    } catch (err) {
        console.error('❌ Analytics productivity error:', err);
        res.status(500).json({ error: 'Failed to fetch productivity data.' });
    }
});

app.get('/analytics/streaks', requireAuth, async (req, res) => {
    const streakQuery = `SELECT DISTINCT DATE(start_at) as completion_date FROM todos WHERE user_email = $1 AND progress = 100 AND start_at IS NOT NULL ORDER BY completion_date;`;
    try {
        const { rows: completionRows } = await pool.query(streakQuery, [req.user.email]);
        const completionDates = completionRows.map(r => new Date(r.completion_date));
        if (completionDates.length === 0) return res.json({ currentStreak: 0, longestStreak: 0 });
        let longestStreak = 0, currentStreak = 0, streak = 1;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isConsecutive = (d1, d2) => (d2.getTime() - d1.getTime()) / 86400000 === 1;
        for (let i = 1; i < completionDates.length; i++) {
            if (isConsecutive(completionDates[i-1], completionDates[i])) streak++;
            else { longestStreak = Math.max(longestStreak, streak); streak = 1; }
        }
        longestStreak = Math.max(longestStreak, streak);
        const lastCompletionDate = completionDates[completionDates.length - 1];
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (lastCompletionDate.getTime() === today.getTime() || lastCompletionDate.getTime() === yesterday.getTime()) {
            currentStreak = 1;
            for (let i = completionDates.length - 2; i >= 0; i--) {
                if (isConsecutive(completionDates[i], completionDates[i+1])) currentStreak++;
                else break;
            }
        }
        res.json({ currentStreak, longestStreak });
    } catch (err) {
        console.error('❌ Analytics streak error:', err);
        res.status(500).json({ error: 'Failed to calculate streaks.' });
    }
});

app.get('/gamification/status', requireAuth, async (req, res) => {
    try {
        const { rows: completedTasks } = await pool.query("SELECT start_at FROM todos WHERE user_email = $1 AND progress = 100 AND start_at IS NOT NULL", [req.user.email]);
        const completedCount = completedTasks.length;
        const level = Math.floor(Math.sqrt(completedCount / 5)) + 1;
        const badges = [];
        if (completedCount >= 1) badges.push({ name: "First Task", description: "You completed your first task!" });
        if (completedCount >= 10) badges.push({ name: "Task Enthusiast", description: "Completed 10 tasks." });
        if (completedCount >= 50) badges.push({ name: "Productivity Pro", description: "Completed 50 tasks!" });
        if (completedCount >= 100) badges.push({ name: "Century Club", description: "Completed 100 tasks. Amazing!" });
        if (completedTasks.some(t => new Date(t.start_at).getHours() < 9)) badges.push({ name: "Early Bird", description: "Completed a task before 9 AM." });
        if (completedTasks.some(t => new Date(t.start_at).getHours() >= 22)) badges.push({ name: "Night Owl", description: "Completed a task after 10 PM." });
        res.json({ level, badges });
    } catch (err) {
        console.error('❌ Gamification status error:', err);
        res.status(500).json({ error: 'Failed to fetch gamification status.' });
    }
});

// ===================================================================
// PUBLIC ROUTES
// ===================================================================

// ── TAG CLASSIFICATION ───────────────────────────────────────────
app.post('/todos/classify-tags', async (req, res) => {
  try {
    const prompt = `Given a task title, return a JSON array of tags (choose from work, personal, email, phone, urgent). Title: "${req.body.title}" Return exactly like: [\"work\",\"email\"]`;
    const response = await openai.completions.create({ model: 'text-davinci-003', prompt, max_tokens: 50, temperature: 0.2 });
    res.json({ tags: JSON.parse(response.choices[0].text) });
  } catch (err) {
    console.error('❌ Tag classification error:', err);
    res.status(500).json({ error: 'Failed to classify tags.' });
  }
});

// ── AUTHENTICATION ───────────────────────────────────────────────
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

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { rows } = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (!rows.length) return res.status(404).json({ error: 'No such user.' });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);
  await pool.query('INSERT INTO password_resets(email,token,expires_at) VALUES($1,$2,$3)', [email, token, expires]);
  const link = `${FRONTEND}/reset-password?token=${token}`;
  await emailController.sendEmail(email, 'TaskMaster password reset', `Click to reset your password:\n\n${link}\n\nExpires in 1 hour.`);
  res.json({ message: 'Password reset email sent.' });
});

app.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const { rows } = await pool.query('SELECT email,expires_at FROM password_resets WHERE token=$1', [token]);
  if (!rows.length) return res.status(400).json({ error: 'Invalid token.' });
  if (new Date() > rows[0].expires_at) {
    await pool.query('DELETE FROM password_resets WHERE token=$1', [token]);
    return res.status(400).json({ error: 'Token expired.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET hashed_password=$1 WHERE email=$2', [hash, rows[0].email]);
  await pool.query('DELETE FROM password_resets WHERE token=$1', [token]);
  res.json({ message: 'Password has been reset.' });
});

// ── CRON REMINDERS ───────────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Daily overdue task check');
  const today = new Date().toISOString();
  try {
    const { rows } = await pool.query('SELECT id,user_email,title FROM todos WHERE progress<100 AND start_at < $1', [today]);
    for (const t of rows) {
      if (!t.user_email) continue;
      await emailController.sendEmail(t.user_email, 'Overdue Task', `Your task "${t.title}" is overdue.`);
    }
  } catch (err) {
    console.error('❌ Overdue cron error:', err);
  }
});

cron.schedule('* * * * *', async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 5 * 60 * 1000);
  try {
    const { rows } = await pool.query(
      `SELECT id, user_email, title
         FROM todos
        WHERE progress < 100
          AND reminder_sent = false
          AND start_at BETWEEN $1 AND $2`,
      [now.toISOString(), soon.toISOString()],
    );
    for (const t of rows) {
      if (!t.user_email) continue;
      await emailController.sendEmail(t.user_email, "⏰ Upcoming Task Reminder", `Your task “${t.title}” starts soon!`);
      await pool.query("UPDATE todos SET reminder_sent = true WHERE id = $1", [t.id]);
    }
  } catch (err) {
    console.error('❌ Upcoming task cron error:', err);
  }
});

// ── START SERVER ────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
