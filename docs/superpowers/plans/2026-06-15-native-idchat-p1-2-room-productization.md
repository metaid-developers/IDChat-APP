# Native IDChat P1.2 Room Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Native IDChat conversation room release-credible: readable private/group transcripts, safe actions, stable media/transaction presentation, keyboard-safe composer behavior, pagination affordances, and final simulator evidence.

**Architecture:** Keep the existing native room stack. Add small, testable room/message view-model helpers where the current room page has too much local decision logic, then wire those helpers into `NativeChatRoomPage`, `MessageList`, `MessageBubble`, `MessageActionSheet`, and `ChatComposer`. Use deterministic mock data for unsafe or hard-to-reproduce states, while still opening one live private room and one live group room for final acceptance.

**Tech Stack:** React Native 0.79, Expo SDK 53, Zustand store, Jest, TypeScript, iOS Simulator, `expo-image`, `expo-clipboard`, `expo-media-library`.

---

## Current State

- Development worktree: `/Users/tusm/.codex/worktrees/native-idchat-p1-2/IDChat-APP`
- Branch: `codex/native-idchat-p1-2-room-productization`
- Branch base: `0f0ae2df9123f9827c0f914fe289efa817724adb docs: add native idchat p1.2 room spec`
- `main` in the source checkout is ahead of `origin/main`; do not push unless the user explicitly asks.
- Baseline dependency install in the worktree completed with `yarn install --frozen-lockfile`.
- Baseline `yarn test:chat-native` had one cold-run timeout in two `ChatComposer` tests, then passed on rerun: 41 suites / 290 tests.
- Baseline `npm exec tsc -- --noEmit --pretty false` fails only in existing non-`src/chat-native` paths. No baseline `src/chat-native` TypeScript errors were printed.

## Non-Negotiable Scope

- [ ] Do not implement red packet creation, claiming, rendering parity, or composer entry.
- [ ] Do not implement full group management, invite/admin/member role writes, mute writes, whitelist, kick, or owner transfer.
- [ ] Do not productize P1.3 Me/account or deep group-info surfaces except preserving the existing room header info entry.
- [ ] Do not implement Android, TestFlight, EAS, App Store signing, release automation, or production deployment.
- [ ] Do not introduce WebView fallback for normal chat usage.
- [ ] Do not send live messages unless the user explicitly approves the test account and exact test content.
- [ ] Do not print, screenshot, commit, or buzz mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive live message content.
- [ ] If live screenshots contain readable private/group message content, redact the screenshots before keeping them as evidence.
- [ ] Stage and commit only files changed for the current task.
- [ ] After every commit, post a Lisa Hahn development-journal buzz using `metabot-post-buzz` with `--from lisa-hahn`.

## File Map

Create:

- `src/chat-native/ui/chatRoomUi.ts`
  - Testable helpers for room header view-models, room entry states, composer-disabled product copy, safe quote previews, and room status banners.
- `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
  - Focused unit coverage for room states, long header labels, private missing-key state, blocked/unjoined/cannot-send copy, and safe quote preview content.

Modify:

- `src/chat-native/screens/NativeChatRoomPage.tsx`
  - Consume `chatRoomUi` helpers, render deterministic entry states, track sync/load-older failures, use keyboard-safe layout, dismiss keyboard before action sheets, and preserve back navigation.
- `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
  - Cover header states, invalid route, runtime-unavailable room, missing private key banner/composer, keyboard-aware wrapper, action sheet keyboard dismissal, load-older failure, and back fallback.
- `src/chat-native/ui/chatUiSelectors.ts`
  - Extend message row view models with grouping, avatar/sender visibility, safe body kind, unsupported placeholder, safe copy text, and transaction capability data.
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
  - Cover grouped sender labels, long/safe text containment, encrypted/raw JSON containment, unsupported non-image file/red-packet-like messages, status labels, and safe copy text.
- `src/chat-native/components/MessageList.tsx`
  - Render grouped row models, stable empty/older/latest states, retryable load-earlier error, no-more older state, and `maintainVisibleContentPosition`.
- `src/chat-native/components/__tests__/MessageList.test.tsx`
  - Cover grouped render props, older loading/no-more/error states, latest affordance, and visible-index read observation.
- `src/chat-native/components/MessageBubble.tsx`
  - Apply grouping density, hide repeated sender labels, reserve avatar spacing, contain long text, show unsupported placeholder, compact transaction footer, and keep action targets reachable.
- `src/chat-native/components/__tests__/MessageBubble.test.tsx`
  - Cover hidden repeated sender label, avatar spacer, long text style containment, unsupported placeholder, failed/pending status, and action targets.
- `src/chat-native/ui/chatUiFormatters.ts`
  - Make tx explorer URL building explicit for supported chains only: MVC/default, BTC, DOGE. Unknown chains return `undefined`.
- `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
  - Cover supported explorer URLs and unknown-chain no-URL behavior.
- `src/chat-native/ui/messageActions.ts`
  - Gate actions by safe copy text, renderable image URI, supported tx explorer URL, and stable quote target.
- `src/chat-native/ui/__tests__/messageActions.test.ts`
  - Cover text/image/tx/unknown-chain/decrypt-failure/unsupported message action availability.
- `src/chat-native/components/MessageActionSheet.tsx`
  - Put action list first, move full txid into secondary detail, copy safe row text instead of raw content, handle unsupported open-tx safely, and keep close paths.
- `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
  - Cover safe copy, no raw ciphertext copy, secondary tx detail, image view/save callbacks, unsupported-chain no open action, backdrop/close.
- `src/chat-native/components/ChatComposer.tsx`
  - Hide full local image URI from primary preview copy, keep image remove/replace/send controls, keep quote preview bounded, and preserve disabled-state affordances.
- `src/chat-native/services/__tests__/nativeChatSendService.test.ts`
  - Extend existing `ChatComposer` tests for no local URI text, bounded quote/image previews, disabled image/emoji/send controls, and quote metadata.
- `src/chat-native/dev/nativeChatUiMockScenario.ts`
  - Add deterministic P1.2 room states for long text, unsupported content, image unavailable/loading, transaction action, missing-key private chat, load-earlier/latest affordance, and disabled composer evidence.
- `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
  - Assert the mock scenario covers every required P1.2 screenshot state without secrets.

Create during final evidence:

- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/README.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/git-status-before-simulator.txt`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/commit-under-test.txt`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/yarn-test-chat-native.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/tsc-noemit.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/tsc-chat-native-filter.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/metro.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-devices.txt`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-bootstatus.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-openurl.log`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-screenshot.log`
- Screenshots `01-private-room-text.png` through `13-back-to-chat-list.png` as listed in the P1.2 spec.

## Shared Commands

Use these commands after each implementation task unless the task says otherwise:

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-tsc.log 2>&1; true
grep 'src/chat-native' /tmp/idchat-p1-2-tsc.log || true
```

Expected:

- `yarn test:chat-native` exits 0.
- `git diff --check` exits 0.
- TypeScript may exit 2 because of existing non-chat-native errors.
- The filtered `grep 'src/chat-native' /tmp/idchat-p1-2-tsc.log` prints no lines. If it prints any `src/chat-native` line, stop and fix before committing.

Every task below includes its exact `git add` paths, commit message, and Lisa Hahn buzz summary. After each commit, run `git rev-parse --short HEAD`, create a request JSON whose `content` combines that task's listed buzz summary, the actual short SHA, and the verification result, then run:

```bash
$HOME/.metabot/bin/metabot buzz post --from lisa-hahn --request-file /tmp/idchat-p1-2-buzz/task-specific-request.json
```

The buzz content must not include secrets or decrypted live message content.

## Task 0: Preflight, Baseline, And Branch Boundary

**P1.2 slice:** all slices

**Files:** none

- [ ] **Step 1: Confirm branch and latest commits**

  Run:

  ```bash
  git status --short --branch
  git log --oneline --decorate --max-count=12
  ```

  Expected:

  - Branch is `codex/native-idchat-p1-2-room-productization`.
  - HEAD descends from `0f0ae2df9123f9827c0f914fe289efa817724adb`.
  - No unrelated dirty files are present.

- [ ] **Step 2: Run clean baseline tests**

  Run:

  ```bash
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-baseline-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-baseline-tsc.log || true
  ```

  Expected:

  - `yarn test:chat-native` passes. If a cold-run timeout appears, rerun once; if it reproduces, stop and investigate before product changes.
  - `git diff --check` passes.
  - TypeScript output has no `src/chat-native` matches.

- [ ] **Step 3: Record baseline in the task notes**

  Expected result:

  - Subagent notes include exact pass/fail counts and any existing non-chat-native TypeScript errors.
  - No code or docs are committed for Task 0.

## Task 1: P1.2a Room Entry States, Header Identity, And Composer Permission Copy

**P1.2 slice:** P1.2a, with P1.2c disabled-composer prerequisites

**Requirements covered:** P1.2-R1, R2, R18, R19, R20 header/back baseline

**Files:**

- Create: `src/chat-native/ui/chatRoomUi.ts`
- Create: `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`

- [ ] **Step 1: Write failing helper tests**

  Create `src/chat-native/ui/__tests__/chatRoomUi.test.ts` with these test cases:

  ```ts
  import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
  import {
    getNativeChatComposerDisabledReason,
    getNativeChatRoomHeaderViewModel,
    getNativeChatRoomState,
    getSafeNativeChatQuotePreview,
  } from '../chatRoomUi';

  function channel(overrides: Partial<NativeChatChannel> = {}): NativeChatChannel {
    return {
      accountGlobalMetaId: 'self',
      id: 'room-1',
      type: 'group',
      title: 'MetaWeb Builders',
      unreadCount: 0,
      lastReadIndex: 0,
      updatedAt: 1717800000000,
      ...overrides,
    };
  }

  function message(overrides: Partial<NativeChatMessage> = {}): NativeChatMessage {
    return {
      accountGlobalMetaId: 'self',
      channelId: 'room-1',
      channelType: 'group',
      content: 'hello',
      contentType: 'text/plain',
      kind: 'text',
      protocol: 'simplegroupchat',
      status: 'sent',
      timestamp: 1717800000000,
      ...overrides,
    };
  }

  describe('chatRoomUi', () => {
    it('builds private and group header identity without raw ids dominating names', () => {
      expect(getNativeChatRoomHeaderViewModel(channel({ type: 'private', title: 'Lisa Hahn' }))).toEqual(
        expect.objectContaining({
          title: 'Lisa Hahn',
          subtitle: 'Private chat',
          infoEnabled: true,
        }),
      );
      expect(getNativeChatRoomHeaderViewModel(channel({ serverData: { memberCount: 128 } }))).toEqual(
        expect.objectContaining({
          title: 'MetaWeb Builders',
          subtitle: '128 members',
          infoEnabled: true,
        }),
      );
    });

    it('returns deterministic room states for missing, loading, empty, ready, runtime, and sync failure', () => {
      expect(getNativeChatRoomState({
        channelId: 'missing',
        channel: undefined,
        runtimeReady: true,
        messages: [],
        loadingLatest: false,
      })).toEqual(expect.objectContaining({ kind: 'missing', title: 'Chat not found' }));

      expect(getNativeChatRoomState({
        channelId: 'room-1',
        channel: channel(),
        runtimeReady: false,
        messages: [],
        loadingLatest: false,
      })).toEqual(expect.objectContaining({ kind: 'runtime-unavailable' }));

      expect(getNativeChatRoomState({
        channelId: 'room-1',
        channel: channel(),
        runtimeReady: true,
        messages: [],
        loadingLatest: true,
      })).toEqual(expect.objectContaining({ kind: 'loading' }));

      expect(getNativeChatRoomState({
        channelId: 'room-1',
        channel: channel(),
        runtimeReady: true,
        messages: [],
        loadingLatest: false,
      })).toEqual(expect.objectContaining({ kind: 'empty', title: 'No messages yet' }));

      expect(getNativeChatRoomState({
        channelId: 'room-1',
        channel: channel(),
        runtimeReady: true,
        messages: [message()],
        loadingLatest: false,
      })).toEqual(expect.objectContaining({ kind: 'ready' }));

      expect(getNativeChatRoomState({
        channelId: 'room-1',
        channel: channel(),
        runtimeReady: true,
        messages: [message()],
        loadingLatest: false,
        syncError: 'Network failed',
      })).toEqual(expect.objectContaining({ kind: 'sync-failed', title: 'Messages could not refresh' }));
    });

    it('keeps composer disabled reasons product-facing and secret-free', () => {
      expect(getNativeChatComposerDisabledReason({ runtimeReady: false })).toBe(
        'Chat is unavailable while account services load.',
      );
      expect(getNativeChatComposerDisabledReason({
        runtimeReady: true,
        channel: channel({ type: 'private', publicKeyStr: undefined }),
      })).toBe('Missing peer chat public key');
      expect(getNativeChatComposerDisabledReason({
        runtimeReady: true,
        channel: channel({ serverData: { isBlocked: true } }),
      })).toBe('You cannot send because this chat is blocked.');
      expect(getNativeChatComposerDisabledReason({
        runtimeReady: true,
        channel: channel({ serverData: { canSend: false, disabledReason: 'Only moderators can speak.' } }),
      })).toBe('Only moderators can speak.');
    });

    it('builds safe quote previews for text, image, encrypted, and tx-heavy rows', () => {
      expect(getSafeNativeChatQuotePreview({ kind: 'image', body: '', fullTxId: 'tx-full' })).toBe('[Image]');
      expect(getSafeNativeChatQuotePreview({ kind: 'text', body: 'Unable to decrypt this message', fullTxId: 'tx-full' })).toBe(
        'Unable to decrypt this message',
      );
      expect(getSafeNativeChatQuotePreview({ kind: 'text', body: 'hello '.repeat(20), fullTxId: 'tx-full' })).toBe(
        `${'hello '.repeat(10).trimEnd()}...`,
      );
    });
  });
  ```

- [ ] **Step 2: Verify helper tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/ui/__tests__/chatRoomUi.test.ts
  ```

  Expected:

  - Fails because `../chatRoomUi` does not exist.

- [ ] **Step 3: Implement `chatRoomUi` helpers**

  Create `src/chat-native/ui/chatRoomUi.ts` with these exports:

  ```ts
  import type { NativeChatChannel, NativeChatMessage } from '../domain/types';

  export type NativeChatRoomStateKind =
    | 'missing'
    | 'runtime-unavailable'
    | 'loading'
    | 'empty'
    | 'sync-failed'
    | 'ready';

  export type NativeChatRoomState = {
    kind: NativeChatRoomStateKind;
    title: string;
    body?: string;
    retryLabel?: string;
    showMessages: boolean;
  };

  export type NativeChatRoomHeaderViewModel = {
    title: string;
    subtitle: string;
    avatar?: string;
    infoEnabled: boolean;
  };

  const MAX_QUOTE_PREVIEW_LENGTH = 60;

  function getServerMemberCount(serverData: Record<string, unknown> | undefined): number | undefined {
    const values = [
      serverData?.memberCount,
      serverData?.membersCount,
      serverData?.memberTotal,
      serverData?.userCount,
      serverData?.userTotal,
    ];
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
    const members = serverData?.members;
    return Array.isArray(members) ? members.length : undefined;
  }

  export function getNativeChatRoomHeaderViewModel(
    channel: NativeChatChannel | undefined,
  ): NativeChatRoomHeaderViewModel {
    if (!channel) {
      return { title: 'Chat', subtitle: '', infoEnabled: false };
    }

    if (channel.type === 'private') {
      return {
        title: channel.title || 'Private chat',
        subtitle: 'Private chat',
        avatar: channel.avatar,
        infoEnabled: true,
      };
    }

    const memberCount = getServerMemberCount(channel.serverData);
    return {
      title: channel.title || 'Group chat',
      subtitle: memberCount !== undefined ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : 'Group chat',
      avatar: channel.avatar,
      infoEnabled: true,
    };
  }

  export function getNativeChatComposerDisabledReason({
    channel,
    runtimeReady,
  }: {
    channel?: NativeChatChannel;
    runtimeReady: boolean;
  }): string | undefined {
    if (!runtimeReady) return 'Chat is unavailable while account services load.';
    if (!channel) return 'Select a chat to send a message.';
    if (channel.type === 'private' && !channel.publicKeyStr) return 'Missing peer chat public key';

    const serverData = channel.serverData || {};
    if (serverData.isBlocked || serverData.blocked) return 'You cannot send because this chat is blocked.';
    if (serverData.isMember === false || serverData.joined === false) return 'Join this group before sending messages.';
    if (serverData.canSend === false) {
      return typeof serverData.disabledReason === 'string' && serverData.disabledReason.trim()
        ? serverData.disabledReason.trim()
        : 'Sending is unavailable in this chat.';
    }
    return undefined;
  }

  export function getNativeChatRoomState({
    channelId,
    channel,
    runtimeReady,
    messages,
    loadingLatest,
    syncError,
  }: {
    channelId: string;
    channel?: NativeChatChannel;
    runtimeReady: boolean;
    messages: NativeChatMessage[];
    loadingLatest: boolean;
    syncError?: string;
  }): NativeChatRoomState {
    if (!channelId || !channel) {
      return {
        kind: 'missing',
        title: 'Chat not found',
        body: 'Return to Chats and choose a conversation.',
        showMessages: false,
      };
    }
    if (!runtimeReady) {
      return {
        kind: 'runtime-unavailable',
        title: 'Chat is loading',
        body: 'Account services are still starting.',
        showMessages: false,
      };
    }
    if (syncError) {
      return {
        kind: 'sync-failed',
        title: 'Messages could not refresh',
        body: 'Check your connection and try again.',
        retryLabel: 'Retry',
        showMessages: messages.length > 0,
      };
    }
    if (loadingLatest && messages.length === 0) {
      return {
        kind: 'loading',
        title: 'Loading messages',
        body: channel.title,
        showMessages: false,
      };
    }
    if (messages.length === 0) {
      return {
        kind: 'empty',
        title: 'No messages yet',
        body: channel.title,
        showMessages: false,
      };
    }
    return { kind: 'ready', title: '', showMessages: true };
  }

  export function getSafeNativeChatQuotePreview({
    kind,
    body,
  }: {
    kind: NativeChatMessage['kind'];
    body: string;
    fullTxId?: string;
  }): string {
    if (kind === 'image') return '[Image]';
    const normalized = (body || '').trim() || 'Unsupported message';
    if (normalized.length <= MAX_QUOTE_PREVIEW_LENGTH) return normalized;
    return `${normalized.slice(0, MAX_QUOTE_PREVIEW_LENGTH - 3).trimEnd()}...`;
  }
  ```

- [ ] **Step 4: Wire helpers into the room page**

  Modify `src/chat-native/screens/NativeChatRoomPage.tsx`:

  - Import `ActivityIndicator`, `Keyboard`, `KeyboardAvoidingView`, `Platform` from `react-native`.
  - Import helpers from `../ui/chatRoomUi`.
  - Remove local `getServerMemberCount`, `getHeaderSubtitle`, `getComposerDisabledReason`, and `getQuoteContent` after equivalent helper usage is wired.
  - Add state:

    ```ts
    const [roomSyncError, setRoomSyncError] = useState<string | undefined>();
    const [olderLoadError, setOlderLoadError] = useState<string | undefined>();
    ```

  - Compute:

    ```ts
    const headerViewModel = getNativeChatRoomHeaderViewModel(channel);
    const composerDisabledReason = getNativeChatComposerDisabledReason({ channel, runtimeReady });
    const roomState = getNativeChatRoomState({
      channelId,
      channel,
      runtimeReady,
      messages,
      loadingLatest: Boolean(messageWindow?.loadingNewer),
      syncError: roomSyncError,
    });
    ```

  - Use `headerViewModel.title`, `headerViewModel.subtitle`, and `headerViewModel.avatar` in the header.
  - In `handleOpenMessageActions`, call `Keyboard.dismiss()` before `setSelectedMessage(row)`.
  - In `handleQuoteMessage`, use:

    ```ts
    content: getSafeNativeChatQuotePreview({
      kind: row.kind,
      body: row.body,
      fullTxId: row.fullTxId,
    }),
    ```

  - In focused sync, call `setRoomSyncError(undefined)` before sync and `setRoomSyncError('Messages could not refresh')` in the catch block.
  - Extract the focused sync body into a `retryFocusedChannelSync` callback so both `useFocusEffect` and the retry button call the same logic.
  - Add this local component above `NativeChatRoomPage`:

    ```tsx
    function RoomStatePanel({
      onBack,
      onRetry,
      state,
    }: {
      onBack: () => void;
      onRetry?: () => void;
      state: NativeChatRoomState;
    }) {
      return (
        <View style={styles.roomStatePanel}>
          {state.kind === 'loading' ? <ActivityIndicator color={nativeChatTheme.color.primary} /> : null}
          <Text style={styles.roomStateTitle}>{state.title}</Text>
          {state.body ? <Text style={styles.roomStateBody}>{state.body}</Text> : null}
          {state.retryLabel && onRetry ? (
            <Pressable accessibilityLabel={state.retryLabel} accessibilityRole="button" onPress={onRetry} style={styles.roomStateButton}>
              <Text style={styles.roomStateButtonText}>{state.retryLabel}</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityLabel="Back to chats" accessibilityRole="button" onPress={onBack} style={styles.roomStateButton}>
              <Text style={styles.roomStateButtonText}>Back to Chats</Text>
            </Pressable>
          )}
        </View>
      );
    }
    ```

  - Add styles `roomStatePanel`, `roomStateTitle`, `roomStateBody`, `roomStateButton`, and `roomStateButtonText` in the same file.
  - Render `RoomStatePanel` inside the message area when `roomState.showMessages` is false or `roomState.kind === 'sync-failed'`.

- [ ] **Step 5: Add failing screen tests, then make them pass**

  Extend `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx` with:

  ```ts
  it('shows a product state for an invalid room route', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'missing-room' } }} />);
    });
    expect(renderer.root.findByProps({ children: 'Chat not found' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Return to Chats and choose a conversation.' })).toBeTruthy();
  });

  it('shows missing private key as a room-safe disabled state', async () => {
    nativeChatStore.setState({
      channels: [
        {
          accountGlobalMetaId: 'self',
          id: 'private-missing-key',
          type: 'private',
          title: 'Private Peer',
          unreadCount: 0,
          lastReadIndex: 0,
          updatedAt: 100,
        },
      ],
      messagesByChannel: {
        'private-missing-key': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'private-missing-key',
            channelType: 'private',
            kind: 'text',
            content: 'readable history',
            contentType: 'text/plain',
            protocol: 'simplemsg',
            timestamp: 100,
            senderGlobalMetaId: 'peer',
            status: 'sent',
          },
        ],
      },
    });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'private-missing-key' } }} />);
    });
    expect(renderer.root.findByProps({ children: 'Missing peer chat public key' })).toBeTruthy();
  });
  ```

  Expected:

  - These tests fail before wiring and pass after wiring.

- [ ] **Step 6: Verify Task 1**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/ui/__tests__/chatRoomUi.test.ts src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task1-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task1-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No whitespace errors.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 7: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/ui/chatRoomUi.ts \
    src/chat-native/ui/__tests__/chatRoomUi.test.ts \
    src/chat-native/screens/NativeChatRoomPage.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  git commit -m "feat: productize native chat room states"
  ```

  Buzz summary:

  - "Added P1.2a room state/header/composer permission helpers and wired NativeChatRoomPage to show product states for missing, loading, empty, sync-failed, missing-key, and cannot-send rooms."

## Task 2: P1.2a Transcript Readability, Grouping, Long Text, And Raw Content Containment

**P1.2 slice:** P1.2a

**Requirements covered:** P1.2-R3, R4, R5, R6, R7, R9

**Files:**

- Modify: `src/chat-native/ui/chatUiSelectors.ts`
- Modify: `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- Modify: `src/chat-native/components/MessageList.tsx`
- Modify: `src/chat-native/components/__tests__/MessageList.test.tsx`
- Modify: `src/chat-native/components/MessageBubble.tsx`
- Modify: `src/chat-native/components/__tests__/MessageBubble.test.tsx`

- [ ] **Step 1: Add failing selector tests for grouping and safe room bodies**

  Extend `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`:

  ```ts
  import { getMessageRowViewModels, NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT } from '../chatUiSelectors';

  it('groups consecutive same-sender messages without hiding the first group sender label', () => {
    const rows = getMessageRowViewModels([
      message({ senderGlobalMetaId: 'peer', senderName: 'Nina', timestamp: 1000, index: 1 }),
      message({ senderGlobalMetaId: 'peer', senderName: 'Nina', timestamp: 1060, index: 2 }),
      message({ senderGlobalMetaId: 'self', senderName: 'You', timestamp: 1120, index: 3 }),
      message({ senderGlobalMetaId: 'self', senderName: 'You', timestamp: 1180, index: 4 }),
    ], 'self');

    expect(rows.map((row) => ({
      id: row.id,
      showSenderLabel: row.showSenderLabel,
      showAvatar: row.showAvatar,
      isGroupedWithPrevious: row.isGroupedWithPrevious,
    }))).toEqual([
      expect.objectContaining({ showSenderLabel: true, showAvatar: true, isGroupedWithPrevious: false }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: false, isGroupedWithPrevious: true }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: true, isGroupedWithPrevious: false }),
      expect.objectContaining({ showSenderLabel: false, showAvatar: false, isGroupedWithPrevious: true }),
    ]);
  });

  it('contains unsupported room body content without raw protocol or payload text', () => {
    const row = getMessageRowViewModel(
      message({
        content: '{"redpacket":"raw"}',
        contentType: 'application/json',
        protocol: '/protocols/redpacket',
      }),
      'self',
    );
    expect(row.body).toBe(NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT);
    expect(row.safeCopyText).toBe('');
  });

  it('does not copy raw ciphertext from decrypt failure message bodies', () => {
    const row = getMessageRowViewModel(
      message({ content: 'U2FsdGVkX19privatepayload' }),
      'self',
    );
    expect(row.body).toBe('Unable to decrypt this message');
    expect(row.safeCopyText).toBe('');
  });

  it('keeps long text as readable body content while bounding metadata separately', () => {
    const longText = `Line one ${'abc'.repeat(80)}\nLine two with emoji 🙂`;
    const row = getMessageRowViewModel(message({ content: longText }), 'self');
    expect(row.body).toBe(longText);
    expect(row.safeCopyText).toBe(longText);
  });
  ```

- [ ] **Step 2: Verify selector tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/ui/__tests__/chatUiSelectors.test.ts -t "groups consecutive|unsupported room body|raw ciphertext|long text"
  ```

  Expected:

  - Fails because `getMessageRowViewModels`, `showSenderLabel`, `showAvatar`, `isGroupedWithPrevious`, `safeCopyText`, and `NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT` are not implemented.

- [ ] **Step 3: Implement message row grouping and safe body fields**

  In `src/chat-native/ui/chatUiSelectors.ts`:

  - Add:

    ```ts
    export const NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT = 'Unsupported message';
    const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;
    const TEXT_CONTENT_TYPES = new Set(['', 'text/plain', 'text']);
    const TEXT_PROTOCOLS = new Set([
      '',
      'simplemsg',
      'simplegroupchat',
      '/protocols/simplemsg',
      '/protocols/simplegroupchat',
    ]);
    ```

  - Extend `MessageRowViewModel`:

    ```ts
    showSenderLabel: boolean;
    showAvatar: boolean;
    isGroupedWithPrevious: boolean;
    isUnsupported: boolean;
    safeCopyText: string;
    ```

  - Add helper functions:

    ```ts
    function normalizeProtocol(protocol: string | undefined): string {
      return (protocol || '').trim().toLowerCase();
    }

    function normalizeContentType(contentType: string | undefined): string {
      return (contentType || '').split(';')[0].trim().toLowerCase();
    }

    function isSupportedTextMessage(message: NativeChatMessage): boolean {
      return (
        message.kind === 'text' &&
        TEXT_CONTENT_TYPES.has(normalizeContentType(message.contentType)) &&
        TEXT_PROTOCOLS.has(normalizeProtocol(message.protocol))
      );
    }

    function isUnsupportedRoomMessage(message: NativeChatMessage): boolean {
      if (message.kind === 'image') return false;
      return !isSupportedTextMessage(message);
    }

    function isGroupedWithPrevious(message: NativeChatMessage, previous?: NativeChatMessage): boolean {
      if (!previous) return false;
      if ((message.senderGlobalMetaId || '') !== (previous.senderGlobalMetaId || '')) return false;
      const currentTime = normalizeNativeChatTimestamp(message.timestamp) || 0;
      const previousTime = normalizeNativeChatTimestamp(previous.timestamp) || 0;
      return Math.abs(currentTime - previousTime) <= MESSAGE_GROUP_WINDOW_MS;
    }
    ```

  - Update `getMessageRowViewModel` signature:

    ```ts
    export function getMessageRowViewModel(
      message: NativeChatMessage,
      accountGlobalMetaId: string,
      options: { previousMessage?: NativeChatMessage } = {},
    ): MessageRowViewModel
    ```

  - Compute:

    ```ts
    const groupedWithPrevious = isGroupedWithPrevious(message, options.previousMessage);
    const isUnsupported = isUnsupportedRoomMessage(message);
    const safeBody = isUnsupported
      ? NATIVE_CHAT_UNSUPPORTED_MESSAGE_TEXT
      : message.kind === 'image'
        ? message.content
        : getSafeSelectorText(message.content);
    const safeCopyText =
      !isUnsupported && message.kind === 'text' && safeBody !== NATIVE_CHAT_DECRYPT_FAILURE_TEXT
        ? safeBody
        : '';
    const showSenderLabel = !isSelf && message.channelType !== 'private' && !groupedWithPrevious;
    ```

  - Add `getMessageRowViewModels`:

    ```ts
    export function getMessageRowViewModels(
      messages: NativeChatMessage[],
      accountGlobalMetaId: string,
    ): MessageRowViewModel[] {
      return messages.map((message, index) =>
        getMessageRowViewModel(message, accountGlobalMetaId, { previousMessage: messages[index - 1] }),
      );
    }
    ```

- [ ] **Step 4: Update MessageList to compute rows once**

  In `src/chat-native/components/MessageList.tsx`:

  - Import `useMemo`.
  - Replace per-item `getMessageRowViewModel` calls with:

    ```ts
    const rows = useMemo(
      () => getMessageRowViewModels(messages, accountGlobalMetaId),
      [accountGlobalMetaId, messages],
    );
    ```

  - Change the `FlatList` data type from `NativeChatMessage[]` to `MessageRowViewModel[]`.
  - Use `keyExtractor={(row) => row.id}`.
  - Use this render function:

    ```tsx
    renderItem={({ item }) => (
      <MessageBubble
        onCopyTxId={onCopyTxId}
        onOpenActions={onOpenMessageActions}
        row={item}
      />
    )}
    ```
  - In `handleViewableItemsChanged`, read `viewableItem.item?.raw.index`.

- [ ] **Step 5: Update MessageBubble density rendering**

  In `src/chat-native/components/MessageBubble.tsx`:

  - Render the avatar only when `row.showAvatar` is true.
  - Render an avatar spacer with width `nativeChatTheme.size.messageAvatar` when `row.showAvatar` is false.
  - Render sender label only when `row.showSenderLabel` is true.
  - Add an unsupported body style:

    ```ts
    row.isUnsupported ? styles.unsupportedText : null
    ```

  - Add text containment styles:

    ```ts
    flexShrink: 1,
    maxWidth: '100%',
    ```

  - Use smaller `marginVertical` for grouped rows:

    ```ts
    row.isGroupedWithPrevious ? styles.groupedRow : null
    ```

- [ ] **Step 6: Add failing component tests, then make them pass**

  Extend `src/chat-native/components/__tests__/MessageBubble.test.tsx`:

  ```ts
  it('hides repeated sender label and reserves avatar space for grouped messages', () => {
    const row = messageRow({
      isSelf: false,
      senderName: 'Nina',
      showSenderLabel: false,
      showAvatar: false,
      isGroupedWithPrevious: true,
      isUnsupported: false,
      safeCopyText: 'hello',
    });
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });
    expect(renderer.root.findAllByProps({ children: 'Nina' })).toHaveLength(0);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Grouped message avatar spacer' })).toBeTruthy();
  });

  it('renders unsupported messages as product placeholders', () => {
    const row = messageRow({
      body: 'Unsupported message',
      isUnsupported: true,
      safeCopyText: '',
      showSenderLabel: true,
      showAvatar: true,
      isGroupedWithPrevious: false,
    });
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MessageBubble row={row} />);
    });
    expect(renderer.root.findByProps({ children: 'Unsupported message' })).toBeTruthy();
  });
  ```

  Extend `src/chat-native/components/__tests__/MessageList.test.tsx`:

  ```ts
  it('passes grouped row models to message bubbles', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          messages={[
            createMessage({ senderGlobalMetaId: 'peer', senderName: 'Nina', index: 1, timestamp: 100 }),
            createMessage({ senderGlobalMetaId: 'peer', senderName: 'Nina', index: 2, timestamp: 120 }),
          ]}
        />,
      );
    });
    expect(renderer.root.findAllByProps({ children: 'Nina' })).toHaveLength(1);
  });
  ```

- [ ] **Step 7: Verify Task 2**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/ui/__tests__/chatUiSelectors.test.ts \
    src/chat-native/components/__tests__/MessageList.test.tsx \
    src/chat-native/components/__tests__/MessageBubble.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task2-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task2-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 8: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/ui/chatUiSelectors.ts \
    src/chat-native/ui/__tests__/chatUiSelectors.test.ts \
    src/chat-native/components/MessageList.tsx \
    src/chat-native/components/__tests__/MessageList.test.tsx \
    src/chat-native/components/MessageBubble.tsx \
    src/chat-native/components/__tests__/MessageBubble.test.tsx
  git commit -m "feat: improve native room transcript readability"
  ```

  Buzz summary:

  - "Implemented P1.2a transcript grouping, safe unsupported-message placeholders, decrypt/ciphertext containment, long-text-safe row data, and grouped bubble rendering."

## Task 3: P1.2b Message Actions And Transaction Presentation

**P1.2 slice:** P1.2b

**Requirements covered:** P1.2-R10, R11, R12 quote entry prerequisites

**Files:**

- Modify: `src/chat-native/ui/chatUiFormatters.ts`
- Modify: `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
- Modify: `src/chat-native/ui/messageActions.ts`
- Modify: `src/chat-native/ui/__tests__/messageActions.test.ts`
- Modify: `src/chat-native/components/MessageActionSheet.tsx`
- Modify: `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
- Modify: `src/chat-native/components/MessageBubble.tsx`
- Modify: `src/chat-native/components/__tests__/MessageBubble.test.tsx`

- [ ] **Step 1: Add failing formatter and action tests**

  Extend `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`:

  ```ts
  import { getNativeChatTxExplorerUrl, isNativeChatTxExplorerSupported } from '../chatUiFormatters';

  it('hides explorer urls for unsupported chains while keeping copy txid possible', () => {
    expect(isNativeChatTxExplorerSupported('mvc')).toBe(true);
    expect(isNativeChatTxExplorerSupported('btc')).toBe(true);
    expect(isNativeChatTxExplorerSupported('doge')).toBe(true);
    expect(isNativeChatTxExplorerSupported('opcat')).toBe(false);
    expect(getNativeChatTxExplorerUrl('opcat', 'tx1')).toBeUndefined();
  });
  ```

  Extend `src/chat-native/ui/__tests__/messageActions.test.ts`:

  ```ts
  it('does not offer copy text for decrypt failures or unsupported messages', () => {
    expect(getNativeChatMessageActions(message({ content: 'U2FsdGVkX19privatepayload' })).map((item) => item.id)).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
    expect(getNativeChatMessageActions(message({
      content: '{"raw":true}',
      contentType: 'application/json',
      protocol: '/protocols/redpacket',
    })).map((item) => item.id)).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });

  it('hides open tx for unsupported chains but keeps copy txid', () => {
    expect(getNativeChatMessageActions(message({ chain: 'opcat', txId: 'opcat-tx' })).map((item) => item.id)).toEqual([
      'copy-text',
      'copy-txid',
      'quote',
    ]);
  });

  it('does not offer image actions when no renderable image uri exists', () => {
    expect(getNativeChatMessageActions(message({
      kind: 'image',
      attachmentUri: 'ipfs://not-renderable',
      contentType: 'image/png',
      protocol: 'simplefilegroupchat',
    })).map((item) => item.id)).toEqual([
      'copy-txid',
      'open-tx',
      'quote',
    ]);
  });
  ```

- [ ] **Step 2: Verify action tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/ui/__tests__/chatUiFormatters.test.ts src/chat-native/ui/__tests__/messageActions.test.ts
  ```

  Expected:

  - Fails because unknown chain still returns MVCScan, decrypt failures still expose Copy text, and image actions do not check URI renderability.

- [ ] **Step 3: Make tx explorer support explicit**

  In `src/chat-native/ui/chatUiFormatters.ts`:

  ```ts
  export function isNativeChatTxExplorerSupported(chain: NativeChatChain): boolean {
    const normalized = String(chain || 'mvc').toLowerCase();
    return normalized === 'mvc' || normalized === 'btc' || normalized === 'doge';
  }

  export function getNativeChatTxExplorerUrl(chain: NativeChatChain, txId: string): string | undefined {
    const normalized = String(chain || 'mvc').toLowerCase();
    if (normalized === 'btc') return `https://mempool.space/tx/${txId}`;
    if (normalized === 'doge') return `https://dogechain.info/tx/${txId}`;
    if (normalized === 'mvc') return `https://mvcscan.com/tx/${txId}`;
    return undefined;
  }
  ```

  Update existing tests that expected unknown/undefined to default to MVC:

  - `undefined` still returns MVCScan because `String(chain || 'mvc')` normalizes it.
  - explicit unknown strings return `undefined`.

- [ ] **Step 4: Gate message actions through row-safe data**

  Change `getNativeChatMessageActions` signature in `src/chat-native/ui/messageActions.ts`:

  ```ts
  import { resolveNativeChatMediaUri } from './nativeChatMedia';
  import {
    getMessageRowViewModel,
    type MessageRowViewModel,
  } from './chatUiSelectors';
  import { isNativeChatTxExplorerSupported } from './chatUiFormatters';

  export function getNativeChatMessageActions(
    rowOrMessage: MessageRowViewModel | NativeChatMessage,
    accountGlobalMetaId = '',
  ): NativeChatMessageAction[] {
    const row = 'raw' in rowOrMessage
      ? rowOrMessage
      : getMessageRowViewModel(rowOrMessage, accountGlobalMetaId || rowOrMessage.accountGlobalMetaId);
    const message = row.raw;
    const actions: NativeChatMessageAction[] = [];

    if (message.kind === 'text' && row.safeCopyText) {
      actions.push({ id: 'copy-text', label: 'Copy text' });
    }

    const imageUri = resolveNativeChatMediaUri(message.localPreviewUri || message.attachmentUri || message.content);
    if (message.kind === 'image' && imageUri) {
      actions.push({ id: 'view-image', label: 'View image' });
      actions.push({ id: 'save-image', label: 'Save image' });
    }

    if (row.fullTxId) {
      actions.push({ id: 'copy-txid', label: 'Copy txid' });
      if (isNativeChatTxExplorerSupported(message.chain)) {
        actions.push({ id: 'open-tx', label: 'Open tx' });
      }
    }

    actions.push({ id: 'quote', label: 'Quote' });
    return actions;
  }
  ```

  Keep backward compatibility for tests that still pass a message by building a row internally.

- [ ] **Step 5: Update the action sheet**

  In `src/chat-native/components/MessageActionSheet.tsx`:

  - Call `getNativeChatMessageActions(row)` instead of `row.raw`.
  - Copy `row.safeCopyText`, not `row.raw.content`.
  - For `open-tx`, guard:

    ```ts
    const txUrl = getNativeChatTxExplorerUrl(row.raw.chain, txId);
    if (txUrl) await Linking.openURL(txUrl);
    ```

  - Render action buttons before tx detail.
  - Rename tx block label from `Full txid` to `Transaction id`.
  - Keep full txid selectable in the secondary block only.
  - Preserve backdrop and close button close paths.

- [ ] **Step 6: Add action sheet tests**

  Extend `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`:

  ```ts
  it('copies safe message text instead of raw encrypted content', async () => {
    const onClose = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={onClose}
          row={messageRow({
            body: 'Unable to decrypt this message',
            safeCopyText: '',
            raw: {
              ...messageRow().raw,
              content: 'U2FsdGVkX19privatepayload',
            },
          })}
          visible
        />,
      );
    });
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy text' })).toHaveLength(0);
  });

  it('places transaction id as secondary detail after actions', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MessageActionSheet onClose={jest.fn()} row={messageRow()} visible />);
    });
    expect(renderer.root.findByProps({ children: 'Transaction id' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Copy txid' })).toBeTruthy();
  });

  it('does not render open tx for unsupported chains', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MessageActionSheet
          onClose={jest.fn()}
          row={messageRow({
            raw: { ...messageRow().raw, chain: 'opcat' },
          })}
          visible
        />,
      );
    });
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Open tx' })).toHaveLength(0);
  });
  ```

- [ ] **Step 7: Keep bubble tx presentation compact**

  In `src/chat-native/components/MessageBubble.tsx`:

  - Keep `row.txLabel` footer text.
  - Rename visible copy chip text from `Copy` to `Tx` only if tests confirm it is clearer and still accessible as `Copy txid`.
  - Do not render full txid in the bubble.
  - Ensure footer has `flexWrap: 'wrap'` and `maxWidth: '100%'`.

  Expected:

  - Visible bubble remains compact.
  - Full txid is available from Copy txid and secondary sheet detail.

- [ ] **Step 8: Verify Task 3**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/ui/__tests__/chatUiFormatters.test.ts \
    src/chat-native/ui/__tests__/messageActions.test.ts \
    src/chat-native/components/__tests__/MessageActionSheet.test.tsx \
    src/chat-native/components/__tests__/MessageBubble.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task3-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task3-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 9: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/ui/chatUiFormatters.ts \
    src/chat-native/ui/__tests__/chatUiFormatters.test.ts \
    src/chat-native/ui/messageActions.ts \
    src/chat-native/ui/__tests__/messageActions.test.ts \
    src/chat-native/components/MessageActionSheet.tsx \
    src/chat-native/components/__tests__/MessageActionSheet.test.tsx \
    src/chat-native/components/MessageBubble.tsx \
    src/chat-native/components/__tests__/MessageBubble.test.tsx
  git commit -m "feat: refine native room message actions"
  ```

  Buzz summary:

  - "Implemented P1.2b safe action availability, secondary txid presentation, safe text copy behavior, and supported-chain-only Open tx handling."

## Task 4: P1.2b Media Rendering And Quote Composer Presentation

**P1.2 slice:** P1.2b

**Requirements covered:** P1.2-R8, R12, R13 image/quote portions

**Files:**

- Modify: `src/chat-native/components/ImageMessage.tsx`
- Modify: `src/chat-native/components/__tests__/ImageMessage.test.tsx`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Modify: `src/chat-native/services/__tests__/nativeChatSendService.test.ts`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`

- [ ] **Step 1: Add failing composer tests for image preview privacy and quote bounds**

  Extend the `ChatComposer` describe block in `src/chat-native/services/__tests__/nativeChatSendService.test.ts`:

  ```ts
  it('does not show the full local image uri as primary preview copy', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        imagePreviewUri: 'file:///private/var/mobile/Containers/Data/image-secret.png',
        onPickImage: jest.fn(),
        onRemoveImage: jest.fn(),
        onSend: jest.fn(),
        onSendImage: jest.fn(),
      }));
    });
    expect(renderer.root.findByProps({ children: 'Image ready' })).toBeTruthy();
    expect(renderer.root.findAllByProps({
      children: 'file:///private/var/mobile/Containers/Data/image-secret.png',
    })).toHaveLength(0);
  });

  it('keeps image send disabled when composer is disabled', async () => {
    const onSendImage = jest.fn<() => void>();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        disabled: true,
        disabledReason: 'Missing peer chat public key',
        imagePreviewUri: 'file://preview.png',
        onPickImage: jest.fn(),
        onRemoveImage: jest.fn(),
        onSend: jest.fn(),
        onSendImage,
      }));
    });
    await act(async () => {
      await renderer.root.findByProps({ accessibilityLabel: 'Send selected image' }).props.onPress();
    });
    expect(onSendImage).not.toHaveBeenCalled();
  });
  ```

- [ ] **Step 2: Verify composer tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/services/__tests__/nativeChatSendService.test.ts -t "full local image uri|image send disabled"
  ```

  Expected:

  - First test fails because the full URI is currently rendered.
  - Second test should pass or remain passing; keep it as regression coverage.

- [ ] **Step 3: Hide local URI copy in ChatComposer**

  In `src/chat-native/components/ChatComposer.tsx`:

  - Replace:

    ```tsx
    <Text numberOfLines={1} style={styles.imagePreviewUri}>
      {imagePreviewUri}
    </Text>
    ```

  - With:

    ```tsx
    <Text numberOfLines={1} style={styles.imagePreviewSubtitle}>
      Ready to send
    </Text>
    ```

  - Rename `imagePreviewUri` style to `imagePreviewSubtitle`.

- [ ] **Step 4: Confirm image message loading/unavailable coverage**

  Extend `src/chat-native/components/__tests__/ImageMessage.test.tsx`:

  ```ts
  it('renders unavailable state inside the stable media frame when uri cannot resolve', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ImageMessage attachmentUri="ipfs://not-renderable" />);
    });
    expect(renderer.root.findByProps({ children: 'Image unavailable' })).toBeTruthy();
  });
  ```

  Expected:

  - Passes with current `ImageMessage`, proving P1.2 media placeholder behavior.

- [ ] **Step 5: Verify quote entry uses safe preview**

  Update the existing `MessageList` mock in `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx` so tests can trigger message actions:

  ```ts
  let mockMessageListProps: any;

  jest.mock('../../components/MessageList', () => {
    const React = require('react');
    const { Pressable, Text, View } = require('react-native');

    return {
      __esModule: true,
      default: (props: any) => {
        mockMessageListProps = props;
        return React.createElement(
          View,
          { accessibilityLabel: 'Messages' },
          React.createElement(
            Pressable,
            {
              accessibilityLabel: 'Open mocked image actions',
              onPress: () => props.onOpenMessageActions?.({
                id: 'image-row',
                isSelf: false,
                avatar: undefined,
                senderName: 'Nina',
                body: '',
                kind: 'image',
                timeLabel: '13:43',
                txLabel: 'MVC abcd...123',
                fullTxId: 'abcd1234fulltxid',
                statusLabel: '',
                showSenderLabel: true,
                showAvatar: true,
                isGroupedWithPrevious: false,
                isUnsupported: false,
                safeCopyText: '',
                raw: {
                  accountGlobalMetaId: 'self',
                  channelId: 'group-1',
                  channelType: 'group',
                  kind: 'image',
                  content: 'https://example.test/image.png',
                  attachmentUri: 'https://example.test/image.png',
                  contentType: 'image/png',
                  protocol: 'simplefilegroupchat',
                  timestamp: 1710000000,
                  senderGlobalMetaId: 'nina',
                  senderName: 'Nina',
                  txId: 'abcd1234fulltxid',
                  status: 'sent',
                },
              }),
            },
            React.createElement(Text, null, 'Open mocked image actions'),
          ),
        );
      },
    };
  });
  ```

  Add this test:

  ```ts
  it('quotes image messages as image placeholders without raw tx internals', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Open mocked image actions' }).props.onPress();
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Quote' }).props.onPress();
    });
    expect(renderer.root.findByProps({ children: 'Replying to Nina' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: '[Image]' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ children: 'abcd1234fulltxid' })).toHaveLength(0);
  });
  ```

- [ ] **Step 6: Verify Task 4**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/services/__tests__/nativeChatSendService.test.ts \
    src/chat-native/components/__tests__/ImageMessage.test.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task4-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task4-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 7: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/components/ImageMessage.tsx \
    src/chat-native/components/__tests__/ImageMessage.test.tsx \
    src/chat-native/components/ChatComposer.tsx \
    src/chat-native/services/__tests__/nativeChatSendService.test.ts \
    src/chat-native/screens/NativeChatRoomPage.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  git commit -m "feat: stabilize native room media and quote UI"
  ```

  Buzz summary:

  - "Completed P1.2b media and quote presentation: image previews no longer expose local URI copy, image unavailable/loading states stay bounded, and quote previews use safe text or [Image]."

## Task 5: P1.2c Keyboard-Safe Room Layout And Composer Stability

**P1.2 slice:** P1.2c

**Requirements covered:** P1.2-R13, R14, R18, R19

**Files:**

- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Modify: `src/chat-native/services/__tests__/nativeChatSendService.test.ts`

- [ ] **Step 1: Add failing keyboard-aware screen test**

  In `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`, import `KeyboardAvoidingView` and `Keyboard`.

  Add:

  ```ts
  it('wraps the transcript and composer in an iOS keyboard avoiding layout', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    const keyboardViews = renderer.root.findAllByType(KeyboardAvoidingView);
    expect(keyboardViews).toHaveLength(1);
    expect(keyboardViews[0].props.behavior).toBe('padding');
  });

  it('dismisses the keyboard before opening message actions', async () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Open mocked image actions' }).props.onPress();
    });
    expect(dismissSpy).toHaveBeenCalledTimes(1);
  });
  ```

- [ ] **Step 2: Verify tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx -t "keyboard avoiding|dismisses the keyboard"
  ```

  Expected:

  - Fails because `NativeChatRoomPage` does not currently render `KeyboardAvoidingView` or dismiss the keyboard before action sheet open.

- [ ] **Step 3: Implement keyboard-aware wrapper**

  In `src/chat-native/screens/NativeChatRoomPage.tsx`:

  - Import `KeyboardAvoidingView` and `Platform`.
  - Wrap the existing messages view and existing composer instance with `KeyboardAvoidingView`. The `MessageList` and `ChatComposer` props remain the same as before this task:

    ```tsx
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoidingArea}
    >
      <View style={styles.messages}>
        {roomState.showMessages ? (
          <MessageList
            accountGlobalMetaId={state.accountGlobalMetaId}
            hasMoreOlder={Boolean(messageWindow?.hasMoreOlder)}
            hasNewerMessages={Boolean(messageWindow?.hasMoreNewer)}
            isAtLatest={messageWindow?.isAtLatest ?? true}
            loadingOlder={Boolean(messageWindow?.loadingOlder)}
            messages={messages}
            onCopyTxId={handleCopyTxId}
            onLatestStateChange={handleLatestStateChange}
            onLoadOlder={handleLoadOlder}
            onOpenMessageActions={handleOpenMessageActions}
            onScrollToLatest={handleScrollToLatest}
            onVisibleMessageIndexChange={handleVisibleMessageIndexChange}
          />
        ) : (
          <RoomStatePanel onBack={handleBack} onRetry={roomState.retryLabel ? retryFocusedChannelSync : undefined} state={roomState} />
        )}
      </View>
      <ChatComposer
        disabled={composerDisabled}
        disabledReason={composerDisabledReason}
        imagePreviewUri={pendingImage?.localPreviewUri}
        mentionSuggestions={composerMentions}
        mentionsEnabled={channel?.type === 'group' || channel?.type === 'sub-group'}
        onClearQuote={() => setQuotedMessage(undefined)}
        onPickImage={handlePickImage}
        onRemoveImage={handleRemoveImage}
        onSend={handleSendText}
        onSendImage={handleSendImage}
        quote={quotedMessage}
      />
    </KeyboardAvoidingView>
    ```

  - Add:

    ```ts
    keyboardAvoidingArea: {
      flex: 1,
    },
    ```

  - Keep `MessageActionSheet` and `GroupInfoDrawer` outside the keyboard avoiding area so modals are not compressed by the keyboard.

- [ ] **Step 4: Keep composer controls stable**

  In `src/chat-native/components/ChatComposer.tsx`:

  - Ensure `styles.inputRow` has `gap` only if existing RN version handles it reliably. If not, keep current margin-based spacing.
  - Add `accessibilityLabel="Message input"` to the `TextInput`.
  - Keep `maxHeight: 96` and `minHeight: 36` on the input.
  - Keep disabled state blocking text, image, emoji, and send actions.

  Extend `nativeChatSendService.test.ts`:

  ```ts
  it('keeps disabled composer controls inert across text, emoji, image, and send actions', async () => {
    const onSend = jest.fn();
    const onPickImage = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ChatComposer, {
        disabled: true,
        disabledReason: 'Join this group before sending messages.',
        onPickImage,
        onSend,
      }));
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Insert emoji' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Pick image' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Send message' }).props.onPress();
    });
    expect(onPickImage).not.toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ children: 'Join this group before sending messages.' })).toBeTruthy();
  });
  ```

- [ ] **Step 5: Verify Task 5**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx \
    src/chat-native/services/__tests__/nativeChatSendService.test.ts
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task5-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task5-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 6: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/screens/NativeChatRoomPage.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx \
    src/chat-native/components/ChatComposer.tsx \
    src/chat-native/services/__tests__/nativeChatSendService.test.ts
  git commit -m "feat: stabilize native room keyboard layout"
  ```

  Buzz summary:

  - "Completed P1.2c keyboard/composer stability by adding keyboard-aware room layout, keyboard dismissal before action sheets, message input accessibility, and disabled composer control tests."

## Task 6: P1.2c Load Earlier, Latest Affordance, And Read-State Observation

**P1.2 slice:** P1.2c

**Requirements covered:** P1.2-R15, R16, R17, R20 room-cycle support

**Files:**

- Modify: `src/chat-native/components/MessageList.tsx`
- Modify: `src/chat-native/components/__tests__/MessageList.test.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`

- [ ] **Step 1: Add failing MessageList pagination tests**

  Extend `src/chat-native/components/__tests__/MessageList.test.tsx`:

  ```ts
  it('shows no-more and retryable older-message states without hiding the transcript', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder={false}
          olderLoadError="Could not load earlier messages."
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          onLoadOlder={jest.fn()}
        />,
      );
    });
    expect(renderer.root.findByProps({ children: 'Could not load earlier messages.' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Retry loading older messages' })).toBeTruthy();
  });

  it('keeps visible content position when older messages prepend', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MessageList
          accountGlobalMetaId="self"
          hasMoreOlder
          messages={[createMessage({ index: 1, txId: 'tx-1' })]}
          onLoadOlder={jest.fn()}
        />,
      );
    });
    const flatList = renderer.root.findByType(FlatList);
    expect(flatList.props.maintainVisibleContentPosition).toEqual({ minIndexForVisible: 0 });
  });
  ```

- [ ] **Step 2: Verify pagination tests fail**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/components/__tests__/MessageList.test.tsx -t "no-more|visible content"
  ```

  Expected:

  - Fails because `olderLoadError` prop and `maintainVisibleContentPosition` are not wired.

- [ ] **Step 3: Implement MessageList older/latest props**

  In `src/chat-native/components/MessageList.tsx`:

  - Add props:

    ```ts
    olderLoadError?: string;
    showNoMoreOlder?: boolean;
    ```

  - Pass `maintainVisibleContentPosition={{ minIndexForVisible: 0 }}` to `FlatList`.
  - Extend older header:

    ```tsx
    const olderHeader = olderLoadError ? (
      <View style={styles.olderError}>
        <Text style={styles.olderErrorText}>{olderLoadError}</Text>
        <Pressable
          accessibilityLabel="Retry loading older messages"
          accessibilityRole="button"
          disabled={!onLoadOlder}
          onPress={handleLoadOlder}
          style={[styles.olderButton, !onLoadOlder ? styles.disabledButton : undefined]}
        >
          <Text style={styles.olderButtonText}>Retry</Text>
        </Pressable>
      </View>
    ) : loadingOlder || hasMoreOlder ? (
      <View style={styles.olderHeader}>
        <Pressable
          accessibilityLabel="Load older messages"
          accessibilityRole="button"
          disabled={!canLoadOlder}
          onPress={handleLoadOlder}
          style={[styles.olderButton, !canLoadOlder ? styles.disabledButton : undefined]}
        >
          <Text style={styles.olderButtonText}>
            {loadingOlder ? 'Loading earlier messages...' : 'Load earlier messages'}
          </Text>
        </Pressable>
      </View>
    ) : showNoMoreOlder ? (
      <View style={styles.olderHeader}>
        <Text style={styles.noMoreText}>No earlier messages</Text>
      </View>
    ) : null;
    ```

  - Keep latest button at absolute bottom inside `MessageList`, and ensure it does not overlap composer because composer is outside the messages area.

- [ ] **Step 4: Wire older errors from room page**

  In `src/chat-native/screens/NativeChatRoomPage.tsx`:

  - In `handleLoadOlder`, call `setOlderLoadError(undefined)` before sync.
  - In catch, call `setOlderLoadError('Could not load earlier messages.')`.
  - Pass:

    ```tsx
    olderLoadError={olderLoadError}
    showNoMoreOlder={Boolean(messageWindow && messageWindow.hasMoreOlder === false && messages.length > 0)}
    ```

  - Keep `handleVisibleMessageIndexChange` unchanged except for test coverage; it must only mark read to visible indexed messages.

- [ ] **Step 5: Add screen tests for load-earlier failure and back fallback**

  Extend `NativeChatRoomPage.test.tsx`:

  ```ts
  it('shows retryable older-message failure without clearing messages', async () => {
    const sync = require('../../services/nativeChatSyncService');
    sync.syncOlderChannelMessages.mockRejectedValueOnce(new Error('network failed'));
    nativeChatStore.setState({
      messagesByChannel: {
        'group-1': [
          {
            accountGlobalMetaId: 'self',
            channelId: 'group-1',
            channelType: 'group',
            kind: 'text',
            content: 'existing message',
            contentType: 'text/plain',
            protocol: 'simplegroupchat',
            timestamp: 100,
            senderGlobalMetaId: 'owner-gm',
            status: 'sent',
            index: 1,
          },
        ],
      },
    });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      await mockMessageListProps.onLoadOlder();
    });
    expect(renderer.root.findByProps({ children: 'Could not load earlier messages.' })).toBeTruthy();
    expect(mockMessageListProps.messages).toHaveLength(1);
  });

  it('falls back to the chat list route when native back stack cannot go back', async () => {
    const navigation = require('@/base/NavigationService');
    navigation.canGoBack.mockReturnValue(false);
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<NativeChatRoomPage route={{ params: { channelId: 'group-1' } }} />);
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Back' }).props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('NativeChatHomePage');
  });
  ```

  Implement the load-earlier test with the existing mocked `syncOlderChannelMessages`.

- [ ] **Step 6: Verify Task 6**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/components/__tests__/MessageList.test.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task6-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task6-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 7: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/components/MessageList.tsx \
    src/chat-native/components/__tests__/MessageList.test.tsx \
    src/chat-native/screens/NativeChatRoomPage.tsx \
    src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  git commit -m "feat: stabilize native room pagination"
  ```

  Buzz summary:

  - "Completed P1.2c pagination/read-state work by adding retryable load-earlier errors, no-more older copy, scroll-position preservation, latest affordance coverage, and back navigation regression tests."

## Task 7: P1.2c Deterministic Mock Scenario For Final Evidence

**P1.2 slice:** P1.2c final evidence support

**Requirements covered:** Evidence prerequisites for private room, group room, long text, actions, tx, media, quote, keyboard, load earlier/latest, disabled composer

**Files:**

- Modify: `src/chat-native/dev/nativeChatUiMockScenario.ts`
- Modify: `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`

- [ ] **Step 1: Add failing mock coverage tests**

  Extend `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`:

  ```ts
  it('covers P1.2 room evidence states without live sends or secrets', () => {
    const channels = nativeChatUiMockChannels;
    const messages = nativeChatUiMockMessages;
    expect(channels.some((channel) => channel.type === 'private' && channel.publicKeyStr)).toBe(true);
    expect(channels.some((channel) => channel.type === 'private' && !channel.publicKeyStr)).toBe(true);
    expect(channels.some((channel) => channel.type === 'group')).toBe(true);
    expect(messages.some((message) => message.content.includes('long-message-evidence'))).toBe(true);
    expect(messages.some((message) => message.kind === 'image' && message.attachmentUri?.startsWith('https://'))).toBe(true);
    expect(messages.some((message) => message.kind === 'image' && message.attachmentUri?.startsWith('ipfs://'))).toBe(true);
    expect(messages.some((message) => message.txId && message.chain === 'mvc')).toBe(true);
    expect(messages.some((message) => message.contentType === 'application/json')).toBe(true);
    expect(messages.some((message) => message.status === 'failed')).toBe(true);
    expect(JSON.stringify({ channels, messages })).not.toMatch(/mnemonic|private key|seed phrase|shared secret/i);
  });
  ```

- [ ] **Step 2: Verify mock test fails**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts -t "P1.2 room evidence"
  ```

  Expected:

  - Fails because missing-key private, long text marker, unavailable image, and unsupported content are not all present.

- [ ] **Step 3: Extend UI mock scenario**

  In `src/chat-native/dev/nativeChatUiMockScenario.ts`:

  - Add private channel `ui-missing-key-peer` with no `publicKeyStr`, readable history, and `serverData: { canSend: false, disabledReason: 'Missing peer chat public key' }` only if needed for route evidence.
  - Add long group message:

    ```ts
    content: `long-message-evidence ${'abcdefghij'.repeat(24)}\nSecond line stays inside the bubble 🙂`,
    ```

  - Add unsupported JSON-like message:

    ```ts
    content: '{"protocol":"redpacket","amount":"hidden"}',
    contentType: 'application/json',
    protocol: '/protocols/redpacket',
    ```

  - Add unavailable image message:

    ```ts
    kind: 'image',
    attachmentUri: 'ipfs://not-renderable-p1-2',
    contentType: 'image/png',
    protocol: 'simplefilegroupchat',
    ```

  - Add `serverData` and `messageWindowsByChannel` support only if current seeding code can safely set window state. If not, set window state in final simulator through route actions and document it in the evidence README.

  Expected:

  - Mock scenario remains deterministic.
  - No secrets or live decrypted content are present.

- [ ] **Step 4: Verify Task 7**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-task7-tsc.log 2>&1; true
  grep 'src/chat-native' /tmp/idchat-p1-2-task7-tsc.log || true
  ```

  Expected:

  - Focused tests pass.
  - Full chat-native tests pass.
  - No `src/chat-native` TypeScript lines.

- [ ] **Step 5: Commit and buzz**

  Commit:

  ```bash
  git add src/chat-native/dev/nativeChatUiMockScenario.ts \
    src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts
  git commit -m "feat: add native room evidence fixtures"
  ```

  Buzz summary:

  - "Added deterministic P1.2 room evidence fixtures for private/group rooms, long text, transaction action, image available/unavailable, unsupported content, disabled composer, pending, and failed states."

## Task 8: Final Verification And Simulator Evidence

**P1.2 slice:** P1.2c final acceptance

**Requirements covered:** P1.2-R1 through R20 final evidence, acceptance evidence directory, redaction

**Files:**

- Create: `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/README.md`
- Create: `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/*`
- Create: required screenshots `01-private-room-text.png` through `13-back-to-chat-list.png`

- [ ] **Step 1: Create evidence directory**

  Run:

  ```bash
  mkdir -p docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs
  ```

- [ ] **Step 2: Capture command verification logs**

  Run:

  ```bash
  git status --short --branch | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/git-status-before-simulator.txt
  git log --oneline --decorate --max-count=12 | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/commit-under-test.txt
  yarn test:chat-native 2>&1 | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/yarn-test-chat-native.log
  npm exec tsc -- --noEmit --pretty false > docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/tsc-noemit.log 2>&1; true
  grep 'src/chat-native' docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/tsc-noemit.log \
    > docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/tsc-chat-native-filter.log || true
  git diff --check
  ```

  Expected:

  - `yarn-test-chat-native.log` shows 41 suites / 290 tests passing or the updated total if tests were added.
  - `git diff --check` exits 0.
  - `tsc-chat-native-filter.log` is empty.
  - `tsc-noemit.log` may contain existing non-chat-native errors.

- [ ] **Step 3: Start Metro for live evidence**

  Run:

  ```bash
  env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
    -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
    npx --no-install expo start --dev-client --host localhost --port 8081 --clear \
    > docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/metro.log 2>&1
  ```

  Keep this command running in a separate shell session. Do not send live messages.

- [ ] **Step 4: Boot and open simulator**

  Run:

  ```bash
  xcrun simctl list devices | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-devices.txt
  xcrun simctl bootstatus CF3620CF-4769-486E-847B-911C96172049 -b \
    | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-bootstatus.log
  xcrun simctl openurl CF3620CF-4769-486E-847B-911C96172049 \
    'com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' \
    | tee docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-openurl.log
  ```

  Expected:

  - Native dev client opens without red screen.
  - Metro log does not show fatal room runtime errors.

- [ ] **Step 5: Capture live private and group room screenshots**

  Manually navigate in the simulator:

  - Open one private room from the real Native chat list.
  - Capture `01-private-room-text.png`.
  - Return to the chat list.
  - Open one group room from the real Native chat list.
  - Capture `02-group-room-text.png`.
  - Capture `13-back-to-chat-list.png` after returning from a room to the list.

  Commands:

  ```bash
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot \
    docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/01-private-room-text.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot \
    docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/02-group-room-text.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot \
    docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/13-back-to-chat-list.png
  ```

  Redaction rule:

  - If any screenshot includes readable decrypted live message content, redact it before keeping it. Preserve layout, actions, headers, and state affordances.

- [ ] **Step 6: Capture deterministic fixture screenshots**

  Stop live Metro. Start mock evidence Metro:

  ```bash
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
    npx --no-install expo start --dev-client --host localhost --port 8081 --clear \
    >> docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/metro.log 2>&1
  ```

  Capture these states using the simulator:

  - `03-long-message-wrapping.png`
  - `04-message-actions-text.png`
  - `05-transaction-actions.png`
  - `06-image-message.png`
  - `07-image-unavailable-or-loading.png`
  - `08-quote-composer.png`
  - `09-keyboard-open-composer.png`
  - `10-load-earlier-state.png`
  - `11-latest-or-new-messages-affordance.png`
  - `12-disabled-composer-state.png`

  Use these commands for fixture screenshots:

  ```bash
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/03-long-message-wrapping.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/04-message-actions-text.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/05-transaction-actions.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/06-image-message.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/07-image-unavailable-or-loading.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/08-quote-composer.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/09-keyboard-open-composer.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/10-load-earlier-state.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/11-latest-or-new-messages-affordance.png
  xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/12-disabled-composer-state.png
  ```

  Append each screenshot command and result to:

  ```bash
  docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/logs/simctl-screenshot.log
  ```

  Expected:

  - Long text wraps inside the bubble.
  - Action sheet shows implemented actions only.
  - Transaction sheet shows action list before secondary txid detail.
  - Image state is either visible image content or bounded unavailable/loading frame.
  - Quote composer shows safe preview and clear button.
  - Keyboard-open screenshot keeps composer visible.
  - Load earlier/latest affordances do not cover composer.
  - Disabled composer shows product copy and inert controls.

- [ ] **Step 7: Write evidence README**

  Create `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/README.md` with:

  ```md
  # Native IDChat P1.2 Room Productization Evidence - 2026-06-15

  ## Result

  P1.2 simulator evidence: PASS.

  ## Commit Under Test

  - Branch: `codex/native-idchat-p1-2-room-productization`
  - Commit: recorded in `logs/commit-under-test.txt`

  ## Simulator

  - Simulator: iPhone 17
  - Runtime: iOS 26.5
  - UDID: `CF3620CF-4769-486E-847B-911C96172049`

  ## Verification

  - `yarn test:chat-native`: PASS, see `logs/yarn-test-chat-native.log`.
  - `git diff --check`: PASS.
  - `npm exec tsc -- --noEmit --pretty false`: existing non-chat-native errors remain, see `logs/tsc-noemit.log`.
  - `logs/tsc-chat-native-filter.log`: empty.

  ## Screenshot Index

  - `01-private-room-text.png` - live private room opened from the Native list.
  - `02-group-room-text.png` - live group room opened from the Native list.
  - `03-long-message-wrapping.png` - deterministic long text wrapping.
  - `04-message-actions-text.png` - text message action sheet.
  - `05-transaction-actions.png` - transaction action sheet and secondary txid detail.
  - `06-image-message.png` - renderable image message.
  - `07-image-unavailable-or-loading.png` - unavailable or loading image frame.
  - `08-quote-composer.png` - quote selected into composer.
  - `09-keyboard-open-composer.png` - keyboard-open composer remains visible.
  - `10-load-earlier-state.png` - load earlier state.
  - `11-latest-or-new-messages-affordance.png` - latest/new messages affordance.
  - `12-disabled-composer-state.png` - disabled composer product copy.
  - `13-back-to-chat-list.png` - room back navigation returns to list.

  ## Sensitive Data Handling

  - No live messages were sent.
  - No mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive live message content is included.
  - Live screenshots were redacted where needed while preserving layout evidence.
  - Deterministic fixture screenshots contain only non-sensitive mock text.

  ## Notes

  - Live evidence covers at least one private room and one group room.
  - Deterministic fixture evidence covers states unsafe or impractical to force with live data.
  ```

  Before saving, confirm `logs/commit-under-test.txt` contains the commit under test from `git log --oneline --decorate --max-count=12`.

- [ ] **Step 8: Final no-secret scan**

  Run:

  ```bash
  rg -n "mnemonic|private key|seed phrase|shared secret|QA wallet secret|U2Fsd|Unknown point format|TypeError|ReferenceError" \
    docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615 \
    src/chat-native
  ```

  Expected:

  - No evidence screenshot/log/readme text exposes secrets.
  - No normal UI strings include raw ciphertext or low-level crypto errors.
  - If source tests intentionally mention banned raw strings for containment tests, the match is acceptable only in tests and must not appear in evidence README or screenshots.

- [ ] **Step 9: Commit and buzz**

  Commit:

  ```bash
  git add docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615
  git commit -m "docs: capture native room p1.2 evidence"
  ```

  Buzz summary:

  - "Captured Native IDChat P1.2 final evidence: tests, TypeScript filtered check, simulator logs, private/group room screenshots, long text, actions, tx, media, quote, keyboard, pagination, disabled composer, and back-to-list acceptance."

## Final Review Gate

After Task 8, run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=16
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-final-tsc.log 2>&1; true
grep 'src/chat-native' /tmp/idchat-p1-2-final-tsc.log || true
```

Expected:

- Worktree is clean after the final evidence commit.
- Latest commits are small and map to Tasks 1 through 8.
- `yarn test:chat-native` passes.
- `git diff --check` passes.
- The final TypeScript grep prints no `src/chat-native` lines.
- Every commit has a Lisa Hahn development-journal buzz post.
- No push has been performed.

Then dispatch a final code-review subagent with:

- Base SHA: `0f0ae2df9123f9827c0f914fe289efa817724adb`
- Head SHA: `git rev-parse HEAD`
- Requirements: this plan plus `docs/superpowers/specs/2026-06-15-native-idchat-p1-2-room-productization-spec.md`

Critical/Important review issues must be fixed with additional small commits and Lisa Hahn buzz posts before claiming P1.2 complete.

## Requirement Coverage Map

- P1.2-R1 Room Entry States: Task 1, Task 8 screenshots/logs.
- P1.2-R2 Header Identity And Actions: Task 1, Task 8 private/group screenshots.
- P1.2-R3 Sender Orientation And Identity: Task 2, Task 8 private/group screenshots.
- P1.2-R4 Message Grouping And Transcript Density: Task 2, Task 8 long/group screenshots.
- P1.2-R5 Timestamp, Status, And Metadata Rules: Task 2, Task 3, Task 8 screenshots.
- P1.2-R6 Text And Long Message Rendering: Task 2, Task 8 `03-long-message-wrapping.png`.
- P1.2-R7 Decryption And Raw Content Containment: Task 2, Task 3, Task 8 no-secret scan.
- P1.2-R8 Image And Media Messages: Task 4, Task 7, Task 8 image screenshots.
- P1.2-R9 Unsupported Message Types: Task 2, Task 7, Task 8 screenshot or README note.
- P1.2-R10 Transaction Metadata: Task 3, Task 8 `05-transaction-actions.png`.
- P1.2-R11 Message Action Sheet: Task 3, Task 8 actions screenshots.
- P1.2-R12 Quote Flow: Task 1 quote helper, Task 4, Task 8 `08-quote-composer.png`.
- P1.2-R13 Composer Baseline Stability: Task 4, Task 5, Task 8 composer screenshots.
- P1.2-R14 Keyboard And Safe Area Behavior: Task 5, Task 8 `09-keyboard-open-composer.png`.
- P1.2-R15 Load Earlier Messages: Task 6, Task 8 `10-load-earlier-state.png`.
- P1.2-R16 New Messages And Latest Affordance: Task 6, Task 8 `11-latest-or-new-messages-affordance.png`.
- P1.2-R17 Read-State Observation: Task 6 existing plus added tests.
- P1.2-R18 Missing Private Key State: Task 1, Task 7, Task 8 `12-disabled-composer-state.png`.
- P1.2-R19 Permission And Cannot-Send States: Task 1, Task 5, Task 8 disabled composer evidence.
- P1.2-R20 Navigation Stability: Task 1/6 tests, Task 8 `13-back-to-chat-list.png`.

## Self-Review

- Spec coverage: Tasks 1 through 8 cover R1 through R20 and every required screenshot/log artifact.
- Scope control: no task implements red packets, full group management, P1.3 Me/account, Android, TestFlight, EAS, App Store, WebView fallback, protocol changes, or live sends.
- Test-first execution: every code task starts with failing focused tests, then implementation, then focused/full verification.
- TypeScript policy: every task records the known non-chat-native tsc failure pattern and requires an empty `src/chat-native` filter.
- Evidence policy: final evidence requires both live private/group opening and deterministic non-sensitive fixtures for unsafe states.
- Placeholder scan: no task contains unresolved implementation placeholders; screenshot names, commands, files, and expected results are concrete.
