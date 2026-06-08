import {
  DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG,
  buildSocketPath,
  normalizeRuntimeConfigPayload,
} from '../chatRuntimeConfig';

describe('chat runtime config', () => {
  it('builds socket.io paths from chat websocket paths', () => {
    expect(buildSocketPath('/socket')).toBe('/socket/socket.io');
    expect(buildSocketPath('socket')).toBe('/socket/socket.io');
    expect(buildSocketPath('')).toBe('/socket.io');
  });

  it('normalizes public app config payloads into native chat runtime config', () => {
    const addressHost = 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0';

    expect(
      normalizeRuntimeConfigPayload({
        api: {
          metaSoBaseURL: 'https://api.idchat.io',
          paths: {
            chatApi: '/chat-api',
            chatWs: '',
            chatWsPath: '/socket',
          },
        },
        blockchain: {
          addressHost,
        },
      }),
    ).toEqual({
      chatApiBase: 'https://api.idchat.io/chat-api',
      chatWsBase: 'https://api.idchat.io',
      chatWsPath: '/socket',
      socketPath: '/socket/socket.io',
      addressHost,
    });
  });

  it('uses production defaults for empty payloads', () => {
    expect(normalizeRuntimeConfigPayload({})).toEqual(DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG);
  });

  it('falls back when runtime config fields are malformed', () => {
    expect(
      normalizeRuntimeConfigPayload({
        api: {
          metaSoBaseURL: {},
          paths: {
            chatApi: '/chat-api',
            chatWs: [],
            chatWsPath: '/socket',
          },
        },
        blockchain: {
          addressHost: {},
        },
      }),
    ).toEqual(DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG);

    expect(
      normalizeRuntimeConfigPayload({
        api: {
          metaSoBaseURL: 'https://api.idchat.io',
          paths: {
            chatApi: '/chat-api',
            chatWs: [],
            chatWsPath: '/socket',
          },
        },
        blockchain: {
          addressHost: {},
        },
      }),
    ).toMatchObject({
      chatWsBase: 'https://api.idchat.io',
      addressHost: DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG.addressHost,
    });
  });
});
