require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");


// Create Express app FIRST before using it
const app = express();
const PORT = process.env.PORT ?? 8000;

// Controllers
const emailController = require("./controllers/emailController");
// const calendarController = require("./controllers/calendarController"); // Uncomment if using

// Middleware
app.use(cors());
app.use(express.json());

// Stripe webhook (must use raw body)
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️  Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.metadata.userEmail;

      pool.query(
        "UPDATE users SET is_premium = true WHERE email = $1",
        [userEmail],
        (err) => {
          if (err) console.error("❌ Error marking premium:", err);
          else console.log(`✅ ${userEmail} is now premium`);
        }
      );
    }

    res.json({ received: true });
  }
);

// Email webhook route
app.post("/webhooks/email", emailController.parseIncomingEmail);

// Optional Google Calendar Auth
// app.get("/auth/calendar/google", calendarController.redirectToGoogleOAuth);
// app.get("/auth/calendar/google/callback", calendarController.handleGoogleCallback);

// Stripe checkout
app.post("/create-checkout-session", async (req, res) => {
  const { userEmail } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/settings?canceled=true`,
      metadata: { userEmail },
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get all todos
app.get("/todos/:userEmail", async (req, res) => {
  const { userEmail } = req.params;
  try {
    const todos = await pool.query(
      "SELECT * FROM todos WHERE user_email = $1",
      [userEmail]
    );
    res.json(todos.rows);
  } catch (err) {
    console.error("❌ Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos." });
  }
});

// Create a todo
app.post("/todos", async (req, res) => {
  const {
    user_email,
    title,
    progress,
    date,
    is_urgent,
    is_important,
    list_name,
  } = req.body;
  const id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO todos(id, user_email, title, progress, date, is_urgent, is_important, list_name)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        user_email,
        title,
        progress,
        date,
        is_urgent,
        is_important,
        list_name,
      ]
    );
    res.status(201).json({ message: "Todo created successfully!" });
  } catch (err) {
    console.error("❌ Error creating todo:", err);
    res.status(500).json({ error: "Failed to create todo." });
  }
});

// Update a todo
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const {
    user_email,
    title,
    progress,
    date,
    is_urgent,
    is_important,
    list_name,
  } = req.body;

  try {
    await pool.query(
      `UPDATE todos
         SET user_email=$1, title=$2, progress=$3, date=$4,
             is_urgent=$5, is_important=$6, list_name=$7
       WHERE id=$8;`,
      [
        user_email,
        title,
        progress,
        date,
        is_urgent,
        is_important,
        list_name,
        id,
      ]
    );
    res.json({ message: "Todo updated successfully!" });
  } catch (err) {
    console.error("❌ Error updating todo:", err);
    res.status(500).json({ error: "Failed to update todo." });
  }
});

// Delete a todo
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM todos WHERE id = $1;", [id]);
    res.json({ message: "Todo deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting todo:", err);
    res.status(500).json({ error: "Failed to delete todo." });
  }
});

// Signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    await pool.query(
      `INSERT INTO users (email, hashed_password) VALUES($1, $2)`,
      [email, hashedPassword]
    );

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ email, token });
  } catch (err) {
    console.error("❌ Error signing up user:", err);
    res.status(500).json({ error: "Signup failed." });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (!users.rows.length) {
      return res.status(404).json({ detail: "User does not exist!" });
    }

    const success = await bcrypt.compare(
      password,
      users.rows[0].hashed_password
    );

    if (!success) return res.status(401).json({ detail: "Login failed" });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ email: users.rows[0].email, token });
  } catch (err) {
    console.error("❌ Error logging in user:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Start the server
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
