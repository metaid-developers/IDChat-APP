import { io, type Socket } from 'socket.io-client';

const CHAT_MESSAGE_TYPES = new Set(['WS_SERVER_NOTIFY_GROUP_CHAT', 'WS_SERVER_NOTIFY_PRIVATE_CHAT']);

type NativeChatSocketOptions = {
  ioFactory?: typeof io;
  url: string;
  socketPath: string;
  globalMetaId: string;
  onMessage: (message: any) => void | Promise<void>;
  onConnectionChange: (connected: boolean) => void;
};

export function createNativeChatSocketClient(options: NativeChatSocketOptions) {
  let socket: Socket | null = null;
  let reportedConnected: boolean | undefined;
  const ioFactory = options.ioFactory || io;

  function parseMessageWrapper(data: any): any | null {
    if (typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  function ensureSocket(): Socket {
    if (!socket) {
      socket = ioFactory(options.url, {
        path: options.socketPath,
        query: { metaid: options.globalMetaId, type: 'app' },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.on('connect', () => reportConnectionChange(true));
      socket.on('disconnect', () => reportConnectionChange(false));
      socket.on('connect_error', () => reportConnectionChange(false));
      socket.on('message', async (data: any) => {
        const wrapper = parseMessageWrapper(data);

        if (CHAT_MESSAGE_TYPES.has(wrapper?.M)) {
          try {
            await options.onMessage(wrapper.D);
          } catch {
            // Keep socket event handling alive; sync errors are handled by higher-level retries.
          }
        }
      });
    }

    return socket;
  }

  function reportConnectionChange(connected: boolean) {
    if (reportedConnected === connected) {
      return;
    }

    reportedConnected = connected;
    options.onConnectionChange(connected);
  }

  return {
    connect() {
      ensureSocket().connect();
    },
    disconnect() {
      socket?.disconnect();
      socket = null;
      reportConnectionChange(false);
    },
    isConnected() {
      return Boolean(socket?.connected);
    },
  };
}
