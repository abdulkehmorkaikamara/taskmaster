// server/db.js
require('dotenv').config();
const { Pool } = require('pg');

let dbConfig;

// 1) If you have a single DATABASE_URL (e.g. on Render), use it:
if (process.env.DATABASE_URL) {
  dbConfig = { connectionString: process.env.DATABASE_URL };
} else {
  // 2) Otherwise fall back to the .env values you listed:
  dbConfig = {
    user:     process.env.DB_USER   // if you ever set DB_USER
           || process.env.USER      // your .env: USER=brainwill
           || '',

    password: String(
      process.env.DB_PASSWORD       // if you ever set DB_PASSWORD
      || process.env.PASSWORD       // your .env: PASSWORD="Wisdom@2024"
      || ''
    ),

    host:     process.env.DB_HOST   // if you ever set DB_HOST
           || process.env.HOST      // your .env: HOST=localhost
           || 'localhost',

    port:     parseInt(
      process.env.DB_PORT           // if you ever set DB_PORT
      || process.env.DBPORT         // your .env: DBPORT=5432
      || '5432',
      10
    ),

    database: process.env.DB_NAME   // if you ever set DB_NAME
           || process.env.DATABASE  // some envs use DATABASE
           || 'todoapp',
  };
}

// 3) In production (NODE_ENV=production), Postgres on Render requires SSL:
if (process.env.NODE_ENV === 'production') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(dbConfig);
module.exports = pool;
