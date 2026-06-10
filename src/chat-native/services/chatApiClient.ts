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

type GroupInfoParams = {
  groupId: string;
};

type GroupMembersParams = {
  groupId: string;
  cursor?: string;
  size?: string;
  timestamp?: string;
  orderBy?: string;
  orderType?: 'asc' | 'desc';
};

type SearchGroupMembersParams = {
  groupId: string;
  query: string;
  size?: string;
};

type SearchGroupsAndUsersParams = {
  query: string;
};

type OnlineUsersParams = {
  cursor?: string;
  size?: string;
};

const EMPTY_HISTORY_RESPONSE = {
  list: [],
  nextTimestamp: 0,
  total: 0,
};
const DEFAULT_PROFILE_API_BASE = 'https://file.metaid.io/metafile-indexer/api/v1';

const defaultFetcher: Fetcher = (input, init) => (globalThis.fetch as any)(input, init);

function buildUrl(base: string, path: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  const url = `${base.replace(/\/+$/, '')}${path}`;

  return query ? `${url}?${query}` : url;
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

function getProfileData(payload: any): any {
  if (payload?.data) {
    return payload.data;
  }

  return payload;
}

function getApiData(payload: any): any {
  if (payload?.data) {
    return payload.data;
  }

  return payload;
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

  async getGroupInfo(params: GroupInfoParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/group-info', {
        groupId: params.groupId,
      }),
    );

    return getApiData(payload);
  }

  async getGroupMembers(params: GroupMembersParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/group-member-list', {
        groupId: params.groupId,
        cursor: params.cursor ?? '0',
        size: params.size ?? '20',
        timestamp: params.timestamp ?? '0',
        orderBy: params.orderBy ?? 'timestamp',
        orderType: params.orderType ?? 'asc',
      }),
    );

    return getApiData(payload);
  }

  async searchGroupMembers(params: SearchGroupMembersParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/search-group-members', {
        groupId: params.groupId,
        query: params.query,
        size: params.size ?? '20',
      }),
    );

    return getApiData(payload);
  }

  async searchGroupsAndUsers(params: SearchGroupsAndUsersParams): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/search-groups-and-users', {
        query: params.query,
      }),
    );

    return getApiData(payload);
  }

  async getOnlineUsers(params: OnlineUsersParams = {}): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/socket/online-users', {
        cursor: params.cursor ?? '0',
        size: params.size ?? '100',
        withUserInfo: 'true',
      }),
    );

    return getApiData(payload);
  }

  async getUserInfoByGlobalMetaId(globalMetaId: string): Promise<any> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(DEFAULT_PROFILE_API_BASE, `/info/globalmetaid/${encodeURIComponent(globalMetaId)}`, {}),
    );

    return getProfileData(payload);
  }
}
