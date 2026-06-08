import type { NativeChatChannelType } from './types';

export const CHAT_PROTOCOL = {
  SIMPLE_GROUP_CHAT: 'simplegroupchat',
  SIMPLE_MSG: 'simplemsg',
  SIMPLE_FILE_GROUP_CHAT: 'simplefilegroupchat',
  SIMPLE_FILE_MSG: 'simplefilemsg',
} as const;

export type NativeChatProtocol = (typeof CHAT_PROTOCOL)[keyof typeof CHAT_PROTOCOL];

export function isPrivateChannel(channelType: NativeChatChannelType): boolean {
  return channelType === 'private';
}

export function getTextProtocolForChannel(channelType: NativeChatChannelType): NativeChatProtocol {
  return isPrivateChannel(channelType) ? CHAT_PROTOCOL.SIMPLE_MSG : CHAT_PROTOCOL.SIMPLE_GROUP_CHAT;
}

export function getImageProtocolForChannel(channelType: NativeChatChannelType): NativeChatProtocol {
  return isPrivateChannel(channelType)
    ? CHAT_PROTOCOL.SIMPLE_FILE_MSG
    : CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT;
}

export function buildChatProtocolPath(addressHost: string, protocol: NativeChatProtocol): string {
  return `${addressHost}:/protocols/${protocol}`;
}
