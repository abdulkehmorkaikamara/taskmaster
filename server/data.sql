SELECT 'CREATE DATABASE todoapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'todoapp')\gexec

\connect todoapp;

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  hashed_password VARCHAR(255) NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  name VARCHAR(255),
  avatar TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS todos (
  id VARCHAR(255) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_at TIMESTAMPTZ,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  list_name VARCHAR(255) NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  reminder_offset INT,
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_memberships (
  list_id VARCHAR(255) NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  member_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'editor', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, member_email)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_user_email_start_at ON todos(user_email, start_at);
CREATE INDEX IF NOT EXISTS idx_todos_reminders ON todos(reminder_sent, start_at) WHERE progress < 100;
CREATE INDEX IF NOT EXISTS idx_list_memberships_member_email ON list_memberships(member_email);
