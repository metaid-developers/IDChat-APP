import { createMemoryChatRepository, createSQLiteChatRepository } from '../chatRepository';
import type { NativeChatChannel, NativeChatMessage, NativeChatUserProfile } from '../../domain/types';

function createFakeDb() {
  const channels = new Map<string, { payload: string; updated_at: number }>();
  const messages = new Map<string, {
    payload: string;
    timestamp: number;
    dedupe_key: string;
    message_index: number | null;
  }>();
  const readIndexes = new Map<string, { last_read_index: number; updated_at: number }>();
  const messageWindows = new Map<string, {
    account_global_meta_id: string;
    channel_id: string;
    oldest_loaded_index: number | null;
    newest_loaded_index: number | null;
    has_more_older: number;
    has_more_newer: number;
    updated_at: number;
  }>();
  const userProfiles = new Map<string, {
    account_global_meta_id: string;
    profile_key: string;
    payload: string;
    updated_at: number;
  }>();

  function getMessageRows(accountGlobalMetaId: string, channelId: string) {
    return Array.from(messages.entries())
      .filter(([key]) => key.startsWith(`${accountGlobalMetaId}:${channelId}:`))
      .map(([, row]) => row);
  }

  function toPayloadRows(rows: Array<{ payload: string }>) {
    return rows.map(({ payload }) => ({ payload }));
  }

  return {
    async runAsync(sql: string, ...args: unknown[]) {
      if (sql.startsWith('INSERT OR REPLACE INTO channels')) {
        const [accountGlobalMetaId, id, payload, updatedAt] = args as [string, string, string, number];
        channels.set(`${accountGlobalMetaId}:${id}`, { payload, updated_at: updatedAt });
        return;
      }

      if (sql.startsWith('INSERT OR REPLACE INTO messages')) {
        const [accountGlobalMetaId, channelId, dedupeKey, payload, timestamp, messageIndex] = args as [
          string,
          string,
          string,
          string,
          number,
          number | null,
        ];
        messages.set(`${accountGlobalMetaId}:${channelId}:${dedupeKey}`, {
          payload,
          timestamp,
          dedupe_key: dedupeKey,
          message_index: messageIndex,
        });
        return;
      }

      if (sql.startsWith('INSERT OR REPLACE INTO read_indexes')) {
        const [accountGlobalMetaId, channelId, lastReadIndex, updatedAt] = args as [
          string,
          string,
          number,
          number,
        ];
        readIndexes.set(`${accountGlobalMetaId}:${channelId}`, {
          last_read_index: lastReadIndex,
          updated_at: updatedAt,
        });
        return;
      }

      if (sql.startsWith('INSERT OR REPLACE INTO message_windows')) {
        const [
          accountGlobalMetaId,
          channelId,
          oldestLoadedIndex,
          newestLoadedIndex,
          hasMoreOlder,
          hasMoreNewer,
          updatedAt,
        ] = args as [string, string, number | null, number | null, number, number, number];
        messageWindows.set(`${accountGlobalMetaId}:${channelId}`, {
          account_global_meta_id: accountGlobalMetaId,
          channel_id: channelId,
          oldest_loaded_index: oldestLoadedIndex,
          newest_loaded_index: newestLoadedIndex,
          has_more_older: hasMoreOlder,
          has_more_newer: hasMoreNewer,
          updated_at: updatedAt,
        });
        return;
      }

      if (sql.startsWith('INSERT OR REPLACE INTO user_profiles')) {
        const [accountGlobalMetaId, profileKey, payload, updatedAt] = args as [string, string, string, number];
        userProfiles.set(`${accountGlobalMetaId}:${profileKey}`, {
          account_global_meta_id: accountGlobalMetaId,
          profile_key: profileKey,
          payload,
          updated_at: updatedAt,
        });
        return;
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
    async getAllAsync(sql: string, ...args: unknown[]) {
      if (sql.startsWith('SELECT payload FROM channels')) {
        const [accountGlobalMetaId] = args as [string];
        return Array.from(channels.entries())
          .filter(([key]) => key.startsWith(`${accountGlobalMetaId}:`))
          .map(([, row]) => row)
          .sort((a, b) => b.updated_at - a.updated_at)
          .map(({ payload }) => ({ payload }));
      }

      if (sql.includes('message_index IS NOT NULL AND message_index < ?')) {
        const [accountGlobalMetaId, channelId, beforeIndex, limit] = args as [string, string, number, number];
        return toPayloadRows(
          getMessageRows(accountGlobalMetaId, channelId)
            .filter((row) => row.message_index !== null && row.message_index < beforeIndex)
            .sort((a, b) => (b.message_index as number) - (a.message_index as number))
            .slice(0, limit),
        );
      }

      if (sql.includes('message_index IS NOT NULL AND message_index > ?')) {
        const [accountGlobalMetaId, channelId, afterIndex, limit] = args as [string, string, number, number];
        return toPayloadRows(
          getMessageRows(accountGlobalMetaId, channelId)
            .filter((row) => row.message_index !== null && row.message_index > afterIndex)
            .sort((a, b) => (a.message_index as number) - (b.message_index as number))
            .slice(0, limit),
        );
      }

      if (sql.includes('message_index IS NOT NULL AND message_index >= ?')) {
        const [accountGlobalMetaId, channelId, startIndex, endIndex] = args as [string, string, number, number];
        return toPayloadRows(
          getMessageRows(accountGlobalMetaId, channelId)
            .filter((row) =>
              row.message_index !== null &&
              row.message_index >= startIndex &&
              row.message_index <= endIndex
            )
            .sort((a, b) => (a.message_index as number) - (b.message_index as number)),
        );
      }

      if (sql.includes('message_index IS NOT NULL ORDER BY message_index DESC LIMIT')) {
        const [accountGlobalMetaId, channelId, limit] = args as [string, string, number];
        return toPayloadRows(
          getMessageRows(accountGlobalMetaId, channelId)
            .filter((row) => row.message_index !== null)
            .sort((a, b) => (b.message_index as number) - (a.message_index as number))
            .slice(0, limit),
        );
      }

      if (sql.includes('ORDER BY timestamp DESC')) {
        const [accountGlobalMetaId, channelId, limit] = args as [string, string, number];
        return toPayloadRows(
          getMessageRows(accountGlobalMetaId, channelId)
            .sort((a, b) => b.timestamp - a.timestamp || b.dedupe_key.localeCompare(a.dedupe_key))
            .slice(0, limit),
        );
      }

      if (sql.startsWith('SELECT payload FROM messages')) {
        const [accountGlobalMetaId, channelId] = args as [string, string];
        return getMessageRows(accountGlobalMetaId, channelId)
          .sort((a, b) => a.timestamp - b.timestamp || a.dedupe_key.localeCompare(b.dedupe_key))
          .map(({ payload }) => ({ payload }));
      }

      if (sql.startsWith('SELECT account_global_meta_id, channel_id')) {
        const [accountGlobalMetaId, channelId] = args as [string, string];
        const row = messageWindows.get(`${accountGlobalMetaId}:${channelId}`);
        return row ? [row] : [];
      }

      if (sql.startsWith('SELECT payload FROM user_profiles WHERE account_global_meta_id = ? AND profile_key = ?')) {
        const [accountGlobalMetaId, profileKey] = args as [string, string];
        const row = userProfiles.get(`${accountGlobalMetaId}:${profileKey}`);
        return row ? [{ payload: row.payload }] : [];
      }

      if (sql.startsWith('SELECT payload FROM user_profiles WHERE account_global_meta_id = ? AND profile_key IN')) {
        const [accountGlobalMetaId, ...profileKeys] = args as string[];
        return profileKeys
          .map((profileKey) => userProfiles.get(`${accountGlobalMetaId}:${profileKey}`))
          .filter((row): row is NonNullable<typeof row> => Boolean(row))
          .sort((a, b) => b.updated_at - a.updated_at)
          .map(({ payload }) => ({ payload }));
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

describe('chatRepository', () => {
  const channel: NativeChatChannel = {
    accountGlobalMetaId: 'self',
    id: 'group-1',
    type: 'group',
    title: 'Group',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 100,
  };

  const message: NativeChatMessage = {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 100,
    txId: 'tx1',
    status: 'sent',
  };

  const profile: NativeChatUserProfile = {
    accountGlobalMetaId: 'self',
    profileKey: 'peer-gm',
    globalMetaId: 'peer-gm',
    metaId: 'peer-metaid',
    name: 'Peer',
    avatar: 'https://example.test/peer.png',
    chatPublicKey: 'peer-chat-key',
    updatedAt: 1000,
  };

  it('saves and lists channels by account', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertChannel(channel);
    await repo.upsertChannel({ ...channel, accountGlobalMetaId: 'other', id: 'group-2' });

    await expect(repo.listChannels('self')).resolves.toEqual([channel]);
  });

  it('deduplicates messages by txId within an account and channel', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertMessage(message);
    await repo.upsertMessage({ ...message, content: 'new content' });

    await expect(repo.listMessages('self', 'group-1')).resolves.toHaveLength(1);
    await expect(repo.listMessages('self', 'group-1')).resolves.toMatchObject([
      { content: 'new content' },
    ]);
  });

  it('keeps indexed messages that share timestamp and sender without stable ids', async () => {
    const repo = createMemoryChatRepository();
    const first = {
      ...message,
      txId: undefined,
      senderGlobalMetaId: 'sender',
      content: 'first indexed',
      index: 1,
    };
    const second = {
      ...first,
      content: 'second indexed',
      index: 2,
    };

    await repo.upsertMessage(first);
    await repo.upsertMessage(second);

    await expect(repo.listMessages('self', 'group-1')).resolves.toMatchObject([
      { content: 'first indexed', index: 1 },
      { content: 'second indexed', index: 2 },
    ]);
  });

  it('saves and lists SQLite channels by account', async () => {
    const repo = createSQLiteChatRepository(createFakeDb() as any);
    await repo.upsertChannel(channel);
    await repo.upsertChannel({ ...channel, accountGlobalMetaId: 'other', id: 'group-2' });

    await expect(repo.listChannels('self')).resolves.toEqual([channel]);
  });

  it('deduplicates SQLite messages by txId within an account and channel', async () => {
    const repo = createSQLiteChatRepository(createFakeDb() as any);
    await repo.upsertMessage(message);
    await repo.upsertMessage({ ...message, content: 'new content' });

    await expect(repo.listMessages('self', 'group-1')).resolves.toHaveLength(1);
    await expect(repo.listMessages('self', 'group-1')).resolves.toMatchObject([
      { content: 'new content' },
    ]);
  });

  it('orders SQLite indexed messages with the same timestamp by numeric index', async () => {
    const repo = createSQLiteChatRepository(createFakeDb() as any);
    const second = {
      ...message,
      txId: undefined,
      content: 'second',
      index: 2,
    };
    const tenth = {
      ...second,
      content: 'tenth',
      index: 10,
    };

    await repo.upsertMessage(tenth);
    await repo.upsertMessage(second);

    await expect(repo.listMessages('self', 'group-1')).resolves.toMatchObject([
      { content: 'second', index: 2 },
      { content: 'tenth', index: 10 },
    ]);
  });

  it('orders memory and SQLite idless messages with the same timestamp consistently', async () => {
    const memoryRepo = createMemoryChatRepository();
    const sqliteRepo = createSQLiteChatRepository(createFakeDb() as any);
    const zeta = {
      ...message,
      txId: undefined,
      senderGlobalMetaId: 'sender',
      content: 'zeta idless',
    };
    const alpha = {
      ...zeta,
      content: 'alpha idless',
    };

    await memoryRepo.upsertMessage(zeta);
    await memoryRepo.upsertMessage(alpha);
    await sqliteRepo.upsertMessage(zeta);
    await sqliteRepo.upsertMessage(alpha);

    const expected = [
      { content: 'alpha idless' },
      { content: 'zeta idless' },
    ];
    await expect(memoryRepo.listMessages('self', 'group-1')).resolves.toMatchObject(expected);
    await expect(sqliteRepo.listMessages('self', 'group-1')).resolves.toMatchObject(expected);
  });

  it('reads the newest indexed message window from memory in ascending index order', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertMessage({ ...message, content: 'one', index: 1, timestamp: 100, txId: 'tx-1' });
    await repo.upsertMessage({ ...message, content: 'three', index: 3, timestamp: 300, txId: 'tx-3' });
    await repo.upsertMessage({ ...message, content: 'two', index: 2, timestamp: 200, txId: 'tx-2' });
    await repo.upsertMessage({ ...message, accountGlobalMetaId: 'other', content: 'other', index: 4, txId: 'tx-4' });

    await expect(repo.listLatestMessages('self', 'group-1', 2)).resolves.toMatchObject([
      { content: 'two', index: 2 },
      { content: 'three', index: 3 },
    ]);
  });

  it('reads older and newer indexed windows around a loaded range', async () => {
    const repo = createMemoryChatRepository();
    await Promise.all(
      [1, 2, 3, 4, 5].map((index) =>
        repo.upsertMessage({
          ...message,
          content: `message-${index}`,
          index,
          timestamp: 100 + index,
          txId: `tx-${index}`,
        }),
      ),
    );

    await expect(repo.listMessagesBefore('self', 'group-1', 4, 2)).resolves.toMatchObject([
      { content: 'message-2', index: 2 },
      { content: 'message-3', index: 3 },
    ]);
    await expect(repo.listMessagesAfter('self', 'group-1', 2, 2)).resolves.toMatchObject([
      { content: 'message-3', index: 3 },
      { content: 'message-4', index: 4 },
    ]);
  });

  it('checks indexed range continuity from persisted rows', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertMessage({ ...message, content: 'one', index: 1, txId: 'tx-1' });
    await repo.upsertMessage({ ...message, content: 'two', index: 2, txId: 'tx-2' });
    await repo.upsertMessage({ ...message, content: 'four', index: 4, txId: 'tx-4' });

    await expect(repo.hasContinuousMessageRange('self', 'group-1', 1, 2)).resolves.toBe(true);
    await expect(repo.hasContinuousMessageRange('self', 'group-1', 1, 4)).resolves.toBe(false);
  });

  it('persists message window metadata by account and channel', async () => {
    const repo = createMemoryChatRepository();

    await repo.saveMessageWindowState({
      accountGlobalMetaId: 'self',
      channelId: 'group-1',
      oldestLoadedIndex: 4,
      newestLoadedIndex: 8,
      hasMoreOlder: true,
      hasMoreNewer: false,
      updatedAt: 1000,
    });

    await expect(repo.getMessageWindowState('self', 'group-1')).resolves.toEqual({
      accountGlobalMetaId: 'self',
      channelId: 'group-1',
      oldestLoadedIndex: 4,
      newestLoadedIndex: 8,
      hasMoreOlder: true,
      hasMoreNewer: false,
      updatedAt: 1000,
    });
    await expect(repo.getMessageWindowState('other', 'group-1')).resolves.toBeUndefined();
  });

  it('reads SQLite message windows using indexed bounds', async () => {
    const repo = createSQLiteChatRepository(createFakeDb() as any);
    await Promise.all(
      [1, 2, 3, 4, 5].map((index) =>
        repo.upsertMessage({
          ...message,
          content: `sqlite-${index}`,
          index,
          timestamp: 100 + index,
          txId: `sqlite-tx-${index}`,
        }),
      ),
    );

    await expect(repo.listLatestMessages('self', 'group-1', 2)).resolves.toMatchObject([
      { content: 'sqlite-4', index: 4 },
      { content: 'sqlite-5', index: 5 },
    ]);
    await expect(repo.listMessagesBefore('self', 'group-1', 4, 2)).resolves.toMatchObject([
      { content: 'sqlite-2', index: 2 },
      { content: 'sqlite-3', index: 3 },
    ]);
    await expect(repo.listMessagesAfter('self', 'group-1', 2, 2)).resolves.toMatchObject([
      { content: 'sqlite-3', index: 3 },
      { content: 'sqlite-4', index: 4 },
    ]);
    await expect(repo.hasContinuousMessageRange('self', 'group-1', 2, 5)).resolves.toBe(true);
    await expect(repo.hasContinuousMessageRange('self', 'group-1', 2, 6)).resolves.toBe(false);
  });

  it('persists SQLite message window metadata by account and channel', async () => {
    const repo = createSQLiteChatRepository(createFakeDb() as any);

    await repo.saveMessageWindowState({
      accountGlobalMetaId: 'self',
      channelId: 'group-1',
      oldestLoadedIndex: 2,
      newestLoadedIndex: 5,
      hasMoreOlder: true,
      hasMoreNewer: true,
      updatedAt: 2000,
    });

    await expect(repo.getMessageWindowState('self', 'group-1')).resolves.toEqual({
      accountGlobalMetaId: 'self',
      channelId: 'group-1',
      oldestLoadedIndex: 2,
      newestLoadedIndex: 5,
      hasMoreOlder: true,
      hasMoreNewer: true,
      updatedAt: 2000,
    });
    await expect(repo.getMessageWindowState('self', 'other-group')).resolves.toBeUndefined();
  });

  it('persists user profiles by account and profile key', async () => {
    const memoryRepo = createMemoryChatRepository();
    const sqliteRepo = createSQLiteChatRepository(createFakeDb() as any);

    await memoryRepo.upsertUserProfile(profile);
    await sqliteRepo.upsertUserProfile(profile);
    await memoryRepo.upsertUserProfile({ ...profile, accountGlobalMetaId: 'other', name: 'Other' });
    await sqliteRepo.upsertUserProfile({ ...profile, accountGlobalMetaId: 'other', name: 'Other' });

    await expect(memoryRepo.getUserProfile('self', 'peer-gm')).resolves.toEqual(profile);
    await expect(sqliteRepo.getUserProfile('self', 'peer-gm')).resolves.toEqual(profile);
    await expect(memoryRepo.listUserProfiles('self', ['peer-gm', 'missing'])).resolves.toEqual([profile]);
    await expect(sqliteRepo.listUserProfiles('self', ['peer-gm', 'missing'])).resolves.toEqual([profile]);
    await expect(memoryRepo.getUserProfile('self', 'missing')).resolves.toBeUndefined();
    await expect(sqliteRepo.getUserProfile('self', 'missing')).resolves.toBeUndefined();
  });
});
