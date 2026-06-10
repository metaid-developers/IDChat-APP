import * as SQLite from 'expo-sqlite';

export type NativeChatDb = SQLite.SQLiteDatabase;

async function ensureColumn(db: NativeChatDb, tableName: string, columnName: string, ddl: string): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);

  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`);
  }
}

export async function openNativeChatDatabase(): Promise<NativeChatDb> {
  const db = await SQLite.openDatabaseAsync('native-idchat.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS channels (
      account_global_meta_id TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      dedupe_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      message_index INTEGER,
      PRIMARY KEY (account_global_meta_id, channel_id, dedupe_key)
    );
    CREATE TABLE IF NOT EXISTS read_indexes (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      last_read_index INTEGER NOT NULL,
      message_timestamp INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id)
    );
    CREATE TABLE IF NOT EXISTS message_windows (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      oldest_loaded_index INTEGER,
      newest_loaded_index INTEGER,
      has_more_older INTEGER NOT NULL,
      has_more_newer INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id)
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      account_global_meta_id TEXT NOT NULL,
      profile_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, profile_key)
    );
    CREATE TABLE IF NOT EXISTS group_info (
      account_global_meta_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, group_id)
    );
    CREATE TABLE IF NOT EXISTS group_members (
      account_global_meta_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      role TEXT,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, group_id, member_id)
    );
    CREATE TABLE IF NOT EXISTS channel_settings (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id)
    );
    CREATE TABLE IF NOT EXISTS mentions (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_key TEXT NOT NULL,
      mentioned_global_meta_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      read_at INTEGER,
      PRIMARY KEY (account_global_meta_id, channel_id, message_key, mentioned_global_meta_id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_window
      ON messages (account_global_meta_id, channel_id, message_index);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp
      ON messages (account_global_meta_id, channel_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_group_members_group
      ON group_members (account_global_meta_id, group_id, role, updated_at);
    CREATE INDEX IF NOT EXISTS idx_mentions_unread
      ON mentions (account_global_meta_id, channel_id, read_at, timestamp);
  `);
  await ensureColumn(db, 'messages', 'message_index', 'message_index INTEGER');
  await ensureColumn(db, 'read_indexes', 'message_timestamp', 'message_timestamp INTEGER');
  return db;
}
