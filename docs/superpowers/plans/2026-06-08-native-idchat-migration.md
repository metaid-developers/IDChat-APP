# Native IDChat Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the IDChat homepage WebView with native React Native chat screens for private chat, group chat, text, images, and emoji while preserving the existing backend and wallet protocols.

**Architecture:** Build a new `src/chat-native` module inside the existing Expo/React Native wallet app. Keep chat protocol, crypto, storage, socket, wallet, and UI concerns separated so Phase 0 compatibility tests can pass before any visible UI replacement. Preserve the existing generic DApp/WebView stack and keep the current web chat entry behind a fallback flag until native MVP parity is proven.

**Tech Stack:** Expo SDK 53, React Native 0.79, TypeScript, React Navigation, Jest/Jest Expo, `crypto-js`, `socket.io-client`, `expo-sqlite`, `expo-file-system`, existing wallet/createPin/ECDH helpers in `src/webs/actions`.

---

## Fresh Session Brief

This plan is intended to be handed to a new development session with no prior conversation context.

### Product Background

`IDChat-APP` is an existing Expo/React Native wallet app. Its current IDChat home experience is implemented by `src/chat/page/ChatHomePage.tsx`, which loads the web app at `https://www.idchat.io/chat` through `react-native-webview` and injects a `window.metaidwallet` bridge. The bridge currently lets the web app call wallet actions such as Connect, ECDH, getPKHByPath, signing, payment/createPin-style flows, badge handling, and opening links.

The goal is to replace only the IDChat chat homepage WebView with native React Native chat screens. The generic DApp/WebView browser routes must remain available for external apps and DApps. This migration should not rewrite the wallet, not redesign backend APIs, and not change server contracts.

The related web chat app lives at `/Users/tusm/Documents/MetaID_Projects/idchat`. Use it as the source of truth for HTTP route shapes, Socket.IO query/path behavior, message encryption formats, local history semantics, and MetaID node payloads. Do not modify that repo as part of this implementation unless the user explicitly asks.

### Backend And Protocol Ground Truth

- Chat API base: `https://api.idchat.io/chat-api`
- Socket.IO base: `https://api.idchat.io`
- Socket.IO path: `/socket/socket.io`
- Do not use `/chat-api/socket/socket.io`; that path is wrong.
- Public runtime config source: `https://www.idchat.io/chat/app-config.json`
- MVP-compatible HTTP surface is under `/chat-api/group-chat/*`.
- History semantics are continuous-index based: indexed history requests use `startIndex`, and returned messages must be merged/deduped without breaking local pending/mock messages.
- Outgoing chat messages are not simple HTTP POSTs. They are MetaID/createPin operations built with existing wallet primitives.
- Protocol constants must match the current web app in `/Users/tusm/Documents/MetaID_Projects/idchat/src/enum.ts`: `simplegroupchat`, `simplefilegroupchat`, `simplemsg`, and `simplefilemsg`. Do not use PascalCase protocol values in generated paths.
- `createShowMsg` in the web app writes chat pins to `${addressHost}:/protocols/${protocol}` where `protocol` is the lowercase value above. Native node builders must include golden tests for this path construction.
- Current web text send path is `src/stores/simple-talk.ts::sendMessage`: group text payload uses `groupID` and optional `channelID`; private text payload uses `to`. Current web image send path is `src/utils/talk.ts::_sendImageMessage`: group image payload uses `groupId` and `channelId`; private image payload uses `to`; image pins pass `attachments` plus `fileEncryption`.

### MVP Product Scope

Implement native versions of:

- conversation list
- private chat room
- group chat room
- text messages
- image messages
- emoji insertion
- message history loading
- Socket.IO realtime receiving
- pending/sent/failed state for outgoing messages
- basic unread/read index behavior
- minimal chat-link shell for links/apps opened from messages

Explicitly exclude from the MVP:

- red packets
- MRC20 and asset message types
- full group admin workflows
- private group invite/onboarding flows
- replacing the generic DApp/WebView container
- removing all WebView usage from the wallet app

### Release-Quality Definition Of Done

This work is not considered complete when it merely compiles or passes code review. It is complete only when all of these are true:

- Unit and integration tests pass for protocol constants, runtime config, crypto compatibility, HTTP route construction, Socket.IO config, node builders, storage, store behavior, send service, image helpers, and link classification.
- A mocked native chat scenario runs inside at least one simulator/emulator and proves the native screens, message list, composer, emoji insertion, image picker entry, link shell, and state transitions work without depending on live backend availability.
- A real backend smoke test runs against existing IDChat services using designated QA accounts and proves: read conversation list, open group chat, open private chat, receive Socket.IO messages, send group text, send private text, send group image, and send private image.
- Native-sent messages are visible in the existing web IDChat app, and web-sent messages are visible in the native app.
- Generic WebView/DApp routes still work after native chat routes are registered.
- iOS Simulator and Android Emulator have both been exercised, or the missing platform is documented with the exact blocker.
- App lifecycle checks pass: foreground, background/resume, reconnect, account switch, offline cached open, and send failure/retry.
- The old chat WebView fallback remains available until the user explicitly approves making native chat the default for all users.

### QA Accounts And Live Testing

Use dedicated QA wallet/account data for live backend verification. Do not use a personal or production-custody wallet for automated tests. If a funded QA wallet is not available, complete mocked simulator validation and document live-send verification as blocked by missing QA credentials. Read-only live API and Socket.IO checks should still be attempted where possible.

Record every simulator and live-backend verification command/result in the final handoff. Include screenshots or screen recordings for the native conversation list, chat room, composer, image flow, link shell, and fallback WebView route when possible.

## Subagent-Driven Execution Model

Use `superpowers:subagent-driven-development` for implementation. Each task below is written so a fresh subagent can own a narrow slice, edit files directly, run its own tests, and report changed files.

Rules for subagents:

- A subagent must only edit files listed in its assigned task unless it explicitly reports why another file is required.
- Subagents are not alone in the codebase. They must not revert user changes or other agents' changes.
- Each subagent must run the task's focused tests before returning.
- Each subagent must report exact files changed, commands run, and remaining risks.
- The parent agent must review each subagent result before dispatching the next dependent task.

Dependency order for subagents:

- Wave A: Task 1 only. No other task should start until the test harness and dependencies are installed.
- Wave B: Tasks 2-4 may run after Task 1. These create domain/protocol/runtime/crypto primitives.
- Wave C: Tasks 5-9 may run after Tasks 2-4, but preserve this dependency chain inside the wave: Task 5 API/normalizers, Task 6 socket, Task 7 node/wallet adapter, Task 8 storage, Task 9 store.
- Wave D: Task 10 account bootstrap must land before Task 13 read-only history/realtime sync or any live API/socket/send work. This prevents native chat from starting with an empty `accountGlobalMetaId`.
- Wave E: Tasks 11-14 are sequenced integration work: read-only screens, navigation flag, history/realtime sync, then text send.
- Wave F: Tasks 15-17 finish image send, link shell, and simulator/live release-candidate QA. Task 17 must be assigned to a verification-focused subagent after all implementation tasks are integrated.

## Execution Notes

- Start execution in an isolated branch or worktree, because the current `main` worktree has unrelated user changes.
- Do not revert or restage existing changes outside the files named in each task.
- Keep commits small and scoped to each task.
- Run the focused test command after every task.
- Do not make native chat the default route for normal users until the simulator and live-backend acceptance gates pass.

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
- `src/chat-native/services/nativeChatAccount.ts` - Resolve current wallet account/globalMetaId/profile for native chat startup.
- `src/chat-native/services/__tests__/nativeChatAccount.test.ts` - Account resolver tests for success, no-wallet, and account switch.
- `src/chat-native/storage/chatDatabase.ts` - SQLite schema and low-level database open/migrate.
- `src/chat-native/storage/chatRepository.ts` - Channel/message/read-index repository.
- `src/chat-native/storage/__tests__/chatRepository.test.ts` - Repository tests using an in-memory adapter.
- `src/chat-native/state/useNativeChatStore.ts` - Zustand store for channels, messages, socket state, and pending sends.
- `src/chat-native/state/__tests__/useNativeChatStore.test.ts` - Store reducer/action tests.
- `src/chat-native/services/nativeChatSyncService.ts` - History loading, cache merge, realtime receive, read-index, socket lifecycle.
- `src/chat-native/services/__tests__/nativeChatSyncService.test.ts` - History/realtime sync tests.
- `src/chat-native/services/nativeChatRuntimeContext.ts` - In-memory native chat runtime dependency holder for repository, wallet, API client, and runtime config.
- `src/chat-native/screens/NativeChatHomePage.tsx` - Native IDChat root screen.
- `src/chat-native/screens/NativeChatRoomPage.tsx` - Native chat room.
- `src/chat-native/screens/ChatLinkShellPage.tsx` - Lightweight shell for links opened from chat.
- `src/chat-native/components/ConversationList.tsx` - Conversation list UI.
- `src/chat-native/components/MessageList.tsx` - Message list UI.
- `src/chat-native/components/MessageBubble.tsx` - Message bubble.
- `src/chat-native/components/ChatComposer.tsx` - Text, emoji, and image composer.
- `src/chat-native/components/EmojiBar.tsx` - MVP emoji picker.
- `src/chat-native/components/ImageMessage.tsx` - Image display.
- `src/chat-native/services/nativeChatImageSendService.ts` - Image encryption, MetaFile attachment pinning, image message send flow.
- `src/chat-native/services/__tests__/nativeChatImageSendService.test.ts` - Image send golden tests.
- `src/chat-native/dev/nativeChatMockScenario.ts` - Mock channels, messages, API client, and wallet adapter for simulator validation.
- `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` - Mock scenario tests.
- `src/chat-native/index.ts` - Public exports for navigation.
- `docs/superpowers/qa/native-idchat-simulator-runbook.md` - Manual simulator and live-backend QA runbook.

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
npx expo install expo-sqlite expo-file-system
yarn add socket.io-client@4.7.5
yarn add -D jest@^29.7.0 jest-expo@~53.0.0 @types/jest
```

Do not install `expo-sqlite` or `expo-file-system` with unpinned `yarn add`; Expo native modules must be installed with the SDK-compatible versions selected by `npx expo install`. `socket.io-client@4.7.5` matches the current web app dependency in `/Users/tusm/Documents/MetaID_Projects/idchat/package.json`.

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
  buildChatProtocolPath,
  getTextProtocolForChannel,
  getImageProtocolForChannel,
  isPrivateChannel,
} from '../protocol';

describe('native chat protocol helpers', () => {
  it('uses exact lowercase protocol values from the current web app', () => {
    expect(CHAT_PROTOCOL.SIMPLE_GROUP_CHAT).toBe('simplegroupchat');
    expect(CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT).toBe('simplefilegroupchat');
    expect(CHAT_PROTOCOL.SIMPLE_MSG).toBe('simplemsg');
    expect(CHAT_PROTOCOL.SIMPLE_FILE_MSG).toBe('simplefilemsg');
  });

  it('uses simplemsg for private text and simplegroupchat for group text', () => {
    expect(getTextProtocolForChannel('private')).toBe('simplemsg');
    expect(getTextProtocolForChannel('group')).toBe('simplegroupchat');
    expect(getTextProtocolForChannel('sub-group')).toBe('simplegroupchat');
  });

  it('uses file protocols for image messages', () => {
    expect(getImageProtocolForChannel('private')).toBe('simplefilemsg');
    expect(getImageProtocolForChannel('group')).toBe('simplefilegroupchat');
  });

  it('identifies private channels', () => {
    expect(isPrivateChannel('private')).toBe(true);
    expect(isPrivateChannel('group')).toBe(false);
    expect(isPrivateChannel('sub-group')).toBe(false);
  });

  it('builds the same protocol path shape as web createShowMsg', () => {
    expect(buildChatProtocolPath('bc1p-host', CHAT_PROTOCOL.SIMPLE_GROUP_CHAT)).toBe(
      'bc1p-host:/protocols/simplegroupchat',
    );
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
  SIMPLE_GROUP_CHAT: 'simplegroupchat',
  SIMPLE_MSG: 'simplemsg',
  SIMPLE_FILE_GROUP_CHAT: 'simplefilegroupchat',
  SIMPLE_FILE_MSG: 'simplefilemsg',
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

export function buildChatProtocolPath(addressHost: string, protocol: NativeChatProtocol): string {
  return `${addressHost}:/protocols/${protocol}`;
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
import { normalizeLatestChatInfoItem, normalizeSocketMessage } from '../chatNormalizers';

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
          userInfo: {
            globalMetaId: 'peer-gm',
            name: 'Peer',
            avatar: 'peer-avatar',
            chatPublicKey: 'pub',
          },
          latestMessage: { content: 'hello', timestamp: 10 },
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      id: 'peer-gm',
      type: 'private',
      title: 'Peer',
      avatar: 'peer-avatar',
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

  it('normalizes current web send DTO field variants from history/socket payloads', () => {
    expect(
      normalizeSocketMessage(
        {
          groupID: 'group-1',
          channelID: 'sub-1',
          content: 'cipher',
          protocol: 'simplegroupchat',
          userInfo: { globalMetaId: 'sender-gm' },
          txId: 'tx1',
          index: 7,
        },
        'self-gm',
      ),
    ).toMatchObject({
      accountGlobalMetaId: 'self-gm',
      channelId: 'sub-1',
      protocol: 'simplegroupchat',
      senderGlobalMetaId: 'sender-gm',
      index: 7,
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
import type { NativeChatChannel, NativeChatMessage, NativeChatRuntimeConfig } from '../domain/types';

export function normalizeLatestChatInfoItem(item: any, accountGlobalMetaId: string): NativeChatChannel {
  const userInfo = item?.userInfo || item?.targetUserInfo || item?.peerUserInfo || {};
  const isPrivate = item?.type === '2' || Boolean((item?.globalMetaId || userInfo?.globalMetaId) && !item?.groupId);
  const id = isPrivate
    ? item.globalMetaId || userInfo.globalMetaId || userInfo.metaid || item.metaId
    : item.groupId || item.channelId;
  const title = isPrivate
    ? item.name || userInfo.name || userInfo.nickName || item.nickName || id || 'Unknown'
    : item.roomName || item.name || item.groupId || 'Group';
  const latest = item.latestMessage || item.lastMessage;

  return {
    accountGlobalMetaId,
    id,
    type: isPrivate ? 'private' : 'group',
    title,
    avatar: item.avatar || item.avatarImage || userInfo.avatar || userInfo.avatarImage || item.icon,
    roomJoinType: item.roomJoinType,
    path: item.path,
    passwordKey: item.passwordKey,
    publicKeyStr: item.chatPublicKey || item.publicKeyStr || userInfo.chatPublicKey || userInfo.publicKeyStr,
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
      : payload.channelId || payload.channelID || payload.groupId || payload.groupID || payload.metanetId;

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
    senderGlobalMetaId: payload.globalMetaId || payload.metaId || payload.fromGlobalMetaId || payload.userInfo?.globalMetaId || payload.userInfo?.metaid,
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
import { buildChatMetaidData, buildImageNode, buildTextNode } from '../chatNodeBuilder';
import { CHAT_PROTOCOL } from '../../domain/protocol';

describe('chatNodeBuilder', () => {
  it('builds group text nodes using the current simple-talk payload shape', () => {
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
        channelID: undefined,
        content: 'encrypted',
        contentType: 'text/plain',
        encryption: 'aes',
      },
      externalEncryption: '0',
    });
  });

  it('builds private text nodes using the web simplemsg payload shape', () => {
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

  it('builds group image nodes using groupId/channelId and fileEncryption 0', () => {
    expect(
      buildImageNode({
        channelType: 'sub-group',
        channelId: 'sub-1',
        parentGroupId: 'group-1',
        fileType: 'png',
        nickName: 'Alice',
        timestamp: 100,
      }),
    ).toMatchObject({
      protocol: CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT,
      fileEncryption: '0',
      body: {
        groupId: 'group-1',
        channelId: 'sub-1',
        fileType: 'png',
        attachment: '',
      },
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

  it('builds createPin metadata with the web createShowMsg path', () => {
    const node = buildTextNode({
      channelType: 'private',
      channelId: 'peer-gm',
      content: 'encrypted',
      nickName: 'Alice',
      timestamp: 100,
    });

    expect(buildChatMetaidData('bc1p-host', node)).toMatchObject({
      operation: 'create',
      path: 'bc1p-host:/protocols/simplemsg',
      contentType: 'application/json',
      encryption: '0',
      encoding: 'utf-8',
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
import { buildChatProtocolPath, CHAT_PROTOCOL } from '../domain/protocol';
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

export function buildChatMetaidData(
  addressHost: string,
  node: ReturnType<typeof buildTextNode> | ReturnType<typeof buildImageNode>,
) {
  return {
    operation: 'create' as const,
    path: buildChatProtocolPath(addressHost, node.protocol),
    body: JSON.stringify(node.body),
    contentType:
      node.protocol === CHAT_PROTOCOL.SIMPLE_GROUP_CHAT || node.protocol === CHAT_PROTOCOL.SIMPLE_MSG
        ? 'application/json'
        : node.body.contentType || 'application/json',
    encryption: node.externalEncryption,
    encoding: 'utf-8' as const,
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
import { buildChatMetaidData } from './chatNodeBuilder';
import type { NativeChatProtocol } from '../domain/protocol';

export type NativeChatAttachmentItem = {
  data: string;
  fileType: string;
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
  getEcdh(externalPubKey: string): Promise<{
    externalPubKey: string;
    sharedSecret: string;
    ecdhPubKey?: string;
    creatorPubkey?: string;
  }>;
  createPin(params: CreatePinParams): Promise<CreatePinResult>;
  createChatNode(params: NativeChatCreateNodeParams): Promise<CreatePinResult>;
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
    async createChatNode(params: NativeChatCreateNodeParams) {
      if (params.attachments?.length) {
        throw new Error('Native chat image attachments are implemented in Task 15');
      }
      return CreatePin.process({
        chain: 'mvc',
        dataList: [
          {
            metaidData: buildChatMetaidData(params.addressHost, {
              protocol: params.protocol,
              body: params.body,
              externalEncryption: params.externalEncryption,
            } as any),
          },
        ],
      });
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
    protocol: 'simplegroupchat',
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
        protocol: 'simplegroupchat',
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
  runtimeConfig?: NativeChatRuntimeConfig;
  channels: NativeChatChannel[];
  messagesByChannel: Record<string, NativeChatMessage[]>;
  socketConnected: boolean;
  setAccount: (globalMetaId: string) => void;
  setRuntimeConfig: (runtimeConfig: NativeChatRuntimeConfig) => void;
  setActiveChannelId: (channelId?: string) => void;
  setSocketConnected: (connected: boolean) => void;
  mergeChannels: (channels: NativeChatChannel[]) => void;
  mergeMessages: (channelId: string, messages: NativeChatMessage[]) => void;
};

export function createNativeChatStore() {
  return createStore<NativeChatState>((set) => ({
    accountGlobalMetaId: '',
    activeChannelId: undefined,
    runtimeConfig: undefined,
    channels: [],
    messagesByChannel: {},
    socketConnected: false,
    setAccount: (globalMetaId) => set({ accountGlobalMetaId: globalMetaId }),
    setRuntimeConfig: (runtimeConfig) => set({ runtimeConfig }),
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

## Task 10: Native Chat Account Bootstrap

**Files:**
- Create: `src/chat-native/services/nativeChatAccount.ts`
- Create: `src/chat-native/services/__tests__/nativeChatAccount.test.ts`
- Modify: `src/chat-native/services/chatWalletAdapter.ts`
- Modify: `src/chat-native/state/useNativeChatStore.ts`

- [ ] **Step 1: Write account resolver tests**

Create `src/chat-native/services/__tests__/nativeChatAccount.test.ts`:

```ts
import { resolveNativeChatAccount } from '../nativeChatAccount';

describe('resolveNativeChatAccount', () => {
  it('uses MVC globalMetaId as the native chat account identity', async () => {
    const wallet = {
      getGlobalMetaId: jest.fn(async () => ({
        mvc: { address: 'mvc-address', globalMetaId: 'mvc-global-metaid' },
        btc: { address: 'btc-address', globalMetaId: 'btc-global-metaid' },
        doge: { address: 'doge-address', globalMetaId: 'doge-global-metaid' },
      })),
      getCurrentProfile: jest.fn(async () => ({
        name: 'Alice',
        avatar: 'https://example.test/avatar.png',
      })),
    };

    await expect(resolveNativeChatAccount(wallet as any)).resolves.toEqual({
      accountGlobalMetaId: 'mvc-global-metaid',
      address: 'mvc-address',
      displayName: 'Alice',
      avatar: 'https://example.test/avatar.png',
    });
  });

  it('throws a clear error when the wallet has no MVC globalMetaId', async () => {
    const wallet = {
      getGlobalMetaId: jest.fn(async () => ({
        mvc: { address: '', globalMetaId: '' },
        btc: { address: 'btc-address', globalMetaId: 'btc-global-metaid' },
        doge: { address: 'doge-address', globalMetaId: 'doge-global-metaid' },
      })),
      getCurrentProfile: jest.fn(),
    };

    await expect(resolveNativeChatAccount(wallet as any)).rejects.toThrow('Missing MVC GlobalMetaId');
  });
});
```

- [ ] **Step 2: Extend wallet adapter with account/profile reads**

In `src/chat-native/services/chatWalletAdapter.ts`, add these imports:

```ts
import * as GetGlobalMetaid from '@/webs/actions/lib/query/get-global-metaid';
import useUserStore from '@/stores/useUserStore';
```

Add these adapter types:

```ts
export type NativeChatAccountProfile = {
  name?: string;
  avatar?: string;
};
```

Extend `NativeChatWalletAdapter`:

```ts
getGlobalMetaId(password?: string): Promise<{
  mvc: { address: string; globalMetaId: string };
  btc: { address: string; globalMetaId: string };
  doge: { address: string; globalMetaId: string };
}>;
getCurrentProfile(): Promise<NativeChatAccountProfile>;
```

Implement the adapter methods:

```ts
async getGlobalMetaId(password = '') {
  return GetGlobalMetaid.process(undefined, { host: 'https://www.idchat.io', password });
},
async getCurrentProfile() {
  const userInfo = useUserStore.getState().userInfo;
  return {
    name: userInfo?.name,
    avatar: userInfo?.avatarLocalUri || userInfo?.avatar,
  };
},
```

- [ ] **Step 3: Implement account resolver**

Create `src/chat-native/services/nativeChatAccount.ts`:

```ts
import type { NativeChatWalletAdapter } from './chatWalletAdapter';

export type NativeChatAccount = {
  accountGlobalMetaId: string;
  address: string;
  displayName: string;
  avatar?: string;
};

export async function resolveNativeChatAccount(
  wallet: Pick<NativeChatWalletAdapter, 'getGlobalMetaId' | 'getCurrentProfile'>,
): Promise<NativeChatAccount> {
  const [globalMetaIdResult, profile] = await Promise.all([
    wallet.getGlobalMetaId(),
    wallet.getCurrentProfile(),
  ]);
  const mvc = globalMetaIdResult.mvc;
  if (!mvc?.globalMetaId || !mvc?.address) {
    throw new Error('Missing MVC GlobalMetaId');
  }

  return {
    accountGlobalMetaId: mvc.globalMetaId,
    address: mvc.address,
    displayName: profile.name || 'IDChat User',
    avatar: profile.avatar,
  };
}
```

- [ ] **Step 4: Store display profile and clear stale active channel on account switch**

In `src/chat-native/state/useNativeChatStore.ts`, add state fields:

```ts
accountDisplayName: string;
accountAvatar?: string;
```

Initialize them in `createNativeChatStore`:

```ts
accountDisplayName: 'IDChat User',
accountAvatar: undefined,
```

Change `setAccount` to accept profile metadata and reset stale channel state when the account changes:

```ts
setAccount: (globalMetaId, profile) =>
  set((state) => ({
    accountGlobalMetaId: globalMetaId,
    accountDisplayName: profile?.displayName || state.accountDisplayName,
    accountAvatar: profile?.avatar,
    activeChannelId: state.accountGlobalMetaId === globalMetaId ? state.activeChannelId : undefined,
    messagesByChannel: state.accountGlobalMetaId === globalMetaId ? state.messagesByChannel : {},
  })),
```

Update the store type:

```ts
setAccount: (globalMetaId: string, profile?: { displayName?: string; avatar?: string }) => void;
```

Extend `src/chat-native/state/__tests__/useNativeChatStore.test.ts` with an account-switch regression test:

```ts
it('clears active channel messages when account changes', () => {
  const store = createNativeChatStore();
  store.getState().setAccount('self-a');
  store.getState().setActiveChannelId('group-1');
  store.getState().mergeMessages('group-1', [
    {
      accountGlobalMetaId: 'self-a',
      channelId: 'group-1',
      channelType: 'group',
      kind: 'text',
      content: 'hello',
      contentType: 'text/plain',
      protocol: 'simplegroupchat',
      timestamp: 1,
      txId: 'tx1',
      status: 'sent',
    },
  ]);

  store.getState().setAccount('self-b', { displayName: 'Bob' });

  expect(store.getState().accountGlobalMetaId).toBe('self-b');
  expect(store.getState().accountDisplayName).toBe('Bob');
  expect(store.getState().activeChannelId).toBeUndefined();
  expect(store.getState().messagesByChannel).toEqual({});
});
```

- [ ] **Step 5: Run account resolver and store tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatAccount.test.ts src/chat-native/state/__tests__/useNativeChatStore.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/chat-native/services/nativeChatAccount.ts src/chat-native/services/__tests__/nativeChatAccount.test.ts src/chat-native/services/chatWalletAdapter.ts src/chat-native/state/useNativeChatStore.ts src/chat-native/state/__tests__/useNativeChatStore.test.ts
git commit -m "feat: bootstrap native chat account"
```

## Task 11: Read-Only Native Chat Screens

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

## Task 12: Navigation Registration And WebView Fallback Flag

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

Keep the flag set to `false` for this task so the current production entry does not change. Do not depend on `ChatHomePage` wallet/WebView initialization after this early return; Task 10 and Task 13 must initialize account, API, storage, and socket inside the native module.

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

## Task 13: Read-Only History And Realtime Sync Orchestrator

**Files:**
- Create: `src/chat-native/services/nativeChatRuntimeContext.ts`
- Create: `src/chat-native/services/nativeChatSyncService.ts`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Test: `src/chat-native/services/__tests__/nativeChatSyncService.test.ts`

- [ ] **Step 1: Write sync service tests**

Create `src/chat-native/services/__tests__/nativeChatSyncService.test.ts`:

```ts
import {
  bootstrapNativeChatSync,
  handleNativeRealtimeMessage,
  markNativeChannelRead,
  syncChannelMessages,
} from '../nativeChatSyncService';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';

describe('nativeChatSyncService', () => {
  it('loads latest channels and cached channels for an account', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    await repo.upsertChannel({
      accountGlobalMetaId: 'self',
      id: 'cached-group',
      type: 'group',
      title: 'Cached',
      unreadCount: 0,
      lastReadIndex: 0,
      updatedAt: 1,
    });
    const apiClient = {
      getLatestChatInfoList: jest.fn(async () => [
        { type: '1', groupId: 'group-1', roomName: 'Group', latestMessage: { content: 'hi', timestamp: 2 } },
      ]),
    };

    await bootstrapNativeChatSync({
      accountGlobalMetaId: 'self',
      apiClient: apiClient as any,
      repository: repo,
      store,
    });

    expect(store.getState().channels.map((channel) => channel.id)).toEqual(['group-1', 'cached-group']);
  });

  it('loads group history by continuous index and merges messages', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = {
      accountGlobalMetaId: 'self',
      id: 'group-1',
      type: 'group' as const,
      title: 'Group',
      unreadCount: 0,
      lastReadIndex: 0,
      updatedAt: 1,
    };
    const apiClient = {
      getGroupMessagesByIndex: jest.fn(async () => ({
        data: {
          list: [
            {
              groupId: 'group-1',
              content: 'cipher',
              contentType: 'text/plain',
              protocol: 'simplegroupchat',
              timestamp: 100,
              txId: 'tx1',
              index: 1,
            },
          ],
        },
      })),
    };

    await syncChannelMessages({
      accountGlobalMetaId: 'self',
      channel,
      apiClient: apiClient as any,
      repository: repo,
      store,
      pageSize: '30',
    });

    expect(apiClient.getGroupMessagesByIndex).toHaveBeenCalledWith({
      groupId: 'group-1',
      startIndex: '0',
      size: '30',
    });
    expect(store.getState().messagesByChannel['group-1']).toHaveLength(1);
  });

  it('merges realtime socket messages and increments unread for inactive channels', async () => {
    const repo = createMemoryChatRepository();
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
        updatedAt: 1,
      },
    ]);

    await handleNativeRealtimeMessage({
      accountGlobalMetaId: 'self',
      payload: {
        groupId: 'group-1',
        content: 'socket cipher',
        contentType: 'text/plain',
        protocol: 'simplegroupchat',
        timestamp: 200,
        txId: 'tx-socket',
        index: 2,
      },
      repository: repo,
      store,
    });

    expect(store.getState().messagesByChannel['group-1']).toHaveLength(1);
    expect(store.getState().channels[0]).toMatchObject({ unreadCount: 1 });
  });

  it('marks active channel read using the highest loaded index', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const channel = {
      accountGlobalMetaId: 'self',
      id: 'group-1',
      type: 'group' as const,
      title: 'Group',
      unreadCount: 4,
      lastReadIndex: 0,
      updatedAt: 1,
    };
    store.getState().mergeChannels([channel]);
    store.getState().mergeMessages('group-1', [
      {
        accountGlobalMetaId: 'self',
        channelId: 'group-1',
        channelType: 'group',
        kind: 'text',
        content: 'cipher',
        contentType: 'text/plain',
        protocol: 'simplegroupchat',
        timestamp: 100,
        txId: 'tx1',
        index: 9,
        status: 'sent',
      },
    ]);

    await markNativeChannelRead({ accountGlobalMetaId: 'self', channel, repository: repo, store });

    expect(store.getState().channels[0]).toMatchObject({ unreadCount: 0, lastReadIndex: 9 });
  });
});
```

- [ ] **Step 2: Implement runtime context and sync service**

Create `src/chat-native/services/nativeChatRuntimeContext.ts`:

```ts
import type { NativeChatRuntimeConfig } from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { NativeChatApiClient } from './chatApiClient';
import type { NativeChatWalletAdapter } from './chatWalletAdapter';

export type NativeChatRuntimeContext = {
  runtimeConfig: NativeChatRuntimeConfig;
  repository: NativeChatRepository;
  apiClient: NativeChatApiClient;
  wallet: NativeChatWalletAdapter;
};

let currentRuntimeContext: NativeChatRuntimeContext | undefined;

export function setNativeChatRuntimeContext(context: NativeChatRuntimeContext) {
  currentRuntimeContext = context;
}

export function getNativeChatRuntimeContext(): NativeChatRuntimeContext {
  if (!currentRuntimeContext) {
    throw new Error('Native chat runtime context is not initialized');
  }
  return currentRuntimeContext;
}

export function clearNativeChatRuntimeContext() {
  currentRuntimeContext = undefined;
}
```

Create `src/chat-native/services/nativeChatSyncService.ts`:

```ts
import { normalizeLatestChatInfoItem, normalizeSocketMessage } from './chatNormalizers';
import type { NativeChatApiClient } from './chatApiClient';
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function lastLoadedIndex(messages: NativeChatMessage[], fallback: number): number {
  return messages.reduce((max, message) => Math.max(max, message.index || 0), fallback);
}

export async function bootstrapNativeChatSync(params: {
  accountGlobalMetaId: string;
  apiClient: Pick<NativeChatApiClient, 'getLatestChatInfoList'>;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
}) {
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

export async function syncChannelMessages(params: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  apiClient: Pick<NativeChatApiClient, 'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'>;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
  pageSize?: string;
}) {
  const cached = await params.repository.listMessages(params.accountGlobalMetaId, params.channel.id);
  if (cached.length) params.store.getState().mergeMessages(params.channel.id, cached);

  const startIndex = String(lastLoadedIndex(cached, params.channel.lastReadIndex || 0));
  const size = params.pageSize || '30';
  const payload =
    params.channel.type === 'private'
      ? await params.apiClient.getPrivateMessagesByIndex({
          metaId: params.accountGlobalMetaId,
          otherMetaId: params.channel.id,
          startIndex,
          size,
        })
      : params.channel.type === 'sub-group'
        ? await params.apiClient.getChannelMessagesByIndex({
            channelId: params.channel.id,
            startIndex,
            size,
          })
        : await params.apiClient.getGroupMessagesByIndex({
            groupId: params.channel.id,
            startIndex,
            size,
          });

  const messages = extractList(payload).map((item) => normalizeSocketMessage(item, params.accountGlobalMetaId));
  for (const message of messages) {
    await params.repository.upsertMessage(message);
  }
  params.store.getState().mergeMessages(params.channel.id, messages);
  return messages;
}

export async function handleNativeRealtimeMessage(params: {
  accountGlobalMetaId: string;
  payload: any;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
}) {
  const message = normalizeSocketMessage(params.payload, params.accountGlobalMetaId);
  await params.repository.upsertMessage(message);
  params.store.getState().mergeMessages(message.channelId, [message]);

  const channel = params.store.getState().channels.find((item) => item.id === message.channelId);
  if (channel) {
    const isActive = params.store.getState().activeChannelId === channel.id;
    params.store.getState().mergeChannels([
      {
        ...channel,
        unreadCount: isActive ? channel.unreadCount : channel.unreadCount + 1,
        updatedAt: message.timestamp,
        lastMessage: {
          content: message.content,
          kind: message.kind,
          timestamp: message.timestamp,
          senderGlobalMetaId: message.senderGlobalMetaId,
        },
      },
    ]);
  }

  return message;
}

export async function markNativeChannelRead(params: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
}) {
  const messages = params.store.getState().messagesByChannel[params.channel.id] || [];
  const lastReadIndex = lastLoadedIndex(messages, params.channel.lastReadIndex || 0);
  await params.repository.saveLastReadIndex(params.accountGlobalMetaId, params.channel.id, lastReadIndex);
  params.store.getState().mergeChannels([{ ...params.channel, unreadCount: 0, lastReadIndex }]);
}
```

- [ ] **Step 3: Wire account, latest list, history, socket, and read-index into screens**

In `NativeChatHomePage.tsx`, initialize runtime config, database repository, wallet adapter, account resolver, API client, and Socket.IO client. Do not rely on `ChatHomePage` WebView side effects because Task 12 can navigate before the WebView starts.

Use this structure:

```tsx
useEffect(() => {
  let cancelled = false;
  let disconnectSocket: (() => void) | undefined;

  async function start() {
    try {
      const runtime = await loadNativeChatRuntimeConfig();
      const db = await openNativeChatDatabase();
      const repository = createSQLiteChatRepository(db);
      const wallet = createNativeChatWalletAdapter();
      const account = await resolveNativeChatAccount(wallet);
      if (cancelled) return;

      nativeChatStore.getState().setRuntimeConfig(runtime);
      nativeChatStore.getState().setAccount(account.accountGlobalMetaId, {
        displayName: account.displayName,
        avatar: account.avatar,
      });

      const apiClient = new NativeChatApiClient(runtime.chatApiBase);
      setNativeChatRuntimeContext({ runtimeConfig: runtime, repository, apiClient, wallet });
      await bootstrapNativeChatSync({
        accountGlobalMetaId: account.accountGlobalMetaId,
        apiClient,
        repository,
        store: nativeChatStore,
      });

      const socket = createNativeChatSocketClient({
        baseUrl: runtime.chatWsBase,
        path: runtime.socketPath,
        accountGlobalMetaId: account.accountGlobalMetaId,
        onConnectionChange: (connected) => nativeChatStore.getState().setSocketConnected(connected),
        onMessage: (payload) =>
          handleNativeRealtimeMessage({
            accountGlobalMetaId: account.accountGlobalMetaId,
            payload,
            repository,
            store: nativeChatStore,
          }),
      });
      socket.connect();
      disconnectSocket = socket.disconnect;
    } catch (error) {
      if (!cancelled) setError(error instanceof Error ? error.message : String(error));
    }
  }

  start();
  return () => {
    cancelled = true;
    disconnectSocket?.();
    clearNativeChatRuntimeContext();
  };
}, []);
```

In `NativeChatRoomPage.tsx`, call `syncChannelMessages` when a room receives focus and `markNativeChannelRead` after messages are loaded. Use React Navigation focus hooks or the screen's existing focus pattern. If focus hooks are not available in this app, use `useEffect` keyed by `channel.id` as the fallback and document that background refresh is covered by the socket plus next room open.

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatSyncService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/chat-native/services/nativeChatRuntimeContext.ts src/chat-native/services/nativeChatSyncService.ts src/chat-native/services/__tests__/nativeChatSyncService.test.ts src/chat-native/screens/NativeChatHomePage.tsx src/chat-native/screens/NativeChatRoomPage.tsx
git commit -m "feat: sync native chat history and realtime messages"
```

## Task 14: Text Composer And Send Service

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
  it('creates a pending group message and calls wallet createChatNode', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const wallet = { createChatNode: jest.fn(async () => ({ txids: ['tx1'], totalCost: 1 })) };

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

    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        addressHost: 'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0',
        protocol: 'simplegroupchat',
        externalEncryption: '0',
      }),
    );
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
  wallet: Pick<NativeChatWalletAdapter, 'createChatNode' | 'getEcdh'>;
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
    const result = await params.wallet.createChatNode({
      addressHost: params.addressHost,
      protocol: node.protocol,
      body: node.body,
      externalEncryption: node.externalEncryption,
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

In `NativeChatRoomPage.tsx`, pass `onSendText` into `ChatComposer` and use runtime/account data from `nativeChatStore` plus `getNativeChatRuntimeContext()`:

```tsx
const runtimeContext = getNativeChatRuntimeContext();

<ChatComposer
  disabled={!state.runtimeConfig || !channel}
  onSendText={(text) =>
    sendNativeTextMessage({
      accountGlobalMetaId: state.accountGlobalMetaId,
      channel,
      plaintext: text,
      nickName: state.accountDisplayName,
      addressHost: runtimeContext.runtimeConfig.addressHost,
      repository: runtimeContext.repository,
      store: nativeChatStore,
      wallet: runtimeContext.wallet,
    })
  }
/>
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

## Task 15: Image Message Flow

**Files:**
- Create: `src/chat-native/services/nativeChatImageService.ts`
- Create: `src/chat-native/services/nativeChatImageSendService.ts`
- Create: `src/chat-native/components/ImageMessage.tsx`
- Modify: `src/chat-native/services/chatWalletAdapter.ts`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Modify: `src/chat-native/components/MessageBubble.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Test: `src/chat-native/services/__tests__/nativeChatImageService.test.ts`
- Test: `src/chat-native/services/__tests__/nativeChatImageSendService.test.ts`

- [ ] **Step 1: Write image helper and send tests**

Create `src/chat-native/services/__tests__/nativeChatImageService.test.ts`:

```ts
import { encryptImageAttachmentForChannel, fileExtensionFromMime, makeAttachmentItem } from '../nativeChatImageService';

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

  it('does not encrypt public group image bytes', () => {
    expect(
      encryptImageAttachmentForChannel({
        attachment: { data: '010203', fileType: 'image/png' },
        channel: { type: 'group' } as any,
      }),
    ).toEqual({ data: '010203', fileType: 'image/png' });
  });

  it('encrypts private image bytes when a shared secret is provided', () => {
    const encrypted = encryptImageAttachmentForChannel({
      attachment: { data: '010203', fileType: 'image/png' },
      channel: { type: 'private' } as any,
      sharedSecret: '0123456789abcdef0123456789abcdef',
    });

    expect(encrypted.data).not.toBe('010203');
    expect(encrypted.fileType).toBe('image/png');
  });
});
```

Create `src/chat-native/services/__tests__/nativeChatImageSendService.test.ts`:

```ts
import { sendNativeImageMessage } from '../nativeChatImageSendService';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';

describe('nativeChatImageSendService', () => {
  it('sends group image nodes with attachments and fileEncryption 0', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const wallet = { createChatNode: jest.fn(async () => ({ txids: ['img-tx1'], totalCost: 1 })) };

    await sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel: {
        accountGlobalMetaId: 'self',
        id: 'group-1',
        type: 'group',
        title: 'Group',
        unreadCount: 0,
        lastReadIndex: 0,
        updatedAt: 1,
      },
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/pic.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository: repo,
      store,
      wallet: wallet as any,
      nowSeconds: () => 100,
    });

    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: 'simplefilegroupchat',
        fileEncryption: '0',
        attachments: [{ data: '010203', fileType: 'image/png' }],
      }),
    );
    expect(store.getState().messagesByChannel['group-1'][0]).toMatchObject({
      kind: 'image',
      status: 'sent',
      txId: 'img-tx1',
    });
  });

  it('sends private image nodes with encrypted bytes and fileEncryption 1', async () => {
    const repo = createMemoryChatRepository();
    const store = createNativeChatStore();
    const wallet = {
      getEcdh: jest.fn(async () => ({ sharedSecret: '0123456789abcdef0123456789abcdef' })),
      createChatNode: jest.fn(async () => ({ txids: ['private-img-tx1'], totalCost: 1 })),
    };

    await sendNativeImageMessage({
      accountGlobalMetaId: 'self',
      channel: {
        accountGlobalMetaId: 'self',
        id: 'peer-gm',
        type: 'private',
        title: 'Peer',
        publicKeyStr: 'peer-pub',
        unreadCount: 0,
        lastReadIndex: 0,
        updatedAt: 1,
      },
      attachment: { data: '010203', fileType: 'image/png' },
      localPreviewUri: 'file:///tmp/private.png',
      nickName: 'Alice',
      addressHost: 'bc1p-host',
      repository: repo,
      store,
      wallet: wallet as any,
      nowSeconds: () => 100,
    });

    expect(wallet.createChatNode).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: 'simplefilemsg',
        fileEncryption: '1',
        attachments: [expect.objectContaining({ fileType: 'image/png' })],
      }),
    );
    expect(wallet.createChatNode.mock.calls[0][0].attachments[0].data).not.toBe('010203');
  });
});
```

- [ ] **Step 2: Implement image helpers**

Create `src/chat-native/services/nativeChatImageService.ts`:

```ts
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import type { NativeChatChannel } from '../domain/types';
import type { NativeChatAttachmentItem } from './chatWalletAdapter';
import { encryptPrivateImageHex } from './chatCrypto';

export function fileExtensionFromMime(mimeType: string): string {
  return mimeType.split('/')[1] || 'png';
}

export function makeAttachmentItem(input: { base64: string; mimeType: string }): NativeChatAttachmentItem {
  return {
    data: Buffer.from(input.base64, 'base64').toString('hex'),
    fileType: input.mimeType,
  };
}

export function encryptImageAttachmentForChannel(params: {
  attachment: NativeChatAttachmentItem;
  channel: Pick<NativeChatChannel, 'type' | 'roomJoinType' | 'passwordKey'>;
  sharedSecret?: string;
}): NativeChatAttachmentItem {
  if (params.channel.type === 'private') {
    if (!params.sharedSecret) throw new Error('Missing private image shared secret');
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

- [ ] **Step 3: Extend wallet adapter attachment support**

In `chatWalletAdapter.ts`, replace the temporary attachment error in `createChatNode` with the MVC-compatible two-pin sequence used by the web `createShowMsg` flow:

```ts
async createChatNode(params: NativeChatCreateNodeParams) {
  const body = { ...params.body };
  const dataList: CreatePinParams['dataList'] = [];

  if (params.attachments?.length) {
    const first = params.attachments[0];
    dataList.push({
      metaidData: {
        operation: 'create',
        path: `${params.addressHost}:/file`,
        body: Buffer.from(first.data, 'hex'),
        contentType: `${first.fileType};binary`,
        encryption: params.fileEncryption || '0',
        encoding: 'binary',
      },
    });
    body.attachment = 'metafile://$FILE_TXIDi0';
  }

  dataList.push({
    metaidData: buildChatMetaidData(params.addressHost, {
      protocol: params.protocol,
      body,
      externalEncryption: params.externalEncryption,
    } as any),
    options: params.attachments?.length ? { refs: { '$FILE_TXID': 0 } } : undefined,
  });

  return CreatePin.process({
    chain: 'mvc',
    dataList,
  });
},
```

This keeps the native behavior aligned with the web flow: first create a `/file` pin, then create `/protocols/simplefilegroupchat` or `/protocols/simplefilemsg` with `body.attachment = metafile://<fileTxId>i0`.

- [ ] **Step 4: Implement image send service**

Create `src/chat-native/services/nativeChatImageSendService.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import { buildImageNode } from './chatNodeBuilder';
import { encryptImageAttachmentForChannel } from './nativeChatImageService';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { NativeChatAttachmentItem, NativeChatWalletAdapter } from './chatWalletAdapter';
import type { createNativeChatStore } from '../state/useNativeChatStore';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;

export async function sendNativeImageMessage(params: {
  accountGlobalMetaId: string;
  channel: NativeChatChannel;
  attachment: NativeChatAttachmentItem;
  localPreviewUri: string;
  nickName: string;
  addressHost: string;
  repository: NativeChatRepository;
  store: NativeChatStoreApi;
  wallet: Pick<NativeChatWalletAdapter, 'createChatNode' | 'getEcdh'>;
  nowSeconds?: () => number;
}) {
  const timestamp = params.nowSeconds ? params.nowSeconds() : Math.floor(Date.now() / 1000);
  const mockId = `native_img_${timestamp}_${Math.random().toString(36).slice(2)}`;
  const fileType = params.attachment.fileType.split('/')[1] || 'png';
  const ecdh =
    params.channel.type === 'private' && params.channel.publicKeyStr
      ? await params.wallet.getEcdh(params.channel.publicKeyStr)
      : undefined;
  const attachment = encryptImageAttachmentForChannel({
    attachment: params.attachment,
    channel: params.channel,
    sharedSecret: ecdh?.sharedSecret,
  });

  const node = buildImageNode({
    channelType: params.channel.type,
    channelId: params.channel.id,
    parentGroupId: params.channel.parentGroupId,
    fileType,
    nickName: params.nickName,
    timestamp,
  });

  const pending: NativeChatMessage = {
    accountGlobalMetaId: params.accountGlobalMetaId,
    channelId: params.channel.id,
    channelType: params.channel.type,
    kind: 'image',
    content: '',
    contentType: params.attachment.fileType,
    encryption: 'aes',
    protocol: node.protocol,
    timestamp,
    senderGlobalMetaId: params.accountGlobalMetaId,
    mockId,
    localPreviewUri: params.localPreviewUri,
    status: 'pending',
  };

  await params.repository.upsertMessage(pending);
  params.store.getState().mergeMessages(params.channel.id, [pending]);

  try {
    const result = await params.wallet.createChatNode({
      addressHost: params.addressHost,
      protocol: node.protocol,
      body: node.body,
      externalEncryption: node.externalEncryption,
      fileEncryption: node.fileEncryption,
      attachments: [attachment],
    });
    const txId = result.txids?.[1] || result.txids?.[0] || result.revealTxIds?.[1] || result.revealTxIds?.[0];
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

- [ ] **Step 5: Create image message component**

Create `src/chat-native/components/ImageMessage.tsx`:

```tsx
import React from 'react';
import { Image, Pressable } from 'react-native';

type Props = {
  uri: string;
  onOpen?: (uri: string) => void;
};

export default function ImageMessage({ uri, onOpen }: Props) {
  return (
    <Pressable onPress={() => onOpen?.(uri)} disabled={!onOpen}>
      <Image
        source={{ uri }}
        style={{ width: 180, height: 180, borderRadius: 8, backgroundColor: '#EEE' }}
        resizeMode="cover"
      />
    </Pressable>
  );
}
```

In `MessageBubble.tsx`, replace the inline `<Image />` branch with:

```tsx
<ImageMessage uri={message.localPreviewUri || message.attachmentUri} />
```

Also import `ImageMessage` and remove the old `Image` import from `react-native`.

- [ ] **Step 6: Extend composer and room wiring**

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

In `NativeChatRoomPage.tsx`, use `pickImageAttachment` and `sendNativeImageMessage` for the image button. Pass the native account display name from the store and `addressHost`, repository, and wallet from `getNativeChatRuntimeContext()`.

- [ ] **Step 7: Run image tests**

Run:

```bash
yarn test:chat-native src/chat-native/services/__tests__/nativeChatImageService.test.ts src/chat-native/services/__tests__/nativeChatImageSendService.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/chat-native/services/nativeChatImageService.ts src/chat-native/services/nativeChatImageSendService.ts src/chat-native/services/__tests__/nativeChatImageService.test.ts src/chat-native/services/__tests__/nativeChatImageSendService.test.ts src/chat-native/services/chatWalletAdapter.ts src/chat-native/components/ChatComposer.tsx src/chat-native/components/ImageMessage.tsx src/chat-native/components/MessageBubble.tsx src/chat-native/screens/NativeChatRoomPage.tsx
git commit -m "feat: add native image message sending"
```

## Task 16: Chat Link Shell

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

## Task 17: Simulator, Mock Scenario, And Release-Candidate Verification

**Files:**
- Create: `src/chat-native/dev/nativeChatMockScenario.ts`
- Create: `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`
- Create: `docs/superpowers/qa/native-idchat-simulator-runbook.md`
- Modify: `src/chat/page/ChatHomePage.tsx`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify only other files required by failures found in this task.

- [ ] **Step 1: Write mock scenario tests**

Create `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`:

```ts
import {
  createNativeChatMockApiClient,
  createNativeChatMockWalletAdapter,
  seedNativeChatMockScenario,
} from '../nativeChatMockScenario';
import { createMemoryChatRepository } from '../../storage/chatRepository';
import { createNativeChatStore } from '../../state/useNativeChatStore';

describe('nativeChatMockScenario', () => {
  it('seeds private and group conversations for simulator QA', async () => {
    const store = createNativeChatStore();
    const repo = createMemoryChatRepository();

    await seedNativeChatMockScenario({ store, repository: repo, accountGlobalMetaId: 'qa-self' });

    expect(store.getState().channels.map((channel) => channel.type).sort()).toEqual(['group', 'private']);
    expect(store.getState().messagesByChannel['qa-group']).toHaveLength(2);
    expect(store.getState().messagesByChannel['qa-peer']).toHaveLength(2);
  });

  it('provides mocked API and wallet behavior for offline simulator runs', async () => {
    const api = createNativeChatMockApiClient();
    const wallet = createNativeChatMockWalletAdapter();

    await expect(api.getLatestChatInfoList({ metaId: 'qa-self' })).resolves.toHaveLength(2);
    await expect(
      wallet.createChatNode({
        addressHost: 'bc1p-host',
        protocol: 'simplegroupchat',
        body: { content: 'hello' },
        externalEncryption: '0',
      }),
    ).resolves.toMatchObject({
      txids: ['mock-native-chat-txid'],
    });
  });

  it('keeps native and mock entry flags committed off', async () => {
    const fs = await import('fs/promises');
    const source = await fs.readFile('src/chat/page/ChatHomePage.tsx', 'utf8');

    expect(source).toContain('const ENABLE_NATIVE_IDCHAT = false');
    expect(source).toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = false');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT = true');
    expect(source).not.toContain('const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = true');
  });
});
```

- [ ] **Step 2: Implement simulator mock scenario**

Create `src/chat-native/dev/nativeChatMockScenario.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import type { NativeChatRepository } from '../storage/chatRepository';
import type { createNativeChatStore } from '../state/useNativeChatStore';
import type { NativeChatWalletAdapter } from '../services/chatWalletAdapter';

type NativeChatStoreApi = ReturnType<typeof createNativeChatStore>;

export const MOCK_ACCOUNT_GLOBAL_META_ID = 'qa-self';

export const mockChannels: NativeChatChannel[] = [
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    id: 'qa-group',
    type: 'group',
    title: 'QA Native Group',
    unreadCount: 1,
    lastReadIndex: 1,
    updatedAt: 1717800001000,
    lastMessage: {
      content: 'Mock group message',
      kind: 'text',
      timestamp: 1717800001000,
      senderGlobalMetaId: 'qa-peer',
    },
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    id: 'qa-peer',
    type: 'private',
    title: 'QA Private Peer',
    publicKeyStr: '04mock-public-key',
    unreadCount: 0,
    lastReadIndex: 2,
    updatedAt: 1717800002000,
    lastMessage: {
      content: 'Mock private message',
      kind: 'text',
      timestamp: 1717800002000,
      senderGlobalMetaId: 'qa-peer',
    },
  },
];

export const mockMessages: NativeChatMessage[] = [
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-group',
    channelType: 'group',
    kind: 'text',
    content: 'Mock group message',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1717800001000,
    senderGlobalMetaId: 'qa-peer',
    txId: 'mock-group-tx-1',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-group',
    channelType: 'group',
    kind: 'image',
    content: '',
    contentType: 'image/png',
    protocol: 'simplefilegroupchat',
    timestamp: 1717800001100,
    senderGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    txId: 'mock-group-img-1',
    attachmentUri: 'https://www.idchat.io/logo.png',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-peer',
    channelType: 'private',
    kind: 'text',
    content: 'Mock private message',
    contentType: 'text/plain',
    protocol: 'simplemsg',
    timestamp: 1717800002000,
    senderGlobalMetaId: 'qa-peer',
    txId: 'mock-private-tx-1',
    status: 'sent',
  },
  {
    accountGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    channelId: 'qa-peer',
    channelType: 'private',
    kind: 'text',
    content: 'Pending native reply',
    contentType: 'text/plain',
    protocol: 'simplemsg',
    timestamp: 1717800002100,
    senderGlobalMetaId: MOCK_ACCOUNT_GLOBAL_META_ID,
    mockId: 'mock-pending-1',
    status: 'pending',
  },
];

export async function seedNativeChatMockScenario(params: {
  store: NativeChatStoreApi;
  repository: NativeChatRepository;
  accountGlobalMetaId?: string;
}) {
  const accountGlobalMetaId = params.accountGlobalMetaId || MOCK_ACCOUNT_GLOBAL_META_ID;
  params.store.getState().setAccount(accountGlobalMetaId);

  for (const channel of mockChannels) {
    const nextChannel = { ...channel, accountGlobalMetaId };
    await params.repository.upsertChannel(nextChannel);
    params.store.getState().mergeChannels([nextChannel]);
  }

  for (const message of mockMessages) {
    const nextMessage = { ...message, accountGlobalMetaId };
    await params.repository.upsertMessage(nextMessage);
    params.store.getState().mergeMessages(nextMessage.channelId, [nextMessage]);
  }
}

export function createNativeChatMockApiClient() {
  return {
    async getLatestChatInfoList() {
      return mockChannels.map((channel) => ({
        type: channel.type === 'private' ? '2' : '1',
        groupId: channel.type === 'private' ? undefined : channel.id,
        globalMetaId: channel.type === 'private' ? channel.id : undefined,
        roomName: channel.title,
        name: channel.title,
        chatPublicKey: channel.publicKeyStr,
        latestMessage: channel.lastMessage,
      }));
    },
  };
}

export function createNativeChatMockWalletAdapter(): Pick<NativeChatWalletAdapter, 'createChatNode' | 'getEcdh'> {
  return {
    async getEcdh(externalPubKey: string) {
      return {
        externalPubKey,
        sharedSecret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        ecdhPubKey: '04mock-ecdh-public-key',
      };
    },
    async createChatNode() {
      return { txids: ['mock-native-chat-txid'], totalCost: 1 };
    },
  };
}
```

- [ ] **Step 3: Add development-only mock entry flag**

In `src/chat/page/ChatHomePage.tsx`, keep production behavior safe by default:

```ts
const ENABLE_NATIVE_IDCHAT = false;
const ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = false;
```

When navigating to native chat for simulator QA, pass a mock param only in development:

```ts
if (ENABLE_NATIVE_IDCHAT) {
  navigate('NativeChatHomePage', {
    mockScenario: __DEV__ && ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO ? 'basic' : undefined,
  });
  return;
}
```

In `NativeChatHomePage`, if `route.params?.mockScenario === 'basic'`, call `seedNativeChatMockScenario` with a memory repository before live bootstrap. Keep both flags committed as `false`.

- [ ] **Step 4: Create simulator and live-backend QA runbook**

Create `docs/superpowers/qa/native-idchat-simulator-runbook.md`:

```md
# Native IDChat Simulator QA Runbook

## Purpose

Verify that native IDChat is close to release quality, not merely code-reviewed. This runbook covers mocked simulator validation and live backend smoke validation.

## Preconditions

- Use a development branch or worktree.
- Keep generic WebView/DApp routes available.
- Keep `ENABLE_NATIVE_IDCHAT` and `ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO` committed as `false`.
- For mock simulator QA, temporarily set both flags to `true` locally, run the checks, then revert those local flag edits before committing.
- For live backend QA, use dedicated funded QA wallet/accounts only.

## Automated Checks

Run:

```bash
yarn test:chat-native
npx tsc --noEmit
```

Expected:

- `yarn test:chat-native` passes.
- `npx tsc --noEmit` passes or reports only documented pre-existing errors outside `src/chat-native`.

## Mocked Simulator Checks

Run iOS:

```bash
yarn ios
```

Run Android:

```bash
yarn android
```

Verify in at least one simulator/emulator:

- IDChat opens native conversation list with mock group and private conversations.
- Opening the mock group shows text and image messages.
- Opening the mock private chat shows text and pending message states.
- Emoji insertion adds emoji into the composer.
- Sending text creates pending then sent state using mock wallet.
- Image button opens the platform image picker or permission prompt.
- Tapping a web URL opens `ChatLinkShellPage`, then falls back to existing WebView route.
- App background/resume does not crash.
- Generic `WebsPage`, `DappWebsPage`, and `OpenWebsPage` still open.

Capture screenshots or screen recordings for conversation list, chat room, composer, image entry, link shell, and fallback WebView.

## Live Backend Smoke Checks

Use QA accounts and existing backend:

- Load conversation list from `https://api.idchat.io/chat-api`.
- Open a real group chat.
- Open a real private chat.
- Connect Socket.IO through `https://api.idchat.io` with path `/socket/socket.io`.
- Receive a message sent from the web IDChat app.
- Send native group text and confirm it appears in web IDChat.
- Send native private text and confirm it appears in web IDChat.
- Send native group image and confirm it appears in web IDChat.
- Send native private image and confirm it appears in web IDChat.
- Put app in background, resume, and verify socket reconnect or sync catches up.
- Disable network, open cached conversation, re-enable network, and verify sync resumes.

## Release Candidate Gate

Native IDChat cannot be treated as the default chat entry until:

- Mock simulator checks pass.
- Live backend smoke checks pass or each blocker has an exact reason and owner.
- Old IDChat WebView fallback is verified.
- Generic DApp/WebView routes are verified.
- No secrets, QA mnemonic, private keys, or generated credential files are committed.
```

- [ ] **Step 5: Run mock scenario tests**

Run:

```bash
yarn test:chat-native src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run full native chat unit suite**

Run:

```bash
yarn test:chat-native
```

Expected: PASS.

- [ ] **Step 7: Run TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS or only documented pre-existing unrelated errors. If there are TypeScript errors in `src/chat-native`, fix them in this task.

- [ ] **Step 8: Run Expo startup smoke check**

Run:

```bash
yarn start --clear
```

Expected: Metro starts without module resolution errors. Stop Metro after confirming startup.

- [ ] **Step 9: Run simulator/emulator validation**

Run iOS Simulator when available:

```bash
yarn ios
```

Run Android Emulator when available:

```bash
yarn android
```

Verify the mocked simulator checklist in `docs/superpowers/qa/native-idchat-simulator-runbook.md`. At least one simulator/emulator must pass before this task can be considered complete. If one platform cannot run, record the exact environment blocker.

- [ ] **Step 10: Run live backend smoke validation**

Using designated QA wallet/accounts, verify the live backend checklist in `docs/superpowers/qa/native-idchat-simulator-runbook.md`.

Required evidence:

- native conversation list screenshot
- native group chat screenshot
- native private chat screenshot
- web IDChat screenshot showing a native-sent group text
- web IDChat screenshot showing a native-sent private text
- web IDChat screenshot showing at least one native-sent image, unless blocked by QA wallet funds or backend/file-service failure
- terminal output for `yarn test:chat-native`
- terminal output for `npx tsc --noEmit`

- [ ] **Step 11: Device smoke checklist**

Run an iOS or Android development build, then verify:

- With `ENABLE_NATIVE_IDCHAT = false`, the existing IDChat WebView still opens.
- With `ENABLE_NATIVE_IDCHAT = true`, IDChat opens `NativeChatHomePage`.
- With `ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = true` in development, native chat loads mock conversations without live backend.
- The generic `WebsPage`, `DappWebsPage`, and `OpenWebsPage` routes still open.
- Native chat displays a stable empty state when no account/globalMetaId is available.
- Native chat does not crash on app background/resume.
- Native chat can send text through mock wallet in simulator.
- Native chat can receive or sync real messages through live backend QA flow.

- [ ] **Step 12: Commit final verification assets and fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: stabilize native chat mvp verification"
```

If only the runbook and mock scenario files changed:

```bash
git add src/chat-native/dev docs/superpowers/qa/native-idchat-simulator-runbook.md
git commit -m "test: add native chat simulator qa harness"
```

If no fixes were needed beyond already committed files, record the passing commands and simulator/live evidence in the PR or handoff notes.

## Spec Coverage Review

- Replace IDChat chat homepage WebView: Tasks 10, 11, and 16.
- Preserve generic DApp/WebView container: Tasks 11 and 16.
- Preserve HTTP interfaces: Tasks 3, 5, and 12.
- Preserve Socket.IO contract: Task 6.
- Preserve encryption compatibility: Task 4.
- Preserve MetaID node names and createPin/chat-node send path: Tasks 7, 14, and 15.
- SQLite local persistence: Task 8.
- Conversation list and read-only chat: Tasks 10 and 12.
- Text and emoji sending: Task 14.
- Image support: Task 15.
- Chat link shell: Task 16.
- Mocked simulator QA harness: Task 17.
- Live backend release-candidate smoke validation: Task 17.
- Red packets and MRC20 excluded: no task implements those features.

## Execution Handoff

Execute this plan task-by-task with `superpowers:subagent-driven-development`.

Recommended subagent grouping:

1. Dispatch Tasks 1-4 as independent foundation tasks: test harness, domain/protocol, runtime config, crypto.
2. Dispatch Tasks 5-9 as service/storage/state tasks after the foundation lands.
3. Sequence Tasks 10-15 because they touch screens, navigation, send flows, and shared UI.
4. Assign Task 17 to a verification-focused subagent after implementation is integrated. This subagent must run simulator/emulator checks and live-backend QA checks, not just inspect code.

Keep `ENABLE_NATIVE_IDCHAT = false` and `ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO = false` in committed code until the user explicitly approves making native chat the default. Local simulator testing may temporarily flip them, but those temporary flips must not be committed.

Final handoff must include:

- commits produced
- files changed
- test commands and outputs
- simulator/emulator platforms tested
- live backend QA account scope used, without secrets
- screenshots or recordings collected
- unresolved blockers with owners
