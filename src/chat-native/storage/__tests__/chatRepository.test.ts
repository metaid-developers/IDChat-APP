import { createMemoryChatRepository, createSQLiteChatRepository } from '../chatRepository';
import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';

function createFakeDb() {
  const channels = new Map<string, { payload: string; updated_at: number }>();
  const messages = new Map<string, { payload: string; timestamp: number; dedupe_key: string }>();
  const readIndexes = new Map<string, { last_read_index: number; updated_at: number }>();

  return {
    async runAsync(sql: string, ...args: unknown[]) {
      if (sql.startsWith('INSERT OR REPLACE INTO channels')) {
        const [accountGlobalMetaId, id, payload, updatedAt] = args as [string, string, string, number];
        channels.set(`${accountGlobalMetaId}:${id}`, { payload, updated_at: updatedAt });
        return;
      }

      if (sql.startsWith('INSERT OR REPLACE INTO messages')) {
        const [accountGlobalMetaId, channelId, dedupeKey, payload, timestamp] = args as [
          string,
          string,
          string,
          string,
          number,
        ];
        messages.set(`${accountGlobalMetaId}:${channelId}:${dedupeKey}`, {
          payload,
          timestamp,
          dedupe_key: dedupeKey,
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

      if (sql.startsWith('SELECT payload FROM messages')) {
        const [accountGlobalMetaId, channelId] = args as [string, string];
        return Array.from(messages.entries())
          .filter(([key]) => key.startsWith(`${accountGlobalMetaId}:${channelId}:`))
          .map(([, row]) => row)
          .sort((a, b) => a.timestamp - b.timestamp || a.dedupe_key.localeCompare(b.dedupe_key))
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
});
