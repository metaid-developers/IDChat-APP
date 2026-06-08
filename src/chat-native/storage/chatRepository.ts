import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatDb } from './chatDatabase';

export type NativeChatRepository = {
  upsertChannel(channel: NativeChatChannel): Promise<void>;
  listChannels(accountGlobalMetaId: string): Promise<NativeChatChannel[]>;
  upsertMessage(message: NativeChatMessage): Promise<void>;
  listMessages(accountGlobalMetaId: string, channelId: string): Promise<NativeChatMessage[]>;
  saveLastReadIndex(accountGlobalMetaId: string, channelId: string, lastReadIndex: number): Promise<void>;
};

export function getMessageDedupeKey(message: NativeChatMessage): string {
  return (
    message.txId ||
    message.pinId ||
    message.mockId ||
    (message.index !== undefined ? `index:${message.index}` : undefined) ||
    `${message.timestamp}:${message.senderGlobalMetaId || ''}:${message.protocol}:${message.content}:${message.attachmentUri || ''}`
  );
}

function compareMessagesByPosition(a: NativeChatMessage, b: NativeChatMessage): number {
  const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
  const indexB = b.index ?? Number.MAX_SAFE_INTEGER;
  return a.timestamp - b.timestamp || indexA - indexB || getMessageDedupeKey(a).localeCompare(getMessageDedupeKey(b));
}

export function createSQLiteChatRepository(db: NativeChatDb): NativeChatRepository {
  return {
    async upsertChannel(channel) {
      await db.runAsync(
        'INSERT OR REPLACE INTO channels (account_global_meta_id, id, payload, updated_at) VALUES (?, ?, ?, ?)',
        channel.accountGlobalMetaId,
        channel.id,
        JSON.stringify(channel),
        channel.updatedAt,
      );
    },
    async listChannels(accountGlobalMetaId) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM channels WHERE account_global_meta_id = ? ORDER BY updated_at DESC',
        accountGlobalMetaId,
      );
      return rows.map((row) => JSON.parse(row.payload));
    },
    async upsertMessage(message) {
      await db.runAsync(
        'INSERT OR REPLACE INTO messages (account_global_meta_id, channel_id, dedupe_key, payload, timestamp) VALUES (?, ?, ?, ?, ?)',
        message.accountGlobalMetaId,
        message.channelId,
        getMessageDedupeKey(message),
        JSON.stringify(message),
        message.timestamp,
      );
    },
    async listMessages(accountGlobalMetaId, channelId) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC, dedupe_key ASC',
        accountGlobalMetaId,
        channelId,
      );
      return rows.map((row) => JSON.parse(row.payload)).sort(compareMessagesByPosition);
    },
    async saveLastReadIndex(accountGlobalMetaId, channelId, lastReadIndex) {
      await db.runAsync(
        'INSERT OR REPLACE INTO read_indexes (account_global_meta_id, channel_id, last_read_index, updated_at) VALUES (?, ?, ?, ?)',
        accountGlobalMetaId,
        channelId,
        lastReadIndex,
        Date.now(),
      );
    },
  };
}

export function createMemoryChatRepository(): NativeChatRepository {
  const channels = new Map<string, NativeChatChannel>();
  const messages = new Map<string, NativeChatMessage>();
  return {
    async upsertChannel(channel) {
      channels.set(`${channel.accountGlobalMetaId}:${channel.id}`, channel);
    },
    async listChannels(accountGlobalMetaId) {
      return Array.from(channels.values())
        .filter((channel) => channel.accountGlobalMetaId === accountGlobalMetaId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async upsertMessage(message) {
      messages.set(
        `${message.accountGlobalMetaId}:${message.channelId}:${getMessageDedupeKey(message)}`,
        message,
      );
    },
    async listMessages(accountGlobalMetaId, channelId) {
      return Array.from(messages.values())
        .filter((message) => message.accountGlobalMetaId === accountGlobalMetaId && message.channelId === channelId)
        .sort(compareMessagesByPosition);
    },
    // Read-index retrieval is represented through channel payloads until a read API exists.
    async saveLastReadIndex() {},
  };
}
