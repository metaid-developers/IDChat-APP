import type { NativeChatChannel, NativeChatMessage, NativeChatUserProfile } from '../domain/types';
import type { NativeChatDb } from './chatDatabase';

export type NativeChatMessageWindowState = {
  accountGlobalMetaId: string;
  channelId: string;
  oldestLoadedIndex?: number;
  newestLoadedIndex?: number;
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  updatedAt: number;
};

export type NativeChatRepository = {
  upsertChannel(channel: NativeChatChannel): Promise<void>;
  listChannels(accountGlobalMetaId: string): Promise<NativeChatChannel[]>;
  upsertMessage(message: NativeChatMessage): Promise<void>;
  listMessages(accountGlobalMetaId: string, channelId: string): Promise<NativeChatMessage[]>;
  listLatestMessages(accountGlobalMetaId: string, channelId: string, limit: number): Promise<NativeChatMessage[]>;
  listMessagesBefore(
    accountGlobalMetaId: string,
    channelId: string,
    beforeIndex: number,
    limit: number,
  ): Promise<NativeChatMessage[]>;
  listMessagesAfter(
    accountGlobalMetaId: string,
    channelId: string,
    afterIndex: number,
    limit: number,
  ): Promise<NativeChatMessage[]>;
  hasContinuousMessageRange(
    accountGlobalMetaId: string,
    channelId: string,
    startIndex: number,
    endIndex: number,
  ): Promise<boolean>;
  saveMessageWindowState(state: NativeChatMessageWindowState): Promise<void>;
  getMessageWindowState(
    accountGlobalMetaId: string,
    channelId: string,
  ): Promise<NativeChatMessageWindowState | undefined>;
  upsertUserProfile(profile: NativeChatUserProfile): Promise<void>;
  getUserProfile(accountGlobalMetaId: string, profileKey: string): Promise<NativeChatUserProfile | undefined>;
  listUserProfiles(accountGlobalMetaId: string, profileKeys: string[]): Promise<NativeChatUserProfile[]>;
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

function compareMessagesByWindowPosition(a: NativeChatMessage, b: NativeChatMessage): number {
  if (a.index !== undefined && b.index !== undefined && a.index !== b.index) {
    return a.index - b.index;
  }

  return compareMessagesByPosition(a, b);
}

function getBoundedLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.floor(limit);
}

function getIndexedMessages(messages: NativeChatMessage[]): NativeChatMessage[] {
  return messages
    .filter((message) => message.index !== undefined)
    .sort(compareMessagesByWindowPosition);
}

function sortWindowMessages(messages: NativeChatMessage[]): NativeChatMessage[] {
  return [...messages].sort(compareMessagesByWindowPosition);
}

function hasContinuousRange(messages: NativeChatMessage[], startIndex: number, endIndex: number): boolean {
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || startIndex > endIndex) {
    return false;
  }

  const indexedMessages = getIndexedMessages(messages).filter(
    (message) => (message.index as number) >= startIndex && (message.index as number) <= endIndex,
  );

  if (indexedMessages.length !== endIndex - startIndex + 1) {
    return false;
  }

  return indexedMessages.every((message, offset) => message.index === startIndex + offset);
}

function parseMessageRows(rows: Array<{ payload: string }>): NativeChatMessage[] {
  return rows.map((row) => JSON.parse(row.payload));
}

function parseProfileRows(rows: Array<{ payload: string }>): NativeChatUserProfile[] {
  return rows.map((row) => JSON.parse(row.payload));
}

function normalizeWindowStateRow(row: {
  account_global_meta_id: string;
  channel_id: string;
  oldest_loaded_index: number | null;
  newest_loaded_index: number | null;
  has_more_older: number;
  has_more_newer: number;
  updated_at: number;
}): NativeChatMessageWindowState {
  return {
    accountGlobalMetaId: row.account_global_meta_id,
    channelId: row.channel_id,
    oldestLoadedIndex: row.oldest_loaded_index ?? undefined,
    newestLoadedIndex: row.newest_loaded_index ?? undefined,
    hasMoreOlder: row.has_more_older === 1,
    hasMoreNewer: row.has_more_newer === 1,
    updatedAt: row.updated_at,
  };
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
        'INSERT OR REPLACE INTO messages (account_global_meta_id, channel_id, dedupe_key, payload, timestamp, message_index) VALUES (?, ?, ?, ?, ?, ?)',
        message.accountGlobalMetaId,
        message.channelId,
        getMessageDedupeKey(message),
        JSON.stringify(message),
        message.timestamp,
        message.index ?? null,
      );
    },
    async listMessages(accountGlobalMetaId, channelId) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC, dedupe_key ASC',
        accountGlobalMetaId,
        channelId,
      );
      return parseMessageRows(rows).sort(compareMessagesByPosition);
    },
    async listLatestMessages(accountGlobalMetaId, channelId, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      const indexedRows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? AND message_index IS NOT NULL ORDER BY message_index DESC LIMIT ?',
        accountGlobalMetaId,
        channelId,
        boundedLimit,
      );

      if (indexedRows.length > 0) {
        return sortWindowMessages(parseMessageRows(indexedRows));
      }

      const fallbackRows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp DESC, dedupe_key DESC LIMIT ?',
        accountGlobalMetaId,
        channelId,
        boundedLimit,
      );

      return sortWindowMessages(parseMessageRows(fallbackRows));
    },
    async listMessagesBefore(accountGlobalMetaId, channelId, beforeIndex, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? AND message_index IS NOT NULL AND message_index < ? ORDER BY message_index DESC LIMIT ?',
        accountGlobalMetaId,
        channelId,
        beforeIndex,
        boundedLimit,
      );

      if (rows.length > 0) {
        return sortWindowMessages(parseMessageRows(rows));
      }

      const allRows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC, dedupe_key ASC',
        accountGlobalMetaId,
        channelId,
      );

      return getIndexedMessages(parseMessageRows(allRows))
        .filter((message) => (message.index as number) < beforeIndex)
        .slice(-boundedLimit);
    },
    async listMessagesAfter(accountGlobalMetaId, channelId, afterIndex, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? AND message_index IS NOT NULL AND message_index > ? ORDER BY message_index ASC LIMIT ?',
        accountGlobalMetaId,
        channelId,
        afterIndex,
        boundedLimit,
      );

      if (rows.length > 0) {
        return sortWindowMessages(parseMessageRows(rows));
      }

      const allRows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC, dedupe_key ASC',
        accountGlobalMetaId,
        channelId,
      );

      return getIndexedMessages(parseMessageRows(allRows))
        .filter((message) => (message.index as number) > afterIndex)
        .slice(0, boundedLimit);
    },
    async hasContinuousMessageRange(accountGlobalMetaId, channelId, startIndex, endIndex) {
      if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || startIndex > endIndex) {
        return false;
      }

      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? AND message_index IS NOT NULL AND message_index >= ? AND message_index <= ? ORDER BY message_index ASC',
        accountGlobalMetaId,
        channelId,
        startIndex,
        endIndex,
      );

      if (rows.length > 0) {
        return hasContinuousRange(parseMessageRows(rows), startIndex, endIndex);
      }

      const allRows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC, dedupe_key ASC',
        accountGlobalMetaId,
        channelId,
      );

      return hasContinuousRange(parseMessageRows(allRows), startIndex, endIndex);
    },
    async saveMessageWindowState(state) {
      await db.runAsync(
        `INSERT OR REPLACE INTO message_windows (
          account_global_meta_id,
          channel_id,
          oldest_loaded_index,
          newest_loaded_index,
          has_more_older,
          has_more_newer,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        state.accountGlobalMetaId,
        state.channelId,
        state.oldestLoadedIndex ?? null,
        state.newestLoadedIndex ?? null,
        state.hasMoreOlder ? 1 : 0,
        state.hasMoreNewer ? 1 : 0,
        state.updatedAt,
      );
    },
    async getMessageWindowState(accountGlobalMetaId, channelId) {
      const rows = await db.getAllAsync<{
        account_global_meta_id: string;
        channel_id: string;
        oldest_loaded_index: number | null;
        newest_loaded_index: number | null;
        has_more_older: number;
        has_more_newer: number;
        updated_at: number;
      }>(
        'SELECT account_global_meta_id, channel_id, oldest_loaded_index, newest_loaded_index, has_more_older, has_more_newer, updated_at FROM message_windows WHERE account_global_meta_id = ? AND channel_id = ? LIMIT 1',
        accountGlobalMetaId,
        channelId,
      );

      return rows[0] ? normalizeWindowStateRow(rows[0]) : undefined;
    },
    async upsertUserProfile(profile) {
      await db.runAsync(
        'INSERT OR REPLACE INTO user_profiles (account_global_meta_id, profile_key, payload, updated_at) VALUES (?, ?, ?, ?)',
        profile.accountGlobalMetaId,
        profile.profileKey,
        JSON.stringify(profile),
        profile.updatedAt,
      );
    },
    async getUserProfile(accountGlobalMetaId, profileKey) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM user_profiles WHERE account_global_meta_id = ? AND profile_key = ? LIMIT 1',
        accountGlobalMetaId,
        profileKey,
      );

      return rows[0] ? JSON.parse(rows[0].payload) : undefined;
    },
    async listUserProfiles(accountGlobalMetaId, profileKeys) {
      const uniqueProfileKeys = Array.from(new Set(profileKeys.filter(Boolean)));

      if (uniqueProfileKeys.length === 0) {
        return [];
      }

      const placeholders = uniqueProfileKeys.map(() => '?').join(', ');
      const rows = await db.getAllAsync<{ payload: string }>(
        `SELECT payload FROM user_profiles WHERE account_global_meta_id = ? AND profile_key IN (${placeholders}) ORDER BY updated_at DESC`,
        accountGlobalMetaId,
        ...uniqueProfileKeys,
      );

      return parseProfileRows(rows);
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
  const messageWindows = new Map<string, NativeChatMessageWindowState>();
  const userProfiles = new Map<string, NativeChatUserProfile>();

  function listChannelMessages(accountGlobalMetaId: string, channelId: string): NativeChatMessage[] {
    return Array.from(messages.values())
      .filter((message) => message.accountGlobalMetaId === accountGlobalMetaId && message.channelId === channelId);
  }

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
      return listChannelMessages(accountGlobalMetaId, channelId).sort(compareMessagesByPosition);
    },
    async listLatestMessages(accountGlobalMetaId, channelId, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      const channelMessages = listChannelMessages(accountGlobalMetaId, channelId);
      const indexedMessages = getIndexedMessages(channelMessages);
      const windowSource = indexedMessages.length > 0 ? indexedMessages : sortWindowMessages(channelMessages);
      return windowSource.slice(-boundedLimit);
    },
    async listMessagesBefore(accountGlobalMetaId, channelId, beforeIndex, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      return getIndexedMessages(listChannelMessages(accountGlobalMetaId, channelId))
        .filter((message) => (message.index as number) < beforeIndex)
        .slice(-boundedLimit);
    },
    async listMessagesAfter(accountGlobalMetaId, channelId, afterIndex, limit) {
      const boundedLimit = getBoundedLimit(limit);

      if (boundedLimit === 0) {
        return [];
      }

      return getIndexedMessages(listChannelMessages(accountGlobalMetaId, channelId))
        .filter((message) => (message.index as number) > afterIndex)
        .slice(0, boundedLimit);
    },
    async hasContinuousMessageRange(accountGlobalMetaId, channelId, startIndex, endIndex) {
      return hasContinuousRange(listChannelMessages(accountGlobalMetaId, channelId), startIndex, endIndex);
    },
    async saveMessageWindowState(state) {
      messageWindows.set(`${state.accountGlobalMetaId}:${state.channelId}`, state);
    },
    async getMessageWindowState(accountGlobalMetaId, channelId) {
      return messageWindows.get(`${accountGlobalMetaId}:${channelId}`);
    },
    async upsertUserProfile(profile) {
      userProfiles.set(`${profile.accountGlobalMetaId}:${profile.profileKey}`, profile);
    },
    async getUserProfile(accountGlobalMetaId, profileKey) {
      return userProfiles.get(`${accountGlobalMetaId}:${profileKey}`);
    },
    async listUserProfiles(accountGlobalMetaId, profileKeys) {
      const uniqueProfileKeys = Array.from(new Set(profileKeys.filter(Boolean)));
      return uniqueProfileKeys
        .map((profileKey) => userProfiles.get(`${accountGlobalMetaId}:${profileKey}`))
        .filter((profile): profile is NativeChatUserProfile => Boolean(profile))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    // Read-index retrieval is represented through channel payloads until a read API exists.
    async saveLastReadIndex() {},
  };
}
