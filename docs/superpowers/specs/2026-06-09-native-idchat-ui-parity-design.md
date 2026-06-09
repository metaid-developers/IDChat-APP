# Native IDChat UI Parity Design

Status: Draft for fresh-section review
Date: 2026-06-09
Workspace: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
Primary web reference: `/Users/tusm/Documents/MetaID_Projects/idchat`
Baseline visual artifacts:

- `generated/native-idchat-design-v2.png`
- `generated/native-idchat-design-v2.html`
- `generated/native-idchat-design-v2.prompt.txt`

## Fresh-Section Summary

This document is the current source of truth for continuing the Native IDChat migration in a new development section with no access to the prior conversation.

The original migration goal still stands: replace the IDChat homepage WebView with a native React Native chat experience in `IDChat-APP`, while preserving the current HTTP API, Socket.IO backend, wallet, encryption, and createPin flows. The 2026-06-08 migration spec and implementation plan remain the lower-level protocol and service foundation:

- `docs/superpowers/specs/2026-06-08-native-idchat-migration-design.md`
- `docs/superpowers/plans/2026-06-08-native-idchat-migration.md`

However, the first native UI pass was not product-quality. It proved the native route and core send/read flows, but it was too minimal compared with the existing IDChat web app. The user clarified that the native version must not become a reduced-function version of IDChat. Telegram can be used as a visual and interaction reference, but IDChat web remains the functional reference.

The accepted direction is:

> IDChat-first for functionality and information architecture; Telegram-polished for native spacing, interaction, and visual refinement.

The v2 design board is accepted only as a product direction baseline, not as a pixel-perfect high-fidelity design. Future high-fidelity decisions must be made in the actual React Native app using iOS simulator screenshots and interaction testing.

## Current Implementation State

The current repository already contains a `src/chat-native` module with protocol, service, storage, state, and basic UI files. The existing UI is intentionally basic and must be upgraded before delivery.

Key existing native UI files:

- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/components/EmojiBar.tsx`
- `src/chat-native/components/ImageMessage.tsx`

Current UI gaps:

- Conversation list is too sparse and does not yet show IDChat-level session metadata.
- Chat room header is too minimal.
- Message bubbles do not show avatars on both sides.
- Message bubbles do not expose time, txid, chain, copy, or IDChat message actions.
- Composer buttons are text-heavy and oversized compared with a polished native chat product.
- There is no first-class two-tab IDChat shell for `Chats` and `Me`.
- New-user join guidance is not yet represented in the native product flow.
- iOS visual density has not been tuned through simulator screenshots.

## Product Principle

Native IDChat must preserve the useful chat functionality and information density of IDChat web, while removing the feeling that the app is just loading the web version.

The native product should feel like a mobile chat app:

- fast cached chat list
- direct room navigation
- compact composer
- tappable avatars
- clear current-account identity
- readable message metadata
- long-press message actions
- safe fallback for unsupported deferred features

It should not feel like a generic dashboard, marketing page, or simplified toy chat.

## Source Of Truth Files In IDChat Web

Use these files in `/Users/tusm/Documents/MetaID_Projects/idchat` before changing native UI behavior:

- `src/views/talk/components/direct-contact/List.vue`
  - The web conversation list filters private and group channels together and excludes temporary channels.
- `src/views/talk/components/direct-contact/Item.vue`
  - Session row reference: avatar, group/private icon cue, title, last message preview, sender name for group previews, timestamp, unread badge, mention badge.
- `src/views/talk/components/direct-contact/Search.vue`
  - Search, online bot shortcut, and create-group entry reference.
- `src/views/talk/components/ChannelHeader.vue`
  - Room header reference.
- `src/views/talk/components/MessageItem.vue`
  - Message layout reference. Both incoming and outgoing messages render a `UserAvatar`; outgoing messages are right-aligned through `flex-row-reverse`.
- `src/views/talk/components/MessageMenu.vue`
  - Message action reference: copy, quote, translate for text, tx link, and Buzz/share where applicable.
- `src/views/talk/components/TheInput.vue`
  - Composer reference: emoji, image selection, quote state, image preview, send behavior.
- `src/stores/simple-talk.ts`
  - Functional behavior reference for session merge, message normalization, send payloads, pending/mock state, read indexes, and profile/avatar hydration.

Do not modify the web repo as part of this migration unless the user explicitly asks.

## Scope

### Must Improve In This UI Parity Pass

- Native chat list layout and session metadata.
- Native chat room header.
- Native message bubbles.
- Native message metadata display.
- Message copy/tx/action behavior.
- Native composer density and icon-first controls.
- New-user recommended group prompt.
- `Chats` / `Me` two-tab IDChat shell.
- iOS screenshot polish loop and acceptance checklist.

### Keep From The 2026-06-08 Plan

- Existing backend HTTP APIs.
- Existing Socket.IO backend.
- Existing protocol names and node payload shapes.
- Existing wallet/createPin/ECDH primitives.
- Existing generic WebView/DApp support outside IDChat chat.
- Red packet and MRC20 exclusion.

### Still Out Of Scope

- Red packet sending/receiving UI.
- MRC20 or asset-message UI.
- Full group management/admin workflows.
- Full private group invite/onboarding flows.
- Replacing every generic wallet WebView route.
- Backend changes.

## Visual Baseline

Use `generated/native-idchat-design-v2.png` as the reference for direction and screen coverage:

1. Unified chat list.
2. Group chat room with avatars, message metadata, and long-press action popover.
3. Private chat room with both identities visible.
4. New-user recommended group prompt.
5. Message detail / tx copy sheet.

This image is not a high-fidelity pixel target. It is too rough for final UI, especially in button size, text scale, and density. The implementation must use it to preserve structure and behavior, then refine visual details inside the React Native app.

## High-Fidelity Standard

The high-fidelity source of truth for delivery is not another static generated image. It is the running React Native app on iOS.

The UI is considered high fidelity only after:

- The native app is run in iOS Simulator.
- Screenshots are captured for chat list, group room, private room, composer with emoji, image preview/send flow, message action sheet, tx copy sheet, and new-user join prompt.
- The screenshots are reviewed against this spec and the IDChat web reference.
- Text, buttons, avatars, spacing, and tap targets are adjusted in code until they look product-grade.

Expected iOS density targets:

- Main header title: 17-18 pt.
- Conversation title: 15-16 pt.
- Message body: 14-15 pt.
- Metadata text: 10-12 pt.
- List avatar: 44-48 px.
- Message avatar: 28-32 px.
- Composer icon buttons: 34-40 px, icon-first, no oversized text buttons.
- Message bubble horizontal padding: 10-12 px.
- Message bubble vertical padding: 7-10 px.
- List row height: roughly 68-76 px depending on content.
- Bottom tab height: iOS-safe-area aware, visually close to native tab bars.

These are target ranges, not strict constants. The final decision should be made by simulator screenshots and interaction feel.

## Required UI Behavior

### IDChat Shell

The IDChat native entry should present a simple two-tab shell:

- `Chats`
- `Me`

Do not add `Wallet` or `Discover` as bottom tabs inside the IDChat chat surface. The broader wallet app may still have its own navigation elsewhere. This spec is about the IDChat chat experience.

### Conversation List

The conversation list must follow IDChat and Telegram behavior:

- Private chats and group chats are mixed in one chronological list.
- Do not show `All`, `Private`, or `Groups` segmented tabs.
- Temporary channels should not appear as regular list items.
- Rows should show:
  - avatar
  - group/private cue
  - title
  - last message sender for group chats
  - latest message preview
  - latest message time
  - unread badge
  - mention badge when available
- Image previews should show `[Image]` or localized equivalent.
- Search should be visible near the top.
- Online bot shortcut should remain available when the account supports it.
- Create/start entry should remain available where the current IDChat web supports it.
- Empty state should guide a new user toward joining the recommended public group.

### Chat Room Header

The room header should show:

- Back button.
- Avatar.
- Room or peer title.
- Secondary metadata:
  - group: member count and public/private group state where available
  - private: MetaID/profile/online state where available
- Info/details entry.

Header text must not be oversized. It should feel close to a native chat app header, not a page title.

### Message Layout

Both incoming and outgoing messages must show avatars.

Reason: IDChat users can switch account/profile/avatar. The sender must be able to see which current account sent the right-side message.

Message rows must support:

- incoming left aligned
- outgoing right aligned
- avatar on both sides
- sender display name for group chats
- message body
- image bubble
- pending state
- failed state
- retry affordance for failed outgoing messages
- quoted/reply preview when supported by the existing message model

### Message Metadata

Each displayed message should expose:

- time
- chain hint where available
- shortened txid or pin id
- copy affordance

The shortened txid may be in the bubble footer. The full txid should be available in the message detail/action sheet. If a pending/mock message has no txid yet, the metadata should show pending/sending status instead of fake tx data.

### Message Actions

Long-press or tap-and-hold should open native actions. Supported actions:

- Copy message text.
- Copy txid.
- Open tx in the correct explorer:
  - BTC: `https://mempool.space/tx/<txid>`
  - DOGE: `https://dogechain.info/tx/<txid>`
  - MVC/default: `https://mvcscan.com/tx/<txid>`
- Quote/reply.
- Translate for text where the existing app supports it.
- Buzz/share for group/file group messages where the existing app supports it.

Deferred actions:

- Red packet actions are out of scope.
- MRC20 actions are out of scope.

Deferred actions should not be presented as working controls.

### Composer

The composer must support:

- Text input.
- Emoji insertion.
- Image selection.
- Send.
- Disabled state when account/wallet/runtime is unavailable.
- Draft preservation on failed send attempt.
- Compact icon-first controls.
- Keyboard-safe layout.

The composer should not use large text buttons such as wide `Image` or `Send` buttons in the final polished UI. Use icon buttons with accessible labels.

### Image Flow

The image flow must support:

- image picker entry
- local preview
- send
- cancel/remove before send where practical
- image bubble display
- full-screen or modal preview where practical
- pending/failed states

The protocol, encryption, MetaFile attachment behavior, and send service remain governed by the 2026-06-08 migration plan.

### New User Flow

After a new account is created and enters IDChat, the native UI should show a recommended public group entry when there are no conversations or when onboarding data indicates a first-use flow.

The prompt should:

- avoid a marketing landing-page style
- show the recommended group avatar/name
- include a primary `Join group` action
- include a secondary `Explore chats first` action
- make clear that the active app wallet identity is the chat identity

The exact group source should use existing IDChat app behavior or backend hints where available. If the backend hint is not available during implementation, the native UI may show a safe empty state and document the missing source.

## Data And Type Requirements

The current `NativeChatChannel` and `NativeChatMessage` types may need additional UI fields or derived helpers. Keep raw server payloads available for debugging, but do not make UI components parse arbitrary raw payloads directly.

Required UI-accessible values:

- channel avatar
- channel type
- group/private cue
- last message sender display name
- last message timestamp
- unread count
- mention count if available
- message sender avatar
- message sender display name
- message timestamp
- message chain
- message txid
- message pin id
- message status

If these are not present directly, add normalizer-derived fields or selector helpers near the chat-native module.

## Accessibility And Interaction

- All icon-only buttons must have accessibility labels.
- Long-press actions must also be reachable by an explicit affordance where needed for testability.
- Message text and txid copy feedback should show a short native toast/alert or equivalent.
- Tap targets should be at least 34 px for compact controls and closer to 44 px for primary controls.
- Text must not overlap in compact iPhone layouts.
- Keyboard should not cover the composer.

## Verification Requirements

Do not call this UI parity pass complete based only on code review.

Required verification:

- Focused Jest tests for formatters, selectors, action helpers, and UI behavior.
- Mock scenario inside the app showing mixed list, group room, private room, image message, outgoing avatar, metadata, and action sheet.
- iOS Simulator run with screenshots for all core screens.
- Existing native send/read/live smoke should still pass:
  - read conversation list
  - open group chat
  - open private chat
  - send group text
  - send private text
  - send group image
  - send private image if QA credentials allow it
- Generic WebView/DApp routes outside IDChat should still work.

Android final verification may be deferred until the user provides Android device/emulator access, but the code should stay cross-platform React Native unless a platform-specific exception is documented.

## Handoff Notes For The Next Development Section

Start in:

```bash
cd /Users/tusm/Documents/MetaID_Projects/IDChat-APP
```

The user asked to develop directly on `main`. The worktree may contain unrelated dirty changes. Do not revert or overwrite unrelated files.

Before editing:

1. Read this spec.
2. Read `docs/superpowers/plans/2026-06-09-native-idchat-ui-parity.md`.
3. Skim `generated/native-idchat-design-v2.png`.
4. Read the listed IDChat web reference files.
5. Inspect current `src/chat-native` UI files.

Implementation should use subagent-driven development where possible, with focused commits and review after each task.
