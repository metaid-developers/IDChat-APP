# Native IDChat P0 Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for implementation. Execute one checkbox task at a time, keep the checklist updated, and stop after each slice for verification and commit.

**Goal:** Bring Native IDChat through the P0 productization gates from `docs/superpowers/specs/2026-06-13-native-idchat-p0-productization-spec.md`: deterministic iOS simulator launch, decryption stability with ciphertext containment, real avatar hydration, reliable chat-shell interactions, and a product-grade Me screen.

**Architecture:** Keep the native React Native chat shell as the only normal chat UI. Add narrow safety and presentation helpers inside `src/chat-native`, reuse the existing SQLite/Zustand sync path, and preserve the existing Web/DApp routes. Do not restore the WebView chat shell for normal chat use.

**Tech Stack:** React Native 0.79.5, Expo SDK 53, TypeScript, Jest, Expo dev-client, Zustand vanilla store, SQLite repository, `expo-image` for avatar image rendering.

---

## Operating Rules

- [ ] Read `AGENTS.md` and this plan before editing files.
- [ ] Do not stage or revert unrelated dirty files. Stage only files changed for the current slice.
- [ ] Red packet creation, claim, and detailed rendering stay out of scope. Historical red packet data may only receive defensive rendering if it appears in P0 tests.
- [ ] Do not print mnemonics, private keys, shared secrets, raw decrypted secret material, or QA wallet secrets in tests, logs, docs, or screenshots.
- [ ] Keep all UI strings product-safe. Do not show low-level crypto text such as `Unknown point format` to users.
- [ ] Use `Pressable` for touched interactive React Native elements. Do not add new `TouchableOpacity` usage.
- [ ] Use `expo-image` for touched avatar image rendering and set cache/recycling props for list usage.
- [ ] After each independently verified slice, commit with `<type>: <short description>` and post a Lisa Hahn development-journal buzz as required by `AGENTS.md`.

## Definition Of Done

- [ ] `yarn test:chat-native` passes.
- [ ] Focused Jest suites added or updated in this plan pass individually.
- [ ] `npm exec tsc -- --noEmit --pretty false` is run. Any remaining failures are recorded as pre-existing or owned by this P0 work.
- [ ] iOS simulator launch uses a documented dev-client flow with Metro running before app launch.
- [ ] The chat list loads without a red screen after following the documented flow.
- [ ] Search, tab switching, and returning to Chats do not turn readable previews into raw `U2Fsd...` ciphertext.
- [ ] Malformed peer public keys do not call ECDH point parsing and do not surface `Unknown point format`.
- [ ] Conversation and message avatars render real URI sources when profile data contains usable avatar fields, and fall back deterministically when the URI is missing or fails.
- [ ] Conversation rows are accessible buttons with stable labels and test IDs.
- [ ] Search filters local conversations immediately; remote discovery only runs from an explicit search submit/action.
- [ ] Me screen contains real account/profile information, copy feedback, and no dead `Native settings` placeholder section.
- [ ] QA evidence is saved under `docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/`.

## Subagent Split

Use one coordinating agent and three implementation subagents:

- [ ] Subagent A: decryption/public-key/display safety. Owns `chatMessageDecryption`, `chatPublicKey`, display safety helpers, and related tests.
- [ ] Subagent B: avatar/media hydration. Owns avatar source resolution, `expo-image`, profile hydration avatar normalization, and avatar tests.
- [ ] Subagent C: chat shell and Me page productization. Owns list interaction/search, accessibility, safe error text, Me screen, and related component tests.

The coordinating agent integrates conflicts, runs full verification, updates QA docs/evidence, commits each slice, and posts the required buzz entries.

## Phase 0: Preflight

Goal: establish the exact baseline and keep this P0 cycle bounded.

- [ ] Run:

  ```bash
  git status --short --branch
  yarn test:chat-native
  npm exec tsc -- --noEmit --pretty false
  ```

- [ ] If `yarn test:chat-native` fails before edits, capture the failing suites and decide whether they block P0. Do not fix unrelated suites.
- [ ] Confirm there is a single package manager lock for this repo:

  ```bash
  rg --files | rg '(^|/)(yarn.lock|package-lock.json|pnpm-lock.yaml)$'
  ```

- [ ] Confirm the P0 spec is present:

  ```bash
  test -f docs/superpowers/specs/2026-06-13-native-idchat-p0-productization-spec.md
  ```

Verification:

- [ ] Baseline command results are recorded in the development session handoff.
- [ ] No files are staged during Phase 0.

## Phase 1: Decryption Safety And Ciphertext Containment

Goal: readable messages remain readable, invalid crypto inputs stay local to the affected row, and product UI never displays raw ciphertext as the main message text.

### 1.1 Add Public-Key And Display-Safety Helpers

- [ ] Create `src/chat-native/services/chatPublicKey.ts`:

  ```ts
  const PUBLIC_KEY_HEX_RE = /^(04[0-9a-f]{128}|0[23][0-9a-f]{64})$/i;

  export function normalizeNativeChatPublicKey(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().replace(/^0x/i, '').toLowerCase();
    return PUBLIC_KEY_HEX_RE.test(normalized) ? normalized : undefined;
  }
  ```

- [ ] Create `src/chat-native/services/nativeChatDisplaySafety.ts`:

  ```ts
  export const NATIVE_CHAT_DECRYPT_FAILURE_TEXT = 'Unable to decrypt this message';

  const PRIVATE_CIPHERTEXT_RE = /^U2FsdGVkX1/i;
  const LONG_HEX_RE = /^[0-9a-f]{96,}$/i;

  export function looksLikeNativeChatCiphertext(value?: string | null): boolean {
    const text = typeof value === 'string' ? value.trim() : '';
    return Boolean(text && (PRIVATE_CIPHERTEXT_RE.test(text) || LONG_HEX_RE.test(text)));
  }

  export function getSafeNativeChatText(
    value: string | undefined,
    fallback = NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
  ): string {
    const text = typeof value === 'string' ? value : '';
    return looksLikeNativeChatCiphertext(text) ? fallback : text;
  }

  export function getProductSafeNativeChatError(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : String(error || '');
    if (/unknown point format|invalid public key|invalid public key point/i.test(message)) {
      return fallback;
    }
    return fallback;
  }
  ```

- [ ] Add `src/chat-native/services/__tests__/chatPublicKey.test.ts` covering:
  - valid uncompressed key shape starting with `04`;
  - valid compressed key shape starting with `02` or `03`;
  - invalid search text such as `Sunny`;
  - empty, whitespace, and `0x` normalization.

- [ ] Add `src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts` covering:
  - `U2FsdGVkX1...` becomes `Unable to decrypt this message`;
  - long hex ciphertext becomes `Unable to decrypt this message`;
  - normal text remains unchanged;
  - low-level crypto errors map to a supplied product-safe fallback.

Verification:

```bash
yarn jest --runInBand \
  src/chat-native/services/__tests__/chatPublicKey.test.ts \
  src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts
```

### 1.2 Contain Decryption Failures At The Message Boundary

- [ ] Update `src/chat-native/services/chatMessageDecryption.ts` to import:

  ```ts
  import { normalizeNativeChatPublicKey } from './chatPublicKey';
  import {
    NATIVE_CHAT_DECRYPT_FAILURE_TEXT,
    getSafeNativeChatText,
    looksLikeNativeChatCiphertext,
  } from './nativeChatDisplaySafety';
  ```

- [ ] Replace `withDisplayContent` with a helper that never returns ciphertext when decryption output is empty or still encrypted:

  ```ts
  function withDisplayContent(message: NativeChatMessage, plaintext: string): NativeChatMessage {
    const safeText = getSafeNativeChatText(
      plaintext || message.content,
      looksLikeNativeChatCiphertext(message.content) ? NATIVE_CHAT_DECRYPT_FAILURE_TEXT : message.content,
    );

    return safeText === message.content ? message : { ...message, content: safeText };
  }
  ```

- [ ] In the private-channel branch, normalize `channel.publicKeyStr` before calling `wallet.getEcdh`:

  ```ts
  const publicKey = normalizeNativeChatPublicKey(channel.publicKeyStr);
  if (!publicKey || typeof wallet?.getEcdh !== 'function') {
    return looksLikeNativeChatCiphertext(message.content)
      ? { ...message, content: NATIVE_CHAT_DECRYPT_FAILURE_TEXT }
      : message;
  }

  try {
    const ecdh = await wallet.getEcdh(publicKey);
    return withDisplayContent(message, decryptPrivateText(message.content, ecdh.sharedSecret));
  } catch {
    return looksLikeNativeChatCiphertext(message.content)
      ? { ...message, content: NATIVE_CHAT_DECRYPT_FAILURE_TEXT }
      : message;
  }
  ```

- [ ] Leave file/image protocols skipped. Image/file messages must keep their attachment URI path.
- [ ] Add `src/chat-native/services/__tests__/chatMessageDecryption.test.ts` covering:
  - invalid private public key returns `Unable to decrypt this message` and does not call `wallet.getEcdh`;
  - private decrypt returning `''` does not return the original `U2Fsd...` string;
  - group decrypt with wrong key does not return the original long hex payload;
  - non-encrypted normal text remains unchanged when the channel cannot decrypt;
  - image/file messages are not rewritten.

Verification:

```bash
yarn jest --runInBand src/chat-native/services/__tests__/chatMessageDecryption.test.ts
```

### 1.3 Protect Conversation And Message Selectors

- [ ] Update `src/chat-native/ui/chatUiSelectors.ts` to call `getSafeNativeChatText` for text previews and message body view models.
- [ ] Preserve image preview behavior: `[Image]` stays unchanged for `kind: 'image'`.
- [ ] Add tests to `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`:

  ```ts
  it('does not expose private ciphertext in conversation previews', () => {
    const row = getConversationRowViewModel(channel({
      lastMessage: {
        content: 'U2FsdGVkX19encrypted',
        kind: 'text',
        timestamp: 1710000000,
      },
    }));

    expect(row.preview).toBe('Unable to decrypt this message');
  });
  ```

- [ ] Add a group preview test where sender name remains visible:

  ```ts
  expect(row.preview).toBe('Nina: Unable to decrypt this message');
  ```

Verification:

```bash
yarn jest --runInBand src/chat-native/ui/__tests__/chatUiSelectors.test.ts
```

Slice commit:

- [ ] Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/services/__tests__/chatPublicKey.test.ts \
    src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts \
    src/chat-native/services/__tests__/chatMessageDecryption.test.ts \
    src/chat-native/ui/__tests__/chatUiSelectors.test.ts
  git diff --check
  git status --short
  ```

- [ ] Stage only Phase 1 files.
- [ ] Commit with:

  ```bash
  git commit -m "fix: contain native chat decrypt failures"
  ```

- [ ] Post the Lisa Hahn development-journal buzz for this commit.

## Phase 2: Avatar Hydration And Image Rendering

Goal: native profiles use the same avatar source rules as Web IDChat, and list avatars render real images with cached native image behavior.

### 2.1 Install Expo Image

- [ ] Add the Expo image dependency using the repo's existing Yarn lock:

  ```bash
  npx expo install expo-image
  ```

- [ ] Confirm only `package.json` and `yarn.lock` changed for the dependency install:

  ```bash
  git diff -- package.json yarn.lock
  git status --short
  ```

- [ ] Add a Jest setup mock in `jest.setup.js` so component tests can render `expo-image`:

  ```js
  jest.mock('expo-image', () => {
    const React = require('react');
    const { Image } = require('react-native');

    return {
      Image: React.forwardRef((props, ref) => React.createElement(Image, { ...props, ref })),
    };
  });
  ```

Verification:

```bash
yarn jest --runInBand src/chat-native/components/__tests__/ImageMessage.test.tsx
```

### 2.2 Centralize Native Media And Avatar Source Resolution

- [ ] Create `src/chat-native/ui/nativeChatMedia.ts` with the current `ImageMessage` metafile resolver logic:

  ```ts
  export const NATIVE_CHAT_METAFILE_CONTENT_BASE =
    'https://file.metaid.io/metafile-indexer/api/v1/files/accelerate/content/';

  export function resolveNativeChatMediaUri(uri?: string): string | undefined {
    const source = uri?.trim();
    if (!source) return undefined;

    if (
      /^https?:\/\//i.test(source) ||
      source.startsWith('file://') ||
      source.startsWith('ph://') ||
      source.startsWith('assets-library://') ||
      source.startsWith('content://') ||
      source.startsWith('data:image/')
    ) {
      return source;
    }

    if (source.startsWith('metafile://')) {
      const cleanSrc = source.replace('metafile://', '');
      return cleanSrc ? `${NATIVE_CHAT_METAFILE_CONTENT_BASE}${cleanSrc}` : undefined;
    }

    return undefined;
  }
  ```

- [ ] Update `src/chat-native/components/ImageMessage.tsx` to import `resolveNativeChatMediaUri` and preserve the existing exported `resolveImageMessageUri` API:

  ```ts
  export function resolveImageMessageUri(uri?: string): string | undefined {
    return resolveNativeChatMediaUri(uri);
  }
  ```

- [ ] Create `src/chat-native/ui/avatarSource.ts` by porting the Web IDChat rules from `/Users/tusm/Documents/MetaID_Projects/idchat/src/utils/avatar.ts`:
  - trim values;
  - ignore `/content`, `/thumbnail`, `metafile://`, and `default_user/default_avatar` placeholders;
  - support `data:image/`;
  - support direct `http(s)` image URLs;
  - convert `metafile://<pin>` and raw `<64-hex>i<number>` pin IDs to the metafile content URL;
  - append the existing OSS resize query at width `128` for pin-backed avatars.

  Required public API:

  ```ts
  export function resolveNativeChatAvatarSource(
    ...sources: Array<string | null | undefined>
  ): string | undefined;
  ```

- [ ] Add `src/chat-native/ui/__tests__/avatarSource.test.ts` covering:
  - direct HTTPS URL;
  - `data:image/`;
  - `metafile://<pin>`;
  - `/content/<pin>`;
  - raw pin ID;
  - default avatar placeholder filtered to `undefined`;
  - empty placeholder filtered to `undefined`;
  - first usable source wins across `avatar` and `avatarImage`.

Verification:

```bash
yarn jest --runInBand \
  src/chat-native/components/__tests__/ImageMessage.test.tsx \
  src/chat-native/ui/__tests__/avatarSource.test.ts
```

### 2.3 Normalize Profile Avatars Before Store/UI Use

- [ ] Update `src/chat-native/services/nativeChatProfileService.ts`:
  - import `resolveNativeChatAvatarSource`;
  - in `normalizeProfilePayload`, compute `const avatar = resolveNativeChatAvatarSource(source.avatar, source.avatarImage, source.nftAvatar)`;
  - store both `avatar` and `avatarImage` as the resolved source when one exists;
  - keep name and chat public key logic unchanged.

- [ ] Update `applyProfileToPrivateChannel` and `applyProfileToMessage` to prefer normalized `profile.avatar`.
- [ ] Extend `src/chat-native/services/__tests__/nativeChatProfileService.test.ts` with:
  - fetched private profile using `metafile://<pin>` becomes a content URL;
  - cached profile with default placeholder does not overwrite a channel's existing usable avatar;
  - payload group sender avatar is normalized before repository cache write.

Verification:

```bash
yarn jest --runInBand src/chat-native/services/__tests__/nativeChatProfileService.test.ts
```

### 2.4 Render Avatars With Expo Image And Deterministic Fallback

- [ ] Update `src/chat-native/components/ChatAvatar.tsx`:
  - import `Image` from `expo-image`;
  - import `resolveNativeChatAvatarSource`;
  - reset failed URI state when `uri` changes;
  - render initials fallback when no resolved URI exists or image loading fails;
  - set `contentFit="cover"`, `cachePolicy="memory-disk"`, and `recyclingKey={resolvedUri || name || 'fallback'}`;
  - keep fixed width, height, and border radius from the current component.

- [ ] Add `src/chat-native/components/__tests__/ChatAvatar.test.tsx` covering:
  - resolved HTTPS URI renders an image with avatar accessibility label;
  - `metafile://<pin>` resolves to the content URL;
  - image error switches to initials fallback;
  - default avatar placeholder renders initials fallback.

Verification:

```bash
yarn jest --runInBand \
  src/chat-native/components/__tests__/ChatAvatar.test.tsx \
  src/chat-native/components/__tests__/ConversationList.test.tsx \
  src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
```

Slice commit:

- [ ] Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/components/__tests__/ChatAvatar.test.tsx \
    src/chat-native/components/__tests__/ConversationList.test.tsx \
    src/chat-native/components/__tests__/ImageMessage.test.tsx \
    src/chat-native/services/__tests__/nativeChatProfileService.test.ts \
    src/chat-native/ui/__tests__/avatarSource.test.ts
  git diff --check
  git status --short
  ```

- [ ] Stage only Phase 2 files, including `package.json` and `yarn.lock`.
- [ ] Commit with:

  ```bash
  git commit -m "fix: hydrate native chat avatars"
  ```

- [ ] Post the Lisa Hahn development-journal buzz for this commit.

## Phase 3: Chat Shell Interaction And Search

Goal: the main chat shell behaves like a product UI, not a fragile debug surface.

### 3.1 Make Conversation Rows Accessible And Stable

- [ ] Refactor `src/chat-native/components/ConversationList.tsx` to use a memoized row component:

  ```tsx
  type ConversationRowProps = {
    id: string;
    title: string;
    preview: string;
    avatar?: string;
    typeLabel: string;
    timeLabel: string;
    unreadCount: number;
    mentionCount: number;
    onOpenChannelId: (channelId: string) => void;
  };
  ```

- [ ] The row component must:
  - use `Pressable`;
  - set `accessibilityRole="button"`;
  - set `accessibilityLabel={`Open chat ${title}. ${preview || 'No messages'}`}`;
  - set `testID={`native-chat-row-${id}`}`;
  - receive only primitive row fields plus `onOpenChannelId`;
  - keep fixed avatar/list row dimensions so search and unread badges do not shift row height.

- [ ] Hoist callbacks at the list root with `useCallback`.
- [ ] Build a `channelsById` map with `useMemo` and let the hoisted row callback look up the full `NativeChatChannel` before calling `onOpenChannel`.
- [ ] Set `keyboardShouldPersistTaps="handled"` on the `FlatList`.
- [ ] Replace touched `TouchableOpacity` usages in `ConversationList.tsx` with `Pressable`.

### 3.2 Make Remote Discovery Explicit

- [ ] Add `onClearRemoteSearch?: () => void` to `ConversationListProps`.
- [ ] Change `handleSearchQueryChange` so it only updates local state:

  ```ts
  const handleSearchQueryChange = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    if (!nextQuery.trim()) {
      onClearRemoteSearch?.();
    }
  };
  ```

- [ ] Add a submit handler:

  ```ts
  const submitRemoteSearch = useCallback(() => {
    if (normalizedSearchQuery) {
      onSearchRemote?.(normalizedSearchQuery);
    }
  }, [normalizedSearchQuery, onSearchRemote]);
  ```

- [ ] Wire `TextInput` with:

  ```tsx
  returnKeyType="search"
  onSubmitEditing={submitRemoteSearch}
  ```

- [ ] Add a compact `Pressable` search action in the search row only when `normalizedSearchQuery.length > 0 && onSearchRemote`:

  ```tsx
  <Pressable
    accessibilityLabel={`Search IDChat for ${normalizedSearchQuery}`}
    accessibilityRole="button"
    onPress={submitRemoteSearch}
    style={styles.remoteSearchButton}
  >
    <Text style={styles.remoteSearchText}>Search</Text>
  </Pressable>
  ```

- [ ] Keep local filtering immediate and case-insensitive across title, preview, and type label.
- [ ] Add a `clearRemoteDiscovery` callback in `NativeChatHomePage.tsx` that clears `discoveryResults`, `discoveryError`, and `discoveryLoading` without calling the API.
- [ ] Pass `onClearRemoteSearch={clearRemoteDiscovery}` from `NativeChatHomePage` to `ConversationList`.
- [ ] Do not call `onSearchRemote` for each keystroke.

### 3.3 Product-Safe Discovery And Chat-Start Errors

- [ ] Update `src/chat-native/screens/NativeChatHomePage.tsx`:
  - import `getProductSafeNativeChatError`;
  - export a small helper named `getNativeChatHomeProductError`;
  - map discovery search failures to `Search failed. Try again.`;
  - map private-chat creation failures to `Unable to start chat. Try again.`;
  - log raw errors with a bounded context object through `console.warn`, excluding secrets and decrypted content.

  ```ts
  export function getNativeChatHomeProductError(error: unknown, fallback: string): string {
    return getProductSafeNativeChatError(error, fallback);
  }
  ```

- [ ] Replace touched tab `TouchableOpacity` elements with `Pressable` while preserving `accessibilityRole="tab"` and selected state.

### 3.4 Tests

- [ ] Update `src/chat-native/components/__tests__/ConversationList.test.tsx`:
  - local filtering updates visible rows immediately;
  - local filtering does not call `onSearchRemote`;
  - clearing the search field calls `onClearRemoteSearch`;
  - pressing the search action calls `onSearchRemote` once with the trimmed query;
  - submitting the search input calls `onSearchRemote` once with the trimmed query;
  - pressing a conversation row calls `onOpenChannel`;
  - each row has role `button`, stable accessibility label, and `native-chat-row-<id>` test ID.

- [ ] Add `src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts` covering:
  - `Unknown point format` maps to `Search failed. Try again.`;
  - `Invalid public key point111` maps to `Unable to start chat. Try again.`;
  - arbitrary network errors still return the supplied product-safe fallback.
- [ ] Verify the tab `Pressable` replacement through the Phase 5 simulator flow, not a broad screen runtime mock.

Verification:

```bash
yarn jest --runInBand \
  src/chat-native/components/__tests__/ConversationList.test.tsx \
  src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts
```

Slice commit:

- [ ] Run:

  ```bash
  yarn jest --runInBand src/chat-native/components/__tests__/ConversationList.test.tsx
  yarn test:chat-native
  git diff --check
  git status --short
  ```

- [ ] Stage only Phase 3 files.
- [ ] Commit with:

  ```bash
  git commit -m "fix: harden native chat shell interactions"
  ```

- [ ] Post the Lisa Hahn development-journal buzz for this commit.

## Phase 4: Product-Grade Me Screen

Goal: Me shows real account identity and status with useful copy feedback, without dead settings placeholders.

### 4.1 Remove Placeholder Settings And Add Copy Feedback

- [ ] Update `src/chat-native/screens/NativeChatMePage.tsx`:
  - add `const [copiedLabel, setCopiedLabel] = useState<string | null>(null)`;
  - update `copyValue` to call `Clipboard.setStringAsync(value)` and set the copied label;
  - render a short product-safe feedback line such as `Copied Global MetaID` under the account card when `copiedLabel` exists;
  - use `contentInsetAdjustmentBehavior="automatic"` on the root `ScrollView`;
  - set `contentContainerStyle={styles.content}` for stable bottom padding above the tab bar.

- [ ] Update `src/chat-native/components/NativeChatAccountCard.tsx`:
  - keep display name, avatar, connected/not connected state, Global MetaID, MVC address, chat public key, chat key status, and socket status;
  - remove the `Native settings` section and `No native chat settings available yet`;
  - keep copy buttons only where a real value exists;
  - do not add buttons for routes or settings screens that are not implemented in this P0 cycle.

### 4.2 Tests

- [ ] Update `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`:
  - copied Global MetaID feedback appears after pressing copy;
  - copied MVC address feedback appears after pressing copy;
  - no node renders `Native settings`;
  - no node renders `No native chat settings available yet`;
  - missing address and missing chat public key render product-safe unavailable text and no copy button for missing values.

Verification:

```bash
yarn jest --runInBand src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
```

Slice commit:

- [ ] Run:

  ```bash
  yarn jest --runInBand src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
  yarn test:chat-native
  git diff --check
  git status --short
  ```

- [ ] Stage only Phase 4 files.
- [ ] Commit with:

  ```bash
  git commit -m "fix: productize native chat me screen"
  ```

- [ ] Post the Lisa Hahn development-journal buzz for this commit.

## Phase 5: Launch Runbook And Simulator Evidence

Goal: leave the next reviewer with a repeatable launch path and visual proof that P0 behavior works on iOS Simulator.

### 5.1 Update The Runbook

- [ ] Update `docs/superpowers/qa/native-idchat-simulator-runbook.md` with a P0 dev-client launch section:

  ```bash
  npx expo start --dev-client --host localhost --port 8081 --clear
  ```

  In a second terminal:

  ```bash
  npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049
  ```

- [ ] Document that Metro must be running before launching the app.
- [ ] Document that this P0 gate verifies dev-client launch, not App Store/TestFlight signing.
- [ ] Document that Metro export fallback warnings for `@scure/bip39/wordlists/english` and `@noble/hashes/crypto.js` are recorded unless they block bundling.
- [ ] Add a P0 checklist:
  - first successful screen is Chats;
  - no red screen after canonical flow;
  - avatars load for rows with usable avatar data;
  - search filters local rows without remote discovery;
  - explicit search runs discovery;
  - switching to Me and back does not expose ciphertext;
  - Me screen has no placeholder settings section.

### 5.2 Capture Evidence

- [ ] Create the evidence directory:

  ```bash
  mkdir -p docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613
  ```

- [ ] Start Metro:

  ```bash
  npx expo start --dev-client --host localhost --port 8081 --clear
  ```

- [ ] Launch the simulator app:

  ```bash
  npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049
  ```

- [ ] If that UDID no longer exists on the machine, run:

  ```bash
  xcrun simctl list devices available
  ```

  Use one available iPhone simulator and record its exact name and UDID in the runbook evidence notes.

- [ ] Use `computer-use:computer-use` to operate the iOS Simulator through this visual flow:
  - Chats first screen loaded, no red screen;
  - search for `Sunny`;
  - verify local list filtering occurs;
  - press the explicit `Search` action;
  - switch to Me;
  - copy Global MetaID and MVC address when present;
  - switch back to Chats;
  - verify previews did not become raw `U2Fsd...` ciphertext.

- [ ] Capture screenshots:

  ```bash
  xcrun simctl io booted screenshot docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/01-chats-loaded.png
  xcrun simctl io booted screenshot docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/02-search-local-filter.png
  xcrun simctl io booted screenshot docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/03-me-product-screen.png
  xcrun simctl io booted screenshot docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/04-back-to-chats-no-ciphertext.png
  ```

- [ ] Add a short `README.md` inside the evidence directory with:
  - commit hash;
  - simulator name and UDID;
  - exact launch commands;
  - pass/fail result for each P0 checklist item;
  - any remaining non-blocking warnings.

### 5.3 Full Verification

- [ ] Run:

  ```bash
  yarn test:chat-native
  npm exec tsc -- --noEmit --pretty false
  git diff --check
  git status --short --branch
  ```

- [ ] If TypeScript reports pre-existing failures outside the Phase 1-5 files, record them in the final handoff and do not fix them in this P0 cycle.
- [ ] If a Phase 1-5 file causes a TypeScript failure, fix it before final handoff.

Slice commit:

- [ ] Stage only QA doc/evidence files changed in Phase 5.
- [ ] Commit with:

  ```bash
  git commit -m "docs: document native chat p0 qa flow"
  ```

- [ ] Post the Lisa Hahn development-journal buzz for this commit.

## Final Handoff Template

Use this structure in the development session final reply:

```md
Implemented P0 Native IDChat productization through commit <hash>.

Changed:
- Decryption safety: <files>
- Avatar hydration: <files>
- Chat shell interactions: <files>
- Me screen: <files>
- QA evidence: <files>

Verification:
- yarn test:chat-native: <pass/fail>
- npm exec tsc -- --noEmit --pretty false: <pass/fail or pre-existing failures>
- iOS simulator dev-client flow: <pass/fail>
- Evidence directory: docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/

Remaining P1 work:
- Full group info/admin/member management.
- Full composer parity: mentions, quote reply, emoji/media polish beyond P0.
- Translation and Buzz sharing actions.
- Release/TestFlight signing and Android launch parity.
```

## Out-Of-Scope For This P0 Plan

- [ ] Full group info drawer, member list management, subchannel management, mute/pin/admin actions.
- [ ] Full composer parity beyond preserving existing send/image behavior.
- [ ] Translation, Buzz sharing, red packet creation/claim/detail views.
- [ ] Replacing every app-wide image component with `expo-image`; only avatar and shared media resolver work are in scope.
- [ ] App Store/TestFlight/EAS release automation.
- [ ] Android parity.
