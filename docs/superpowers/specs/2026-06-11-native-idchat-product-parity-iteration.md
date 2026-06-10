# Native IDChat Product Parity Iteration Spec

## Purpose

This spec defines the next Native IDChat iteration after the first native-app conversion rounds. The goal is not another visual polish pass. The goal is to close the product and architecture gaps that still make the native app far from the IDChat web product and far from a release-grade mobile chat app.

The IDChat web repo remains the functional source of truth:

`/Users/tusm/Documents/MetaID_Projects/idchat`

The native app repo is:

`/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Red packet features are explicitly out of scope. All other chat features should be treated as in scope unless this document marks them as deferred because a backend or account-state dependency is missing.

## Current Ground Truth

Verified on 2026-06-11 from the current local repo state:

- Latest native work already replaced the primary chat entry with `src/chat-native` screens and added baseline native chat list, rooms, text/image/emoji send paths, message action sheet, SQLite cache, and Socket.IO integration.
- `yarn test:chat-native` passes: 25 suites / 150 tests.
- The existing QA runbook records live iOS simulator evidence for mixed chat list, group/private room entry, copy actions, tx opening, image action paths, and the remaining image/new-user verification caveats.
- The worktree contains unrelated dirty/untracked files. Future workers must not revert, stage, or overwrite unrelated changes.

Native files that currently define the product surface:

- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/screens/NativeChatMePage.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/storage/chatDatabase.ts`
- `src/chat-native/storage/chatRepository.ts`
- `src/chat-native/state/useNativeChatStore.ts`
- `src/chat-native/services/nativeChatSyncService.ts`
- `src/chat-native/services/chatApiClient.ts`
- `src/chat-native/services/chatSocketClient.ts`
- `src/chat-native/services/chatNormalizers.ts`

Web reference files to read before editing:

- `/Users/tusm/Documents/MetaID_Projects/idchat/src/stores/simple-talk.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/api/talk.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/lib/socket.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/MessageList.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/ChannelHeader.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/ChannelMemberListDrawer.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/TheInput.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/MessageMenu.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/direct-contact/List.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/direct-contact/Search.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/direct-contact/OnlineBotPanel.vue`

## Product Assumptions

- Native IDChat should be a first-class native app, not a WebView shell.
- Web IDChat is the behavioral reference. Telegram-style mobile patterns are acceptable where web layout does not translate well to a phone screen.
- Private chats and group chats must open on the latest messages by default.
- Rendering must be local-first: the room should read and display local SQLite data immediately, then silently sync remote history or socket updates into the local database and store.
- The UI should not depend on a full remote fetch before showing a room when local data exists.
- Backend HTTP and Socket.IO contracts should remain unchanged unless a task explicitly proves a missing API is blocking parity.
- Red packet creation, red packet display, and red packet receive state are not part of this iteration.

## Major Gaps To Close

### P0: Local-First Latest Message Windows

Current native state:

- `chatRepository.listMessages()` returns all cached messages for a channel.
- `MessageList` renders the whole loaded array and has no older-page trigger, latest-window contract, unread divider, scroll-to-latest control, or continuity tracking.
- `syncChannelMessages()` loads cached messages, then fetches from the highest cached index. This is not enough for a product-grade latest-window experience when local data is partial, stale, or very large.

Required behavior:

- Opening any private or group room must show the newest local message window first.
- If the newest local range is complete enough, render it immediately with no blocking server wait.
- If the newest local range is missing or incomplete, render the best local data immediately and fill the gap from the server in the background.
- Scrolling upward loads older messages by range, local first, then server fallback.
- New socket messages are saved to SQLite before the UI relies on them.
- If the user is at the latest edge, new messages append naturally; if the user scrolled up, show a compact "new messages" affordance instead of jumping.
- Read position and mention-read state should be updated by visible message observation, not only by entering a room.

Implementation requirements:

- Add repository APIs for bounded range reads, for example `listLatestMessages(channelId, limit)`, `listMessagesBefore(channelId, beforeIndex, limit)`, `listMessagesAfter(channelId, afterIndex, limit)`, and a continuity check for `[startIndex, endIndex]`.
- Store message-window state per channel: oldest loaded index, newest loaded index, `hasMoreOlder`, `hasMoreNewer`, `loadingOlder`, `loadingNewer`, and `isAtLatest`.
- Refactor room sync into a message-window service instead of loading every cached row into the screen.
- Keep `yarn test:chat-native` passing and add focused tests for latest-window, older pagination, and local-first fallback.

### P0: Profile, Avatar, And Sender Hydration

Current native state:

- Channel rows and message bubbles can render avatars when the normalized payload already contains avatar data.
- There is no durable native user/profile cache.
- Socket message normalization mostly preserves sender identifiers but does not reliably hydrate sender names or avatars.
- Group message sender display is therefore incomplete compared with web.

Required behavior:

- Private chat rows must show the peer name and avatar whenever the web app can resolve them.
- Group message rows must show sender avatar and display name for other users when profile data is available.
- Missing avatar data should fall back to stable initials/colors, then refresh silently when profile data arrives.
- Profile data should be cached locally and shared by list rows, room headers, group drawer, and message bubbles.

Implementation requirements:

- Add a `user_profiles` SQLite table keyed by globalMetaId/address.
- Add a profile service that ports the web app's `getAvatarProfileByGlobalMetaId` usage pattern with bounded concurrency.
- Hydrate private chat users during latest-chat-list sync.
- Hydrate group senders opportunistically from message payloads first, then profile API fallback.
- Extend normalizer tests to cover socket messages with and without sender profile data.

### P0: Group Info Drawer / Mobile Group Info Screen

Current native state:

- `NativeChatRoomPage` has an info button that only shows `Alert.alert(headerTitle, headerSubtitle)`.
- There is no native equivalent for the web `ChannelMemberListDrawer`.

Required behavior:

- In group rooms, tapping the header info/right action opens a native group-info surface.
- On wide screens a right drawer is acceptable. On phones, a full-height side sheet or pushed screen is acceptable if it preserves the same product functions.
- The surface should include group avatar, name, short group id with copy, group type/status, member count, announcement/room note when available, mute state, invite/share entry when available, subchannel/broadcast entry if supported by current APIs, member search, and paginated member list.
- Member list should preserve role grouping where web exposes it: owner/creator, admin/speaker/whitelist, normal members.
- Tapping a member should offer a private-chat path when the account and API data allow it.

Implementation requirements:

- Add read APIs and normalizers for group detail and member list from existing web endpoints in `src/api/talk.ts`.
- Add local cache tables for group info, member summaries, and channel settings where needed.
- Add `GroupInfoDrawer` or `GroupInfoScreen` under `src/chat-native/components` or `src/chat-native/screens`.
- Write component tests for open/close, copy group id, mute toggle state rendering, member search, and paginated member rendering.
- If an edit, invite, mute write, or subchannel endpoint is missing in native contracts, implement read-only display first and document the exact blocker in the QA runbook.

### P0: Chat List Completeness

Current native state:

- The list is a mixed private/group list with search and row badges.
- Create chat is visually present but disabled.
- Empty/new-user prompt is mostly mock/dev-only for recommended actions.
- Online bot and search flows are not at web parity.

Required behavior:

- Keep a single mixed list, not All/Private/Groups tabs.
- Search should filter local conversations immediately and should offer remote/user/group discovery if web endpoints already support it.
- Create/start chat must either work for supported private/group targets or be hidden behind a clear native route that cannot silently fall back to the old WebView.
- Online bot entry/panel should be ported if it is part of current web chat discovery.
- Fresh accounts should see a live new-user path to join or open a recommended public group when backend data permits it.

Implementation requirements:

- Replace disabled create chat affordance with a working native flow or remove it until a working native flow exists.
- Port the minimum web search/create APIs needed for native discovery.
- Keep fake recommended-group actions isolated to mock/dev scenarios only.
- Add tests proving empty live state does not expose fake actions.

### P0: Composer Parity Without Red Packets

Current native state:

- Text, emoji, and image entry exist.
- Quote is visible in actions but not wired into composer state.
- Mention suggestions, group permission states, image pre-send management, and private-chat unavailable states are incomplete.

Required behavior:

- Composer supports text, emoji, image selection, local image preview before send, quote/reply, and group mention suggestions.
- Red packet button must not be included.
- Composer disabled states must be explicit for cases such as missing private chat public key, not joined, muted, blocked, or unsupported channel state.
- Failed sends should remain visible and retryable where the send service can retry safely.

Implementation requirements:

- Add quote state to the room and composer.
- Add mention suggestions for group rooms using cached members.
- Add image preview management before send, including remove/replace.
- Add tests for quote send payload, mention insertion, disabled states, and image preview lifecycle.

### P1: Message Actions And Metadata

Current native state:

- Copy text, copy txid, open tx, view image, save image, quote, buzz/share, and translate affordances exist in some form.
- Some actions are not fully wired to end-to-end behavior.

Required behavior:

- Message actions should be reachable by a normal tap target and long press.
- Copy text and copy txid write exact values to pasteboard.
- Open tx opens the right chain explorer.
- Quote wires into composer.
- Image actions open/save the currently visible image.
- Buzz/share and translate should either work using existing app services or be hidden/read-only with a documented blocker.

Implementation requirements:

- Avoid visible dead actions in product mode.
- Add tests mapping action availability to message type and payload data.
- Add manual QA screenshots for the action sheet in text and image rows.

### P1: Me Tab And Account Status

Current native state:

- `NativeChatMePage` is a placeholder.

Required behavior:

- Me tab should show current account avatar/name, globalMetaId, wallet address, copy actions, chat public-key status, and basic settings links that already exist natively.
- It should not pretend to support settings that are not native yet.

Implementation requirements:

- Reuse existing account/profile/wallet stores.
- Add a lightweight `NativeChatAccountCard`.
- Add tests for rendering with and without profile data.

### P1: Read, Unread, Mentions, And Navigation

Required behavior:

- Conversation rows show unread counts and mention badges from local state.
- Rooms opened from the list still default to latest messages.
- If the room contains unread or mention state, show an affordance to jump to the first unread or next mention without changing the default latest-entry behavior.
- Read state is persisted as messages become visible.

Implementation requirements:

- Add `mentions` and `read_indexes` parity improvements in storage and sync.
- Add viewability tracking in `MessageList`.
- Add tests for read-index updates and mention badge clearing.

## Target Data Flow

### App Start

1. Resolve native chat account and open the account-scoped SQLite database.
2. Load cached channels, cached profile summaries, cached read indexes, and lightweight channel settings.
3. Render the native list immediately from local data.
4. Start background latest-chat-list sync.
5. Hydrate missing private/group profile data with bounded concurrency.
6. Start Socket.IO and persist realtime messages before merging them into the UI store.

### Room Open

1. Resolve channel from navigation params or local repository.
2. Load newest local message window first, for example the newest 30 messages.
3. Render the local window immediately.
4. Check whether the newest range is continuous and whether it reaches the channel latest index.
5. If incomplete, fetch the missing latest range from existing by-index or timestamp APIs.
6. Merge fetched messages into SQLite, then update the store from normalized local rows.
7. Start profile/member hydration for visible messages.
8. Keep the visible position at latest unless the user intentionally scrolls away.

### Older Pagination

1. When the user scrolls near the top edge, request older messages before the current oldest loaded index.
2. Read the local range first.
3. If local range is incomplete, fetch the older range from server.
4. Persist and merge without visual jump.
5. Stop when server and local continuity indicate no more older messages.

### Realtime

1. Socket event arrives.
2. Normalize and persist to SQLite.
3. Update channel last message and unread/mention counts.
4. If the current room is at latest, append and keep latest visible.
5. If the current room is not at latest, show a new-message affordance.

## Implementation Phases

Each phase should be independently committed and verified. Follow `AGENTS.md`: stage only files changed and understood, use a valid commit message prefix, and post a Lisa Hahn development buzz after each commit.

### Phase 1: Preflight And Source-Of-Truth Audit

Deliverables:

- A short update to the QA runbook recording the current baseline command outputs and any simulator state.
- A file map comment or doc note only if current code has moved since this spec.

Verification:

- `git status --short`
- `yarn test:chat-native`
- Inspect the web files listed in this spec before writing implementation code.

### Phase 2: Storage And Repository Message Windows

Deliverables:

- Range query APIs in `chatRepository`.
- Schema additions for profile cache, group info/member cache, mention/read parity, and sync window metadata.
- Unit tests for range reads, newest windows, older pagination, and continuity.

Verification:

- Focused storage tests.
- Full `yarn test:chat-native`.

### Phase 3: Local-First Room Loading

Deliverables:

- Message-window sync service.
- Store state for loaded ranges and pagination state.
- Room open defaults to newest local messages, then background fill.

Verification:

- Tests that prove local data renders before server promises resolve.
- Tests that prove opening private and group rooms requests the newest window.

### Phase 4: MessageList Pagination And Read Observation

Deliverables:

- Windowed `FlatList` behavior with older loading.
- Scroll-to-latest and new-message affordance.
- Viewability-based read-index persistence.
- Mention jump/clear behavior where data exists.

Verification:

- Component tests for older load trigger, no jump regressions, read-index updates, and new-message affordance.

### Phase 5: Profile And Avatar Hydration

Deliverables:

- Profile cache service.
- Private row and group sender hydration.
- Socket sender hydration fallback.

Verification:

- Normalizer and selector tests with complete, partial, and missing avatar payloads.
- Manual screenshot showing private row avatar, group sender avatar, and fallback avatar.

### Phase 6: Group Info Drawer / Screen

Deliverables:

- Group detail/member APIs and cache.
- Native group info drawer/screen.
- Member search and paginated member list.
- Copy group id and mute-state rendering.

Verification:

- Component tests.
- Manual simulator screenshots for group header, group info, member search, and member action path.

### Phase 7: Composer Parity

Deliverables:

- Quote/reply state.
- Group mention suggestions.
- Image preview before send with remove/replace.
- Explicit disabled states.
- Red packet excluded.

Verification:

- Composer tests.
- Live or mock simulator evidence for quote, mention, image preview, emoji, and disabled state.

### Phase 8: Chat List, Discovery, And New User Flow

Deliverables:

- Working native search/create/discovery path or removal of dead controls.
- Online bot entry/panel where supported by existing web APIs.
- Live recommended group path for fresh accounts if supported.

Verification:

- Tests for search and empty states.
- Manual QA with a fresh account or a documented blocker if a fresh account cannot be created without resetting user data.

### Phase 9: Me Tab

Deliverables:

- Account/profile card.
- Copy globalMetaId/address.
- Chat key/status display.
- Links only to native-supported settings.

Verification:

- Component tests with profile present/missing.
- Manual screenshot.

### Phase 10: Release-Gate QA

Deliverables:

- Updated QA runbook with command output, simulator screenshots, and known blockers.
- No new WebView fallback in normal IDChat chat flow.

Verification:

- `yarn test:chat-native`
- Focused Jest suites for all new code.
- `npm exec tsc -- --noEmit --pretty false` and record whether remaining failures are legacy non-`src/chat-native`.
- iOS simulator smoke covering list, private room, group room, pagination, group drawer, composer, actions, Me tab, and fresh-account/new-user path.

## Acceptance Checklist

Product acceptance:

- Opening the app shows native IDChat, not the old web chat.
- Chat list renders from local cache first, then refreshes silently.
- Private chat opens at latest messages by default.
- Group chat opens at latest messages by default.
- Scrolling up loads older messages incrementally.
- Incoming socket messages persist locally and update list/room state.
- Avatars show in private list rows, group list rows, and message rows when web-equivalent data is available.
- Group header info opens a native group info drawer/screen.
- Group info shows members and supports search/pagination.
- Composer supports text, emoji, image preview/send, quote, and mentions.
- Red packet controls are absent.
- Message actions are all reachable and no dead product-mode actions are shown.
- New/fresh users have a native path into a recommended or discoverable group when backend data supports it.
- Me tab is no longer a placeholder.

Automated acceptance:

- `yarn test:chat-native` passes.
- New storage/message-window/profile/group/composer tests are included.
- No new `src/chat-native` TypeScript errors are introduced.

Manual acceptance:

- Capture screenshots or simulator evidence for:
  - cached chat list before refresh
  - private latest-entry room
  - group latest-entry room
  - older pagination
  - socket/new message state
  - profile/avatar hydration
  - group info drawer/screen
  - composer quote/mention/image/emoji
  - message action sheet
  - Me tab
  - fresh-account/new-user flow or exact blocker

## Non-Goals

- Red packet send/receive/display.
- Backend API redesign.
- Replacing unrelated wallet, browser, or legacy app routes outside IDChat chat.
- Broad visual redesign unrelated to web parity or mobile usability.
- Refactoring unrelated legacy TypeScript errors.

## Risks And Open Questions

- Some group drawer write actions may depend on web-only endpoints or account permissions. If missing, ship read-only parity first and document the blocker.
- Fresh-account onboarding cannot be fully accepted without either a fresh mnemonic/account or permission to reset simulator account state.
- A full `tsc --noEmit` currently fails in legacy non-chat-native files. Do not hide new `src/chat-native` errors behind that existing baseline.
- Loading all historical messages is not release-grade. If server APIs cannot provide exact ranges for a channel type, document the limitation and implement the best local-window fallback.

## Fresh Session Handoff Prompt

Copy this into the next development session:

```text
Work in /Users/tusm/Documents/MetaID_Projects/IDChat-APP.

Goal: implement the next Native IDChat product-parity iteration from docs/superpowers/specs/2026-06-11-native-idchat-product-parity-iteration.md.

Context:
- Native IDChat already has baseline chat list, private/group rooms, text/image/emoji send, SQLite cache, socket integration, and message actions.
- It is still far from the IDChat web product. The next iteration must close product-grade gaps: local-first latest message windows, older pagination, profile/avatar hydration, group info drawer, composer quote/mention/image-preview parity, chat discovery/new-user flow, and a real Me tab.
- Use /Users/tusm/Documents/MetaID_Projects/idchat as the source of truth, especially src/stores/simple-talk.ts, src/api/talk.ts, MessageList.vue, ChannelHeader.vue, ChannelMemberListDrawer.vue, TheInput.vue, and direct-contact components.
- Red packet features are explicitly out of scope. Do not add red packet UI.
- Private and group rooms must open on latest messages by default. Rendering must be local-first: read SQLite first, then sync silently from server/socket into local DB and store.

Required workflow:
1. Read AGENTS.md and the spec above before editing.
2. Inspect current native files and web reference files; do not assume APIs or payload shapes.
3. Start with git status and yarn test:chat-native.
4. Work phase by phase in small commits. Stage only files you changed and understand.
5. After every commit, use the Lisa Hahn identity (slug lisa-hahn) to post a detailed development buzz as required by AGENTS.md.
6. Do not revert, stage, or overwrite unrelated dirty files.
7. Keep yarn test:chat-native passing after every phase.
8. Update docs/superpowers/qa/native-idchat-ui-parity-runbook.md with simulator/manual evidence and any exact blockers.

First implementation target:
Start with Phase 2 and Phase 3 from the spec: storage/repository message-window APIs and local-first room loading. This is the foundation for pagination, latest-entry behavior, and release-grade performance.
```
