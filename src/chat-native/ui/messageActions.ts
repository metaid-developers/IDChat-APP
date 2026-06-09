import { CHAT_PROTOCOL } from '../domain/protocol';
import type { NativeChatMessage } from '../domain/types';

export type NativeChatMessageActionId =
  | 'copy-text'
  | 'copy-txid'
  | 'open-tx'
  | 'view-image'
  | 'save-image'
  | 'quote'
  | 'buzz'
  | 'translate';

export type NativeChatMessageAction = {
  id: NativeChatMessageActionId;
  label: string;
};

function includesProtocol(protocol: string, target: string): boolean {
  const normalized = protocol.toLowerCase();
  return normalized.includes(target);
}

function isGroupChatProtocol(protocol: string): boolean {
  return (
    includesProtocol(protocol, CHAT_PROTOCOL.SIMPLE_GROUP_CHAT) ||
    includesProtocol(protocol, CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT)
  );
}

export function getNativeChatMessageActions(message: NativeChatMessage): NativeChatMessageAction[] {
  const actions: NativeChatMessageAction[] = [];

  if (message.kind === 'text' && message.content) {
    actions.push({ id: 'copy-text', label: 'Copy text' });
  }

  if (message.kind === 'image') {
    actions.push({ id: 'view-image', label: 'View image' });
    actions.push({ id: 'save-image', label: 'Save image' });
  }

  if (message.txId || message.pinId) {
    actions.push({ id: 'copy-txid', label: 'Copy txid' });
    actions.push({ id: 'open-tx', label: 'Open tx' });
  }

  actions.push({ id: 'quote', label: 'Quote' });

  if (isGroupChatProtocol(message.protocol)) {
    actions.push({ id: 'buzz', label: 'Buzz' });
  }

  if (message.kind === 'text') {
    actions.push({ id: 'translate', label: 'Translate' });
  }

  return actions;
}
