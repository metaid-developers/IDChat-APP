# Native IDChat Release Hardening Round 3 Reset Spec

## Purpose

Round 3 is a reset after the Round 2 development thread repeatedly declared readiness while still missing product acceptance gates. The goal is not to keep expanding the same context. The goal is to start a clean development session, preserve useful verified ideas from Round 2 only after review, and close the remaining release blockers with a stricter definition of "ready".

Native app repo:

`/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Web reference repo:

`/Users/tusm/Documents/MetaID_Projects/idchat`

Failed Round 2 worktree for reference only:

`/Users/tusm/.codex/worktrees/5419/IDChat-APP`

Failed Round 2 branch for reference only:

`codex/native-idchat-hardening-r2`

Live test mnemonic file:

`/Users/tusm/Documents/MetaID_Projects/servers/测试用助记词.md`

The mnemonic file is allowed for local simulator QA only. Do not copy, print, screenshot, commit, or post the mnemonic, seed, private key, or derived secret material.

## Why Round 2 Is Not Accepted

The Round 2 thread made some real progress, but it cannot be accepted as a release-hardening result because the final state violated basic readiness rules:

- It claimed a clean tracked worktree while `git status` still showed many modified tracked source/test files.
- It left untracked source/test files such as QA runtime command helpers, plus untracked final evidence and generated `ios/`.
- Final screenshots were not trustworthy: several filenames described private/group/image room states while the actual image was still the chat list.
- A final screenshot still showed many `Unable to decrypt message.` rows in a private room, plus `Open debugger to view warnings.`
- Avatars improved from blank circles to initials, but no final evidence proved real avatar image hydration where the web app can show avatars.
- Computer Use could not attach to Simulator (`cgWindowNotFound`), so interactive smoke claims were not independently repeatable.

Round 3 must treat those as blocking process and product failures, not cosmetic issues.

## Source-Of-Truth Rules

- IDChat web is the functional reference except red packet features remain out of scope.
- Telegram-like mobile behavior may be used for native layout decisions, but not to remove IDChat web functionality.
- The failed Round 2 branch may be inspected for possible fixes. Do not blindly merge or cherry-pick it.
- If a Round 2 commit is reused, inspect the diff, run the focused tests, and keep it in a small commit.
- Do not use uncommitted Round 2 worktree changes as a base. Reimplement or intentionally cherry-pick reviewed patches only.
- Do not leave product UI wired to dev-only QA commands, clipboard polling, or file-command hacks.

## Product Acceptance Gates

Round 3 is accepted only if all gates below pass.

### Gate 1: Repository Readiness

Ready means:

- `git status --short --branch` has no modified tracked files.
- Only explicitly documented local generated files may remain untracked, and they must not be required for the feature to work.
- Any final evidence that the runbook references is tracked, current, and minimal.
- Intermediate failed/debug screenshots are not referenced as passing evidence.
- No committed docs or logs include the live mnemonic or secrets.
- Every commit has the required Lisa Hahn development journal buzz per `AGENTS.md`.

### Gate 2: Launch And Simulator State

The app must be launchable in a documented way on iOS simulator:

- Clean dev-client launch through Metro is documented with exact commands.
- If a release/debug launch without Metro is supported, document the command and bundle id.
- If Xcode/Pods require a workaround, it must be source-level and reproducible from a clean prebuild, not a manual edit inside generated `ios/Pods`.
- The installed app must load current JS, not a stale bundle.
- The chat list must not show SQLite schema errors, red screens, or debugger warning overlays.

### Gate 3: Real Mnemonic Import

The native import flow must:

- Show clear missing-word and invalid-checksum errors without creating a wallet.
- Import the live test mnemonic once with one submit action.
- Land on a usable Native IDChat state with GlobalMetaID, MVC address, BTC address, chat public key, and socket/chat-key status.
- Avoid sensitive logs on the import path.
- Route reachable import pages into one canonical import implementation or hide unsupported paths.

### Gate 4: Local-First Latest-Window Chat

The chat list and rooms must:

- Render cached SQLite channels/messages before remote sync blocks UI.
- Open private and group rooms at the latest local window by default.
- Load older messages with bounded upward pagination.
- Persist remote/socket updates to SQLite before UI depends on them.
- Avoid forced jumps when new messages arrive while the user is reading older history.

### Gate 5: Private And Group Decryption Parity

Native decryption must match web-compatible behavior:

- Private self-direction and peer-direction simplemsg messages decrypt when web can decrypt them.
- Group text messages render real plaintext when web can render them.
- Group image and private image messages render bitmap content when web can render them.
- Only truly missing key, malformed payload, or protocol-incompatible messages show `Unable to decrypt message.`
- A latest window must not show rows of decrypt failures for normal web-readable history.

Required web references:

- `/Users/tusm/Documents/MetaID_Projects/idchat/src/stores/simple-talk.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/MessageItem.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/TheInput.vue`

### Gate 6: Real Avatar Hydration

Initials fallback is not enough to claim avatar parity.

Native surfaces must attempt real avatar image hydration wherever the web app has enough profile data:

- Conversation list private rows.
- Conversation list group rows.
- Room headers.
- Private and group message sender bubbles.
- Group info member rows.
- Me tab account card.

Fallback requirements:

- If the web/profile source has no avatar, show deterministic initials and color.
- If an avatar URL fails to load, fall back to initials without a blank pale circle.
- If at least one visible contact/member has a real avatar in web, the native evidence must show at least one real avatar image.
- Do not claim "avatars fixed" when all visible rows are initials.

### Gate 7: Me Tab Product Surface

The Me tab must look like an app screen, not a debug page:

- Show avatar/name, GlobalMetaID, MVC address, BTC address, chat public key, chat key status, socket status, and copy actions.
- Reuse existing native wallet/account capabilities for Wallet home, Wallet accounts, Backup/Security, and Settings where available.
- Hide unsupported write operations or show read-only product copy without dead buttons.
- Do not show `No native settings available yet`, dev-only diagnostics, paste prompts, or secret material.
- A clean screenshot after real import must show no system permission prompt or debugger warning overlay.

### Gate 8: Group Info Product Surface

The group info surface must:

- Open from the room info action.
- Show group avatar/fallback, name, group id copy action, member count, mute/notification status, announcement if available, and member list.
- Support member search and load-more with loading/empty states.
- Avoid clipped titles, truncated core status text, and all-blank avatars.
- Hide unsupported admin/invite/mute-write controls instead of leaving dead buttons.

### Gate 9: Composer Core Parity

Without red packets, the composer must support:

- Text send.
- Emoji insertion.
- Image pick, preview, remove, and send.
- Quote/reply preview and send.
- Group mention insertion.
- Visible failed-send state and safe retry path.
- Disabled states for missing public key, not joined, blocked, or unsupported channel.

### Gate 10: Evidence Integrity

Final evidence must be small, current, and named after what it actually shows:

- Import empty state.
- Missing/invalid mnemonic error.
- Valid import to clean Me tab.
- Chat list with readable previews and avatars/fallbacks.
- Private latest room with readable text.
- Group latest room with readable text.
- Upward pagination.
- Image bitmap render.
- Composer quote, mention, and image preview.
- Group info with members/search/load-more.

Do not use screenshots with debugger overlays, paste permission prompts, red screens, stale bundles, or mismatched filenames as passing evidence.

## Required Automated Verification

Run before declaring ready:

```bash
git status --short --branch
git diff --check main...HEAD
git diff --check
yarn jest --runInBand src/wallet/__tests__/mnemonicImport.test.ts
yarn test:chat-native
yarn jest --runInBand src/webs/actions/common/__tests__/ecdh.test.ts
npm exec tsc -- --noEmit --pretty false
```

TypeScript rule:

- Full `tsc` may still fail on known legacy files.
- It must not fail in `src/chat-native`, current modified files, native launch/plugin files, mnemonic import files, or new tests.
- The final report must list legacy TS errors separately from current-path errors.

## Required Focused Tests

Add or keep focused tests for:

- Old SQLite schema migration adds `message_index` before indexes/queries.
- Private simplemsg decrypts both self and peer direction with web-compatible fixtures.
- Invalid/missing decrypt keys fail as one message, not as a room crash.
- ECDH defaults to the current web-compatible MVC account path.
- Avatar hydration passes `avatarUri` into conversation list, room header, message sender, group member, and Me surfaces.
- Avatar load failure falls back to initials deterministically.
- Me tab includes product account/wallet entry points and excludes unfinished placeholders.
- Group info layout avoids clipped status/title text.
- Image message loading/failure/success states render correctly.
- Composer quote/mention/image preview states render correctly.

## Developer Workflow

- Read `AGENTS.md` first.
- Read this spec and the implementation plan for Round 3.
- Read the Round 2 spec for historical context, but do not inherit its failed acceptance claims.
- Prefer `superpowers:subagent-driven-development`: split decryption, avatars/profile, Me tab, group info, launch/build, and QA evidence into independent reviewable slices.
- Use small commits by work item.
- Stage only files changed and understood.
- Post the required Lisa Hahn buzz after every commit.
- Stop and report rather than declaring ready if the worktree is dirty, evidence is mismatched, or simulator smoke cannot be independently reproduced.

## Stop Conditions

Stop and report a blocker if:

- Web shows a message/avatar that native cannot resolve after endpoint and schema comparison.
- A release/debug build requires credentials or toolchain state unavailable locally.
- Computer Use cannot attach and no alternate deterministic input path can prove the required interaction.
- The app needs dev-only QA runtime hooks to open normal product screens.
- Any required fix depends on changing protocol semantics rather than matching web behavior.

The blocker report must include exact file paths, commands, screenshot paths, and the decision needed.
