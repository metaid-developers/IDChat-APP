import type { NativeChatRuntimeConfig } from '../domain/types';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';
import type { NativeChatApiClient } from './chatApiClient';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';

export type NativeChatRuntimeContext = {
  accountGlobalMetaId: string;
  runtimeConfig: NativeChatRuntimeConfig;
  wallet: NativeChatWalletAdapter;
  apiClient: NativeChatApiClient;
  repository: NativeChatRepository;
  store: ReturnType<typeof createNativeChatStore>;
};

let nativeChatRuntimeContext: NativeChatRuntimeContext | undefined;

export function setNativeChatRuntimeContext(context: NativeChatRuntimeContext): void {
  nativeChatRuntimeContext = context;
}

export function getNativeChatRuntimeContext(): NativeChatRuntimeContext {
  if (!nativeChatRuntimeContext) {
    throw new Error('Native chat runtime context is not initialized');
  }

  return nativeChatRuntimeContext;
}

export function clearNativeChatRuntimeContext(): void {
  nativeChatRuntimeContext = undefined;
}
