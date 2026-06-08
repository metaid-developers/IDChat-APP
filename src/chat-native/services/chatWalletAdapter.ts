import { Buffer } from 'buffer';
import * as ECDH from '@/webs/actions/common/ecdh';
import * as GetPKHByPath from '@/webs/actions/lib/query/get-pkh-by-path';
import * as CreatePin from '@/webs/actions/create-pin';
import type { CreatePinParams, CreatePinResult } from '@/webs/actions/create-pin';
import type { GlobalMetaidResult } from '@/webs/actions/lib/query/get-global-metaid';
import { buildChatMetaidData } from './chatNodeBuilder';
import type { NativeChatProtocol } from '../domain/protocol';

export type NativeChatAttachmentItem = {
  data: string;
  fileType: string;
};

export type NativeChatAccountProfile = {
  name?: string;
  avatar?: string;
};

export type NativeChatCreateNodeParams = {
  addressHost: string;
  protocol: NativeChatProtocol;
  body: Record<string, unknown>;
  externalEncryption: '0' | '1' | '2';
  fileEncryption?: '0' | '1' | '2';
  attachments?: NativeChatAttachmentItem[];
};

export type NativeChatWalletAdapter = {
  getPKHByPath(path: string): Promise<string>;
  getGlobalMetaId(password?: string): Promise<GlobalMetaidResult>;
  getCurrentProfile(): Promise<NativeChatAccountProfile>;
  getEcdh(externalPubKey: string): ReturnType<typeof ECDH.process>;
  createPin(params: CreatePinParams): Promise<CreatePinResult>;
  createChatNode(params: NativeChatCreateNodeParams): Promise<CreatePinResult>;
};

export function createNativeChatWalletAdapter(): NativeChatWalletAdapter {
  return {
    getPKHByPath(path: string) {
      return GetPKHByPath.process({ path }, { password: '' });
    },
    async getGlobalMetaId(password = '') {
      const GetGlobalMetaid = await import('@/webs/actions/lib/query/get-global-metaid');
      return GetGlobalMetaid.process(undefined, { host: 'https://www.idchat.io', password });
    },
    async getCurrentProfile() {
      const useUserStore = (await import('@/stores/useUserStore')).default;
      const userInfo = useUserStore.getState().userInfo;
      return {
        name: userInfo?.name,
        avatar: userInfo?.avatarLocalUri || userInfo?.avatar,
      };
    },
    getEcdh(externalPubKey: string) {
      return ECDH.process({ externalPubKey });
    },
    createPin(params: CreatePinParams) {
      return CreatePin.process(params);
    },
    createChatNode(params: NativeChatCreateNodeParams) {
      const body = { ...params.body };
      const dataList: CreatePinParams['dataList'] = [];
      const attachment = params.attachments?.[0];

      if (attachment) {
        dataList.push({
          metaidData: {
            operation: 'create',
            path: `${params.addressHost}:/file`,
            body: Buffer.from(attachment.data, 'hex'),
            contentType: `${attachment.fileType};binary`,
            encryption: params.fileEncryption || '0',
            encoding: 'binary',
          },
        });
        body.attachment = 'metafile://$FILE_TXIDi0';
      }

      const chatPinDetail: CreatePinParams['dataList'][number] = {
        metaidData: buildChatMetaidData(params.addressHost, {
          protocol: params.protocol,
          body,
          externalEncryption: params.externalEncryption,
          fileEncryption: params.fileEncryption,
        }),
      };

      if (attachment) {
        chatPinDetail.options = { refs: { '$FILE_TXID': 0 } };
      }

      dataList.push(chatPinDetail);

      return CreatePin.process({
        chain: 'mvc',
        dataList,
      });
    },
  };
}
