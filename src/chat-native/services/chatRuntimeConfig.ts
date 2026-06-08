import type { NativeChatRuntimeConfig } from '../domain/types';

export const DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG: NativeChatRuntimeConfig = {
  chatApiBase: 'https://api.idchat.io/chat-api',
  chatWsBase: 'https://api.idchat.io',
  chatWsPath: '/socket',
  socketPath: '/socket/socket.io',
  addressHost: 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0',
};

export const IDCHAT_APP_CONFIG_URL = 'https://www.idchat.io/chat/app-config.json';

export function buildSocketPath(chatWsPath: string): string {
  const trimmedPath = chatWsPath.trim();

  if (!trimmedPath) {
    return '/socket.io';
  }

  const pathWithLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  const pathWithoutTrailingSlash = pathWithLeadingSlash.replace(/\/+$/, '');

  return `${pathWithoutTrailingSlash}/socket.io`;
}

function joinBaseAndPath(base: string, path: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, '');
  const trimmedPath = path.trim().replace(/^\/+/, '');

  if (!trimmedPath) {
    return trimmedBase;
  }

  return `${trimmedBase}/${trimmedPath}`;
}

export function normalizeRuntimeConfigPayload(payload: any): NativeChatRuntimeConfig {
  const api = payload?.api;
  const paths = api?.paths;
  const metaSoBaseURL = typeof api?.metaSoBaseURL === 'string' ? api.metaSoBaseURL : '';
  const chatApiPath = typeof paths?.chatApi === 'string' ? paths.chatApi : '';

  if (!metaSoBaseURL || !chatApiPath) {
    return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
  }

  const chatWsPath =
    typeof paths.chatWsPath === 'string'
      ? paths.chatWsPath
      : DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG.chatWsPath;
  const chatWsPathValue = typeof paths.chatWs === 'string' ? paths.chatWs : '';
  const chatWsBase = chatWsPathValue ? joinBaseAndPath(metaSoBaseURL, chatWsPathValue) : metaSoBaseURL;
  const addressHost =
    typeof payload?.blockchain?.addressHost === 'string'
      ? payload.blockchain.addressHost
      : DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG.addressHost;

  return {
    chatApiBase: joinBaseAndPath(metaSoBaseURL, chatApiPath),
    chatWsBase,
    chatWsPath,
    socketPath: buildSocketPath(chatWsPath),
    addressHost,
  };
}

export async function loadNativeChatRuntimeConfig(
  fetcher: typeof fetch = fetch,
): Promise<NativeChatRuntimeConfig> {
  try {
    const response = await fetcher(IDCHAT_APP_CONFIG_URL);

    if (!response.ok) {
      return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
    }

    return normalizeRuntimeConfigPayload(await response.json());
  } catch {
    return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
  }
}
