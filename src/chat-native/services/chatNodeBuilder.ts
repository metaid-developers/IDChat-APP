import { buildChatProtocolPath, CHAT_PROTOCOL, type NativeChatProtocol } from '../domain/protocol';
import type { NativeChatChannelType, NativeChatMention } from '../domain/types';

type ChatNodeBase = {
  protocol: NativeChatProtocol;
  body: Record<string, unknown>;
  timestamp: number;
  externalEncryption: '0';
};

export type NativeChatMetaidNode = {
  protocol: NativeChatProtocol;
  body: Record<string, unknown>;
  externalEncryption: '0' | '1' | '2';
  fileEncryption?: '0' | '1' | '2';
};

export type NativeChatTextNodeInput = {
  channelType: NativeChatChannelType;
  channelId: string;
  parentGroupId?: string;
  content: string;
  nickName: string;
  timestamp: number;
  replyPin?: string;
  mentions?: NativeChatMention[];
};

export type NativeChatImageNodeInput = {
  channelType: NativeChatChannelType;
  channelId: string;
  parentGroupId?: string;
  fileType: string;
  nickName: string;
  timestamp: number;
  replyPin?: string;
};

export type NativeChatTextNode = ChatNodeBase;

export type NativeChatImageNode = ChatNodeBase & {
  fileEncryption: '0' | '1';
};

export type NativeChatNode = NativeChatTextNode | NativeChatImageNode;

export function buildTextNode(input: NativeChatTextNodeInput): NativeChatTextNode {
  if (input.channelType === 'private') {
    return {
      protocol: CHAT_PROTOCOL.SIMPLE_MSG,
      body: {
        to: input.channelId,
        timestamp: input.timestamp,
        content: input.content,
        contentType: 'text/plain',
        encrypt: 'ecdh',
        replyPin: input.replyPin || '',
      },
      timestamp: input.timestamp,
      externalEncryption: '0',
    };
  }

  return {
    protocol: CHAT_PROTOCOL.SIMPLE_GROUP_CHAT,
    body: {
      groupID: input.parentGroupId || input.channelId,
      channelID: input.channelType === 'sub-group' ? input.channelId : undefined,
      timestamp: input.timestamp,
      nickName: input.nickName,
      content: input.content,
      contentType: 'text/plain',
      encryption: 'aes',
      replyPin: input.replyPin || '',
      mention: input.mentions || [],
    },
    timestamp: input.timestamp * 1000,
    externalEncryption: '0',
  };
}

export function buildImageNode(input: NativeChatImageNodeInput): NativeChatImageNode {
  if (input.channelType === 'private') {
    return {
      protocol: CHAT_PROTOCOL.SIMPLE_FILE_MSG,
      body: {
        timestamp: input.timestamp,
        encrypt: 'aes',
        fileType: input.fileType,
        to: input.channelId,
        nickName: input.nickName,
        attachment: '',
        replyPin: input.replyPin || '',
      },
      timestamp: input.timestamp * 1000,
      externalEncryption: '0',
      fileEncryption: '1',
    };
  }

  return {
    protocol: CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT,
    body: {
      timestamp: input.timestamp,
      encrypt: 'aes',
      fileType: input.fileType,
      groupId: input.parentGroupId || input.channelId,
      channelId: input.channelType === 'sub-group' ? input.channelId : '',
      nickName: input.nickName,
      attachment: '',
      replyPin: input.replyPin || '',
    },
    timestamp: input.timestamp * 1000,
    externalEncryption: '0',
    fileEncryption: '0',
  };
}

export function buildChatMetaidData(addressHost: string, node: NativeChatMetaidNode) {
  const imageContentType =
    'fileEncryption' in node && typeof node.body.contentType === 'string'
      ? node.body.contentType
      : undefined;

  return {
    operation: 'create' as const,
    path: buildChatProtocolPath(addressHost, node.protocol),
    body: JSON.stringify(node.body),
    contentType: imageContentType || 'application/json',
    encryption: node.externalEncryption,
    encoding: 'utf-8' as const,
  };
}
