# Native IDChat Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the IDChat homepage WebView with native React Native chat screens for private chat, group chat, text, images, and emoji while preserving the existing backend and wallet protocols.

**Architecture:** Build a new `src/chat-native` module inside the existing Expo/React Native wallet app. Keep chat protocol, crypto, storage, socket, wallet, and UI concerns separated so Phase 0 compatibility tests can pass before any visible UI replacement. Preserve the existing generic DApp/WebView stack and keep the current web chat entry behind a fallback flag until native MVP parity is proven.

**Tech Stack:** Expo SDK 53, React Native 0.79, TypeScript, React Navigation, Jest/Jest Expo, `crypto-js`, `socket.io-client`, `expo-sqlite`, `expo-file-system`, existing wallet/createPin/ECDH helpers in `src/webs/actions`.

---

## Execution Notes

- Start execution in an isolated branch or worktree, because the current `main` worktree has unrelated user changes.
- Do not revert or restage existing changes outside the files named in each task.
- Keep commits small and scoped to each task.
- Run the focused test command after every task.
- Do not make native chat the default route until Task 12; before that, the existing `ChatHomePage` remains active.

## File Structure

Create these files:

- `jest.config.js` - Jest Expo test config with `@/` alias support.
- `jest.setup.js` - Node test polyfills for `atob`, `btoa`, and `Buffer`.
- `src/chat-native/domain/types.ts` - Shared chat domain types.
- `src/chat-native/domain/protocol.ts` - Protocol constants and protocol helpers.
- `src/chat-native/domain/__tests__/protocol.test.ts` - Protocol helper tests.
- `src/chat-native/services/chatRuntimeConfig.ts` - Runtime chat API and Socket.IO config resolution.
- `src/chat-native/services/__tests__/chatRuntimeConfig.test.ts` - Runtime config tests.
- `src/chat-native/services/chatCrypto.ts` - Web-compatible chat crypto helpers.
- `src/chat-native/services/__tests__/chatCrypto.test.ts` - Crypto compatibility fixtures.
- `src/chat-native/services/chatApiClient.ts` - HTTP client for current chat backend routes.
- `src/chat-native/services/chatNormalizers.ts` - DTO-to-domain normalization.
- `src/chat-native/services/__tests__/chatApiClient.test.ts` - API route and parser tests.
- `src/chat-native/services/chatSocketClient.ts` - Socket.IO wrapper for native chat.
- `src/chat-native/services/__tests__/chatSocketClient.test.ts` - Socket config and event tests.
- `src/chat-native/services/chatNodeBuilder.ts` - Text/image MetaID node builders.
- `src/chat-native/services/chatWalletAdapter.ts` - Wallet interface and adapter factory.
- `src/chat-native/services/__tests__/chatNodeBuilder.test.ts` - Node-shape tests.
- `src/chat-native/storage/chatDatabase.ts` - SQLite schema and low-level database open/migrate.
- `src/chat-native/storage/chatRepository.ts` - Channel/message/read-index repository.
- `src/chat-native/storage/__tests__/chatRepository.test.ts` - Repository tests using an in-memory adapter.
- `src/chat-native/state/useNativeChatStore.ts` - Zustand store for channels, messages, socket state, and pending sends.
- `src/chat-native/state/__tests__/useNativeChatStore.test.ts` - Store reducer/action tests.
- `src/chat-native/screens/NativeChatHomePage.tsx` - Native IDChat root screen.
- `src/chat-native/screens/NativeChatRoomPage.tsx` - Native chat room.
- `src/chat-native/screens/ChatLinkShellPage.tsx` - Lightweight shell for links opened from chat.
- `src/chat-native/components/ConversationList.tsx` - Conversation list UI.
- `src/chat-native/components/MessageList.tsx` - Message list UI.
- `src/chat-native/components/MessageBubble.tsx` - Message bubble.
- `src/chat-native/components/ChatComposer.tsx` - Text, emoji, and image composer.
- `src/chat-native/components/EmojiBar.tsx` - MVP emoji picker.
- `src/chat-native/components/ImageMessage.tsx` - Image display.
- `src/chat-native/index.ts` - Public exports for navigation.

Modify these files:

- `package.json` - Add test scripts and required dependencies.
- `src/base/AppNavigator.jsx` - Register native chat screens and route fallback.
- `src/chat/page/ChatHomePage.tsx` - Route to native chat when the feature flag is enabled; keep web fallback.

## Task 1: Test Harness And Dependencies

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `jest.setup.js`
- Create: `src/chat-native/__tests__/testHarness.test.ts`

- [ ] **Step 1: Write the failing harness test**

Create `src/chat-native/__tests__/testHarness.test.ts`:

```ts
describe('native chat test harness', () => {
  it('provides browser-compatible base64 helpers in node tests', () => {
    expect(global.btoa('IDChat')).toBe('SURDaGF0');
    expect(global.atob('SURDaGF0')).toBe('IDChat');
  });
});
```

- [ ] **Step 2: Run the test and confirm the harness is not configured**

Run:

```bash
yarn test:chat-native src/chat-native/__tests__/testHarness.test.ts
```

Expected: the command fails because `test:chat-native` is not defined.

- [ ] **Step 3: Install test and native chat dependencies**

Run:

```bash
yarn add socket.io-client expo-sqlite expo-file-system
yarn add -D jest jest-expo @types/jest
```

- [ ] **Step 4: Add test scripts to `package.json`**

Add these scripts without removing existing scripts:

```json
{
  "test": "jest --runInBand",
  "test:chat-native": "jest --runInBand src/chat-native"
}
```

- [ ] **Step 5: Add `jest.config.js`**

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-navigation|@react-navigation/.*)/)',
  ],
};
```

- [ ] **Step 6: Add `jest.setup.js`**

Create `jest.setup.js`:

```js
const { Buffer } = require('buffer');

global.Buffer = Buffer;
global.atob = (input) => Buffer.from(input, 'base64').toString('binary');
global.btoa = (input) => Buffer.from(input, 'binary').toString('base64');
```

- [ ] **Step 7: Run the harness test**

Run:

```bash
yarn test:chat-native src/chat-native/__tests__/testHarness.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock jest.config.js jest.setup.js src/chat-native/__tests__/testHarness.test.ts
git commit -m "test: add native chat test harness"
```

## Task 2: Domain Types And Protocol Constants

**Files:**
- Create: `src/chat-native/domain/types.ts`
- Create: `src/chat-native/domain/protocol.ts`
- Create: `src/chat-native/domain/__tests__/protocol.test.ts`

- [ ] **Step 1: Write protocol tests**

Create `src/chat-native/domain/__tests__/protocol.test.ts`:

```ts
import {
  CHAT_PROTOCOL,
  getTextProtocolForChannel,
  getImageProtocolForChannel,
  isPrivateChannel,
} from '../protocol';

describe('native chat protocol helpers', () => {
  it('uses SimpleMsg for private text and SimpleGroupChat for group text', () => {
    expect(getTextProtocolForChannel('private')).toBe(CHAT_PROTOCOL.SIMPLE_MSG);
    expect(getTextProtocolForChannel('group')).toBe(CHAT_PROTOCOL.SIMPLE_GROUP_CHAT);
    expect(getTextProtocolForChannel('sub-group')).toBe(CHAT_PROTOCOL.SIMPLE_GROUP_CHAT);
  });

  it('uses file protocols for image messages', () => {
    expect(getImageProtocolForChannel('private')).toBe(CHAT_PROTOCOL.SIMPLE_FILE_MSG);
    expect(getImageProtocolForChannel('group')).toBe(CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT);
  });

  it('identifies private channels', () => {
    expect(isPrivateChannel('private')).toBe(true);
    expect(isPrivateChannel('group')).toBe(false);
    expect(isPrivateChannel('sub-group')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/domain/__tests__/protocol.test.ts
```

Expected: FAIL with module not found for `../protocol`.

- [ ] **Step 3: Create `types.ts`**

Create `src/chat-native/domain/types.ts`:

```ts
export type NativeChatChannelType = 'private' | 'group' | 'sub-group';

export type NativeChatMessageKind = 'text' | 'image';

export type NativeChatSendStatus = 'idle' | 'pending' | 'sent' | 'failed' | 'cancelled';

export type NativeChatRuntimeConfig = {
  chatApiBase: string;
  chatWsBase: string;
  chatWsPath: string;
  socketPath: string;
  addressHost: string;
};

export type NativeChatChannel = {
  accountGlobalMetaId: string;
  id: string;
  type: NativeChatChannelType;
  title: string;
  avatar?: string;
  parentGroupId?: string;
  roomJoinType?: string;
  path?: string;
  passwordKey?: string;
  publicKeyStr?: string;
  lastMessage?: NativeChatMessageSummary;
  unreadCount: number;
  lastReadIndex: number;
  updatedAt: number;
  serverData?: Record<string, unknown>;
};

export type NativeChatMessageSummary = {
  content: string;
  kind: NativeChatMessageKind;
  timestamp: number;
  senderGlobalMetaId?: string;
};

export type NativeChatMessage = {
  accountGlobalMetaId: string;
  channelId: string;
  channelType: NativeChatChannelType;
  kind: NativeChatMessageKind;
  content: string;
  contentType: string;
  encryption?: string;
  protocol: string;
  timestamp: number;
  senderGlobalMetaId?: string;
  txId?: string;
  pinId?: string;
  mockId?: string;
  index?: number;
  attachmentUri?: string;
  localPreviewUri?: string;
  replyPin?: string;
  status: NativeChatSendStatus;
  errorMessage?: string;
  raw?: Record<string, unknown>;
};

export type NativeChatEcdhRecord = {
  accountGlobalMetaId: string;
  externalPubKey: string;
  sharedSecret: string;
  ecdhPubKey?: string;
  creatorPubkey?: string;
  updatedAt: number;
};
```

- [ ] **Step 4: Create `protocol.ts`**

Create `src/chat-native/domain/protocol.ts`:

```ts
import type { NativeChatChannelType } from './types';

export const CHAT_PROTOCOL = {
  SIMPLE_GROUP_CHAT: 'SimpleGroupChat',
  SIMPLE_MSG: 'SimpleMsg',
  SIMPLE_FILE_GROUP_CHAT: 'SimpleFileGroupChat',
  SIMPLE_FILE_MSG: 'SimpleFileMsg',
} as const;

export type NativeChatProtocol = (typeof CHAT_PROTOCOL)[keyof typeof CHAT_PROTOCOL];

export function isPrivateChannel(type: NativeChatChannelType): boolean {
  return type === 'private';
}

export function getTextProtocolForChannel(type: NativeChatChannelType): NativeChatProtocol {
  return isPrivateChannel(type)
    ? CHAT_PROTOCOL.SIMPLE_MSG
    : CHAT_PROTOCOL.SIMPLE_GROUP_CHAT;
}

export function getImageProtocolForChannel(type: NativeChatChannelType): NativeChatProtocol {
  return isPrivateChannel(type)
    ? CHAT_PROTOCOL.SIMPLE_FILE_MSG
    : CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/domain/__tests__/protocol.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/domain
git commit -m "feat: add native chat domain protocol types"
```

## Task 3: Runtime Config Resolver

**Files:**
- Create: `src/chat-native/services/chatRuntimeConfig.ts`
- Create: `src/chat-native/services/__tests__/chatRuntimeConfig.test.ts`

- [ ] **Step 1: Write runtime config tests**

Create `src/chat-native/services/__tests__/chatRuntimeConfig.test.ts`:

```ts
import {
  DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG,
  buildSocketPath,
  normalizeRuntimeConfigPayload,
} from '../chatRuntimeConfig';

describe('chatRuntimeConfig', () => {
  it('builds Socket.IO path from chatWsPath', () => {
    expect(buildSocketPath('/socket')).toBe('/socket/socket.io');
    expect(buildSocketPath('socket')).toBe('/socket/socket.io');
    expect(buildSocketPath('')).toBe('/socket.io');
  });

  it('normalizes production app-config fields', () => {
    const config = normalizeRuntimeConfigPayload({
      api: {
        metaSoBaseURL: 'https://api.idchat.io',
        paths: {
          chatApi: '/chat-api',
          chatWs: '',
          chatWsPath: '/socket',
        },
      },
      blockchain: {
        addressHost: 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0',
      },
    });

    expect(config).toEqual({
      chatApiBase: 'https://api.idchat.io/chat-api',
      chatWsBase: 'https://api.idchat.io',
      chatWsPath: '/socket',
      socketPath: '/socket/socket.io',
      addressHost: 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0',
    });
  });

  it('falls back to known production defaults when payload is incomplete', () => {
    expect(normalizeRuntimeConfigPayload({})).toEqual(DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG);
  });
});
```

- [ ] **Step 2: Run the test and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatRuntimeConfig.test.ts
```

Expected: FAIL with module not found for `../chatRuntimeConfig`.

- [ ] **Step 3: Implement runtime config resolver**

Create `src/chat-native/services/chatRuntimeConfig.ts`:

```ts
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
  const trimmed = String(chatWsPath || '').trim();
  if (!trimmed) return '/socket.io';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
  return `${withoutTrailingSlash}/socket.io`;
}

function joinBaseAndPath(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function normalizeRuntimeConfigPayload(payload: any): NativeChatRuntimeConfig {
  const api = payload?.api;
  const paths = api?.paths;
  const metaSoBaseURL = typeof api?.metaSoBaseURL === 'string' ? api.metaSoBaseURL : '';
  const chatApiPath = typeof paths?.chatApi === 'string' ? paths.chatApi : '';
  const chatWsPath = typeof paths?.chatWsPath === 'string' ? paths.chatWsPath : '';
  const addressHost =
    typeof payload?.blockchain?.addressHost === 'string'
      ? payload.blockchain.addressHost
      : DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG.addressHost;

  if (!metaSoBaseURL || !chatApiPath) {
    return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
  }

  const chatWsBase = paths?.chatWs
    ? joinBaseAndPath(metaSoBaseURL, paths.chatWs)
    : metaSoBaseURL;

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
    if (!response.ok) return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
    const payload = await response.json();
    return normalizeRuntimeConfigPayload(payload);
  } catch {
    return DEFAULT_NATIVE_CHAT_RUNTIME_CONFIG;
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatRuntimeConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/chatRuntimeConfig.ts src/chat-native/services/__tests__/chatRuntimeConfig.test.ts
git commit -m "feat: add native chat runtime config resolver"
```

## Task 4: Crypto Compatibility Service

**Files:**
- Create: `src/chat-native/services/chatCrypto.ts`
- Create: `src/chat-native/services/__tests__/chatCrypto.test.ts`

- [ ] **Step 1: Write crypto compatibility tests**

Create `src/chat-native/services/__tests__/chatCrypto.test.ts`:

```ts
import {
  decryptGroupText,
  decryptPrivateImageHex,
  decryptPrivateText,
  encryptGroupText,
  encryptPrivateImageHex,
  encryptPrivateText,
} from '../chatCrypto';

describe('chatCrypto', () => {
  const groupKey = '1234567890abcdef';
  const groupPlaintext = 'hello native idchat';
  const groupCiphertext = '943905175995b6f813db36b6a522b9a2cff81261a273a4171fa030fb901ee974';
  const privateSecret =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const privateCiphertext = 'U2FsdGVkX1/HuezozE95VsBrHneFXYJHwD65DuYR2W0=';
  const imageHex = '89504e470d0a1a0a0000000d49484452';
  const imageCiphertext = '22f18f43ce108ff8bfde42aa3925e82647541575567dc89f0080c4bcd7888046';

  it('matches the web group AES-CBC hex fixture', () => {
    expect(encryptGroupText(groupPlaintext, groupKey)).toBe(groupCiphertext);
    expect(decryptGroupText(groupCiphertext, groupKey)).toBe(groupPlaintext);
  });

  it('decrypts a web-compatible private text ciphertext', () => {
    expect(decryptPrivateText(privateCiphertext, privateSecret)).toBe('private hello');
  });

  it('round-trips private text with the current web-compatible passphrase mode', () => {
    const encrypted = encryptPrivateText('fresh private hello', privateSecret);
    expect(encrypted).not.toBe('fresh private hello');
    expect(decryptPrivateText(encrypted, privateSecret)).toBe('fresh private hello');
  });

  it('matches the web private image AES-CBC hex fixture', () => {
    expect(encryptPrivateImageHex(imageHex, privateSecret)).toBe(imageCiphertext);
    expect(decryptPrivateImageHex(imageCiphertext, privateSecret)).toBe(imageHex);
  });
});
```

- [ ] **Step 2: Run the test and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatCrypto.test.ts
```

Expected: FAIL with module not found for `../chatCrypto`.

- [ ] **Step 3: Implement `chatCrypto.ts`**

Create `src/chat-native/services/chatCrypto.ts`:

```ts
import { AES, enc, mode, pad } from 'crypto-js';

const Utf8 = enc.Utf8;
const Hex = enc.Hex;
const iv = Utf8.parse('0000000000000000');

function hexToBase64(hex: string): string {
  return Buffer.from(hex, 'hex').toString('base64');
}

function base64ToHex(base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex');
}

export function decryptGroupText(messageHex: string, secretKeyStr: string): string {
  const secretKey = Utf8.parse(secretKeyStr);
  try {
    const messageBase64 = hexToBase64(messageHex);
    const messageBytes = AES.decrypt(messageBase64, secretKey, {
      iv,
      mode: mode.CBC,
      padding: pad.Pkcs7,
    });
    return messageBytes.toString(Utf8);
  } catch {
    return messageHex;
  }
}

export function encryptGroupText(message: string, secretKeyStr: string): string {
  const encrypted = AES.encrypt(Utf8.parse(message), Utf8.parse(secretKeyStr), {
    iv,
    mode: mode.CBC,
    padding: pad.Pkcs7,
  });
  return base64ToHex(encrypted.toString());
}

export function encryptPrivateText(message: string, sharedSecret: string): string {
  return AES.encrypt(message, sharedSecret).toString();
}

export function decryptPrivateText(message: string, sharedSecret: string): string {
  try {
    return AES.decrypt(message, sharedSecret).toString(Utf8);
  } catch {
    return '';
  }
}

export function encryptPrivateImageHex(messageHex: string, secretKeyHex: string): string {
  const encrypted = AES.encrypt(Hex.parse(messageHex), Hex.parse(secretKeyHex), {
    mode: mode.CBC,
    padding: pad.Pkcs7,
    iv,
  });
  return encrypted.ciphertext.toString(Hex);
}

export function decryptPrivateImageHex(cipherHex: string, secretKeyHex: string): string {
  const cipherParams = { ciphertext: Hex.parse(cipherHex) } as any;
  const decrypted = AES.decrypt(cipherParams, Hex.parse(secretKeyHex), {
    mode: mode.CBC,
    padding: pad.Pkcs7,
    iv,
  });
  return decrypted.toString(Hex);
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatCrypto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/chatCrypto.ts src/chat-native/services/__tests__/chatCrypto.test.ts
git commit -m "feat: add native chat crypto compatibility helpers"
```

## Task 5: Chat API Client And Normalizers

**Files:**
- Create: `src/chat-native/services/chatApiClient.ts`
- Create: `src/chat-native/services/chatNormalizers.ts`
- Create: `src/chat-native/services/__tests__/chatApiClient.test.ts`

- [ ] **Step 1: Write API client tests**

Create `src/chat-native/services/__tests__/chatApiClient.test.ts`:

```ts
import { NativeChatApiClient } from '../chatApiClient';
import { normalizeLatestChatInfoItem } from '../chatNormalizers';

describe('NativeChatApiClient', () => {
  it('calls latest-chat-info-list with the existing backend route shape', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    })) as any;
    const client = new NativeChatApiClient('https://api.idchat.io/chat-api', fetcher);

    await client.getLatestChatInfoList({ metaId: 'gm1', cursor: '0', size: '100' });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.idchat.io/chat-api/group-chat/user/latest-chat-info-list?metaId=gm1&cursor=0&size=100',
      { method: 'GET' },
    );
  });

  it('normalizes private and group latest chat records', () => {
    expect(
      normalizeLatestChatInfoItem(
        {
          type: '2',
          globalMetaId: 'peer-gm',
          name: 'Peer',
          chatPublicKey: 'pub',
          latestMessage: { content: 'hello', timestamp: 10 },
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'peer-gm',
      type: 'private',
      title: 'Peer',
      publicKeyStr: 'pub',
    });

    expect(
      normalizeLatestChatInfoItem(
        {
          type: '1',
          groupId: 'group-1',
          roomName: 'Group',
          latestMessage: { content: 'group hello', timestamp: 20 },
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'group-1',
      type: 'group',
      title: 'Group',
    });
  });
});
```

- [ ] **Step 2: Run tests and confirm missing modules fail**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatApiClient.test.ts
```

Expected: FAIL with module not found for `../chatApiClient`.

- [ ] **Step 3: Implement `chatApiClient.ts`**

Create `src/chat-native/services/chatApiClient.ts`:

```ts
type Fetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<any> }>;

function buildUrl(base: string, path: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${base.replace(/\/+$/, '')}${path}?${query}`;
}

async function getJson(fetcher: Fetcher, url: string): Promise<any> {
  const response = await fetcher(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Chat API request failed: ${url}`);
  }
  return response.json();
}

export class NativeChatApiClient {
  constructor(
    private readonly chatApiBase: string,
    private readonly fetcher: Fetcher = fetch as Fetcher,
  ) {}

  async getLatestChatInfoList(params: {
    metaId: string;
    cursor?: string;
    size?: string;
  }): Promise<any[]> {
    const payload = await getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/user/latest-chat-info-list', {
        metaId: params.metaId,
        cursor: params.cursor || '0',
        size: params.size || '100',
      }),
    );
    return payload?.data?.list || payload?.data || [];
  }

  async getGroupMessagesByIndex(params: {
    groupId: string;
    startIndex?: string;
    size?: string;
  }): Promise<any> {
    return getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/group-chat-list-by-index', {
        groupId: params.groupId,
        startIndex: params.startIndex || '0',
        size: params.size || '30',
      }),
    );
  }

  async getChannelMessagesByIndex(params: {
    channelId: string;
    startIndex?: string;
    size?: string;
  }): Promise<any> {
    return getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/channel-chat-list-by-index', {
        channelId: params.channelId,
        startIndex: params.startIndex || '0',
        size: params.size || '30',
      }),
    );
  }

  async getPrivateMessagesByIndex(params: {
    metaId: string;
    otherMetaId: string;
    startIndex?: string;
    size?: string;
  }): Promise<any> {
    return getJson(
      this.fetcher,
      buildUrl(this.chatApiBase, '/group-chat/private-chat-list-by-index', {
        metaId: params.metaId,
        otherMetaId: params.otherMetaId,
        startIndex: params.startIndex || '0',
        size: params.size || '30',
      }),
    );
  }
}
```

- [ ] **Step 4: Implement `chatNormalizers.ts`**

Create `src/chat-native/services/chatNormalizers.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';

export function normalizeLatestChatInfoItem(item: any, accountGlobalMetaId: string): NativeChatChannel {
  const isPrivate = item?.type === '2' || Boolean(item?.globalMetaId && !item?.groupId);
  const id = isPrivate ? item.globalMetaId || item.metaId : item.groupId || item.channelId;
  const title = isPrivate
    ? item.name || item.nickName || item.globalMetaId || 'Unknown'
    : item.roomName || item.name || item.groupId || 'Group';
  const latest = item.latestMessage || item.lastMessage;

  return {
    accountGlobalMetaId,
    id,
    type: isPrivate ? 'private' : 'group',
    title,
    avatar: item.avatar || item.avatarImage || item.icon,
    roomJoinType: item.roomJoinType,
    path: item.path,
    passwordKey: item.passwordKey,
    publicKeyStr: item.chatPublicKey || item.publicKeyStr,
    unreadCount: Number(item.unreadCount || 0),
    lastReadIndex: Number(item.lastReadIndex || 0),
    updatedAt: Number(latest?.timestamp || item.timestamp || Date.now()),
    lastMessage: latest
      ? {
          content: String(latest.content || ''),
          kind: latest.fileType || latest.attachment ? 'image' : 'text',
          timestamp: Number(latest.timestamp || 0),
          senderGlobalMetaId: latest.globalMetaId || latest.metaId,
        }
      : undefined,
    serverData: item,
  };
}

export function normalizeSocketMessage(
  payload: any,
  accountGlobalMetaId: string,
): NativeChatMessage {
  const channelType = payload?.toGlobalMetaId || payload?.to ? 'private' : 'group';
  const channelId =
    channelType === 'private'
      ? payload.fromGlobalMetaId || payload.metaId || payload.from
      : payload.channelId || payload.groupId || payload.metanetId;

  return {
    accountGlobalMetaId,
    channelId,
    channelType,
    kind: payload.attachment || payload.fileType ? 'image' : 'text',
    content: String(payload.content || ''),
    contentType: payload.contentType || 'text/plain',
    encryption: payload.encryption || payload.encrypt,
    protocol: payload.protocol || payload.nodeName || '',
    timestamp: Number(payload.timestamp || Date.now()),
    senderGlobalMetaId: payload.globalMetaId || payload.metaId || payload.fromGlobalMetaId,
    txId: payload.txId,
    pinId: payload.pinId,
    index: typeof payload.index === 'number' ? payload.index : undefined,
    attachmentUri: payload.attachment,
    status: 'sent',
    raw: payload,
  };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatApiClient.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/services/chatApiClient.ts src/chat-native/services/chatNormalizers.ts src/chat-native/services/__tests__/chatApiClient.test.ts
git commit -m "feat: add native chat api client"
```

## Task 6: Socket.IO Client Wrapper

**Files:**
- Create: `src/chat-native/services/chatSocketClient.ts`
- Create: `src/chat-native/services/__tests__/chatSocketClient.test.ts`

- [ ] **Step 1: Write Socket.IO wrapper tests**

Create `src/chat-native/services/__tests__/chatSocketClient.test.ts`:

```ts
import { createNativeChatSocketClient } from '../chatSocketClient';

describe('chatSocketClient', () => {
  it('connects with existing idchat query and path shape', () => {
    const socket = {
      connected: false,
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const ioFactory = jest.fn(() => socket as any);

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
    expect(socket.connect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatSocketClient.test.ts
```

Expected: FAIL with module not found for `../chatSocketClient`.

- [ ] **Step 3: Implement socket wrapper**

Create `src/chat-native/services/chatSocketClient.ts`:

```ts
import { io, Socket } from 'socket.io-client';

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
  const ioFactory = options.ioFactory || io;

  function ensureSocket(): Socket {
    if (!socket) {
      socket = ioFactory(options.url, {
        path: options.socketPath,
        query: { metaid: options.globalMetaId, type: 'app' },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.on('connect', () => options.onConnectionChange(true));
      socket.on('disconnect', () => options.onConnectionChange(false));
      socket.on('connect_error', () => options.onConnectionChange(false));
      socket.on('message', async (data: any) => {
        const wrapper = typeof data === 'string' ? JSON.parse(data) : data;
        if (
          wrapper?.M === 'WS_SERVER_NOTIFY_GROUP_CHAT' ||
          wrapper?.M === 'WS_SERVER_NOTIFY_PRIVATE_CHAT'
        ) {
          await options.onMessage(wrapper.D);
        }
      });
    }
    return socket;
  }

  return {
    connect() {
      ensureSocket().connect();
    },
    disconnect() {
      socket?.disconnect();
      socket = null;
      options.onConnectionChange(false);
    },
    isConnected() {
      return Boolean(socket?.connected);
    },
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatSocketClient.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/chatSocketClient.ts src/chat-native/services/__tests__/chatSocketClient.test.ts
git commit -m "feat: add native chat socket client"
```

## Task 7: MetaID Node Builders And Wallet Adapter Interface

**Files:**
- Create: `src/chat-native/services/chatNodeBuilder.ts`
- Create: `src/chat-native/services/chatWalletAdapter.ts`
- Create: `src/chat-native/services/__tests__/chatNodeBuilder.test.ts`

- [ ] **Step 1: Write node builder tests**

Create `src/chat-native/services/__tests__/chatNodeBuilder.test.ts`:

```ts
import { buildImageNode, buildTextNode } from '../chatNodeBuilder';
import { CHAT_PROTOCOL } from '../../domain/protocol';

describe('chatNodeBuilder', () => {
  it('builds group text nodes', () => {
    expect(
      buildTextNode({
        channelType: 'group',
        channelId: 'group-1',
        content: 'encrypted',
        nickName: 'Alice',
        timestamp: 100,
      }),
    ).toMatchObject({
      protocol: CHAT_PROTOCOL.SIMPLE_GROUP_CHAT,
      body: {
        groupID: 'group-1',
        content: 'encrypted',
        contentType: 'text/plain',
        encryption: 'aes',
      },
      externalEncryption: '0',
    });
  });

  it('builds private text nodes', () => {
    expect(
      buildTextNode({
        channelType: 'private',
        channelId: 'peer-gm',
        content: 'encrypted',
        nickName: 'Alice',
        timestamp: 100,
      }),
    ).toMatchObject({
      protocol: CHAT_PROTOCOL.SIMPLE_MSG,
      body: {
        to: 'peer-gm',
        content: 'encrypted',
        contentType: 'text/plain',
        encrypt: 'ecdh',
      },
      externalEncryption: '0',
    });
  });

  it('builds private image nodes with file encryption enabled', () => {
    expect(
      buildImageNode({
        channelType: 'private',
        channelId: 'peer-gm',
        fileType: 'png',
        nickName: 'Alice',
        timestamp: 100,
      }),
    ).toMatchObject({
      protocol: CHAT_PROTOCOL.SIMPLE_FILE_MSG,
      fileEncryption: '1',
      body: {
        to: 'peer-gm',
        fileType: 'png',
        attachment: '',
      },
    });
  });
});
```

- [ ] **Step 2: Run tests and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatNodeBuilder.test.ts
```

Expected: FAIL with module not found for `../chatNodeBuilder`.

- [ ] **Step 3: Implement node builder**

Create `src/chat-native/services/chatNodeBuilder.ts`:

```ts
import { CHAT_PROTOCOL } from '../domain/protocol';
import type { NativeChatChannelType } from '../domain/types';

type TextNodeInput = {
  channelType: NativeChatChannelType;
  channelId: string;
  parentGroupId?: string;
  content: string;
  nickName: string;
  timestamp: number;
  replyPin?: string;
};

type ImageNodeInput = {
  channelType: NativeChatChannelType;
  channelId: string;
  parentGroupId?: string;
  fileType: string;
  nickName: string;
  timestamp: number;
  replyPin?: string;
};

export function buildTextNode(input: TextNodeInput) {
  if (input.channelType === 'private') {
    return {
      protocol: CHAT_PROTOCOL.SIMPLE_MSG,
      body: {
        to: input.channelId,
        timestamp: input.timestamp,
        content: input.content,
        contentType: 'text/plain',
        encrypt: 'ecdh',
        replyPin: input.replyPin || '',
      },
      timestamp: input.timestamp,
      externalEncryption: '0' as const,
    };
  }

  return {
    protocol: CHAT_PROTOCOL.SIMPLE_GROUP_CHAT,
    body: {
      groupID: input.parentGroupId || input.channelId,
      channelID: input.channelType === 'sub-group' ? input.channelId : undefined,
      timestamp: input.timestamp,
      nickName: input.nickName,
      content: input.content,
      contentType: 'text/plain',
      encryption: 'aes',
      replyPin: input.replyPin || '',
      mention: [],
    },
    timestamp: input.timestamp * 1000,
    externalEncryption: '0' as const,
  };
}

export function buildImageNode(input: ImageNodeInput) {
  if (input.channelType === 'private') {
    return {
      protocol: CHAT_PROTOCOL.SIMPLE_FILE_MSG,
      body: {
        timestamp: input.timestamp,
        encrypt: 'aes',
        fileType: input.fileType,
        to: input.channelId,
        nickName: input.nickName,
        attachment: '',
        replyPin: input.replyPin || '',
      },
      timestamp: input.timestamp * 1000,
      externalEncryption: '0' as const,
      fileEncryption: '1' as const,
    };
  }

  return {
    protocol: CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT,
    body: {
      timestamp: input.timestamp,
      encrypt: 'aes',
      fileType: input.fileType,
      groupId: input.parentGroupId || input.channelId,
      channelId: input.channelType === 'sub-group' ? input.channelId : '',
      nickName: input.nickName,
      attachment: '',
      replyPin: input.replyPin || '',
    },
    timestamp: input.timestamp * 1000,
    externalEncryption: '0' as const,
    fileEncryption: '0' as const,
  };
}
```

- [ ] **Step 4: Define wallet adapter interface**

Create `src/chat-native/services/chatWalletAdapter.ts`:

```ts
import * as ECDH from '@/webs/actions/common/ecdh';
import * as GetPKHByPath from '@/webs/actions/lib/query/get-pkh-by-path';
import * as CreatePin from '@/webs/actions/create-pin';
import type { CreatePinParams, CreatePinResult } from '@/webs/actions/create-pin';

export type NativeChatWalletAdapter = {
  getPKHByPath(path: string): Promise<string>;
  getEcdh(externalPubKey: string): Promise<{
    externalPubKey: string;
    sharedSecret: string;
    ecdhPubKey?: string;
    creatorPubkey?: string;
  }>;
  createPin(params: CreatePinParams): Promise<CreatePinResult>;
};

export function createNativeChatWalletAdapter(): NativeChatWalletAdapter {
  return {
    async getPKHByPath(path: string) {
      return GetPKHByPath.process({ path }, { password: '' });
    },
    async getEcdh(externalPubKey: string) {
      return ECDH.process({ externalPubKey });
    },
    async createPin(params: CreatePinParams) {
      return CreatePin.process(params);
    },
  };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatNodeBuilder.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/services/chatNodeBuilder.ts src/chat-native/services/chatWalletAdapter.ts src/chat-native/services/__tests__/chatNodeBuilder.test.ts
git commit -m "feat: add native chat node builders"
```

## Task 8: SQLite Storage Repository

**Files:**
- Create: `src/chat-native/storage/chatDatabase.ts`
- Create: `src/chat-native/storage/chatRepository.ts`
- Create: `src/chat-native/storage/__tests__/chatRepository.test.ts`

- [ ] **Step 1: Write repository behavior tests against a memory adapter**

Create `src/chat-native/storage/__tests__/chatRepository.test.ts`:

```ts
import { createMemoryChatRepository } from '../chatRepository';
import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';

describe('chatRepository', () => {
  const channel: NativeChatChannel = {
    accountGlobalMetaId: 'self',
    id: 'group-1',
    type: 'group',
    title: 'Group',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 100,
  };

  const message: NativeChatMessage = {
    accountGlobalMetaId: 'self',
    channelId: 'group-1',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'SimpleGroupChat',
    timestamp: 100,
    txId: 'tx1',
    status: 'sent',
  };

  it('saves and lists channels by account', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertChannel(channel);
    await repo.upsertChannel({ ...channel, accountGlobalMetaId: 'other', id: 'group-2' });

    await expect(repo.listChannels('self')).resolves.toEqual([channel]);
  });

  it('deduplicates messages by txId within an account and channel', async () => {
    const repo = createMemoryChatRepository();
    await repo.upsertMessage(message);
    await repo.upsertMessage({ ...message, content: 'new content' });

    await expect(repo.listMessages('self', 'group-1')).resolves.toHaveLength(1);
    await expect(repo.listMessages('self', 'group-1')).resolves.toMatchObject([
      { content: 'new content' },
    ]);
  });
});
```

- [ ] **Step 2: Run tests and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/storage/__tests__/chatRepository.test.ts
```

Expected: FAIL with module not found for `../chatRepository`.

- [ ] **Step 3: Implement `chatDatabase.ts`**

Create `src/chat-native/storage/chatDatabase.ts`:

```ts
import * as SQLite from 'expo-sqlite';

export type NativeChatDb = SQLite.SQLiteDatabase;

export async function openNativeChatDatabase(): Promise<NativeChatDb> {
  const db = await SQLite.openDatabaseAsync('native-idchat.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS channels (
      account_global_meta_id TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      dedupe_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id, dedupe_key)
    );
    CREATE TABLE IF NOT EXISTS read_indexes (
      account_global_meta_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      last_read_index INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_global_meta_id, channel_id)
    );
  `);
  return db;
}
```

- [ ] **Step 4: Implement repository with memory adapter for unit tests**

Create `src/chat-native/storage/chatRepository.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatDb } from './chatDatabase';

export type NativeChatRepository = {
  upsertChannel(channel: NativeChatChannel): Promise<void>;
  listChannels(accountGlobalMetaId: string): Promise<NativeChatChannel[]>;
  upsertMessage(message: NativeChatMessage): Promise<void>;
  listMessages(accountGlobalMetaId: string, channelId: string): Promise<NativeChatMessage[]>;
  saveLastReadIndex(accountGlobalMetaId: string, channelId: string, lastReadIndex: number): Promise<void>;
};

export function getMessageDedupeKey(message: NativeChatMessage): string {
  return message.txId || message.pinId || message.mockId || `${message.timestamp}:${message.senderGlobalMetaId || ''}`;
}

export function createSQLiteChatRepository(db: NativeChatDb): NativeChatRepository {
  return {
    async upsertChannel(channel) {
      await db.runAsync(
        'INSERT OR REPLACE INTO channels (account_global_meta_id, id, payload, updated_at) VALUES (?, ?, ?, ?)',
        channel.accountGlobalMetaId,
        channel.id,
        JSON.stringify(channel),
        channel.updatedAt,
      );
    },
    async listChannels(accountGlobalMetaId) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM channels WHERE account_global_meta_id = ? ORDER BY updated_at DESC',
        accountGlobalMetaId,
      );
      return rows.map((row) => JSON.parse(row.payload));
    },
    async upsertMessage(message) {
      await db.runAsync(
        'INSERT OR REPLACE INTO messages (account_global_meta_id, channel_id, dedupe_key, payload, timestamp) VALUES (?, ?, ?, ?, ?)',
        message.accountGlobalMetaId,
        message.channelId,
        getMessageDedupeKey(message),
        JSON.stringify(message),
        message.timestamp,
      );
    },
    async listMessages(accountGlobalMetaId, channelId) {
      const rows = await db.getAllAsync<{ payload: string }>(
        'SELECT payload FROM messages WHERE account_global_meta_id = ? AND channel_id = ? ORDER BY timestamp ASC',
        accountGlobalMetaId,
        channelId,
      );
      return rows.map((row) => JSON.parse(row.payload));
    },
    async saveLastReadIndex(accountGlobalMetaId, channelId, lastReadIndex) {
      await db.runAsync(
        'INSERT OR REPLACE INTO read_indexes (account_global_meta_id, channel_id, last_read_index, updated_at) VALUES (?, ?, ?, ?)',
        accountGlobalMetaId,
        channelId,
        lastReadIndex,
        Date.now(),
      );
    },
  };
}

export function createMemoryChatRepository(): NativeChatRepository {
  const channels = new Map<string, NativeChatChannel>();
  const messages = new Map<string, NativeChatMessage>();
  return {
    async upsertChannel(channel) {
      channels.set(`${channel.accountGlobalMetaId}:${channel.id}`, channel);
    },
    async listChannels(accountGlobalMetaId) {
      return Array.from(channels.values())
        .filter((channel) => channel.accountGlobalMetaId === accountGlobalMetaId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async upsertMessage(message) {
      messages.set(
        `${message.accountGlobalMetaId}:${message.channelId}:${getMessageDedupeKey(message)}`,
        message,
      );
    },
    async listMessages(accountGlobalMetaId, channelId) {
      return Array.from(messages.values())
        .filter((message) => message.accountGlobalMetaId === accountGlobalMetaId && message.channelId === channelId)
        .sort((a, b) => a.timestamp - b.timestamp);
    },
    async saveLastReadIndex() {},
  };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/storage/__tests__/chatRepository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/storage
git commit -m "feat: add native chat storage repository"
```

## Task 9: Native Chat Store

**Files:**
- Create: `src/chat-native/state/useNativeChatStore.ts`
- Create: `src/chat-native/state/__tests__/useNativeChatStore.test.ts`

- [ ] **Step 1: Write store tests**

Create `src/chat-native/state/__tests__/useNativeChatStore.test.ts`:

```ts
import { createNativeChatStore } from '../useNativeChatStore';

describe('useNativeChatStore', () => {
  it('merges channels and tracks active channel messages', async () => {
    const store = createNativeChatStore();

    store.getState().setAccount('self');
    store.getState().mergeChannels([
      {
        accountGlobalMetaId: 'self',
        id: 'group-1',
        type: 'group',
        title: 'Group',
        unreadCount: 0,
        lastReadIndex: 0,
        updatedAt: 100,
      },
    ]);
    store.getState().setActiveChannelId('group-1');
    store.getState().mergeMessages('group-1', [
      {
        accountGlobalMetaId: 'self',
        channelId: 'group-1',
        channelType: 'group',
        kind: 'text',
        content: 'hello',
        contentType: 'text/plain',
        protocol: 'SimpleGroupChat',
        timestamp: 100,
        txId: 'tx1',
        status: 'sent',
      },
    ]);

    expect(store.getState().channels).toHaveLength(1);
    expect(store.getState().messagesByChannel['group-1']).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests and confirm missing module failure**

Run:

```bash
yarn test:chat-native src/chat-native/state/__tests__/useNativeChatStore.test.ts
```

Expected: FAIL with module not found for `../useNativeChatStore`.

- [ ] **Step 3: Implement store**

Create `src/chat-native/state/useNativeChatStore.ts`:

```ts
import { createStore } from 'zustand/vanilla';
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { getMessageDedupeKey } from '../storage/chatRepository';

type NativeChatState = {
  accountGlobalMetaId: string;
  activeChannelId?: string;
  channels: NativeChatChannel[];
  messagesByChannel: Record<string, NativeChatMessage[]>;
  socketConnected: boolean;
  setAccount: (globalMetaId: string) => void;
  setActiveChannelId: (channelId?: string) => void;
  setSocketConnected: (connected: boolean) => void;
  mergeChannels: (channels: NativeChatChannel[]) => void;
  mergeMessages: (channelId: string, messages: NativeChatMessage[]) => void;
};

export function createNativeChatStore() {
  return createStore<NativeChatState>((set) => ({
    accountGlobalMetaId: '',
    activeChannelId: undefined,
    channels: [],
    messagesByChannel: {},
    socketConnected: false,
    setAccount: (globalMetaId) => set({ accountGlobalMetaId: globalMetaId }),
    setActiveChannelId: (channelId) => set({ activeChannelId: channelId }),
    setSocketConnected: (connected) => set({ socketConnected: connected }),
    mergeChannels: (incoming) =>
      set((state) => {
        const byId = new Map(state.channels.map((channel) => [channel.id, channel]));
        incoming.forEach((channel) => byId.set(channel.id, { ...byId.get(channel.id), ...channel }));
        return { channels: Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt) };
      }),
    mergeMessages: (channelId, incoming) =>
      set((state) => {
        const existing = state.messagesByChannel[channelId] || [];
        const byKey = new Map(existing.map((message) => [getMessageDedupeKey(message), message]));
        incoming.forEach((message) => byKey.set(getMessageDedupeKey(message), { ...byKey.get(getMessageDedupeKey(message)), ...message }));
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: Array.from(byKey.values()).sort((a, b) => a.timestamp - b.timestamp),
          },
        };
      }),
  }));
}

export const nativeChatStore = createNativeChatStore();
```

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/state/__tests__/useNativeChatStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/state
git commit -m "feat: add native chat store"
```

## Task 10: Read-Only Native Chat Screens

**Files:**
- Create: `src/chat-native/index.ts`
- Create: `src/chat-native/screens/NativeChatHomePage.tsx`
- Create: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Create: `src/chat-native/components/ConversationList.tsx`
- Create: `src/chat-native/components/MessageList.tsx`
- Create: `src/chat-native/components/MessageBubble.tsx`

- [ ] **Step 1: Create public exports**

Create `src/chat-native/index.ts`:

```ts
export { default as NativeChatHomePage } from './screens/NativeChatHomePage';
export { default as NativeChatRoomPage } from './screens/NativeChatRoomPage';
```

- [ ] **Step 2: Create conversation list component**

Create `src/chat-native/components/ConversationList.tsx`:

```tsx
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { NativeChatChannel } from '../domain/types';

type Props = {
  channels: NativeChatChannel[];
  onOpenChannel: (channel: NativeChatChannel) => void;
};

export default function ConversationList({ channels, onOpenChannel }: Props) {
  return (
    <FlatList
      data={channels}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text>No chats yet</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => onOpenChannel(item)} style={{ padding: 16 }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
            <Text numberOfLines={1}>{item.lastMessage?.content || ''}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}
```

- [ ] **Step 3: Create read-only message components**

Create `src/chat-native/components/MessageBubble.tsx`:

```tsx
import React from 'react';
import { Image, Text, View } from 'react-native';
import type { NativeChatMessage } from '../domain/types';

type Props = {
  message: NativeChatMessage;
  isSelf: boolean;
};

export default function MessageBubble({ message, isSelf }: Props) {
  return (
    <View style={{ alignItems: isSelf ? 'flex-end' : 'flex-start', padding: 8 }}>
      <View style={{ maxWidth: '80%', padding: 10, borderRadius: 8, backgroundColor: isSelf ? '#DCF8C6' : '#FFFFFF' }}>
        {message.kind === 'image' && message.attachmentUri ? (
          <Image source={{ uri: message.localPreviewUri || message.attachmentUri }} style={{ width: 180, height: 180 }} />
        ) : (
          <Text>{message.content}</Text>
        )}
        {message.status === 'failed' ? <Text style={{ color: '#C00' }}>{message.errorMessage || 'Send failed'}</Text> : null}
      </View>
    </View>
  );
}
```

Create `src/chat-native/components/MessageList.tsx`:

```tsx
import React from 'react';
import { FlatList } from 'react-native';
import type { NativeChatMessage } from '../domain/types';
import MessageBubble from './MessageBubble';

type Props = {
  accountGlobalMetaId: string;
  messages: NativeChatMessage[];
};

export default function MessageList({ accountGlobalMetaId, messages }: Props) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.txId || item.pinId || item.mockId || `${item.timestamp}`}
      renderItem={({ item }) => (
        <MessageBubble message={item} isSelf={item.senderGlobalMetaId === accountGlobalMetaId} />
      )}
    />
  );
}
```

- [ ] **Step 4: Create native home and room screens**

Create `src/chat-native/screens/NativeChatHomePage.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigate } from '@/base/NavigationService';
import ConversationList from '../components/ConversationList';
import { nativeChatStore } from '../state/useNativeChatStore';

export default function NativeChatHomePage() {
  const [channels, setChannels] = useState(nativeChatStore.getState().channels);

  useEffect(() => {
    const unsubscribe = nativeChatStore.subscribe((state) => setChannels(state.channels));
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <ConversationList
        channels={channels}
        onOpenChannel={(channel) => {
          nativeChatStore.getState().setActiveChannelId(channel.id);
          navigate('NativeChatRoomPage', { channelId: channel.id });
        }}
      />
    </SafeAreaView>
  );
}
```

Create `src/chat-native/screens/NativeChatRoomPage.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageList from '../components/MessageList';
import { nativeChatStore } from '../state/useNativeChatStore';

type Props = {
  route: { params?: { channelId?: string } };
};

export default function NativeChatRoomPage({ route }: Props) {
  const channelId = route.params?.channelId || nativeChatStore.getState().activeChannelId || '';
  const [state, setState] = useState(nativeChatStore.getState());

  useEffect(() => {
    const unsubscribe = nativeChatStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EFEFEF' }}>
      <MessageList
        accountGlobalMetaId={state.accountGlobalMetaId}
        messages={state.messagesByChannel[channelId] || []}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS or only pre-existing unrelated type errors. If unrelated type errors appear, capture them in the task notes and run the focused Jest suite as the gating check for this task.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/index.ts src/chat-native/screens src/chat-native/components
git commit -m "feat: add read-only native chat screens"
```

## Task 11: Navigation Registration And WebView Fallback Flag

**Files:**
- Modify: `src/base/AppNavigator.jsx`
- Modify: `src/chat/page/ChatHomePage.tsx`

- [ ] **Step 1: Register native chat screens in `AppNavigator.jsx`**

Add imports:

```js
import { NativeChatHomePage, NativeChatRoomPage } from '@/chat-native';
```

Add stack screens near the existing chat stack screens:

```jsx
<Stack.Screen name="NativeChatHomePage" component={NativeChatHomePage} />
<Stack.Screen name="NativeChatRoomPage" component={NativeChatRoomPage} />
```

- [ ] **Step 2: Add a local fallback flag in `ChatHomePage.tsx`**

Near the imports, add:

```ts
const ENABLE_NATIVE_IDCHAT = false;
```

Inside the first mount effect in `ChatHomePage`, before WebView initialization work, add:

```ts
if (ENABLE_NATIVE_IDCHAT) {
  navigate('NativeChatHomePage');
  return;
}
```

Keep the flag set to `false` for this task so the current production entry does not change.

- [ ] **Step 3: Run focused validation**

Run:

```bash
npx tsc --noEmit
yarn test:chat-native
```

Expected: Jest passes. If TypeScript reports existing unrelated errors, record the exact first error and keep Jest as the task gate.

- [ ] **Step 4: Commit**

```bash
git add src/base/AppNavigator.jsx src/chat/page/ChatHomePage.tsx
git commit -m "feat: register native chat routes behind fallback"
```

## Task 12: Read-Only Sync Orchestrator

**Files:**
- Create: `src/chat-native/services/nativeChatBootstrap.ts`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Test: `src/chat-native/services/__tests__/nativeChatBootstrap.test.ts`

- [ ] **Step 1: Write bootstrap test**

Create `src/chat-native/services/__tests__/nativeChatBootstrap.test.ts`:

```ts
import { bootstrapReadOnlyNativeChat } from '../nativeChatBootstrap';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';

describe('nativeChatBootstrap', () => {
  it('loads latest channels into repository and store', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const apiClient = {
      getLatestChatInfoList: jest.fn(async () => [
        { type: '1', groupId: 'group-1', roomName: 'Group', latestMessage: { content: 'hi', timestamp: 1 } },
      ]),
    };

    await bootstrapReadOnlyNativeChat({
      accountGlobalMetaId: 'self',
      apiClient: apiClient as any,
      repository: repo,
      store,
    });

    expect(store.getState().channels).toMatchObject([{ id: 'group-1', title: 'Group' }]);
    await expect(repo.listChannels('self')).resolves.toMatchObject([{ id: 'group-1' }]);
  });
});
```

- [ ] **Step 2: Implement bootstrap orchestration**

Create `src/chat-native/services/nativeChatBootstrap.ts`:

```ts
import { normalizeLatestChatInfoItem } from './chatNormalizers';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatApiClient } from './chatApiClient';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;

export async function bootstrapReadOnlyNativeChat(params: {
  accountGlobalMetaId: string;
  apiClient: Pick<NativeChatApiClient, 'getLatestChatInfoList'>;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
}) {
  params.store.getState().setAccount(params.accountGlobalMetaId);
  const cached = await params.repository.listChannels(params.accountGlobalMetaId);
  if (cached.length) params.store.getState().mergeChannels(cached);

  const latest = await params.apiClient.getLatestChatInfoList({
    metaId: params.accountGlobalMetaId,
    cursor: '0',
    size: '100',
  });
  const channels = latest.map((item) => normalizeLatestChatInfoItem(item, params.accountGlobalMetaId));

  for (const channel of channels) {
    await params.repository.upsertChannel(channel);
  }
  params.store.getState().mergeChannels(channels);
}
```

- [ ] **Step 3: Wire bootstrap into `NativeChatHomePage`**

In `NativeChatHomePage.tsx`, initialize runtime config, database repository, and API client in `useEffect`. Keep failures visible through a basic text state and do not clear cached store data on failure.

Use this structure:

```tsx
useEffect(() => {
  let cancelled = false;
  async function start() {
    try {
      const runtime = await loadNativeChatRuntimeConfig();
      const db = await openNativeChatDatabase();
      const repository = createSQLiteChatRepository(db);
      const apiClient = new NativeChatApiClient(runtime.chatApiBase);
      const accountGlobalMetaId = nativeChatStore.getState().accountGlobalMetaId;
      if (!accountGlobalMetaId) return;
      await bootstrapReadOnlyNativeChat({ accountGlobalMetaId, apiClient, repository, store: nativeChatStore });
    } catch (error) {
      if (!cancelled) setError(error instanceof Error ? error.message : String(error));
    }
  }
  start();
  return () => {
    cancelled = true;
  };
}, []);
```

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatBootstrap.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/nativeChatBootstrap.ts src/chat-native/services/__tests__/nativeChatBootstrap.test.ts src/chat-native/screens/NativeChatHomePage.tsx
git commit -m "feat: bootstrap read-only native chat sync"
```

## Task 13: Text Composer And Send Service

**Files:**
- Create: `src/chat-native/services/nativeChatSendService.ts`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Test: `src/chat-native/services/__tests__/nativeChatSendService.test.ts`

- [ ] **Step 1: Write send service tests**

Create `src/chat-native/services/__tests__/nativeChatSendService.test.ts`:

```ts
import { sendNativeTextMessage } from '../nativeChatSendService';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';

describe('nativeChatSendService', () => {
  it('creates a pending group message and calls wallet createPin', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const wallet = { createPin: jest.fn(async () => ({ txids: ['tx1'], totalCost: 1 })) };

    await sendNativeTextMessage({
      accountGlobalMetaId: 'self',
      channel: {
        accountGlobalMetaId: 'self',
        id: '1234567890abcdef-group',
        type: 'group',
        title: 'Group',
        unreadCount: 0,
        lastReadIndex: 0,
        updatedAt: 1,
      },
      plaintext: 'hello',
      nickName: 'Alice',
      addressHost: 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0',
      repository: repo,
      store,
      wallet: wallet as any,
      nowSeconds: () => 100,
    });

    expect(wallet.createPin).toHaveBeenCalled();
    expect(store.getState().messagesByChannel['1234567890abcdef-group'][0]).toMatchObject({
      status: 'sent',
      txId: 'tx1',
    });
  });
});
```

- [ ] **Step 2: Implement send service**

Create `src/chat-native/services/nativeChatSendService.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { encryptGroupText, encryptPrivateText } from './chatCrypto';
import { buildTextNode } from './chatNodeBuilder';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';
import type { createNativeChatStore } from '../state/useNativeChatStore';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;

export async function sendNativeTextMessage(params: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  plaintext: string;
  nickName: string;
  addressHost: string;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
  wallet: Pick<NativeChatWalletAdapter, 'createPin' | 'getEcdh'>;
  nowSeconds?: () => number;
}) {
  const timestamp = params.nowSeconds ? params.nowSeconds() : Math.floor(Date.now() / 1000);
  const mockId = `native_${timestamp}_${Math.random().toString(36).slice(2)}`;
  let encrypted = '';

  if (params.channel.type === 'private') {
    if (!params.channel.publicKeyStr) throw new Error('Missing peer chat public key');
    const ecdh = await params.wallet.getEcdh(params.channel.publicKeyStr);
    encrypted = encryptPrivateText(params.plaintext, ecdh.sharedSecret);
  } else {
    const secret = params.channel.passwordKey || params.channel.id.substring(0, 16);
    encrypted = encryptGroupText(params.plaintext, secret);
  }

  const node = buildTextNode({
    channelType: params.channel.type,
    channelId: params.channel.id,
    parentGroupId: params.channel.parentGroupId,
    content: encrypted,
    nickName: params.nickName,
    timestamp,
  });

  const pending: NativeChatMessage = {
    accountGlobalMetaId: params.accountGlobalMetaId,
    channelId: params.channel.id,
    channelType: params.channel.type,
    kind: 'text',
    content: encrypted,
    contentType: 'text/plain',
    encryption: params.channel.type === 'private' ? 'ecdh' : 'aes',
    protocol: node.protocol,
    timestamp,
    senderGlobalMetaId: params.accountGlobalMetaId,
    mockId,
    status: 'pending',
  };

  await params.repository.upsertMessage(pending);
  params.store.getState().mergeMessages(params.channel.id, [pending]);

  try {
    const result = await params.wallet.createPin({
      chain: 'mvc',
      dataList: [
        {
          metaidData: {
            operation: 'create',
            path: `${params.addressHost}:/protocols/${node.protocol}`,
            body: JSON.stringify(node.body),
            contentType: 'application/json',
            encryption: node.externalEncryption,
            encoding: 'utf-8',
          },
        },
      ],
    });
    const txId = result.txids?.[0] || result.revealTxIds?.[0];
    const sent = { ...pending, status: 'sent' as const, txId };
    await params.repository.upsertMessage(sent);
    params.store.getState().mergeMessages(params.channel.id, [sent]);
    return sent;
  } catch (error) {
    const failed = {
      ...pending,
      status: 'failed' as const,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    await params.repository.upsertMessage(failed);
    params.store.getState().mergeMessages(params.channel.id, [failed]);
    return failed;
  }
}
```

- [ ] **Step 3: Create composer component**

Create `src/chat-native/components/ChatComposer.tsx`:

```tsx
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import EmojiBar from './EmojiBar';

type Props = {
  disabled?: boolean;
  onSendText: (text: string) => Promise<void>;
};

export default function ChatComposer({ disabled, onSendText }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setText('');
    setSending(true);
    try {
      await onSendText(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ padding: 8, borderTopWidth: 1, borderTopColor: '#DDD' }}>
      <EmojiBar onPick={(emoji) => setText((value) => `${value}${emoji}`)} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!disabled && !sending}
          style={{ flex: 1, minHeight: 40, paddingHorizontal: 10, backgroundColor: '#FFF', borderRadius: 8 }}
        />
        <Pressable onPress={send} disabled={disabled || sending} style={{ padding: 10 }}>
          <Text>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

Create `src/chat-native/components/EmojiBar.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const MVP_EMOJIS = ['😀', '😂', '👍', '🙏', '🔥', '❤️'];

export default function EmojiBar({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', paddingBottom: 6 }}>
      {MVP_EMOJIS.map((emoji) => (
        <Pressable key={emoji} onPress={() => onPick(emoji)} style={{ padding: 6 }}>
          <Text>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Run send tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatSendService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/nativeChatSendService.ts src/chat-native/services/__tests__/nativeChatSendService.test.ts src/chat-native/components/ChatComposer.tsx src/chat-native/components/EmojiBar.tsx src/chat-native/screens/NativeChatRoomPage.tsx
git commit -m "feat: add native text message sending"
```

## Task 14: Image Message Flow

**Files:**
- Create: `src/chat-native/services/nativeChatImageService.ts`
- Create: `src/chat-native/components/ImageMessage.tsx`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Test: `src/chat-native/services/__tests__/nativeChatImageService.test.ts`

- [ ] **Step 1: Write image service tests**

Create `src/chat-native/services/__tests__/nativeChatImageService.test.ts`:

```ts
import { fileExtensionFromMime, makeAttachmentItem } from '../nativeChatImageService';

describe('nativeChatImageService', () => {
  it('extracts image file extension', () => {
    expect(fileExtensionFromMime('image/png')).toBe('png');
    expect(fileExtensionFromMime('image/jpeg')).toBe('jpeg');
  });

  it('creates attachment item from base64 content', () => {
    expect(makeAttachmentItem({ base64: 'AQID', mimeType: 'image/png' })).toEqual({
      data: '010203',
      fileType: 'image/png',
    });
  });
});
```

- [ ] **Step 2: Implement image helpers**

Create `src/chat-native/services/nativeChatImageService.ts`:

```ts
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type NativeChatAttachmentItem = {
  data: string;
  fileType: string;
};

export function fileExtensionFromMime(mimeType: string): string {
  return mimeType.split('/')[1] || 'png';
}

export function makeAttachmentItem(input: { base64: string; mimeType: string }): NativeChatAttachmentItem {
  return {
    data: Buffer.from(input.base64, 'base64').toString('hex'),
    fileType: input.mimeType,
  };
}

export async function pickImageAttachment(): Promise<{
  attachment: NativeChatAttachmentItem;
  localPreviewUri: string;
} | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/png';
  const base64 = asset.base64 || (await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }));
  return {
    attachment: makeAttachmentItem({ base64, mimeType }),
    localPreviewUri: asset.uri,
  };
}
```

- [ ] **Step 3: Extend composer with image button**

In `ChatComposer.tsx`, add an optional prop:

```ts
onPickImage?: () => Promise<void>;
```

Add a button before `Send`:

```tsx
<Pressable onPress={onPickImage} disabled={disabled || sending} style={{ padding: 10 }}>
  <Text>Image</Text>
</Pressable>
```

- [ ] **Step 4: Run image tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatImageService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/nativeChatImageService.ts src/chat-native/services/__tests__/nativeChatImageService.test.ts src/chat-native/components/ChatComposer.tsx src/chat-native/components/ImageMessage.tsx
git commit -m "feat: add native image attachment helpers"
```

## Task 15: Chat Link Shell

**Files:**
- Create: `src/chat-native/screens/ChatLinkShellPage.tsx`
- Create: `src/chat-native/services/chatLinkClassifier.ts`
- Create: `src/chat-native/services/__tests__/chatLinkClassifier.test.ts`
- Modify: `src/base/AppNavigator.jsx`

- [ ] **Step 1: Write link classifier tests**

Create `src/chat-native/services/__tests__/chatLinkClassifier.test.ts`:

```ts
import { classifyChatLink } from '../chatLinkClassifier';

describe('chatLinkClassifier', () => {
  it('classifies safe https urls for WebView fallback', () => {
    expect(classifyChatLink('https://show.now/app')).toEqual({
      kind: 'web-url',
      label: 'show.now',
      url: 'https://show.now/app',
    });
  });

  it('marks non-url app links as unsupported app route', () => {
    expect(classifyChatLink('idchat://app/example')).toEqual({
      kind: 'unsupported-app-route',
      label: 'idchat://app/example',
      url: 'idchat://app/example',
    });
  });
});
```

- [ ] **Step 2: Implement classifier**

Create `src/chat-native/services/chatLinkClassifier.ts`:

```ts
export type ChatLinkClassification =
  | { kind: 'web-url'; label: string; url: string }
  | { kind: 'unsupported-app-route'; label: string; url: string };

export function classifyChatLink(url: string): ChatLinkClassification {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { kind: 'web-url', label: parsed.host, url };
    }
  } catch {}

  return { kind: 'unsupported-app-route', label: url, url };
}
```

- [ ] **Step 3: Create shell screen**

Create `src/chat-native/screens/ChatLinkShellPage.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { goBack, navigate } from '@/base/NavigationService';
import { classifyChatLink } from '../services/chatLinkClassifier';

type Props = {
  route: { params?: { url?: string } };
};

export default function ChatLinkShellPage({ route }: Props) {
  const url = route.params?.url || '';
  const classified = classifyChatLink(url);

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{classified.label}</Text>
      <Text style={{ marginTop: 8 }}>{classified.kind === 'web-url' ? url : 'This chat app link is not available natively yet.'}</Text>
      {classified.kind === 'web-url' ? (
        <Pressable onPress={() => navigate('OpenWebsPage', { url })} style={{ marginTop: 16 }}>
          <Text>Open Web</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={goBack} style={{ marginTop: 16 }}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Register route**

In `AppNavigator.jsx`, import and register:

```js
import ChatLinkShellPage from '@/chat-native/screens/ChatLinkShellPage';
```

```jsx
<Stack.Screen name="ChatLinkShellPage" component={ChatLinkShellPage} />
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/chatLinkClassifier.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/screens/ChatLinkShellPage.tsx src/chat-native/services/chatLinkClassifier.ts src/chat-native/services/__tests__/chatLinkClassifier.test.ts src/base/AppNavigator.jsx
git commit -m "feat: add native chat link shell"
```

## Task 16: MVP Verification Pass

**Files:**
- Modify only files required by failures found in this task.

- [ ] **Step 1: Run full native chat unit suite**

Run:

```bash
yarn test:chat-native
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS or only documented pre-existing unrelated errors. If there are TypeScript errors in `src/chat-native`, fix them in this task.

- [ ] **Step 3: Run Expo startup smoke check**

Run:

```bash
yarn start --clear
```

Expected: Metro starts without module resolution errors. Stop Metro after confirming startup.

- [ ] **Step 4: Device smoke checklist**

Run an iOS or Android development build, then verify:

- With `ENABLE_NATIVE_IDCHAT = false`, the existing IDChat WebView still opens.
- With `ENABLE_NATIVE_IDCHAT = true`, IDChat opens `NativeChatHomePage`.
- The generic `WebsPage`, `DappWebsPage`, and `OpenWebsPage` routes still open.
- Native chat displays a stable empty state when no account/globalMetaId is available.
- Native chat does not crash on app background/resume.

- [ ] **Step 5: Commit final verification fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: stabilize native chat mvp verification"
```

If no fixes were needed, record the passing commands in the PR or handoff notes.

## Spec Coverage Review

- Replace IDChat chat homepage WebView: Tasks 10, 11, and 16.
- Preserve generic DApp/WebView container: Tasks 11 and 16.
- Preserve HTTP interfaces: Tasks 3, 5, and 12.
- Preserve Socket.IO contract: Task 6.
- Preserve encryption compatibility: Task 4.
- Preserve MetaID node names and createPin send path: Tasks 7 and 13.
- SQLite local persistence: Task 8.
- Conversation list and read-only chat: Tasks 10 and 12.
- Text and emoji sending: Task 13.
- Image support: Task 14.
- Chat link shell: Task 15.
- Red packets and MRC20 excluded: no task implements those features.

## Execution Handoff

After this plan is approved, execute it task-by-task. Recommended path:

1. Use subagent-driven development for Tasks 1-9 because they are independent service/storage/test modules.
2. Use inline execution for Tasks 10-16 if tight navigation/UI integration needs local context.
3. Keep `ENABLE_NATIVE_IDCHAT = false` until Task 16 verification is ready to promote the native route.
