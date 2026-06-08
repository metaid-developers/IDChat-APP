export type Fetcher = (
  input: string,
  init?: { method: 'GET' },
) => Promise<{ ok: boolean; json: () => Promise<any> }>;

type LatestChatInfoListParams = {
  metaId: string;
  cursor?: string;
  size?: string;
};

type IndexedGroupMessagesParams = {
  groupId: string;
  startIndex?: string;
  size?: string;
};

type IndexedChannelMessagesParams = {
  channelId: string;
  startIndex?: string;
  size?: string;
};

type IndexedPrivateMessagesParams = {
  metaId: string;
  otherMetaId: string;
  startIndex?: string;
  size?: string;
};

type TimestampGroupMessagesParams = {
  groupId: string;
  metaId: string;
  cursor?: string;
  size?: string;
  timestamp?: string;
};

type TimestampChannelMessagesParams = {
  channelId: string;
  metaId: string;
  cursor?: string;
  size?: string;
  timestamp?: string;
};

type TimestampPrivateMessagesParams = {
  metaId: string;
  otherMetaId: string;
  cursor?: string;
  size?: string;
  timestamp?: string;
};

const EMPTY_HISTORY_RESPONSE = {
  list: [],
  nextTimestamp: 0,
  total: 0,
};

const defaultFetcher: Fetcher = (input, init) => (globalThis.fetch as any)(input, init);

function buildUrl(base: string, path: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();

  return `${base.replace(/\/+$/, '')}${path}?${query}`;
}

async function getJson(fetcher: Fetcher, url: string): Promise<any> {
  const response = await fetcher(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Chat API request failed: ${url}`);
  }

  return response.json();
}

function getHistoryData(payload: any): any {
  if (payload?.data) {
    return payload.data;
  }

  if (Array.isArray(payload?.list)) {
    return payload;
  }

  return EMPTY_HISTORY_RESPONSE;
}

export class NativeChatApiClient {
  constructor(
    private readonly chatApiBase: string,
    private readonly fetcher: Fetcher = defaultFetcher,
  ) {}

  async getLatestChatInfoList(params: LatestChatInfoListParams): Promise<any[]> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/user/latest-chat-info-list', {
        metaId: params.metaId,
        cursor: params.cursor ?? '0',
        size: params.size ?? '100',
      }),
    );

    return payload?.data?.list || payload?.data || [];
  }

  async getGroupMessagesByIndex(params: IndexedGroupMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/group-chat-list-by-index', {
        groupId: params.groupId,
        startIndex: params.startIndex ?? '0',
        size: params.size ?? '30',
      }),
    );

    return getHistoryData(payload);
  }

  async getChannelMessagesByIndex(params: IndexedChannelMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/channel-chat-list-by-index', {
        channelId: params.channelId,
        startIndex: params.startIndex ?? '0',
        size: params.size ?? '30',
      }),
    );

    return getHistoryData(payload);
  }

  async getPrivateMessagesByIndex(params: IndexedPrivateMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/private-chat-list-by-index', {
        metaId: params.metaId,
        otherMetaId: params.otherMetaId,
        startIndex: params.startIndex ?? '0',
        size: params.size ?? '30',
      }),
    );

    return getHistoryData(payload);
  }

  async getGroupMessages(params: TimestampGroupMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/group-chat-list-v2', {
        groupId: params.groupId,
        metaId: params.metaId,
        cursor: params.cursor ?? '0',
        size: params.size ?? '30',
        timestamp: params.timestamp ?? '0',
      }),
    );

    return getHistoryData(payload);
  }

  async getChannelMessages(params: TimestampChannelMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/channel-chat-list-v3', {
        channelId: params.channelId,
        metaId: params.metaId,
        cursor: params.cursor ?? '0',
        size: params.size ?? '30',
        timestamp: params.timestamp ?? '0',
      }),
    );

    return getHistoryData(payload);
  }

  async getPrivateMessages(params: TimestampPrivateMessagesParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/private-chat-list', {
        metaId: params.metaId,
        otherMetaId: params.otherMetaId,
        cursor: params.cursor ?? '0',
        size: params.size ?? '30',
        timestamp: params.timestamp ?? '0',
      }),
    );

    return getHistoryData(payload);
  }
}
