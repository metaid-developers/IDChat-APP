# Native IDChat P1.2 Chat Room Productization Spec

## Executive Summary

P1.2 must turn the Native IDChat room from a technically functional transcript into a release-credible mobile chat room: readable message history, safe message actions, stable media/transaction rendering, and predictable keyboard/scroll behavior, without expanding into red packets, full group management, or full Web composer parity.

## Background

Native IDChat is being productized in stages after P0.5/P0.6 proved the release gate, iOS build gate, mock discovery, and simulator evidence paths. Those gates established that the app can build, launch, and avoid major release blockers, but they did not prove that the user-visible chat experience is ready to ship.

The P1 product audit found that Native IDChat still needed release-readiness work across the main chat list, search/discovery, room, group info, and account surfaces. P1.1 has now been merged back to `main` and covers the first-screen experience: chat list previews, avatar fallbacks, unread labels, local search, explicit remote discovery, Online Bot display, and containment of raw decrypt/ciphertext/profile text in list-level surfaces.

P1.2 begins after that merge. Its scope is the conversation room itself: opening a private or group chat should feel like a real mobile chat product rather than a protocol/debug viewer. The work must preserve the P1.1 list/search/discovery behavior and avoid widening into P1.3 account/group-info cleanup or full composer parity.

## Current Baseline

- Native repo: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Web reference repo: `/Users/tusm/Documents/MetaID_Projects/idchat`
- Native baseline branch: `main`
- Native baseline commit for this spec: `f783ab2862243f516c37d52a3ff63268728522d8 feat: merge native idchat p1.1 productization`
- P1 audit spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-productization-spec.md`
- P1 audit evidence: `docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`
- P1.1 implementation plan: `docs/superpowers/plans/2026-06-15-native-idchat-p1-1-main-chat-productization.md`
- P1.1 evidence: `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/`

Known post-merge verification state:

- `yarn test:chat-native` passed after the P1.1 merge: 41 suites / 290 tests.
- `git diff --check` passed after the P1.1 merge.
- `npm exec tsc -- --noEmit --pretty false` still reports existing non-`src/chat-native` TypeScript errors; the post-merge log had no `src/chat-native` matches.
- `main` is ahead of `origin/main`; no push was performed during P1.1 closeout.

## Audit Inputs Used For P1.2

### Native Evidence From P1 Audit

- `05-native-room-group-test2.png`
  - Group room opens from the live list.
  - Header shows group name and member count.
  - The transcript shows sender labels, bubbles, transaction metadata, a `Load earlier messages` control, and the composer.
  - Message body text is redacted in evidence, but layout issues remain visible.
- `06-native-message-actions.png`
  - Message action sheet opens.
  - Visible actions include Copy text, Copy txid, Open tx, and Quote.
  - Full txid is exposed as a prominent selectable block, which is useful for QA but too raw as the primary product presentation.
- `07-native-group-info.png`
  - Group info exists, but deeper group-info polish is P1.3 unless a P1.2 room header action is broken.
- `16-web-room-redacted.png`
  - Logged-in Web room reference, redacted for content.
  - Confirms richer room structure, denser transcript, and integrated room affordances.

### Native Code Context

Current Native room-related files:

- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/components/ImageMessage.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/components/GroupInfoDrawer.tsx`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/messageActions.ts`
- `src/chat-native/services/nativeChatSyncService.ts`
- `src/chat-native/services/nativeChatSendService.ts`
- `src/chat-native/services/nativeChatImageService.ts`
- `src/chat-native/services/nativeChatImageSendService.ts`
- `src/chat-native/storage/chatRepository.ts`

Current focused tests already cover pieces of the room layer:

- `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- `src/chat-native/components/__tests__/MessageList.test.tsx`
- `src/chat-native/components/__tests__/MessageBubble.test.tsx`
- `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
- `src/chat-native/components/__tests__/ImageMessage.test.tsx`
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- `src/chat-native/ui/__tests__/messageActions.test.ts`
- `src/chat-native/services/__tests__/nativeChatSendService.test.ts`
- `src/chat-native/services/__tests__/nativeChatImageSendService.test.ts`
- `src/chat-native/services/__tests__/nativeChatSyncService.test.ts`

### Web Reference Context

Relevant Web IDChat room files observed read-only:

- `src/views/talk/components/MessageItem.vue`
- `src/views/talk/components/MessageItemForSession.vue`
- `src/views/talk/components/MessageMenu.vue`
- `src/views/talk/components/MessageList.vue`
- `src/views/talk/components/TheInput.vue`
- `src/views/talk/components/ChannelHeader.vue`
- `src/views/talk/components/MessageItemQuote.vue`
- `src/views/talk/components/ImagePreview.vue`
- `src/components/ChatImage/ChatImage.vue`

Web behavior to preserve conceptually, adapted to native mobile patterns:

- Room header identifies private/group context and exposes the right room action.
- Group rooms show sender avatar/name, timestamp, chain context, message content, quote blocks, image content, join/leave/member system messages, and unread/scroll affordances.
- Private rooms use a session-specific message item but keep the same core transcript concepts.
- Message menu supports copy and quote, and Web also has translate/share-to-Buzz paths. Native P1.2 should keep unsupported translate/Buzz hidden until native callable contracts are confirmed.
- Web composer supports quote, image preview, emoji, mention, and red packet. Native P1.2 covers only the baseline composer states needed to keep the room usable; red packet remains out of scope.

## P1.2 Goal

When a user opens a conversation from the Native chat list, they should be able to understand who is speaking, what was said or shared, when it happened, whether it is pending/failed/sent, and what safe actions are available. The room should remain usable while loading older messages, receiving newer messages, opening the keyboard, selecting a quote, selecting an image, and returning to the list.

P1.2 is complete when both a private room and a group room can be accepted in the simulator with screenshots and logs, and the transcript no longer reads as a debug/protocol surface.

## P1.2 Scope

P1.2 includes:

- Room header productization for private and group rooms.
- Message transcript layout: incoming/outgoing orientation, avatars, names, bubble shape, spacing, timestamp context, status labels, and grouping behavior.
- Safe message body rendering for text, decrypt failures, unsupported content, and long content.
- Image/media message rendering at the message level, including loading and unavailable states.
- Transaction metadata presentation and transaction actions.
- Message action sheet productization for implemented native actions.
- Quote action entry and quote composer state.
- Load-earlier state and scroll-to-latest/new-message affordance behavior.
- Keyboard-open room behavior and composer visibility.
- Empty, loading, failed, disabled, and unavailable room states that can be observed by QA.
- Simulator evidence for private room, group room, actions, media, transaction, keyboard, and pagination states.

## Explicit Non-Scope

The following are not part of P1.2:

- Red packet creation, claiming, historical rendering parity, or red packet composer entry.
- Full group management: invite, admin controls, owner transfer, mute writes, whitelist, kick, permission editing, or member role editing.
- P1.3 group-info polish except when the group-info entry point itself blocks room usability.
- P1.3 Me/account page cleanup.
- Full Web composer parity: every attachment type, stickers, advanced emoji picker parity, file upload beyond image baseline, translation, Buzz sharing, subchannel authoring, fee selector parity, and command palette parity.
- Android, TestFlight, EAS, App Store signing, release-channel automation, or production deployment.
- WebView fallback for normal chat usage.
- Protocol changes, wallet secret flows, account migration, key recovery, or private-key/mnemonic display.
- Sending live messages during acceptance unless the user explicitly approves the test account and content.

## Product Principles

- Product copy over protocol copy: visible UI must not show raw ciphertext, raw JSON, stack traces, `Unknown point format`, unbounded txids, or low-level crypto messages as primary content.
- Preserve useful technical power without making it primary: txid and pin identifiers may be copyable, but the default view should be compact and user-readable.
- Native mobile adaptation is acceptable: the goal is Web IDChat core parity, not pixel-level desktop replication.
- If a Web action has no confirmed Native callable path, hide it instead of exposing a dead control.
- A failed or unavailable message should be understandable and recoverable where possible, not silent or visually broken.
- Screenshots and logs must not include mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive live message content.

## Gap Matrix

| Area | Web Behavior | Native Current Baseline | Gap | Severity | P1.2 Requirement |
| --- | --- | --- | --- | --- | --- |
| Room entry | Web opens selected room into a structured transcript with loading protection. | Native opens group/private route and focuses the active channel. | Need product empty/loading/failure states when channel or runtime is unavailable. | High | P1.2-R1 |
| Header identity | Web header shows room name, private/group context, group id or member affordances, and room actions. | Native header shows back, avatar, title, subtitle, info button. | Header is serviceable but lacks explicit acceptance for long names, private missing-key state, and group context. | Medium | P1.2-R2 |
| Incoming/outgoing orientation | Web distinguishes own messages and peer/group messages with avatar, name, side, and metadata. | Native aligns own messages right and others left. | Needs acceptance for private sent/received and group sender behavior, including fallback names/avatars. | High | P1.2-R3 |
| Repeated sender labels | Web transcript density keeps names/timestamps useful without dominating the stream. | Native shows sender label above every bubble. | Repeated labels make the room feel noisy and less polished. | Medium | P1.2-R4 |
| Timestamp context | Web shows timestamps and chain icons in a compact metadata row. | Native has `timeLabel` on each bubble. | Needs product rules for when timestamps appear and how they combine with status/tx metadata. | Medium | P1.2-R5 |
| Text bodies | Web renders readable decrypted content and wraps long text in the transcript. | Native uses safe selector text and bubbles. | Need proof for long text, multiline text, emoji, and decrypt-failure containment in room bodies. | High | P1.2-R6 |
| Decrypt failures | Web does not expose raw encrypted payloads in normal room content. | Native maps ciphertext-like body to `Unable to decrypt this message`. | Room body copy is acceptable only if scoped and not overused as preview; raw ciphertext must never appear. | Release blocker if violated | P1.2-R7 |
| Images/media | Web renders public/private images as visual content and supports preview. | Native `ImageMessage` renders a 220px frame, loading overlay, and `Image unavailable`. | Need acceptance for local preview, remote image, failed image, and action sheet image actions. | High | P1.2-R8 |
| Unsupported content | Web has protocol-specific renderers for several message types. | Native handles text/image primarily; unsupported protocol behavior is not clearly productized. | Unsupported non-red-packet content needs safe placeholder and no raw protocol dump. | High | P1.2-R9 |
| Transaction metadata | Web metadata is compact with chain context and explorer access. | Native footer shows chain + shortened txid plus Copy chip; sheet shows full txid block. | Full txid is too prominent in sheet; footer can feel technical. Need compact product treatment. | High | P1.2-R10 |
| Message actions | Web menu offers actions for supported content; unsupported paths may exist on Web. | Native action sheet exposes Copy text, Copy txid, Open tx, View image, Save image, Quote where applicable. | Need action availability rules, no dead translate/Buzz, better sheet hierarchy, and copy feedback. | High | P1.2-R11 |
| Quote | Web quote shows source sender/content and scroll-to-quoted context. | Native Quote sets composer quote bar with sender/content. | Need acceptance that quote can be selected, cleared, and does not expose raw image/tx internals. | Medium | P1.2-R12 |
| Composer baseline | Web composer supports text, quote, images, emoji, mentions, red packet, fee selector. | Native composer supports text, quote, image preview/send, emoji tray, group mention suggestions. | P1.2 should only stabilize baseline states, not pursue full parity. | Medium | P1.2-R13 |
| Keyboard behavior | Web desktop composer is stable; mobile Web has adapted behavior. | Native composer is outside `MessageList`, but keyboard behavior was not accepted in P1 audit. | Keyboard must not permanently cover composer/latest message, and layout must recover after dismiss. | High | P1.2-R14 |
| Older messages | Web supports top pagination/loading and scroll preservation. | Native has `Load earlier messages`, top-scroll trigger, and window state. | Need visible loading, no-more, failure, and scroll position acceptance. | Medium | P1.2-R15 |
| New messages/latest | Web shows unread mention and scroll-to-bottom affordances. | Native shows `New messages` / `Latest` affordance based on window state. | Need behavior acceptance when away from latest and after tapping latest. | Medium | P1.2-R16 |
| Read observation | Web advances read state based on viewed messages. | Native reports highest visible indexed message to mark read. | Need regression tests/evidence that room open does not incorrectly mark unseen messages read. | Medium | P1.2-R17 |
| Private missing key | Web shows a clear unsupported private chat alert when peer key is missing. | Native disables composer with `Missing peer chat public key`. | Need room-level product state, not only a small disabled reason. | High | P1.2-R18 |
| Blocked/unjoined/cannot send | Web displays permission/unsupported input states. | Native composer has disabled reasons for blocked, not joined, and canSend false. | Need user-facing copy, visible disabled composer, and no send action. | Medium | P1.2-R19 |
| Back navigation | Web/mobile returns to the list without warning overlays. | Native P1.1 evidence shows list survives Chats -> Me -> Chats; room back must be re-accepted. | Need no `GO_BACK` warning or red screen after room -> list -> room cycles. | High | P1.2-R20 |

## Requirements

### P1.2-R1: Room Entry States

Native must show deterministic room states for:

- channel found and messages available;
- channel found but latest message window is loading;
- channel found but no messages are available;
- channel missing or route param invalid;
- runtime/account not ready;
- sync failed after room focus.

Acceptance:

- No state may render a blank white screen.
- No state may expose a stack trace, raw exception, or raw response object.
- Empty states must name the room context where possible, such as "No messages yet" rather than a generic loader.
- Failure states must offer a retry affordance or a clear way back to the chat list.

### P1.2-R2: Header Identity And Actions

The room header must identify the active room clearly.

Private rooms:

- show peer avatar or initials;
- show peer display name or deterministic fallback;
- show "Private chat" or a product-equivalent context label;
- expose back;
- expose info only if it opens a real product surface or a clear read-only summary.

Group rooms:

- show group avatar or deterministic fallback;
- show group name with truncation that does not overlap controls;
- show member count when known, otherwise "Group chat";
- expose back;
- expose info to open the existing group info drawer.

Acceptance:

- Long names truncate to one line without pushing back/info controls off screen.
- Header remains inside the safe area on iPhone 17 simulator.
- Header does not show raw group id as the primary title unless no name exists.

### P1.2-R3: Sender Orientation And Identity

Messages must clearly distinguish current-account messages from other messages.

Acceptance:

- Current-account messages align right.
- Incoming messages align left.
- Group incoming messages show sender avatar or initials and sender display name.
- Private incoming messages show peer avatar or initials and do not repeat low-value globalMetaId text when a display name exists.
- Self messages may show "You" only where the product needs it; repeated "You" labels on consecutive self messages should not dominate the transcript.

### P1.2-R4: Message Grouping And Transcript Density

The transcript must reduce visual noise from consecutive messages.

Acceptance:

- Consecutive messages from the same sender within a short time window may be visually grouped.
- Grouping must not hide the first sender label in a group-room sender run.
- Grouping must not hide message action targets.
- Grouping must not make accessibility labels ambiguous.
- The visible transcript must fit at least 4 normal text messages plus the composer on iPhone 17 without feeling like each message is a standalone debug card.

### P1.2-R5: Timestamp, Status, And Metadata Rules

Each message must provide enough temporal and delivery context without overloading the bubble.

Acceptance:

- Sent messages show a human-readable time.
- Pending messages show "Sending" or a product-equivalent status.
- Failed messages show "Failed" and a visible recovery clue; retry may be P2 if no send retry path exists, but the failure must not be silent.
- Cancelled messages show "Cancelled" only if that state can occur.
- Timestamp, status, tx metadata, and actions wrap without overlapping.

### P1.2-R6: Text And Long Message Rendering

Text messages must render safely and readably.

Acceptance:

- Single-line, multi-line, emoji, URL-like, and long text messages wrap inside bubbles.
- Long uninterrupted strings are contained and do not overflow the bubble or screen.
- Text selection/copy uses the action sheet or long-press path, not raw hidden debug fields.
- The message row touch target remains stable when content wraps.

### P1.2-R7: Decryption And Raw Content Containment

Room content must not expose raw encrypted payloads or low-level crypto errors.

Acceptance:

- No visible room text may include raw `U2Fsd`, raw long hex/base64 ciphertext, raw JSON payloads, `Unknown point format`, stack traces, or `TypeError`/`ReferenceError` copy.
- A decrypt failure body may show a bounded product message such as `Unable to decrypt this message`.
- Copy text must not copy raw ciphertext for messages whose visible body is a decrypt-failure placeholder unless the user explicitly opens a future advanced diagnostic surface, which is out of P1.2.
- List-preview copy from P1.1 must remain unchanged.

### P1.2-R8: Image And Media Messages

Image messages must render as image content or a clear product placeholder.

Acceptance:

- Local selected-image preview in the composer shows a thumbnail and does not expose full local URI as primary copy.
- Sent or received image messages show a fixed, stable media frame.
- Loading image state is visible and bounded.
- Failed/unavailable image state shows `Image unavailable` or product-equivalent copy inside the media frame.
- View image action appears only when an image URI exists.
- Save image action appears only when native save can be attempted.
- Red packet media is not implemented; if historical red packet-like content appears, it must be contained as unsupported content without red packet behavior.

### P1.2-R9: Unsupported Message Types

Unsupported non-red-packet message protocols must be contained.

Acceptance:

- Unsupported content renders a compact placeholder such as `Unsupported message` with optional protocol-neutral detail like "Open Web IDChat to view this message" only if that is product-approved.
- Unsupported content does not render raw protocol names, raw node payloads, or JSON as the main body.
- Unsupported rows still keep sender, time, and safe actions if available.
- Red packet remains explicitly hidden or contained and must not become a callable feature in P1.2.

### P1.2-R10: Transaction Metadata

Transaction metadata must be useful without making every message look like a ledger row.

Acceptance:

- Message footer may show chain and shortened txid only when txid/pinId exists.
- Full txid is available through Copy txid, not as the dominant sheet header.
- Open tx uses the correct chain explorer for MVC/BTC/DOGE/OPCAT where the app already has confirmed support; unsupported chains hide Open tx or show a safe unavailable state.
- Transaction metadata wraps cleanly on small widths.
- Copy feedback confirms the copied field.

### P1.2-R11: Message Action Sheet

The action sheet must expose only implemented native actions.

Allowed P1.2 actions:

- Copy text for safe text messages.
- Copy txid when txid/pinId exists.
- Open tx when a supported explorer URL can be built.
- View image when an image URI exists.
- Save image when an image URI exists and native permissions can be requested.
- Quote when the message has a stable reply target.

Disallowed P1.2 actions:

- Translate.
- Share to Buzz.
- Red packet actions.
- Like/reaction actions.
- Delete/edit/pin/admin actions.
- Any action that opens WebView fallback for normal chat.

Acceptance:

- Action availability changes by message kind.
- The sheet never shows an empty action list.
- The sheet can be closed by backdrop, close button, and system back gesture.
- Failed action handlers do not crash the room.
- Full txid display, if present, is secondary to the action list and not the first product element users must read.

### P1.2-R12: Quote Flow

Quote must be safe enough for baseline replying.

Acceptance:

- Selecting Quote from a text message shows a composer quote bar with sender and bounded content preview.
- Selecting Quote from an image message shows `[Image]` or product-equivalent copy.
- Quote preview does not expose raw ciphertext or full txid.
- Clear quote removes the quote bar.
- Sending with quote metadata is covered by tests; live sending during acceptance requires user approval.

### P1.2-R13: Composer Baseline Stability

The composer must remain usable for baseline text/image/emoji/quote states.

Acceptance:

- Text input is visible at rest.
- Send button is disabled when the draft is empty or sending is unavailable.
- Disabled reason is user-facing and visible.
- Emoji entry appends emoji without breaking layout.
- Image pick entry opens the picker without the deprecated warning overlay introduced before P0.6.
- Image selected state shows thumbnail, remove, replace, and send-selected-image actions.
- Mention suggestions in group rooms may remain basic, but must not overlap the input or hide the send button.

### P1.2-R14: Keyboard And Safe Area Behavior

The room must handle the iOS keyboard predictably.

Acceptance:

- Tapping the input opens the keyboard.
- Composer remains visible above the keyboard.
- Latest visible message is not permanently hidden behind the keyboard.
- Dismissing the keyboard restores the prior layout.
- Opening a message action sheet while the keyboard is open must either dismiss the keyboard or render the sheet above it without overlap.
- No text or controls are clipped by the bottom safe area.

### P1.2-R15: Load Earlier Messages

Older-message loading must feel intentional.

Acceptance:

- If older messages are available, the top affordance says `Load earlier messages` or product-equivalent copy.
- Tapping it shows a loading state.
- When older messages load, the visible scroll position should not jump unexpectedly to the bottom.
- When no older messages remain, the control disappears or changes to a product-level no-more state.
- If loading fails, the user sees a retryable failure state without losing the current transcript.

### P1.2-R16: New Messages And Latest Affordance

The room must handle being away from the latest edge.

Acceptance:

- When newer messages exist while the user is scrolled away, a compact `New messages` affordance appears.
- When the user is simply not at bottom, a compact `Latest` affordance can appear.
- Tapping the affordance scrolls to the latest edge and refreshes the latest window if needed.
- The affordance does not cover the composer or last message actions.

### P1.2-R17: Read-State Observation

Read state must advance based on visible messages, not merely room focus.

Acceptance:

- Opening a room does not automatically mark messages read beyond the visible range.
- The highest visible indexed message can advance read state.
- Pending local messages without index do not corrupt read-index updates.
- Mention badge clearing is tied to visible/read progress, not route entry alone.

### P1.2-R18: Missing Private Key State

Private chats without a peer public key must show a clear room state.

Acceptance:

- The composer is disabled.
- The reason is understandable, such as `Missing peer chat public key`.
- The transcript area remains navigable and does not crash.
- Send/image/emoji actions are disabled.
- No raw key material is displayed.

### P1.2-R19: Permission And Cannot-Send States

Blocked, unjoined, or disabled-send channels must be readable and safe.

Acceptance:

- The transcript can still be read if messages are available.
- Composer disabled state names the reason in product copy.
- Send/image buttons are disabled.
- The user can still go back.
- The UI does not imply that a send succeeded when no send was attempted.

### P1.2-R20: Navigation Stability

Room navigation must not regress P0/P1.1 stability.

Acceptance:

- Chats -> private room -> Back returns to the Native list.
- Chats -> group room -> Back returns to the Native list.
- Reopening the same room does not duplicate messages or reset the list into a broken loading state.
- No red screen, `GO_BACK` warning overlay, or unhandled fatal Metro error appears during the flow.

## Suggested P1.2 Delivery Slices

These slices are not an implementation plan. They are a scope split for the next session to turn into a detailed plan.

### P1.2a: Transcript Readability And Safety

Purpose: make text rooms readable before touching richer media or keyboard edge cases.

Includes:

- room entry states;
- header identity acceptance;
- incoming/outgoing identity rules;
- message grouping/density;
- timestamp/status rules;
- long text wrapping;
- decrypt/raw content containment;
- unsupported message placeholders.

Must produce:

- focused tests for selectors/components;
- simulator screenshots for private text room and group text room;
- evidence that no raw ciphertext/errors appear in room body.

### P1.2b: Message Actions, Media, And Transaction Presentation

Purpose: make the room useful for the message types already visible in Native and Web.

Includes:

- image/media rendering;
- image loading/unavailable states;
- action-sheet hierarchy and availability;
- copy/open tx behavior;
- quote entry and quote composer state;
- transaction metadata compaction.

Must produce:

- focused tests for action availability, image rendering, quote state, tx explorer/copy behavior;
- simulator screenshots for action sheet, image message, image unavailable state or deterministic fixture, transaction message, and quote bar.

### P1.2c: Keyboard, Scroll, Pagination, And Final Room Evidence

Purpose: stabilize the room as a mobile interaction surface.

Includes:

- keyboard-open/dismiss layout;
- composer disabled states;
- image selected composer state;
- load-earlier behavior;
- new-message/latest affordance;
- read-state observation;
- navigation cycles.

Must produce:

- focused tests for scroll/window/read-state behavior where possible;
- simulator screenshots for keyboard-open room, load-earlier state, latest/new-message affordance, disabled composer state, and room back navigation;
- final P1.2 evidence README.

## Acceptance Evidence Requirements

Create P1.2 evidence under:

`docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/`

Required files:

- `README.md`
- `logs/git-status-before-simulator.txt`
- `logs/commit-under-test.txt`
- `logs/yarn-test-chat-native.log`
- `logs/tsc-noemit.log` or a documented filtered TypeScript result showing no `src/chat-native` errors
- `logs/metro.log`
- `logs/simctl-devices.txt`
- `logs/simctl-bootstatus.log`
- `logs/simctl-openurl.log`
- `logs/simctl-screenshot.log`

Required screenshots, redacted where needed:

- `01-private-room-text.png`
- `02-group-room-text.png`
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
- `13-back-to-chat-list.png`

If live data cannot safely provide one required state, use a deterministic non-sensitive mock scenario and document it in the evidence README. Mock evidence cannot replace all live-room evidence; at least one private room and one group room must be opened from the real Native list unless the user explicitly approves a mock-only exception.

## Verification Commands

Baseline commands for the future implementation session:

```bash
git status --short --branch
git log --oneline --decorate --max-count=16
yarn test:chat-native
npm exec tsc -- --noEmit --pretty false
```

Simulator launch command:

```bash
env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
  -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
  npx --no-install expo start --dev-client --host localhost --port 8081 --clear
```

Simulator support commands:

```bash
xcrun simctl list devices
xcrun simctl bootstatus CF3620CF-4769-486E-847B-911C96172049 -b
xcrun simctl openurl CF3620CF-4769-486E-847B-911C96172049 <dev-client-url>
xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot <output.png>
```

Acceptance may use a different simulator only if the evidence README records the exact device name, runtime, and UDID.

## Release Blocking Criteria

Any of the following blocks P1.2 acceptance:

- red screen or fatal runtime error during room open, actions, keyboard, pagination, or back navigation;
- raw ciphertext, raw JSON payload, stack trace, or low-level crypto error visible in normal room UI;
- composer permanently hidden by keyboard;
- user cannot return from room to chat list;
- message action shown but doing nothing silently;
- Open tx shown for a chain without a safe URL or safe unavailable handling;
- image messages collapse into blank space;
- live evidence captures unredacted sensitive message content, mnemonic, private key, shared secret, or QA wallet secret;
- P1.2 implementation adds red packet behavior, WebView fallback, Android release work, or P1.3 account/group management scope.

## P2/P3 Deferrals

These can be deferred if P1.2 acceptance passes:

- rich reaction/like/share actions;
- translate action;
- Share to Buzz action;
- full tx detail screen;
- full image gallery;
- non-image file rendering;
- voice/video/file attachments;
- complete mention navigation and unread mention jump parity;
- full private missing-key recovery flow;
- retry-send implementation if failed states are visible and safe;
- exact desktop Web visual density.

## Risks And Open Questions

- Live private-room outgoing/incoming evidence may require sending a non-sensitive QA message. Do not send without explicit user approval.
- Some Web actions, especially Translate and Share to Buzz, have Web-only service paths. Native should keep them hidden until a callable native contract is confirmed.
- Chain explorer support should be confirmed for every chain Native exposes in message actions. If uncertain, hide Open tx for that chain and keep Copy txid.
- Private image rendering depends on available decrypted URI/local preview behavior. If live private image evidence is unsafe, use a deterministic fixture and record the limitation.
- Group messages may include historical protocols not covered by text/image. P1.2 must contain them safely but does not need full renderer parity.
- Existing non-`src/chat-native` TypeScript errors can continue to exist, but P1.2 must not introduce `src/chat-native` TypeScript errors.
- The Web reference repo is currently not a clean `main` checkout in this workstation. Treat it as a read-only behavioral reference, not a source of release-truth for Native code changes.

## Implementation Plan Handoff Notes

This spec is intended as input to a new implementation-planning session. The next session should:

- start from Native `main` after commit `f783ab2862243f516c37d52a3ff63268728522d8` or a newer main that includes it;
- create a new `codex/` branch or isolated worktree before code edits;
- use `superpowers:writing-plans` to turn this spec into a detailed implementation plan;
- use `superpowers:subagent-driven-development` when executing that plan, because P1.2 has separable transcript, action/media, and keyboard/scroll slices;
- keep commits small and post Lisa Hahn development-journal buzz for each commit as required by `AGENTS.md`;
- preserve P1.1 behavior and evidence assumptions;
- avoid red packet, P1.3 group/account, Android/TestFlight/EAS, and WebView fallback scope;
- prefer focused selector/component/service tests before simulator evidence;
- include simulator evidence before claiming P1.2 complete;
- redact screenshots that contain live decrypted message content.

This spec intentionally does not prescribe code-level implementation steps. The implementation plan should decide exact file edits after re-reading the current code and tests from the new development session.

## Self-Review

- No P1.2 requirement depends on red packet support.
- No requirement asks for Android, TestFlight, EAS, App Store, or WebView fallback.
- P1.3 account and full group-management surfaces are excluded.
- Requirements are tied to visible user behavior and simulator evidence.
- Every release-blocking issue has a concrete observable failure condition.
- Sensitive data handling is explicit for screenshots, logs, and live message content.
