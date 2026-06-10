import type { NativeChatMessage } from '../domain/types';

export type NativeChatMessageActionId =
  | 'copy-text'
  | 'copy-txid'
  | 'open-tx'
  | 'view-image'
  | 'save-image'
  | 'quote';

export type NativeChatMessageAction = {
  id: NativeChatMessageActionId;
  label: string;
};

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

  return actions;
}
