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
}

