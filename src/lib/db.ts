import { createClient, Client, InArgs, InStatement } from '@libsql/client'

let dbInstance: Client | null = null

function getDb(): Client {
  if (!dbInstance) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set')
    }

    dbInstance = createClient({
      url,
      authToken: authToken || undefined,
    })
  }
  return dbInstance
}

export async function executeQuery(sql: string, args: InArgs = []) {
  const client = getDb()
  try {
    return await client.execute({ sql, args })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message?.includes('no such table') && process.env.AUTO_INIT_SCHEMA !== 'false') {
      console.log('Schema not found, attempting auto-initialization...')
      try {
        await initializeSchema()
        return await client.execute({ sql, args })
      } catch (initError) {
        console.error('Auto-initialization failed:', initError)
        throw error
      }
    }
    throw error
  }
}

export async function batchQueries(statements: Array<{ sql: string; args?: InArgs }>) {
  const client = getDb()
  const normalizedStatements: InStatement[] = statements.map(s => ({
    sql: s.sql,
    args: s.args || [],
  }))
  return client.batch(normalizedStatements)
}

export async function getFirstRow<T = Record<string, unknown>>(
  sql: string,
  args: InArgs = []
): Promise<T | null> {
  const result = await executeQuery(sql, args)
  return (result.rows[0] as T) || null
}

export async function getAllRows<T = Record<string, unknown>>(
  sql: string,
  args: InArgs = []
): Promise<T[]> {
  const result = await executeQuery(sql, args)
  return result.rows as T[]
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#6366f1',
  profile_photo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  target_unit TEXT DEFAULT 'ml',
  assigned_by TEXT,
  is_custom INTEGER DEFAULT 0,
  frequency TEXT DEFAULT 'daily',
  goal_area TEXT,
  due_time TEXT,
  reminder_enabled INTEGER DEFAULT 0,
  reminder_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES family_members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS goal_completions (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  date TEXT NOT NULL,
  value REAL,
  notes TEXT,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS water_entries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  amount_ml REAL NOT NULL,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_entries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  activity TEXT,
  notes TEXT,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  default_duration INTEGER DEFAULT 30,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES family_members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  goal_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  member_id TEXT,
  goal_id TEXT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  original_name TEXT,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS family_settings (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark',
  background_type TEXT DEFAULT 'gradient',
  background_value TEXT DEFAULT 'default',
  background_fit TEXT DEFAULT 'cover',
  background_position TEXT DEFAULT 'center',
  background_blur INTEGER DEFAULT 0,
  background_overlay REAL DEFAULT 0.6,
  background_overlay_color TEXT DEFAULT '#000000',
  background_contain_color TEXT DEFAULT '#0f0f23',
  accent_color TEXT DEFAULT '#8b5cf6',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS steps_entries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  steps INTEGER NOT NULL,
  date TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_steps_member_date ON steps_entries(member_id, date);

CREATE TABLE IF NOT EXISTS mindfulness_entries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mindfulness_member_date ON mindfulness_entries(member_id, date);
`

export async function initializeSchema() {
  const client = getDb()
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      await client.execute(statement)
    } catch (error: unknown) {
      const err = error as Error
      if (!err.message?.includes('already exists')) {
        console.error('Schema error:', err.message)
      }
    }
  }

  // Run migrations
  await runMigrations()

  return { success: true }
}

async function runMigrations() {
  const client = getDb()

  // Add goal_area column if it doesn't exist
  try {
    await client.execute('ALTER TABLE goals ADD COLUMN goal_area TEXT')
  } catch (error: unknown) {
    // Column already exists, ignore
  }

  // Create default steps goal for existing users who don't have one
  try {
    const { v4: uuidv4 } = await import('uuid')
    const members = await getAllRows<{ id: string }>('SELECT id FROM family_members')
    for (const member of members) {
      const existingGoal = await getFirstRow(
        "SELECT id FROM goals WHERE member_id = ? AND type = 'steps'",
        [member.id]
      )
      if (!existingGoal) {
        await executeQuery(
          `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, frequency)
           VALUES (?, ?, 'steps', 'Daily Steps', 'Track your daily steps and stay active', 10000, 'steps', 'daily')`,
          [uuidv4(), member.id]
        )
      }
    }
  } catch (error: unknown) {
    // Migration already applied or error, ignore
  }

  // Create default mindfulness goal for existing users who don't have one
  try {
    const { v4: uuidv4 } = await import('uuid')
    const members = await getAllRows<{ id: string }>('SELECT id FROM family_members')
    for (const member of members) {
      const existingGoal = await getFirstRow(
        "SELECT id FROM goals WHERE member_id = ? AND type = 'mindfulness'",
        [member.id]
      )
      if (!existingGoal) {
        await executeQuery(
          `INSERT INTO goals (id, member_id, type, title, description, target_value, target_unit, frequency)
           VALUES (?, ?, 'mindfulness', 'Daily Mindfulness', 'Practice mindfulness meditation to reduce stress and improve focus. Recommended: 15 minutes daily', 15, 'minutes', 'daily')`,
          [uuidv4(), member.id]
        )
      }
    }
  } catch (error: unknown) {
    // Migration already applied or error, ignore
  }

  // Update existing water goals from 2000ml to 3000ml with new peer-reviewed source
  try {
    await executeQuery(
      `UPDATE goals
       SET target_value = 3000,
           description = 'Recommended daily intake: Men 3.7L (125 oz), Women 2.7L (91 oz), Teens 2-3L, Children 1-2L. Source: National Academies of Sciences - https://nap.nationalacademies.org/read/10925'
       WHERE type = 'water'
       AND target_value = 2000`,
      []
    )
  } catch (error: unknown) {
    // Migration already applied or error, ignore
  }
}


