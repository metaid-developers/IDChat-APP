import type {
  NativeChatChannel,
  NativeChatChannelType,
  NativeChatMessage,
  NativeChatMessageKind,
} from '../domain/types';
import { resolveNativeChatAvatarSource } from '../ui/avatarSource';

const FILE_PROTOCOLS = new Set(['simplefilemsg', 'simplefilegroupchat']);

function asObject(value: any): Record<string, any> {
  return value && typeof value === 'object' ? value : {};
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function numberValue(value: any, fallback = 0): number {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}

function optionalNumber(value: any): number | undefined {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : undefined;
}

function isImagePayload(payload: Record<string, any>): boolean {
  const protocol = firstString(payload.protocol, payload.nodeName)?.toLowerCase();

  return (
    Number(payload.chatType) === 3 ||
    Boolean(protocol && FILE_PROTOCOLS.has(protocol)) ||
    Boolean(payload.attachment) ||
    (Array.isArray(payload.attachments) && payload.attachments.length > 0) ||
    Boolean(payload.fileType)
  );
}

function getLatestPayload(item: Record<string, any>): Record<string, any> | undefined {
  const latest = item.latestMessage || item.lastMessage;

  if (latest && typeof latest === 'object') {
    return latest;
  }

  if (
    item.content !== undefined ||
    item.chatType !== undefined ||
    item.timestamp !== undefined ||
    item.index !== undefined
  ) {
    return item;
  }

  return undefined;
}

function getAttachmentUri(payload: Record<string, any>): string | undefined {
  const attachment = payload.attachment;

  if (typeof attachment === 'string') {
    return attachment;
  }

  if (attachment && typeof attachment === 'object') {
    return firstString(attachment.uri, attachment.url, attachment.path);
  }

  if (Array.isArray(payload.attachments)) {
    const firstAttachment = asObject(payload.attachments[0]);

    return firstString(firstAttachment.uri, firstAttachment.url, firstAttachment.path);
  }

  return undefined;
}

export function normalizeLatestChatInfoItem(item: any, accountGlobalMetaId: string): NativeChatChannel {
  const source = asObject(item);
  const userInfo = asObject(source.userInfo || source.targetUserInfo || source.peerUserInfo);
  const privateId = firstString(
    userInfo.globalMetaId,
    userInfo.metaid,
    userInfo.metaId,
    source.otherMetaId,
    source.globalMetaId,
    source.metaId,
  );
  const groupId = firstString(source.groupId, source.groupID, source.metanetId, source.channelId, source.channelID);
  const isPrivate = String(source.type) === '2' || Boolean(privateId && !groupId);
  const id = isPrivate ? privateId : groupId;
  const latest = getLatestPayload(source);
  const latestKind: NativeChatMessageKind = latest && isImagePayload(latest) ? 'image' : 'text';
  const latestTimestamp = latest ? numberValue(latest.timestamp, numberValue(source.timestamp)) : numberValue(source.timestamp);

  return {
    accountGlobalMetaId,
    id: id || '',
    type: isPrivate ? 'private' : 'group',
    title:
      (isPrivate
        ? firstString(userInfo.name, userInfo.metaName, userInfo.nickName, source.name, source.nickName)
        : firstString(source.roomName, source.groupName, source.name, source.title)) ||
      id ||
      (isPrivate ? 'Unknown' : 'Group'),
    avatar: resolveNativeChatAvatarSource(
      source.avatar,
      source.avatarImage,
      userInfo.avatar,
      userInfo.avatarImage,
      source.icon,
    ),
    roomJoinType: firstString(source.roomJoinType),
    path: firstString(source.path),
    passwordKey: firstString(source.passwordKey),
    publicKeyStr: firstString(
      userInfo.chatPublicKey,
      userInfo.publicKeyStr,
      source.chatPublicKey,
      source.publicKeyStr,
    ),
    unreadCount: numberValue(source.unreadCount ?? source.unread),
    lastReadIndex: numberValue(source.lastReadIndex ?? source.readIndex),
    updatedAt: latestTimestamp,
    lastMessage: latest
      ? {
          content: String(latest.content ?? ''),
          kind: latestKind,
          timestamp: latestTimestamp,
          index: optionalNumber(latest.index),
          senderGlobalMetaId: firstString(
            latest.senderGlobalMetaId,
            latest.fromGlobalMetaId,
            latest.globalMetaId,
            latest.metaId,
            asObject(latest.userInfo).globalMetaId,
            asObject(latest.userInfo).metaid,
          ),
          senderName: getSenderName(latest),
        }
      : undefined,
    serverData: source,
  };
}

function getSenderGlobalMetaId(payload: Record<string, any>): string | undefined {
  const userInfo = asObject(payload.userInfo || payload.fromUserInfo);

  return firstString(
    payload.senderGlobalMetaId,
    payload.fromGlobalMetaId,
    payload.globalMetaId,
    payload.fromMetaId,
    payload.metaId,
    payload.from,
    userInfo.globalMetaId,
    userInfo.metaid,
    userInfo.metaId,
  );
}

function getSenderName(payload: Record<string, any>): string | undefined {
  const userInfo = asObject(payload.userInfo || payload.fromUserInfo);

  return firstString(
    payload.senderName,
    payload.nickName,
    payload.name,
    userInfo.name,
    userInfo.metaName,
    userInfo.nickName,
  );
}

function getSenderAvatar(payload: Record<string, any>): string | undefined {
  const userInfo = asObject(payload.userInfo || payload.fromUserInfo);

  return firstString(
    payload.senderAvatar,
    payload.avatar,
    payload.avatarImage,
    userInfo.avatar,
    userInfo.avatarImage,
  );
}

function getRecipientGlobalMetaId(payload: Record<string, any>): string | undefined {
  const toUserInfo = asObject(payload.toUserInfo);

  return firstString(
    payload.toGlobalMetaId,
    payload.toMetaId,
    payload.to,
    payload.otherMetaId,
    toUserInfo.globalMetaId,
    toUserInfo.metaid,
    toUserInfo.metaId,
  );
}

function getPrivateChannelId(
  payload: Record<string, any>,
  accountGlobalMetaId: string,
  senderGlobalMetaId?: string,
): string {
  const recipientGlobalMetaId = getRecipientGlobalMetaId(payload);

  if (senderGlobalMetaId === accountGlobalMetaId && recipientGlobalMetaId) {
    return recipientGlobalMetaId;
  }

  if (recipientGlobalMetaId === accountGlobalMetaId && senderGlobalMetaId) {
    return senderGlobalMetaId;
  }

  return (
    firstString(payload.otherMetaId, recipientGlobalMetaId, senderGlobalMetaId, payload.metaId, payload.globalMetaId) ||
    ''
  );
}

export function normalizeSocketMessage(payload: any, accountGlobalMetaId: string): NativeChatMessage {
  const source = asObject(payload);
  const channelId = firstString(source.channelId, source.channelID);
  const groupId = firstString(source.groupId, source.groupID, source.metanetId);
  const senderGlobalMetaId = getSenderGlobalMetaId(source);
  const channelType: NativeChatChannelType = channelId ? 'sub-group' : groupId ? 'group' : 'private';
  const resolvedChannelId =
    channelType === 'private'
      ? getPrivateChannelId(source, accountGlobalMetaId, senderGlobalMetaId)
      : channelId || groupId || '';
  const kind: NativeChatMessageKind = isImagePayload(source) ? 'image' : 'text';

  return {
    accountGlobalMetaId,
    channelId: resolvedChannelId,
    channelType,
    kind,
    content: String(source.content ?? ''),
    contentType: firstString(source.contentType) || (kind === 'image' ? 'image' : 'text/plain'),
    encryption: firstString(source.encryption, source.encrypt),
    protocol: firstString(source.protocol, source.nodeName) || '',
    timestamp: numberValue(source.timestamp ?? source.createTime ?? source.createdAt),
    senderGlobalMetaId,
    senderName: getSenderName(source),
    senderAvatar: getSenderAvatar(source),
    txId: firstString(source.txId, source.txid, source.revealTxId),
    pinId: firstString(source.pinId, source.pinID),
    index: optionalNumber(source.index),
    attachmentUri: getAttachmentUri(source),
    replyPin: firstString(source.replyPin, asObject(source.replyInfo).pinId),
    status: 'sent',
    raw: source,
  };
}
