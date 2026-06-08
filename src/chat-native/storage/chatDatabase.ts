import * as SQLite from 'expo-sqlite';

export type NativeChatDb = SQLite.SQLiteDatabase;

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
      PRIMARY KEY (account_global_meta_id, channel_id, dedupe_key)
    );
    CREATE TABLE IF NOT EXISTS read_indexes (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      last_read_index INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id)
    );
  `);
  return db;
}
