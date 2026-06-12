# Native IDChat Release Hardening Round 3 Implementation Plan

## Operating Mode

Use a new clean development session. Do not continue the failed Round 2 thread.

Recommended workflow:

- Start from a clean worktree based on `main`.
- Inspect `codex/native-idchat-hardening-r2` and `/Users/tusm/.codex/worktrees/5419/IDChat-APP` only as reference material.
- Cherry-pick or reimplement useful Round 2 changes only after inspecting the diff and proving the focused tests.
- Use subagent-driven development for independent slices.
- Keep every slice small enough to review and commit independently.

## Phase 0: Preflight And Boundaries

Goal:

Establish the starting state and prevent another false-ready result.

Steps:

1. Read `AGENTS.md`, the Round 3 spec, Round 2 spec, and the relevant QA runbooks.
2. Run:

   ```bash
   git status --short --branch
   yarn test:chat-native
   yarn jest --runInBand src/wallet/__tests__/mnemonicImport.test.ts
   npm exec tsc -- --noEmit --pretty false
   ```

3. Record current legacy TS errors separately.
4. Inspect the failed Round 2 branch with:

   ```bash
   git log --oneline --decorate --max-count=20 codex/native-idchat-hardening-r2
   git diff --stat main...codex/native-idchat-hardening-r2
   ```

5. Decide which Round 2 commits are safe to reuse. Do not use dirty uncommitted changes as a base.

Verification:

- Preflight results are noted in the final handoff.
- No unrelated dirty files are staged.

## Phase 1: Launch And SQLite Readiness

Goal:

Make simulator launch and old local data deterministic before UI parity work.

Implementation:

1. Fix or preserve the SQLite migration ordering so `message_index` exists before any index/query references it.
2. Keep an old-schema regression test for `messages` without `message_index`.
3. Verify the dev-client launch path loads current JS.
4. If Xcode/Pods need `fmt` or similar workarounds, implement them through source-level config/plugin code and validate clean config generation.
5. Remove or guard dev-only launch helpers from production UI.

Verification:

```bash
yarn jest --runInBand src/chat-native/storage/__tests__/chatDatabase.test.ts
yarn test:chat-native
npx expo config --type public --json
```

Acceptance evidence:

- Current app bundle launches to Native IDChat.
- Chat list appears without SQLite error, red screen, stale JS, or debugger warning overlay.

## Phase 2: Private/Group Decryption Parity

Goal:

Eliminate normal-message decrypt failures in latest windows.

Implementation:

1. Compare web `simple-talk.ts`, `MessageItem.vue`, and `TheInput.vue` with native normalizers/decryption.
2. Add deterministic fixtures for:
   - self-direction private simplemsg
   - peer-direction private simplemsg
   - invalid key/payload failure
3. Ensure native chooses the same peer chat key and ECDH path as web.
4. Ensure native stores enough raw sender/recipient/profile fields to decrypt after local reload.
5. Confirm group text/image paths use the correct group protocol payload and fallback behavior.
6. Keep `Unable to decrypt message.` only for genuinely unsupported messages.

Verification:

```bash
yarn jest --runInBand src/chat-native/services/__tests__/chatMessageDecryption.test.ts
yarn jest --runInBand src/webs/actions/common/__tests__/ecdh.test.ts
yarn test:chat-native
```

Acceptance evidence:

- Private latest room shows readable text.
- Group latest room shows readable text.
- Latest window does not contain repeated decrypt-failure rows for web-readable history.

## Phase 3: Avatar/Profile Hydration

Goal:

Replace blank/initial-only visuals with real avatar images where available and deterministic fallback where not.

Implementation:

1. Identify web avatar/profile sources and native account/profile services.
2. Build one native avatar resolver/service used by:
   - conversation list
   - room header
   - message sender bubbles
   - group info members
   - Me tab
3. Normalize avatar URL fields from channel, profile, member, and account payloads.
4. Add image load error fallback in `ChatAvatar`.
5. Keep deterministic initials/color fallback only for missing or failed avatar images.
6. Avoid all rows using the same pale blank circle.

Verification:

```bash
yarn jest --runInBand src/chat-native/components/__tests__/ChatAvatar.test.tsx
yarn jest --runInBand src/chat-native/services/__tests__/nativeChatAvatar.test.ts
yarn test:chat-native
```

Acceptance evidence:

- Chat list and room screenshots show real avatar images for at least one contact/member when web has one.
- Missing-avatar users show initials/color fallback.
- Me tab shows real avatar if available; otherwise initials fallback without looking blank.

## Phase 4: Me Tab Product Completion

Goal:

Make Me look like a complete account/product screen.

Implementation:

1. Reuse existing native wallet/account screens where possible.
2. Show identity fields: avatar/name, GlobalMetaID, MVC address, BTC address, chat public key, chat key status, socket status.
3. Add product entry rows only for native-supported destinations:
   - Wallet home
   - Wallet accounts
   - Backup/Security
   - Settings if implemented
4. Hide unsupported write operations and dead buttons.
5. Remove unfinished placeholder text and dev-only diagnostics.
6. Ensure copy actions do not trigger paste permission prompts in screenshots.

Verification:

```bash
yarn jest --runInBand src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx
yarn jest --runInBand src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
yarn test:chat-native
```

Acceptance evidence:

- Clean Me screenshot after real import, with no paste prompt, debugger overlay, or placeholder copy.

## Phase 5: Room UI, Group Info, And Composer

Goal:

Close the core product interactions the web app already supports.

Implementation:

1. Room opening:
   - latest window by default
   - upward pagination
   - stable new-message affordance
2. Group info:
   - group avatar/fallback, name, id copy, member count
   - notification status without truncation
   - members with search/load-more and loading/empty states
   - hide unsupported admin/mute-write/dead controls
3. Composer:
   - text send
   - emoji insertion
   - image preview/remove/send
   - quote/reply
   - group mentions
   - failed-send state and retry when safe

Verification:

```bash
yarn jest --runInBand src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
yarn jest --runInBand src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx
yarn jest --runInBand src/chat-native/components/__tests__/MessageList.test.tsx
yarn test:chat-native
```

Acceptance evidence:

- Private latest room.
- Group latest room.
- Older pagination.
- Image bitmap render.
- Composer quote, mention, and image preview.
- Group info members/search/load-more.

## Phase 6: Evidence And Final Verification

Goal:

Make final review independently repeatable.

Implementation:

1. Create one final evidence directory with only passing screenshots.
2. Name files after actual visible state.
3. Remove references to stale or failing screenshots from runbooks.
4. Update runbooks with exact commands, simulator device, bundle id, and residual risks.
5. Ensure no secret material appears in docs, logs, screenshots, commit messages, or buzz posts.

Required final commands:

```bash
git status --short --branch
git diff --check main...HEAD
git diff --check
yarn jest --runInBand src/wallet/__tests__/mnemonicImport.test.ts
yarn test:chat-native
yarn jest --runInBand src/webs/actions/common/__tests__/ecdh.test.ts
npm exec tsc -- --noEmit --pretty false
```

Ready declaration format:

- Commit list.
- Exact verification command results.
- TypeScript legacy/current-path split.
- Final evidence directory and a short mapping of screenshot to acceptance gate.
- Simulator/Computer Use status, including exact blocker if UI automation cannot attach.
- Remaining risks.
- Explicit statement that `git status --short --branch` is clean for tracked files.

## Non-Negotiable Rejection Conditions

Reject the result immediately if any are true:

- Tracked source/test/doc files are dirty after "ready".
- Required tests pass only because untracked source/test files exist.
- Latest evidence shows repeated `Unable to decrypt message.` for normal conversations.
- Evidence filenames do not match visible content.
- Screenshots contain debugger overlays, paste prompts, red screens, or stale bundle states.
- Avatars are claimed fixed while all visible users are only initials/fallback.
- Me tab still looks like a diagnostic/debug card instead of a product screen.
- Product navigation depends on dev-only QA commands or file polling.
