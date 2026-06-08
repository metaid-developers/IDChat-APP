import { createNativeChatSocketClient } from '../chatSocketClient';

type SocketHandler = (data?: any) => any;

function createSocket(connected = false, options: { emitDisconnectOnDisconnect?: boolean } = {}) {
  const handlers: Record<string, SocketHandler> = {};
  const socket: any = {
    connected,
    connect: jest.fn(),
    disconnect: jest.fn(() => {
      socket.connected = false;
      if (options.emitDisconnectOnDisconnect) {
        handlers.disconnect?.('io client disconnect');
      }
    }),
    on: jest.fn((event: string, handler: SocketHandler) => {
      handlers[event] = handler;
      return socket;
    }),
    emitTestEvent: (event: string, data?: any) => handlers[event]?.(data),
  };

  return socket;
}

describe('chatSocketClient', () => {
  it('connects with existing idchat query and path shape', () => {
    const socket = createSocket();
    const ioFactory = jest.fn(() => socket);

    const client = createNativeChatSocketClient({
      ioFactory,
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage: jest.fn(),
      onConnectionChange: jest.fn(),
    });

    client.connect();

    expect(ioFactory).toHaveBeenCalledWith('https://api.idchat.io', {
      path: '/socket/socket.io',
      query: { metaid: 'gm1', type: 'app' },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('registers socket listeners on first socket creation', () => {
    const socket = createSocket();
    const ioFactory = jest.fn(() => socket);
    const onConnectionChange = jest.fn();

    const client = createNativeChatSocketClient({
      ioFactory,
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage: jest.fn(),
      onConnectionChange,
    });

    client.connect();
    client.connect();

    expect(ioFactory).toHaveBeenCalledTimes(1);
    expect(socket.on).toHaveBeenCalledTimes(4);
    socket.emitTestEvent('connect');
    socket.emitTestEvent('disconnect');
    socket.emitTestEvent('connect_error');

    expect(onConnectionChange).toHaveBeenNthCalledWith(1, true);
    expect(onConnectionChange).toHaveBeenNthCalledWith(2, false);
    expect(onConnectionChange).toHaveBeenCalledTimes(2);
  });

  it('reports an initial connection error as disconnected', () => {
    const socket = createSocket();
    const onConnectionChange = jest.fn();
    const client = createNativeChatSocketClient({
      ioFactory: jest.fn(() => socket),
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage: jest.fn(),
      onConnectionChange,
    });

    client.connect();
    socket.emitTestEvent('connect_error');

    expect(onConnectionChange).toHaveBeenCalledWith(false);
  });

  it('passes string and object chat message wrapper payloads to onMessage', async () => {
    const socket = createSocket();
    const onMessage = jest.fn(async () => undefined);
    const client = createNativeChatSocketClient({
      ioFactory: jest.fn(() => socket),
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage,
      onConnectionChange: jest.fn(),
    });

    client.connect();

    await socket.emitTestEvent(
      'message',
      JSON.stringify({ M: 'WS_SERVER_NOTIFY_GROUP_CHAT', D: { txId: 'group-tx' } }),
    );
    await socket.emitTestEvent('message', {
      M: 'WS_SERVER_NOTIFY_PRIVATE_CHAT',
      D: { txId: 'private-tx' },
    });

    expect(onMessage).toHaveBeenNthCalledWith(1, { txId: 'group-tx' });
    expect(onMessage).toHaveBeenNthCalledWith(2, { txId: 'private-tx' });
  });

  it('ignores non-chat wrappers and malformed string messages', async () => {
    const socket = createSocket();
    const onMessage = jest.fn();
    const client = createNativeChatSocketClient({
      ioFactory: jest.fn(() => socket),
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage,
      onConnectionChange: jest.fn(),
    });

    client.connect();

    await expect(
      socket.emitTestEvent('message', { M: 'HEART_BEAT', D: { txId: 'ignored' } }),
    ).resolves.toBeUndefined();
    await expect(socket.emitTestEvent('message', '{bad json')).resolves.toBeUndefined();

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('swallows rejected message handlers so socket listener callers do not see unhandled rejections', async () => {
    const socket = createSocket();
    const onMessage = jest.fn(async () => {
      throw new Error('sync failed');
    });
    const client = createNativeChatSocketClient({
      ioFactory: jest.fn(() => socket),
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage,
      onConnectionChange: jest.fn(),
    });

    client.connect();

    await expect(
      socket.emitTestEvent('message', { M: 'WS_SERVER_NOTIFY_GROUP_CHAT', D: { txId: 'group-tx' } }),
    ).resolves.toBeUndefined();
    expect(onMessage).toHaveBeenCalledWith({ txId: 'group-tx' });
  });

  it('disconnects the active socket and reports disconnected state', () => {
    const socket = createSocket(true, { emitDisconnectOnDisconnect: true });
    const onConnectionChange = jest.fn();
    const client = createNativeChatSocketClient({
      ioFactory: jest.fn(() => socket),
      url: 'https://api.idchat.io',
      socketPath: '/socket/socket.io',
      globalMetaId: 'gm1',
      onMessage: jest.fn(),
      onConnectionChange,
    });

    client.connect();

    expect(client.isConnected()).toBe(true);

    socket.connected = false;
    expect(client.isConnected()).toBe(false);

    socket.connected = true;
    client.disconnect();

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(client.isConnected()).toBe(false);
    expect(onConnectionChange).toHaveBeenCalledTimes(1);
    expect(onConnectionChange).toHaveBeenLastCalledWith(false);
  });
});
