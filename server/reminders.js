// server/reminders.js

const cron = require('node-cron');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// configure your SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// run every day at 8 AM server time
cron.schedule('0 8 * * *', async () => {
  console.log('[reminders] Checking for overdue tasks...');
  try {
    const { rows: overdue } = await pool.query(
      `SELECT user_email, title, date 
       FROM todos
       WHERE progress < 100
         AND date < NOW()`
    );

    // group tasks by user
    const byUser = overdue.reduce((acc, t) => {
      acc[t.user_email] = acc[t.user_email] || [];
      acc[t.user_email].push(t);
      return acc;
    }, {});

    for (const [email, tasks] of Object.entries(byUser)) {
      const taskList = tasks
        .map(t => `• ${t.title} (was due ${t.date.toLocaleString()})`)
        .join('\n');

      await transporter.sendMail({
        from: `"TaskMaster" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: 'Overdue Task Reminder',
        text: `You have ${tasks.length} overdue tasks:\n\n${taskList}`
      });

      console.log(`[reminders] Sent reminder to ${email}`);
    }
  } catch (err) {
    console.error('[reminders] Error sending reminders', err);
  }
});
