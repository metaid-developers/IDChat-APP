import { Buffer } from 'buffer';
import type * as ExpoFileSystem from 'expo-file-system';
import type * as ExpoImagePicker from 'expo-image-picker';
import type { NativeChatChannel } from '../domain/types';
import { encryptPrivateImageHex } from './chatCrypto';
import type { NativeChatAttachmentItem } from './chatWalletAdapter';

export function fileExtensionFromMime(mimeType: string): string {
  return mimeType.split('/')[1] || 'png';
}

export function makeAttachmentItem(input: { base64: string; mimeType: string }): NativeChatAttachmentItem {
  return {
    data: Buffer.from(input.base64, 'base64').toString('hex'),
    fileType: input.mimeType,
  };
}

type NativeChatPreviewFileSystem = Pick<
  typeof ExpoFileSystem,
  'cacheDirectory' | 'writeAsStringAsync' | 'EncodingType'
>;

export async function createLocalImagePreviewUri(input: {
  uri: string;
  base64: string;
  mimeType: string;
  fileSystem: NativeChatPreviewFileSystem;
  nowMs?: () => number;
}): Promise<string> {
  if (input.uri.startsWith('data:image/')) {
    return input.uri;
  }

  const cacheDirectory = input.fileSystem.cacheDirectory;

  if (!cacheDirectory) {
    return input.uri;
  }

  const extension = fileExtensionFromMime(input.mimeType);
  const timestamp = input.nowMs ? input.nowMs() : Date.now();
  const previewUri = `${cacheDirectory}idchat-image-preview-${timestamp}.${extension}`;

  try {
    await input.fileSystem.writeAsStringAsync(previewUri, input.base64, {
      encoding: input.fileSystem.EncodingType.Base64,
    });

    return previewUri;
  } catch {
    return input.uri;
  }
}

export function encryptImageAttachmentForChannel(params: {
  attachment: NativeChatAttachmentItem;
  channel: Pick<NativeChatChannel, 'type' | 'roomJoinType' | 'passwordKey'>;
  sharedSecret?: string;
}): NativeChatAttachmentItem {
  if (params.channel.type === 'private') {
    if (!params.sharedSecret) {
      throw new Error('Missing private image shared secret');
    }

    return {
      ...params.attachment,
      data: encryptPrivateImageHex(params.attachment.data, params.sharedSecret),
    };
  }

  if (params.channel.roomJoinType === '100' && params.channel.passwordKey) {
    return {
      ...params.attachment,
      data: encryptPrivateImageHex(params.attachment.data, params.channel.passwordKey),
    };
  }

  return params.attachment;
}

export async function pickImageAttachment(): Promise<{
  attachment: NativeChatAttachmentItem;
  localPreviewUri: string;
} | null> {
  const FileSystem = require('expo-file-system') as typeof ExpoFileSystem;
  const ImagePicker = require('expo-image-picker') as typeof ExpoImagePicker;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/png';
  const base64 =
    asset.base64 ||
    (await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }));

  return {
    attachment: makeAttachmentItem({ base64, mimeType }),
    localPreviewUri: await createLocalImagePreviewUri({
      base64,
      fileSystem: FileSystem,
      mimeType,
      uri: asset.uri,
    }),
  };
}
