import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use an in-memory database when running tests to avoid polluting the dev database
const DB_PATH =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, '..', 'data', 'tasks.db');

// Ensure the data directory exists (only needed for file-based DB)
import fs from 'fs';
if (DB_PATH !== ':memory:') {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignee_id INTEGER REFERENCES users(id),
      project_id INTEGER NOT NULL REFERENCES projects(id),
      due_date TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function seedData() {
  const existingTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
  if (existingTeams.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding database with initial data...');

  // Create teams
  const insertTeam = db.prepare('INSERT INTO teams (name) VALUES (?)');
  const alphaTeam = insertTeam.run('Alpha Squad');
  const betaTeam = insertTeam.run('Beta Team');

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create users
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, team_id, role) VALUES (?, ?, ?, ?, ?)'
  );
  const alice = insertUser.run('Alice Chen', 'alice@example.com', passwordHash, alphaTeam.lastInsertRowid, 'admin');
  const bob = insertUser.run('Bob Martinez', 'bob@example.com', passwordHash, alphaTeam.lastInsertRowid, 'member');
  const carol = insertUser.run('Carol Williams', 'carol@example.com', passwordHash, betaTeam.lastInsertRowid, 'admin');
  const dave = insertUser.run('Dave Johnson', 'dave@example.com', passwordHash, betaTeam.lastInsertRowid, 'member');

  // Create projects
  const insertProject = db.prepare(
    'INSERT INTO projects (name, description, team_id) VALUES (?, ?, ?)'
  );
  const alphaProject = insertProject.run(
    'Platform Redesign',
    'Modernise the customer-facing platform with new UI components and improved performance.',
    alphaTeam.lastInsertRowid
  );
  const alphaProject2 = insertProject.run(
    'API Integrations',
    'Build and maintain third-party API integrations for payment and notification services.',
    alphaTeam.lastInsertRowid
  );
  const betaProject = insertProject.run(
    'Mobile App v2',
    'Next major version of the mobile application with offline support and new features.',
    betaTeam.lastInsertRowid
  );
  const betaProject2 = insertProject.run(
    'Data Pipeline',
    'ETL pipeline for processing customer analytics and generating weekly reports.',
    betaTeam.lastInsertRowid
  );

  // Create tasks for Alpha Squad - Platform Redesign
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, assignee_id, project_id, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const alphaTasks = [
    ['Redesign navigation menu', 'Update the top navigation to match new brand guidelines. Include mobile-responsive hamburger menu.', 'done', 'high', alice.lastInsertRowid, alphaProject.lastInsertRowid, '2025-11-15', alice.lastInsertRowid],
    ['Implement dark mode toggle', 'Add a dark/light mode preference that persists across sessions using localStorage.', 'in_progress', 'medium', bob.lastInsertRowid, alphaProject.lastInsertRowid, '2025-12-20', alice.lastInsertRowid],
    ['Migrate to design tokens', 'Replace hard-coded colour values with CSS custom properties from the shared design token library.', 'todo', 'medium', alice.lastInsertRowid, alphaProject.lastInsertRowid, '2025-12-31', bob.lastInsertRowid],
    ['Performance audit', 'Run Lighthouse audit and identify top 3 performance bottlenecks. Document findings.', 'todo', 'urgent', bob.lastInsertRowid, alphaProject.lastInsertRowid, null, alice.lastInsertRowid],
    ['Update onboarding flow', 'Simplify the 6-step onboarding to 3 steps based on user research findings.', 'in_progress', 'high', alice.lastInsertRowid, alphaProject.lastInsertRowid, '2026-01-10', alice.lastInsertRowid],
  ];

  const apiTasks = [
    ['Stripe webhook integration', 'Handle payment.succeeded and payment.failed events. Add retry logic for failures.', 'in_progress', 'urgent', alice.lastInsertRowid, alphaProject2.lastInsertRowid, '2025-12-01', alice.lastInsertRowid],
    ['Twilio SMS notifications', 'Send SMS alerts for critical system events. Implement rate limiting per user.', 'todo', 'high', bob.lastInsertRowid, alphaProject2.lastInsertRowid, '2026-01-15', bob.lastInsertRowid],
    ['OAuth2 provider support', 'Add Google and GitHub OAuth2 login as alternatives to email/password.', 'todo', 'medium', null, alphaProject2.lastInsertRowid, '2026-02-01', alice.lastInsertRowid],
  ];

  const betaTasks = [
    ['Offline sync architecture', 'Design and implement conflict resolution for offline edits using CRDTs.', 'in_progress', 'urgent', carol.lastInsertRowid, betaProject.lastInsertRowid, '2025-12-15', carol.lastInsertRowid],
    ['Push notification service', 'Integrate FCM for Android and APNs for iOS push notifications.', 'todo', 'high', dave.lastInsertRowid, betaProject.lastInsertRowid, '2026-01-20', carol.lastInsertRowid],
    ['Biometric authentication', 'Add Face ID and fingerprint login support via device secure storage.', 'done', 'medium', carol.lastInsertRowid, betaProject.lastInsertRowid, '2025-10-30', dave.lastInsertRowid],
    ['App store submission', 'Prepare assets, screenshots, and descriptions for App Store and Play Store submission.', 'todo', 'low', null, betaProject.lastInsertRowid, '2026-03-01', carol.lastInsertRowid],
  ];

  const dataTasks = [
    ['Airflow DAG for nightly ETL', 'Create an Airflow DAG that runs nightly, extracts from Postgres, transforms, and loads into BigQuery.', 'in_progress', 'high', dave.lastInsertRowid, betaProject2.lastInsertRowid, '2025-12-10', carol.lastInsertRowid],
    ['Data quality checks', 'Add Great Expectations suite to validate schema and null constraints on each pipeline run.', 'todo', 'medium', carol.lastInsertRowid, betaProject2.lastInsertRowid, '2026-01-05', dave.lastInsertRowid],
    ['Weekly report automation', 'Auto-generate and email the weekly KPI report PDF using Puppeteer and Sendgrid.', 'cancelled', 'low', dave.lastInsertRowid, betaProject2.lastInsertRowid, '2025-09-01', dave.lastInsertRowid],
  ];

  for (const task of [...alphaTasks, ...apiTasks, ...betaTasks, ...dataTasks]) {
    insertTask.run(...(task as Parameters<typeof insertTask.run>));
  }

  // Create audit log entries
  const insertAudit = db.prepare(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
  );

  const sampleAudits = [
    [alice.lastInsertRowid, 'create', 'task', 1, 'Created task "Redesign navigation menu"'],
    [alice.lastInsertRowid, 'update', 'task', 1, 'Changed status from in_progress to done'],
    [bob.lastInsertRowid, 'create', 'task', 2, 'Created task "Implement dark mode toggle"'],
    [alice.lastInsertRowid, 'create', 'task', 4, 'Created task "Performance audit"'],
    [carol.lastInsertRowid, 'create', 'task', 9, 'Created task "Offline sync architecture"'],
    [dave.lastInsertRowid, 'update', 'task', 11, 'Changed status from in_progress to done'],
    [carol.lastInsertRowid, 'create', 'project', Number(betaProject.lastInsertRowid), 'Created project "Mobile App v2"'],
    [alice.lastInsertRowid, 'update', 'task', 5, 'Changed assignee to Alice Chen'],
    [dave.lastInsertRowid, 'create', 'task', 13, 'Created task "Airflow DAG for nightly ETL"'],
    [carol.lastInsertRowid, 'update', 'task', 15, 'Changed status from in_progress to cancelled'],
  ];

  for (const entry of sampleAudits) {
    insertAudit.run(...(entry as Parameters<typeof insertAudit.run>));
  }

  console.log('Database seeded successfully.');
}

export { db, initSchema, seedData };
