# Native IDChat P1.1 Main Chat Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Native IDChat first screen release-credible by productizing conversation previews, avatars, unread badges, local search, remote discovery, Online Bot display, and P1.1 simulator evidence.

**Architecture:** Keep the existing P0.5/P0.6 native chat shell and dev-client flow. Add focused view-model, normalization, and component improvements around the chat list/discovery boundary, with tests at the selector/service/component level and final live simulator evidence. Do not touch room rendering, group info, Me/account, send flows, red packets, Android, TestFlight, EAS, or WebView fallback in this P1.1 plan.

**Tech Stack:** React Native 0.79.5, Expo SDK 53, Zustand store, Jest, TypeScript, iOS Simulator, `expo-image`.

---

## Current State

- Current branch: `main`, currently ahead of `origin/main` by the P1 audit commit.
- P1 audit commit: `457d893 docs: add native idchat p1 product audit spec`.
- Product spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-productization-spec.md`.
- Audit evidence: `docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`.
- Native list/search/discovery components already have P0.5 selectors and basic containment.
- Remaining P1.1 gaps from audit:
  - visible list rows are dominated by technical decrypt-failure text;
  - avatars can appear as pale blank circles while image hydration is unresolved;
  - unread count rendering is not Web-like for high counts;
  - remote discovery has no retained no-result state after an explicit search;
  - Online Bot can expose raw JSON-like profile text;
  - P1.1 does not yet have its own post-fix simulator evidence.

## Non-Negotiable Scope

- [ ] Do not implement P1.2 room work: message bubble grouping, keyboard/scroll behavior, media cards, transaction cards, quote behavior, or room header redesign.
- [ ] Do not implement P1.3 group/account work: group management, group info productization, member search polish, Me/settings restructuring, or account route changes.
- [ ] Do not implement red packet behavior.
- [ ] Do not implement Android, TestFlight, EAS, App Store signing, or release-channel automation.
- [ ] Do not restore or introduce a WebView fallback for normal chat usage.
- [ ] Do not print, screenshot, commit, or buzz mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message content.
- [ ] Preserve P0.5/P0.6 launch/build assumptions. If the dev-client flow regresses, stop and record the exact blocker.
- [ ] For every commit, stage only files changed for that task and post a Lisa Hahn development-journal buzz as required by `AGENTS.md`.

## File Map

Modify:

- `src/chat-native/services/nativeChatDisplaySafety.ts`
  - Add product-safe preview and profile-text helpers used by the list, discovery, and Online Bot surfaces.
- `src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts`
  - Cover ciphertext preview fallback, raw JSON-like profile text filtering, and bounded product text.
- `src/chat-native/ui/chatUiFormatters.ts`
  - Add unread badge formatting for Web-like `999+` caps.
- `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
  - Cover unread badge formatting.
- `src/chat-native/ui/chatUiSelectors.ts`
  - Use preview-specific fallback text and unread badge labels in conversation row view models.
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
  - Update preview expectations and add unread cap coverage.
- `src/chat-native/components/ConversationList.tsx`
  - Render formatted unread labels and retain explicit discovery empty/error states after remote search.
- `src/chat-native/components/__tests__/ConversationList.test.ts`
  - Cover formatted unread labels, retained discovery no-result state, and failure copy.
- `src/chat-native/screens/NativeChatHomePage.tsx`
  - Track the last submitted discovery query, pass it into `ConversationList`, and sanitize Online Bot errors.
- `src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts`
  - Extend product-error coverage if the new helper is exported.
- `src/chat-native/components/ChatAvatar.tsx`
  - Keep deterministic initials visible until an avatar image finishes loading, so rows never show blank pale circles.
- `src/chat-native/components/__tests__/ChatAvatar.test.tsx`
  - Cover fallback-before-load, load completion, load failure, and URI changes.
- `src/chat-native/services/chatNormalizers.ts`
  - Normalize channel avatar sources through the existing native avatar resolver.
- `src/chat-native/storage/__tests__/chatRepository.test.ts`
  - No planned change unless a normalizer assertion belongs there after implementation.
- `src/chat-native/services/__tests__/nativeChatProfileService.test.ts`
  - Add profile hydration regression coverage only if implementation touches profile hydration.
- `src/chat-native/services/nativeChatDiscoveryService.ts`
  - Normalize discovery/Online Bot avatars and filter raw JSON-like bot bio text.
- `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`
  - Cover JSON-string bio filtering, provider summaries, avatar normalization, and duplicate bot handling.
- `src/chat-native/components/OnlineBotPanel.tsx`
  - Productize subtitle display, header layout, and loading/empty/error copy.
- `src/chat-native/components/__tests__/OnlineBotPanel.test.tsx`
  - Cover no raw bio leakage, header actions, loading, empty, error, and open action.
- `docs/superpowers/qa/native-idchat-simulator-runbook.md`
  - Add a short P1.1 evidence checklist after implementation.

Create during final simulator acceptance:

- `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/README.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/logs/*`
- Redacted screenshots for list, local search, discovery result, discovery no-result or failure, Online Bot, and list after Chats -> Me -> Chats navigation.

## Task 0: Preflight And Branch Boundary

**Files:** none

- [ ] **Step 1: Read governing docs**

  Run:

  ```bash
  sed -n '1,220p' AGENTS.md
  sed -n '1,320p' docs/superpowers/specs/2026-06-15-native-idchat-p1-productization-spec.md
  sed -n '1,180p' docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/README.md
  ```

  Expected:

  - P1.1 scope is list/search/discovery/containment only.
  - Red packets, P1.2 room work, P1.3 group/account work, Android, TestFlight, EAS, and WebView fallback remain out of scope.

- [ ] **Step 2: Create an implementation branch or worktree**

  If this plan is executed from the main repo, create a branch from current `main`:

  ```bash
  git status --short --branch
  git switch -c codex/native-idchat-p1-1-main-chat-productization
  ```

  If the worktree is dirty or the user wants isolation, create a worktree instead:

  ```bash
  git worktree add /Users/tusm/.codex/worktrees/native-idchat-p1-1/IDChat-APP \
    -b codex/native-idchat-p1-1-main-chat-productization main
  cd /Users/tusm/.codex/worktrees/native-idchat-p1-1/IDChat-APP
  ```

  Expected:

  - Work starts from a branch containing commit `457d893`.
  - No unrelated dirty files are staged or reverted.

- [ ] **Step 3: Record baseline**

  Run:

  ```bash
  git log --oneline --decorate --max-count=12
  git status --short --branch
  yarn test:chat-native
  ```

  Expected:

  - `yarn test:chat-native` passes before edits.
  - If tests fail before edits, stop and record the exact failing suites before changing code.

## Task 1: Product-Safe Conversation Preview And Unread Labels

**Files:**

- Modify: `src/chat-native/services/nativeChatDisplaySafety.ts`
- Modify: `src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts`
- Modify: `src/chat-native/ui/chatUiFormatters.ts`
- Modify: `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
- Modify: `src/chat-native/ui/chatUiSelectors.ts`
- Modify: `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`

- [ ] **Step 1: Add failing display-safety tests**

  Append these tests to `src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts`:

  ```ts
  import {
    NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    getSafeNativeChatPreviewText,
    getSafeNativeChatProfileText,
  } from '../nativeChatDisplaySafety';

  it('uses product preview copy for encrypted list previews', () => {
    expect(getSafeNativeChatPreviewText('U2FsdGVkX19privatepayload')).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
    expect(getSafeNativeChatPreviewText('a'.repeat(96))).toBe(
      NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT,
    );
    expect(getSafeNativeChatPreviewText('hello preview')).toBe('hello preview');
  });

  it('filters raw profile JSON strings from product text', () => {
    expect(getSafeNativeChatProfileText(' {\"background\":\"raw prompt\"} ')).toBeUndefined();
    expect(getSafeNativeChatProfileText('[\"raw\"]')).toBeUndefined();
    expect(getSafeNativeChatProfileText('Helpful IDChat assistant')).toBe(
      'Helpful IDChat assistant',
    );
  });

  it('bounds long profile text without breaking short product copy', () => {
    expect(getSafeNativeChatProfileText('A'.repeat(120))).toBe(`${'A'.repeat(77)}...`);
    expect(getSafeNativeChatProfileText('Online now')).toBe('Online now');
  });
  ```

- [ ] **Step 2: Implement preview/profile helpers**

  Add this code to `src/chat-native/services/nativeChatDisplaySafety.ts` below the existing `NATIVE_CHAT_DECRYPT_FAILURE_TEXT` export:

  ```ts
  export const NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT = 'Message unavailable';
  const MAX_PRODUCT_PROFILE_TEXT_LENGTH = 80;
  const RAW_STRUCTURED_TEXT_RE = /^\s*(?:\{|\[)/;
  ```

  Add these exported functions below `getSafeNativeChatText`:

  ```ts
  export function getSafeNativeChatPreviewText(value?: string | null): string {
    return getSafeNativeChatText(value, NATIVE_CHAT_PREVIEW_UNAVAILABLE_TEXT);
  }

  export function getSafeNativeChatProfileText(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed || looksLikeNativeChatCiphertext(trimmed) || RAW_STRUCTURED_TEXT_RE.test(trimmed)) {
      return undefined;
    }

    return trimmed.length > MAX_PRODUCT_PROFILE_TEXT_LENGTH
      ? `${trimmed.slice(0, MAX_PRODUCT_PROFILE_TEXT_LENGTH - 3)}...`
      : trimmed;
  }
  ```

- [ ] **Step 3: Add failing unread formatter tests**

  In `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`, add:

  ```ts
  import { formatNativeChatUnreadCount } from '../chatUiFormatters';

  describe('formatNativeChatUnreadCount', () => {
    it('hides zero and invalid unread counts', () => {
      expect(formatNativeChatUnreadCount(0)).toBe('');
      expect(formatNativeChatUnreadCount(-1)).toBe('');
      expect(formatNativeChatUnreadCount(Number.NaN)).toBe('');
    });

    it('formats small unread counts directly and caps large counts', () => {
      expect(formatNativeChatUnreadCount(1)).toBe('1');
      expect(formatNativeChatUnreadCount(16)).toBe('16');
      expect(formatNativeChatUnreadCount(999)).toBe('999');
      expect(formatNativeChatUnreadCount(1000)).toBe('999+');
    });
  });
  ```

- [ ] **Step 4: Implement unread formatter**

  Add this function to `src/chat-native/ui/chatUiFormatters.ts`:

  ```ts
  export function formatNativeChatUnreadCount(count: number | undefined): string {
    const normalized = Number(count || 0);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return '';
    }

    return normalized > 999 ? '999+' : String(Math.floor(normalized));
  }
  ```

- [ ] **Step 5: Wire preview and unread labels into selectors**

  In `src/chat-native/ui/chatUiSelectors.ts`, import the new helper and formatter:

  ```ts
  import {
    NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
    getSafeNativeChatPreviewText,
    getSafeNativeChatText,
    looksLikeNativeChatCiphertext,
  } from '../services/nativeChatDisplaySafety';
  import {
    formatNativeChatClockTime,
    formatNativeChatUnreadCount,
    getNativeChatChainLabel,
    normalizeNativeChatTimestamp,
    shortenNativeChatTxId,
  } from './chatUiFormatters';
  ```

  Extend `ConversationRowViewModel`:

  ```ts
  unreadLabel: string;
  ```

  Replace `getSafeSelectorText` with:

  ```ts
  function getSafeMessageBodyText(content: string): string {
    return getSafeNativeChatText(
      content,
      looksLikeNativeChatCiphertext(content) ? NATIVE_CHAT_DECRYPT_FAILURE_TEXT : '',
    );
  }

  function getSafePreviewText(content: string): string {
    return getSafeNativeChatPreviewText(content);
  }
  ```

  Update `getNativeChatPreviewContent`:

  ```ts
  export function getNativeChatPreviewContent(channel: NativeChatChannel): string {
    const lastMessage = channel.lastMessage;
    if (!lastMessage) return '';
    const content =
      lastMessage.kind === 'image'
        ? '[Image]'
        : getSafePreviewText(lastMessage.content || '');
    if (channel.type === 'group' && lastMessage.senderName) {
      return `${lastMessage.senderName}: ${content}`;
    }
    return content;
  }
  ```

  Update `getConversationRowViewModel`:

  ```ts
  const unreadCount = Math.max(0, channel.unreadCount || 0);
  return {
    id: channel.id,
    title: channel.title,
    avatar: channel.avatar,
    typeLabel: channel.type === 'private' ? 'P' : 'G',
    preview: getNativeChatPreviewContent(channel),
    timeLabel: formatNativeChatClockTime(getConversationActivityTimestamp(channel)),
    unreadCount,
    unreadLabel: formatNativeChatUnreadCount(unreadCount),
    mentionCount: getMentionCount(channel),
    updatedAt: getConversationActivityTimestamp(channel),
    raw: channel,
  };
  ```

  Update `getMessageRowViewModel` to use `getSafeMessageBodyText`:

  ```ts
  body: message.kind === 'image' ? message.content : getSafeMessageBodyText(message.content),
  ```

- [ ] **Step 6: Wire unread labels into `ConversationList`**

  In `src/chat-native/components/ConversationList.tsx`, add `unreadLabel` to `ConversationRowProps`, pass it from `renderConversationRow`, and render it:

  ```tsx
  unreadLabel: string;
  ```

  ```tsx
  {unreadLabel ? <ChatBadge label={unreadLabel} /> : null}
  ```

  ```tsx
  unreadLabel={row.unreadLabel}
  ```

- [ ] **Step 7: Update selector/component tests**

  In `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`, change private ciphertext preview expectation:

  ```ts
  expect(row.preview).toBe('Message unavailable');
  ```

  Change group ciphertext preview expectation:

  ```ts
  expect(row.preview).toBe('Nina: Message unavailable');
  ```

  Add unread label coverage:

  ```ts
  it('caps high unread badge labels for conversation rows', () => {
    const row = getConversationRowViewModel(
      channel({
        unreadCount: 1250,
        lastMessage: {
          content: 'hello',
          kind: 'text',
          timestamp: 1710000000,
        },
      }),
    );

    expect(row.unreadCount).toBe(1250);
    expect(row.unreadLabel).toBe('999+');
  });
  ```

  In `src/chat-native/components/__tests__/ConversationList.test.ts`, add:

  ```tsx
  it('renders capped unread badges from row view models', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [
        {
          ...createChannel({
            content: 'latest',
            kind: 'text',
            timestamp: 1,
          }),
          id: 'busy-channel',
          unreadCount: 1001,
        },
      ],
      onOpenChannel: jest.fn(),
    });

    expect(renderer.root.findAll((node) => node.props.children === '999+').length).toBeGreaterThan(0);
  });
  ```

- [ ] **Step 8: Run focused tests**

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath \
    src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts \
    src/chat-native/ui/__tests__/chatUiFormatters.test.ts \
    src/chat-native/ui/__tests__/chatUiSelectors.test.ts \
    src/chat-native/components/__tests__/ConversationList.test.ts
  ```

  Expected: all listed suites pass.

- [ ] **Step 9: Commit Task 1**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/services/nativeChatDisplaySafety.ts \
    src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts \
    src/chat-native/ui/chatUiFormatters.ts \
    src/chat-native/ui/__tests__/chatUiFormatters.test.ts \
    src/chat-native/ui/chatUiSelectors.ts \
    src/chat-native/ui/__tests__/chatUiSelectors.test.ts \
    src/chat-native/components/ConversationList.tsx \
    src/chat-native/components/__tests__/ConversationList.test.ts
  git commit -m "fix: productize native chat list previews"
  ```

- [ ] **Step 10: Post Lisa Hahn buzz**

  Post a development-journal buzz saying this commit productizes list preview fallback copy and unread badge labels, with no room/group/account scope.

## Task 2: Remove Blank Avatar States From List And Discovery

**Files:**

- Modify: `src/chat-native/components/ChatAvatar.tsx`
- Modify: `src/chat-native/components/__tests__/ChatAvatar.test.tsx`
- Modify: `src/chat-native/services/chatNormalizers.ts`
- Modify: `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`
- Modify: `src/chat-native/services/nativeChatDiscoveryService.ts`

- [ ] **Step 1: Add failing avatar component tests**

  In `src/chat-native/components/__tests__/ChatAvatar.test.tsx`, add:

  ```tsx
  it('keeps initials visible while a remote image is loading', () => {
    const renderer = renderAvatar({
      name: 'Loading User',
      uri: 'https://example.test/loading.png',
    });

    expect(findInitials(renderer, 'LU')).toHaveLength(1);
    expect(renderer.root.findAllByType(Image)).toHaveLength(1);
  });

  it('hides initials after a remote image loads', () => {
    const renderer = renderAvatar({
      name: 'Loaded User',
      uri: 'https://example.test/loaded.png',
    });

    act(() => {
      renderer.root.findByType(Image).props.onLoad();
    });

    expect(findInitials(renderer, 'LU')).toHaveLength(0);
    expect(renderer.root.findAllByType(Image)).toHaveLength(1);
  });
  ```

- [ ] **Step 2: Implement avatar fallback-under-image rendering**

  Replace the image branch in `src/chat-native/components/ChatAvatar.tsx` with a single container that always has the deterministic fallback available:

  ```tsx
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const [loadedUri, setLoadedUri] = useState<string | undefined>();
  const shouldRenderImage = Boolean(resolvedUri && failedUri !== resolvedUri);
  const shouldShowInitials = !shouldRenderImage || loadedUri !== resolvedUri;
  ```

  Reset both URI states in the existing effect:

  ```tsx
  useEffect(() => {
    setFailedUri(undefined);
    setLoadedUri(undefined);
  }, [resolvedUri, uri]);
  ```

  Replace the component return with:

  ```tsx
  return (
    <View
      accessible
      accessibilityLabel={`${name || 'User'} avatar`}
      style={[styles.fallback, { borderRadius, height: size, width: size }]}
    >
      {shouldShowInitials ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.initials, { fontSize: size <= 32 ? 11 : 14 }]}
        >
          {initialsForName(name)}
        </Text>
      ) : null}
      {shouldRenderImage && resolvedUri ? (
        <Image
          accessibilityElementsHidden
          cachePolicy="memory-disk"
          contentFit="cover"
          importantForAccessibility="no"
          onError={() => setFailedUri(resolvedUri)}
          onLoad={() => setLoadedUri(resolvedUri)}
          recyclingKey={resolvedUri || name || 'fallback'}
          source={{ uri: resolvedUri }}
          style={[
            StyleSheet.absoluteFillObject,
            styles.avatar,
            { borderRadius },
          ]}
        />
      ) : null}
    </View>
  );
  ```

- [ ] **Step 3: Normalize channel/discovery avatars**

  In `src/chat-native/services/chatNormalizers.ts`, import the avatar resolver:

  ```ts
  import { resolveNativeChatAvatarSource } from '../ui/avatarSource';
  ```

  Replace the channel avatar assignment in `normalizeLatestChatInfoItem` with:

  ```ts
  avatar: resolveNativeChatAvatarSource(
    source.avatar,
    source.avatarImage,
    userInfo.avatar,
    userInfo.avatarImage,
    source.icon,
  ),
  ```

  In `src/chat-native/services/nativeChatDiscoveryService.ts`, import:

  ```ts
  import { resolveNativeChatAvatarSource } from '../ui/avatarSource';
  ```

  Replace discovery, bot, and created-channel avatar assignments:

  ```ts
  avatar: resolveNativeChatAvatarSource(record.avatar, record.avatarImage, record.groupAvatar),
  ```

  ```ts
  avatar: resolveNativeChatAvatarSource(userInfo.avatar, userInfo.avatarImage),
  ```

  ```ts
  const avatar = resolveNativeChatAvatarSource(source.avatar, source.avatarImage, source.nftAvatar);
  ```

  ```ts
  avatar: resolveNativeChatAvatarSource(profile.avatar, profile.avatarImage),
  ```

- [ ] **Step 4: Add avatar normalization tests**

  In `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`, add a pin id constant at the top:

  ```ts
  const PIN_ID = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefi0';
  const PIN_AVATAR =
    `https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/${PIN_ID}` +
    '?x-oss-process=image/auto-orient,1/quality,q_80/resize,m_lfit,w_128';
  ```

  Add this test:

  ```ts
  it('normalizes discovery and online bot avatar sources before rendering', async () => {
    const searchClient = {
      searchGroupsAndUsers: jest.fn().mockResolvedValue({
        list: [
          {
            type: 'user',
            globalMetaId: 'peer-gm',
            name: 'Avatar Peer',
            avatar: `metafile://${PIN_ID}`,
          },
        ],
      }),
    };
    await expect(searchNativeChatDiscovery({ apiClient: searchClient, query: 'avatar' }))
      .resolves.toEqual([
        expect.objectContaining({
          avatar: PIN_AVATAR,
        }),
      ]);

    const onlineClient = {
      getOnlineUsers: jest.fn().mockResolvedValue({
        list: [
          {
            globalMetaId: 'bot-gm',
            userInfo: {
              name: 'Avatar Bot',
              avatar: `/content/${PIN_ID}`,
              chatPublicKey: 'bot-chat-key',
            },
          },
        ],
      }),
    };
    await expect(loadNativeChatOnlineBots({ apiClient: onlineClient }))
      .resolves.toEqual(expect.objectContaining({
        bots: [
          expect.objectContaining({
            avatar: PIN_AVATAR,
          }),
        ],
      }));
  });
  ```

- [ ] **Step 5: Run focused tests**

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath \
    src/chat-native/components/__tests__/ChatAvatar.test.tsx \
    src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts
  ```

  Expected: both suites pass.

- [ ] **Step 6: Commit Task 2**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/components/ChatAvatar.tsx \
    src/chat-native/components/__tests__/ChatAvatar.test.tsx \
    src/chat-native/services/chatNormalizers.ts \
    src/chat-native/services/nativeChatDiscoveryService.ts \
    src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts
  git commit -m "fix: stabilize native chat avatar fallbacks"
  ```

- [ ] **Step 7: Post Lisa Hahn buzz**

  Post a development-journal buzz saying this commit prevents blank avatar states and normalizes discovery/list avatar sources for P1.1.

## Task 3: Retain Explicit Remote Discovery States

**Files:**

- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`

- [ ] **Step 1: Add failing `ConversationList` tests for submitted remote search**

  Add these tests to `src/chat-native/components/__tests__/ConversationList.test.ts`:

  ```tsx
  it('keeps a remote discovery no-result state after explicit search', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      discoveryQuery: 'missing',
      discoveryResults: [],
      onOpenChannel: jest.fn(),
      onSearchRemote: jest.fn(),
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('missing');
    });

    expect(renderer.root.findAll((node) => node.props.children === 'Discovery')).toHaveLength(1);
    expect(renderer.root.findAll((node) => node.props.children === 'No remote results')).toHaveLength(1);
    expect(renderer.root.findAll((node) => node.props.children === 'No matching chats')).toHaveLength(0);
  });

  it('keeps remote discovery failure visible after explicit search', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [],
      discoveryError: 'Search failed. Try again.',
      discoveryQuery: 'broken',
      discoveryResults: [],
      onOpenChannel: jest.fn(),
      onSearchRemote: jest.fn(),
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Search chats' }).props.onChangeText('broken');
    });

    expect(renderer.root.findAll((node) => node.props.children === 'Search failed. Try again.')).toHaveLength(1);
    expect(renderer.root.findAll((node) => node.props.children === 'No matching chats')).toHaveLength(0);
  });
  ```

- [ ] **Step 2: Add `discoveryQuery` prop and no-result state**

  In `src/chat-native/components/ConversationList.tsx`, add to `ConversationListProps`:

  ```ts
  discoveryQuery?: string | null;
  ```

  Add it to function props:

  ```ts
  discoveryQuery,
  ```

  Add this state calculation:

  ```ts
  const normalizedDiscoveryQuery = String(discoveryQuery || '').trim();
  const hasSubmittedDiscovery = Boolean(
    normalizedDiscoveryQuery &&
    normalizedDiscoveryQuery.toLowerCase() === normalizedSearchQuery.toLowerCase(),
  );
  const shouldShowDiscovery = Boolean(
    normalizedSearchQuery &&
    (discoveryLoading || discoveryError || discoveryResults.length > 0 || hasSubmittedDiscovery),
  );
  const shouldShowDiscoveryEmpty = Boolean(
    hasSubmittedDiscovery &&
    !discoveryLoading &&
    !discoveryError &&
    discoveryResults.length === 0,
  );
  ```

  In the discovery section, add:

  ```tsx
  {shouldShowDiscoveryEmpty ? <Text style={styles.discoveryStatus}>No remote results</Text> : null}
  ```

- [ ] **Step 3: Track last submitted discovery query in Home**

  In `src/chat-native/screens/NativeChatHomePage.tsx`, add state:

  ```ts
  const [discoveryQuery, setDiscoveryQuery] = useState<string | null>(null);
  ```

  In `searchRemoteDiscovery`, after the blank-query guard and before setting loading, add:

  ```ts
  setDiscoveryQuery(normalizedQuery);
  ```

  In the blank-query branch and in `clearRemoteDiscovery`, add:

  ```ts
  setDiscoveryQuery(null);
  ```

  Pass the prop into `ConversationList`:

  ```tsx
  discoveryQuery={discoveryQuery}
  ```

- [ ] **Step 4: Run focused tests**

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/ConversationList.test.ts
  ```

  Expected: `ConversationList` tests pass.

- [ ] **Step 5: Commit Task 3**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/components/ConversationList.tsx \
    src/chat-native/components/__tests__/ConversationList.test.ts \
    src/chat-native/screens/NativeChatHomePage.tsx
  git commit -m "fix: retain native chat discovery states"
  ```

- [ ] **Step 6: Post Lisa Hahn buzz**

  Post a development-journal buzz saying this commit keeps explicit discovery loading/result/empty/failure states visible after remote search.

## Task 4: Productize Online Bot Text And Panel Layout

**Files:**

- Modify: `src/chat-native/services/nativeChatDiscoveryService.ts`
- Modify: `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`
- Modify: `src/chat-native/components/OnlineBotPanel.tsx`
- Modify: `src/chat-native/components/__tests__/OnlineBotPanel.test.tsx`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`

- [ ] **Step 1: Add failing Online Bot normalization test**

  In `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`, add:

  ```ts
  it('does not expose raw JSON-like online bot bio strings', async () => {
    const apiClient = {
      getOnlineUsers: jest.fn().mockResolvedValue({
        list: [
          {
            globalMetaId: 'raw-bot-gm',
            lastSeenAgoSeconds: 3,
            deviceCount: 1,
            userInfo: {
              name: 'Raw Bio Bot',
              chatPublicKey: 'bot-chat-key',
              bio: '{\"background\":\"prompt text should not render\"}',
            },
          },
          {
            globalMetaId: 'provider-bot-gm',
            lastSeenAgoSeconds: 5,
            deviceCount: 2,
            userInfo: {
              name: 'Provider Bot',
              chatPublicKey: 'provider-chat-key',
              bio: { primaryProvider: 'gpt-4.1' },
            },
          },
        ],
      }),
    };

    await expect(loadNativeChatOnlineBots({ apiClient })).resolves.toEqual(expect.objectContaining({
      bots: [
        expect.objectContaining({
          name: 'Raw Bio Bot',
          bio: undefined,
        }),
        expect.objectContaining({
          name: 'Provider Bot',
          bio: 'LLM:gpt-4.1',
        }),
      ],
    }));
  });
  ```

- [ ] **Step 2: Sanitize Online Bot bio strings**

  In `src/chat-native/services/nativeChatDiscoveryService.ts`, update imports from display safety:

  ```ts
  import { getSafeNativeChatProfileText } from './nativeChatDisplaySafety';
  ```

  Replace `normalizeBio`:

  ```ts
  function normalizeBio(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      const safeText = getSafeNativeChatProfileText(value);
      if (safeText) {
        return safeText;
      }

      try {
        return normalizeBio(JSON.parse(value));
      } catch {
        return undefined;
      }
    }

    const record = asObject(value);
    const provider = firstString(record.primaryProvider, record.fallbackProvider, record.LLM, record.llm);
    if (provider) {
      return `LLM:${provider}`;
    }

    return getSafeNativeChatProfileText(
      firstString(record.summary, record.description, record.title),
    );
  }
  ```

- [ ] **Step 3: Add failing panel tests**

  In `src/chat-native/components/__tests__/OnlineBotPanel.test.tsx`, change the fixture `bio` to product text:

  ```ts
  bio: 'LLM:gpt',
  ```

  Add:

  ```tsx
  it('does not render raw JSON-like bot subtitles', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <OnlineBotPanel
          bots={[{ ...bot, bio: undefined }]}
          loading={false}
          onClose={jest.fn()}
          onOpenBot={jest.fn()}
          onRefresh={jest.fn()}
          visible
        />,
      );
    });

    expect(
      renderer.root.findAll((node) =>
        typeof node.props.children === 'string' && node.props.children.includes('{\"background\"}'),
      ),
    ).toHaveLength(0);
    expect(
      renderer.root.findAll((node) =>
        typeof node.props.children === 'string' && node.props.children.includes('Seen 7s ago · 2 devices'),
      ).length,
    ).toBeGreaterThan(0);
  });
  ```

- [ ] **Step 4: Tighten `OnlineBotPanel` layout and copy**

  In `src/chat-native/components/OnlineBotPanel.tsx`, update `getBotSubtitle`:

  ```ts
  function getBotSubtitle(bot: NativeChatOnlineBot): string {
    const onlineAgo = bot.lastSeenAgoSeconds > 0 ? `Seen ${bot.lastSeenAgoSeconds}s ago` : 'Online now';
    const devices = bot.deviceCount > 0 ? `${bot.deviceCount} device${bot.deviceCount === 1 ? '' : 's'}` : '';
    return [bot.bio, onlineAgo, devices].filter(Boolean).join(' · ');
  }
  ```

  Update header styles:

  ```ts
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 16,
  },
  headerTitle: {
    color: nativeChatTheme.color.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: nativeChatTheme.color.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '82%',
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  ```

  If `getBotSubtitle` already matches the target, only change styles and tests.

- [ ] **Step 5: Use product-safe Online Bot error copy**

  In `src/chat-native/screens/NativeChatHomePage.tsx`, replace:

  ```ts
  setOnlineBotsError(error instanceof Error ? error.message : 'Failed to load online bots');
  ```

  with:

  ```ts
  setOnlineBotsError(getNativeChatHomeProductError(error, 'Unable to load online bots. Try again.'));
  ```

- [ ] **Step 6: Run focused tests**

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath \
    src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts \
    src/chat-native/components/__tests__/OnlineBotPanel.test.tsx
  ```

  Expected: both suites pass.

- [ ] **Step 7: Commit Task 4**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/services/nativeChatDiscoveryService.ts \
    src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts \
    src/chat-native/components/OnlineBotPanel.tsx \
    src/chat-native/components/__tests__/OnlineBotPanel.test.tsx \
    src/chat-native/screens/NativeChatHomePage.tsx
  git commit -m "fix: productize native online bots"
  ```

- [ ] **Step 8: Post Lisa Hahn buzz**

  Post a development-journal buzz saying this commit removes raw Online Bot profile text from product UI and improves the Online Bot sheet layout/copy.

## Task 5: Full P1.1 Test And Type Verification

**Files:** none unless test failures reveal a scoped P1.1 bug

- [ ] **Step 1: Run all native chat tests**

  Run:

  ```bash
  yarn test:chat-native
  ```

  Expected: all `src/chat-native` suites pass.

- [ ] **Step 2: Run TypeScript check**

  Run:

  ```bash
  npm exec tsc -- --noEmit --pretty false
  ```

  Expected:

  - PASS, or
  - FAIL only in pre-existing non-`src/chat-native` files. If it fails, save the log and confirm there are no `src/chat-native` errors:

  ```bash
  npm exec tsc -- --noEmit --pretty false 2>&1 | tee /tmp/native-idchat-p1-1-tsc.log
  rg -n "src/chat-native" /tmp/native-idchat-p1-1-tsc.log || true
  ```

- [ ] **Step 3: Run diff checks**

  Run:

  ```bash
  git diff --check
  git status --short
  ```

  Expected:

  - `git diff --check` exits 0.
  - `git status --short` contains only scoped P1.1 changes if earlier tasks were not committed, or is clean if every task has been committed.

## Task 6: P1.1 Simulator Evidence

**Files:**

- Create: `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/README.md`
- Create: `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/logs/*`
- Create: redacted screenshots in the same evidence folder
- Modify: `docs/superpowers/qa/native-idchat-simulator-runbook.md`

- [ ] **Step 1: Create evidence directory**

  Run:

  ```bash
  export P11_EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615"
  mkdir -p "$P11_EVIDENCE_DIR/logs"
  git status --short --branch | tee "$P11_EVIDENCE_DIR/logs/git-status-before-simulator.txt"
  git log --oneline --decorate --max-count=12 | tee "$P11_EVIDENCE_DIR/logs/commit-under-test.txt"
  xcrun simctl list devices available | tee "$P11_EVIDENCE_DIR/logs/simctl-devices.txt"
  ```

- [ ] **Step 2: Start default live Metro**

  Run:

  ```bash
  env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
    -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
    npx --no-install expo start --dev-client --host localhost --port 8081 --clear \
    2>&1 | tee "$P11_EVIDENCE_DIR/logs/metro-default.log"
  ```

  Keep this command running until screenshots are complete.

- [ ] **Step 3: Open dev client**

  In a second terminal, run:

  ```bash
  export NATIVE_IDCHAT_SIMULATOR_UDID="CF3620CF-4769-486E-847B-911C96172049"
  xcrun simctl bootstatus "$NATIVE_IDCHAT_SIMULATOR_UDID" -b \
    > "$P11_EVIDENCE_DIR/logs/simctl-bootstatus.log" 2>&1
  xcrun simctl terminate "$NATIVE_IDCHAT_SIMULATOR_UDID" com.meta.idchat \
    > "$P11_EVIDENCE_DIR/logs/simctl-terminate.log" 2>&1 || true
  node - <<'NODE' > "$P11_EVIDENCE_DIR/logs/dev-client-url.txt"
  const metroUrl = 'http://127.0.0.1:8081';
  process.stdout.write(`com.meta.idchat://expo-development-client/?url=${encodeURIComponent(metroUrl)}`);
  NODE
  xcrun simctl openurl "$NATIVE_IDCHAT_SIMULATOR_UDID" "$(cat "$P11_EVIDENCE_DIR/logs/dev-client-url.txt")" \
    > "$P11_EVIDENCE_DIR/logs/simctl-openurl.log" 2>&1
  ```

- [ ] **Step 4: Capture required screenshots**

  Use Computer Use for interaction and `xcrun simctl io` for captures:

  ```bash
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/01-list-after-settle.png"
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/02-local-search-filter.png"
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/03-remote-discovery-results.png"
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/04-remote-discovery-empty-or-failure.png"
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/05-online-bots.png"
  xcrun simctl io "$NATIVE_IDCHAT_SIMULATOR_UDID" screenshot "$P11_EVIDENCE_DIR/06-back-to-chats-after-me.png"
  ```

  Required visible behavior:

  - visible list rows have no blank pale avatar circles after settling;
  - ciphertext is not visible in list/search/discovery/Online Bot UI;
  - list preview failure copy is product-level, not raw crypto text or stack text;
  - unread badges cap as `999+` when data contains high unread counts;
  - local search filters the list without calling remote search on every keystroke;
  - explicit remote discovery shows result and empty/failure states;
  - Online Bot sheet shows no raw JSON profile text and no clipped title/header controls;
  - switching Chats -> Me -> Chats does not regress list display.

- [ ] **Step 5: Redact sensitive screenshots**

  If any screenshot contains decrypted live message content, contact names the user wants hidden, or other live personal content, redact it before committing. Preserve layout, avatar, badge, and state evidence. Do not commit unredacted source captures.

- [ ] **Step 6: Stop Metro**

  Stop the Metro terminal with `Ctrl-C` and confirm no P1.1 dev server remains:

  ```bash
  ps -axo pid,command | rg 'expo start|native-idchat-p1-1-main-chat-productization' || true
  ```

- [ ] **Step 7: Write evidence README**

  Create `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/README.md` with this structure:

  ```markdown
  # Native IDChat P1.1 Main Chat Productization Evidence - 2026-06-15

  ## Result

  P1.1 simulator evidence: PASS

  ## Commit Under Test

  - Branch: `codex/native-idchat-p1-1-main-chat-productization`
  - Commit: `<commit hash>`

  ## Simulator

  - Simulator: iPhone 17
  - Runtime: iOS 26.5
  - UDID: `CF3620CF-4769-486E-847B-911C96172049`

  ## Commands

  - `yarn test:chat-native`
  - `npm exec tsc -- --noEmit --pretty false`
  - default Expo dev-client Metro command
  - `xcrun simctl openurl ...`

  ## Screenshot Evidence

  - `01-list-after-settle.png`
  - `02-local-search-filter.png`
  - `03-remote-discovery-results.png`
  - `04-remote-discovery-empty-or-failure.png`
  - `05-online-bots.png`
  - `06-back-to-chats-after-me.png`

  ## Sensitive Data Handling

  - No mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message content is included.
  - Live content screenshots were redacted where needed while preserving layout evidence.
  ```

- [ ] **Step 8: Update runbook**

  In `docs/superpowers/qa/native-idchat-simulator-runbook.md`, add a `P1.1 Main Chat Productization Gate` section after the P0 checklist:

  ```markdown
  ## P1.1 Main Chat Productization Gate

  P1.1 verifies the live main chat list, search/discovery, and Online Bot surfaces after P0.5/P0.6.

  Required evidence:

  - list after live data settles;
  - local search filter;
  - explicit remote discovery result;
  - explicit remote discovery empty or failure state;
  - Online Bot sheet;
  - list after Chats -> Me -> Chats navigation.

  Pass criteria:

  - no raw ciphertext, raw JSON profile text, `Unknown point format`, or stack traces in user-facing UI;
  - no blank pale avatar circles after loading settles;
  - unread badges render and cap high counts as `999+`;
  - explicit discovery states remain visible after search;
  - screenshots and logs contain no secrets or decrypted sensitive message content.
  ```

- [ ] **Step 9: Verify evidence files**

  Run:

  ```bash
  rg -n "TB[D]|TO[D]O|mnemonic|private key|shared secret|QA wallet secret|seed phrase" \
    "$P11_EVIDENCE_DIR" docs/superpowers/qa/native-idchat-simulator-runbook.md || true
  find "$P11_EVIDENCE_DIR" -type f | sort
  git diff --check
  ```

  Expected:

  - No unresolved placeholder marker appears.
  - Sensitive terms appear only in the Sensitive Data Handling policy text.
  - `git diff --check` exits 0.

- [ ] **Step 10: Commit Task 6**

  Run:

  ```bash
  git add \
    docs/superpowers/qa/native-idchat-simulator-runbook.md \
    docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615
  git commit -m "docs: capture native chat p1.1 evidence"
  ```

- [ ] **Step 11: Post Lisa Hahn buzz**

  Post a development-journal buzz saying this commit captures P1.1 simulator evidence and redaction notes.

## Task 7: Final Verification And Handoff

**Files:** none unless final evidence notes need correction

- [ ] **Step 1: Run final verification**

  Run:

  ```bash
  yarn test:chat-native
  npm exec tsc -- --noEmit --pretty false 2>&1 | tee /tmp/native-idchat-p1-1-final-tsc.log
  rg -n "src/chat-native" /tmp/native-idchat-p1-1-final-tsc.log || true
  git diff --check
  git status --short --branch
  git log --oneline --decorate --max-count=12
  ```

  Expected:

  - `yarn test:chat-native` passes.
  - TypeScript has no `src/chat-native` errors.
  - `git diff --check` exits 0.
  - Working tree is clean after all commits, except for explicitly ignored local runtime files.

- [ ] **Step 2: Final response content**

  Report:

  - final branch name;
  - commit hashes created for P1.1;
  - evidence path;
  - test commands and results;
  - TypeScript result and any non-`src/chat-native` residual risk;
  - Lisa Hahn buzz pin/local URL for each commit or a consolidated list;
  - recommendation whether to proceed to P1.2 or run another live P1.1 acceptance pass.

## Self-Review

- Spec coverage:
  - Chat list previews, avatars, unread labels, sorting display, local search, remote discovery states, Online Bot, product containment, and simulator evidence are covered by Tasks 1-6.
  - P1.2 room work and P1.3 group/account work are intentionally excluded.
- Placeholder scan:
  - This plan contains no unresolved placeholder markers.
  - Every code step names exact files and functions.
- Type consistency:
  - New props are `discoveryQuery?: string | null` and `unreadLabel: string`.
  - New helpers are `getSafeNativeChatPreviewText`, `getSafeNativeChatProfileText`, and `formatNativeChatUnreadCount`.
  - New evidence folder is `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/`.
