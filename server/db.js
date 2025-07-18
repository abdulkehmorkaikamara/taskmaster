// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

// This configuration object will be used to connect to the database.
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

// --- THIS IS THE CRUCIAL PART ---
// When the application is running in a production environment (like Render),
// it needs to use SSL to connect to the database securely.
// Render sets the NODE_ENV variable to 'production' automatically.
if (process.env.NODE_ENV === 'production') {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(dbConfig);

module.exports = pool;
