import type { NativeChatMessage } from '../domain/types';
import {
  getMessageRowViewModel,
  type MessageRowViewModel,
} from './chatUiSelectors';

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

function isMessageRowViewModel(
  value: NativeChatMessage | MessageRowViewModel,
): value is MessageRowViewModel {
  return typeof (value as MessageRowViewModel).fullTxId === 'string' &&
    typeof (value as MessageRowViewModel).body === 'string' &&
    Boolean((value as MessageRowViewModel).raw);
}

function getActionRow(
  value: NativeChatMessage | MessageRowViewModel,
): MessageRowViewModel {
  if (isMessageRowViewModel(value)) {
    return value;
  }

  return getMessageRowViewModel(value, value.accountGlobalMetaId);
}

export function getNativeChatMessageActions(
  value: NativeChatMessage | MessageRowViewModel,
): NativeChatMessageAction[] {
  const row = getActionRow(value);
  const message = row.raw;
  const actions: NativeChatMessageAction[] = [];

  if (message.kind === 'text' && row.safeCopyText) {
    actions.push({ id: 'copy-text', label: 'Copy text' });
  }

  if (message.kind === 'image') {
    actions.push({ id: 'view-image', label: 'View image' });
    actions.push({ id: 'save-image', label: 'Save image' });
  }

  if (row.fullTxId) {
    actions.push({ id: 'copy-txid', label: 'Copy txid' });
    actions.push({ id: 'open-tx', label: 'Open tx' });
  }

  actions.push({ id: 'quote', label: 'Quote' });

  return actions;
}
