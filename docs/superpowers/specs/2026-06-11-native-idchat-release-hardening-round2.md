# Native IDChat Release Hardening Round 2 Spec

## Purpose

This round moves Native IDChat from "baseline native chat exists" toward a releaseable product. The acceptance bar is the IDChat web app, except red packet features remain out of scope. The first priority is not visual polish. The first priority is that a real account can be imported, the app can launch, local data can migrate, chats can open from local cache, message content including images can decrypt and display, and core chat actions can be completed on an iOS simulator without relying on mock data.

Native app repo:

`/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Web reference repo:

`/Users/tusm/Documents/MetaID_Projects/idchat`

Live test mnemonic file:

`/Users/tusm/Documents/MetaID_Projects/servers/测试用助记词.md`

The mnemonic file is allowed for simulator QA. Do not copy its contents into source code, docs, git commits, terminal logs, screenshots, or buzz posts. Use it only as local test input.

## Current Evidence

Verified in the current simulator before this spec:

- Installed bundle: `com.meta.idchat`, display name `IDChat`.
- Direct simulator launch shows a development-client red screen: `No script URL provided`.
- Opening through Metro reaches the native chat shell, but the chat list renders `Calling the 'execAsync' function has failed -> Caused by: no such column: message_index`.
- The simulator SQLite DB contains old user data: `3` channels and `284` messages.
- `messages` table lacks `message_index`, while `chatDatabase.ts` creates `idx_messages_window` on `message_index` before adding the column.
- `yarn test:chat-native` passes.
- Full `tsc --noEmit` still fails in legacy non-`src/chat-native` files.

This means the app is not releaseable even before deeper feature parity review. Round 2 must unblock real simulator QA first.

## Product Acceptance Standard

The round is accepted only if all of these are true:

- Fresh install path can create or import a wallet without dead screens.
- Importing the live test mnemonic succeeds from the app UI and lands on a usable account state.
- Existing local SQLite data upgrades without breaking the chat list or Me tab.
- Direct app launch mode is understood and documented: either a release/dev build launches without Metro, or the runbook clearly distinguishes dev-client launch from release launch and includes the tested release command.
- Chat list renders from local data before remote sync blocks the UI.
- Opening private and group chats defaults to the latest messages.
- Scrolling upward loads older messages in bounded pages.
- Text messages decrypt and render.
- Image messages decrypt and render when the web app can render them.
- Sending text and image messages works with the live test account.
- New socket or remote messages persist to SQLite before the UI depends on them.
- Group info opens from group rooms and shows real group metadata and members.
- Me tab looks like a complete product screen, not a placeholder.
- No visible red packet UI is introduced.

## P0 Work Items

### 1. Fix SQLite Upgrade Path

Problem:

Existing simulator data fails on startup because `idx_messages_window` references `message_index` before the migration adds the column.

Required implementation:

- In `src/chat-native/storage/chatDatabase.ts`, ensure required columns are added before any index or query references them.
- Add a regression test that creates an old `messages` schema without `message_index`, opens the database, and verifies startup succeeds.
- Verify old rows remain readable after migration.
- Verify `idx_messages_window` exists after migration.

Acceptance:

- The current simulator DB with existing rows no longer shows `no such column: message_index`.
- Chat list and Me tab render without the SQLite startup error.

### 2. Productize Mnemonic Import

Current state:

- `ImportWalletNetNewPage` now validates BIP39 words before deriving wallets.
- It supports 12, 15, 18, 21, and 24 word counts.
- It normalizes pasted input, catches import failures, blocks duplicate submit, writes current wallet/account IDs, and updates the wallet store.
- Tests exist at `src/wallet/__tests__/mnemonicImport.test.ts`.

Round 2 requirements:

- Verify the UI flow on simulator using the live test mnemonic file.
- Do not print the mnemonic, seed, or private key to the console.
- Remove or guard existing sensitive wallet logs encountered on the import path.
- Ensure import after password setup and import from the welcome page use one canonical import implementation.
- Confirm imported account can resolve MVC address, BTC address, GlobalMetaID, and chat public key.
- If `ImportWalletNetPage`, `ImportWalletPage`, `ImportWalletFirstPage`, or `MnemonicImportPage` remain reachable, either route them into the canonical flow or hide them from product navigation.

Acceptance:

- Invalid checksum shows a clear error and does not create a wallet.
- Missing words show a clear error and do not create a wallet.
- Valid test mnemonic imports exactly once on one tap.
- After import, Native IDChat can bootstrap the wallet adapter without "Not connected" placeholders.

### 3. Launch And Build Verification

Required implementation:

- Identify whether the installed simulator app is a dev-client build or a release-like build.
- Add runbook steps for both:
  - dev-client launch through Metro
  - release/debug build launch without Metro, if supported by the current Expo setup
- Fix packaging if a release/debug build still shows `No script URL provided`.

Acceptance:

- QA can start the app from a clean simulator using documented commands.
- The runbook names the tested bundle id, simulator device, and exact launch command.

### 4. Local-First Chat List And Room Open

Required implementation:

- Chat list must render cached channels immediately.
- Room open must load the newest local message window first, not every row.
- Older pagination must use bounded reads and remote fallback.
- Opening a private or group room must land at the latest message by default.
- If the user scrolls up, new messages should show an affordance instead of forcing a jump.

Acceptance:

- Existing local data appears before remote fetch completes.
- Latest room entry is verified for one private chat and one group chat.
- Upward pagination is verified with screenshots and a test.

### 5. Message Content, Image, And Decryption Parity

Required implementation:

- Compare native normalizers/decryption with:
  - `/Users/tusm/Documents/MetaID_Projects/idchat/src/stores/simple-talk.ts`
  - `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/MessageItem.vue`
  - `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/TheInput.vue`
- Ensure private text, private image, group text, and group image messages decrypt correctly.
- Ensure image attachments render the real image with loading, failure, preview, and retry-safe states.
- Ensure messages with missing decrypt keys fail visibly without breaking the room.

Acceptance:

- Send and receive text in a live private chat.
- Send and receive text in a live group chat.
- Send and render at least one live image message using the test account.
- Verify historical image messages render if the web app can render them.

### 6. Composer Core Parity Without Red Packets

Required implementation:

- Keep red packets out of native UI.
- Text send, emoji insertion, image pick/preview/remove/send, quote/reply, and group mention insertion must work.
- Failed sends must remain visible and expose a retry path when safe.
- Disabled states must explain missing public key, not joined, blocked, or unsupported channel states.

Acceptance:

- Simulator evidence for text, emoji, image, quote, and mention send paths.
- Failed send state is visible in mock or controlled failure tests.

### 7. Group Info Surface

Required implementation:

- Implement a native group info sheet/screen from the room header action.
- Show group avatar, name, group id with copy, member count, announcement if available, mute status, and members.
- Member list must support search and pagination.
- Preserve role grouping where available from existing web APIs.
- Tapping a member should provide a private-chat entry when supported.
- If invite/share, mute writes, admin, whitelist, blocklist, or subchannels cannot be fully supported this round, show only non-dead read-only UI and document the exact blocker.

Web reference:

`/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/ChannelMemberListDrawer.vue`

Acceptance:

- One live group info screen is captured in simulator.
- Member search and load-more are tested.
- No dead buttons are visible in product mode.

### 8. Me Tab Completion

Required implementation:

- Me tab must show current account avatar/name, GlobalMetaID, MVC address, BTC address if available, chat public key status, socket status, and copy actions.
- Settings links must point only to native-supported screens.
- Empty or missing data should show product-grade explanations, not "No native settings available yet" placeholders.

Acceptance:

- Me tab after live mnemonic import shows connected account data.
- Me tab without profile data still looks complete and actionable.

## P1 Work Items

- Restore translate and Buzz/share only after native service contracts are wired; otherwise keep them hidden.
- Add unread and mention navigation parity with web.
- Add profile/avatar backfill for private rows, group senders, group members, and Me tab.
- Add fresh-account recommended group or discovery path using real APIs, not mock actions.
- Clean TypeScript debt in modified/native paths and keep legacy failures separated in QA notes.

## Required Verification

Run these commands before asking for review:

```bash
yarn jest --runInBand src/wallet/__tests__/mnemonicImport.test.ts
yarn test:chat-native
npm exec tsc -- --noEmit --pretty false
```

Expected TypeScript rule:

- Full `tsc` may still fail on known legacy files.
- It must not fail in `src/chat-native`, `src/page/ImportWalletNetNewPage.tsx`, `src/wallet/mnemonicImport.ts`, or files modified in this round.

Manual simulator verification must include:

- Screenshot of import page before submit.
- Screenshot or note showing invalid mnemonic error.
- Screenshot after valid import showing connected Me tab.
- Screenshot of chat list with no SQLite error.
- Screenshot of private room latest messages.
- Screenshot of group room latest messages.
- Screenshot of older pagination.
- Screenshot of image message rendered.
- Screenshot of group info sheet.
- Screenshot of composer quote/mention/image preview.

Do not include the mnemonic words in screenshots.

## Developer Workflow

- Read `AGENTS.md` before editing.
- Read this spec and the previous product parity spec:
  - `docs/superpowers/specs/2026-06-11-native-idchat-product-parity-iteration.md`
- Read the web reference files before changing behavior.
- Start from current `main` and do not revert unrelated dirty files.
- Stage and commit only files you changed and understand.
- Keep commits small by work item.
- After each commit, post the required development buzz with Lisa Hahn (`lisa-hahn`) per `AGENTS.md`.

## Stop Conditions

Stop and report a concrete blocker if:

- A required web endpoint is missing after inspecting `/Users/tusm/Documents/MetaID_Projects/idchat/src/api/talk.ts`.
- Live account import works but GlobalMetaID or chat public key cannot be resolved with current backend data.
- Image encryption/decryption differs between native and web and requires protocol clarification.
- A release/debug launch without Metro requires Expo/EAS credentials not present locally.

The blocker report must include the failing file, command, screenshot path when relevant, and the exact next decision needed.
