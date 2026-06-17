# Native IDChat P1.2.5 Release Readiness Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the current Native IDChat `main` branch is release-credible on live simulator data, then fix only visible P1.2.5 release blockers that affect P1.1/P1.2 surfaces before P1.3 starts.

**Architecture:** Treat P1.2.5 as an evidence-first release gate, not a feature batch. Start with a live simulator audit on current `main` with mock state disabled, classify every finding by the P1.2.5 release-blocker definition, then make the smallest focused code changes needed for blocker containment. Keep deterministic mock screenshots only for unsafe or impractical edge states, and label them as supplemental rather than live acceptance.

**Tech Stack:** React Native 0.79, Expo SDK 53, Zustand store, Jest, TypeScript, iOS Simulator, `expo-image`, `xcrun simctl`, Metro dev-client.

---

## Current Baseline Confirmed During Plan Authoring

- Repository: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Current branch: `main`
- Current status: `## main...origin/main [ahead 41]`
- Current HEAD: `d1894c6 docs: add native idchat p1.2.5 stabilization spec`
- Recent baseline commits:
  - `71b9405 fix: merge native chat avatar rendering`
  - `dd1969d fix: render native chat avatars from content endpoint`
  - `63d8dc8 feat: merge native idchat p1.2 room productization`
- `dd1969d` and `71b9405` are both ancestors of current HEAD.
- Avatar endpoint work is already baseline. Do not reopen avatar implementation unless Task 2 visual acceptance proves a remaining blocker.

## Non-Negotiable Scope Boundaries

- P1.2.5 is a release-readiness gate between P1.2 and P1.3. It is not a broad redesign and not a new parity phase.
- Do not implement red packet creation, claiming, rendering parity, action surfacing, or composer entry.
- Do not implement full group management: invite, kick, admin, owner transfer, mute writes, whitelist, permission edits, or member role writes.
- Do not implement full composer parity: non-image file types, stickers, advanced emoji parity, translation, Buzz sharing, fee selector parity, command palette, or subchannel authoring.
- Do not implement Android, TestFlight, EAS, App Store signing, release channels, or production deployment.
- Do not implement WebView fallback.
- Do not change protocols, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, shared-secret diagnostics, or live sending flows.
- Do not send live messages, upload live media, or expose sensitive account material unless the user explicitly approves the account, room, and exact test content.
- Do not print, screenshot, commit, or buzz mnemonic, private key, seed phrase, shared secret, QA wallet secret, decrypted sensitive live message content, or private message bodies.
- Public IDs may appear only where they are already product UI under audit. Do not make unbounded txids, pin IDs, raw JSON, raw ciphertext, `Unknown point format`, stack traces, or raw exception names primary product UI.

## Live Evidence Vs Mock Evidence

- A screenshot is live evidence only when the evidence logs prove:
  - `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO` is unset;
  - `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST` is unset;
  - embedded Expo `extra.nativeIdchatMockScenario` is absent or removed from the app bundle/config under test;
  - the screenshot was captured from the live dev-client run recorded in the same evidence directory.
- Deterministic mock evidence is allowed only for edge states that are unsafe or impractical to trigger live, such as keyboard-with-action-sheet, load-earlier failure, latest/new-message timing, unavailable media, disabled composer, and no-result/failure states.
- Mock screenshots must use `mock-` filenames or be listed under a mock-only evidence section. Mock screenshots cannot substitute for the live list, live private room, live group room, live search/discovery, live Online Bot, live Group info entry, live Me/account entry, and live navigation acceptance.

## Evidence Directory

All P1.2.5 execution evidence goes under:

`docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/`

Required evidence structure:

- `README.md`
- `logs/git-status-before.txt`
- `logs/git-status-after.txt`
- `logs/git-log-under-test.txt`
- `logs/mock-mode-proof-live.txt`
- `logs/metro-live.log`
- `logs/simctl-devices.txt`
- `logs/simctl-bootstatus.log`
- `logs/simctl-openurl-live.log`
- `logs/simctl-screenshot-live.log`
- `logs/yarn-test-chat-native.log`
- `logs/git-diff-check.log`
- `logs/tsc-noemit.log`
- `logs/tsc-chat-native-filter.log`
- redacted live screenshots for chat list, local search, remote discovery, Online Bot, private room, group room, message action sheet, group info, Me/account, and route cycling
- mock screenshots only where the README says live reproduction was unsafe or impractical

## Shared Verification Commands

Use these commands after every task that changes code, tests, or evidence docs:

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-2-5-tsc.log > /tmp/idchat-p1-2-5-tsc-chat-native-filter.log || true
```

Expected:

- `yarn test:chat-native` exits 0. This is the primary regression gate.
- `git diff --check` exits 0.
- Full `tsc --noEmit` may exit nonzero because of existing non-`src/chat-native` errors.
- `/tmp/idchat-p1-2-5-tsc-chat-native-filter.log` is empty. Any `src/chat-native` line is a blocker and must be fixed before committing.

Docs-only tasks may use:

```bash
git diff --check -- docs/superpowers
rg -n "TB[D]|TO[D]O|FIXM[E]|优化体[验]|optimi[sz]e experience" docs/superpowers/plans/2026-06-17-native-idchat-p1-2-5-release-readiness-stabilization.md
```

Expected:

- `git diff --check -- docs/superpowers` exits 0.
- The `rg` scan prints no matches.

## Commit And Buzz Rules For Execution

- Use a `codex/` branch or isolated worktree for execution, such as `codex/native-idchat-p1-2-5-release-readiness-stabilization`.
- Stage and commit only files changed and understood for the current task.
- Prefer one commit per independent, verified unit.
- After every commit, post a Lisa Hahn development-journal buzz:

```bash
$HOME/.metabot/bin/metabot buzz post --from lisa-hahn --request-file /tmp/idchat-p1-2-5-buzz/task-N.json
```

- Buzz content must include the task name, short commit hash, verification summary, and evidence path when applicable.
- Buzz content must not include secrets, decrypted message text, raw private screenshots, or sensitive logs.

## File Map

Create during execution:

- `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/README.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/*`
- redacted screenshots under `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/`

Likely code/test files if live evidence proves blockers:

- First screen and discovery:
  - `src/chat-native/screens/NativeChatHomePage.tsx`
  - `src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts`
  - `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
  - `src/chat-native/components/ConversationList.tsx`
  - `src/chat-native/components/__tests__/ConversationList.test.ts`
  - `src/chat-native/components/OnlineBotPanel.tsx`
  - `src/chat-native/components/__tests__/OnlineBotPanel.test.tsx`
  - `src/chat-native/services/nativeChatDiscoveryService.ts`
  - `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`
  - `src/chat-native/ui/chatUiSelectors.ts`
  - `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- Avatar visual acceptance only if remaining blockers are found:
  - `src/chat-native/ui/avatarSource.ts`
  - `src/chat-native/ui/__tests__/avatarSource.test.ts`
  - `src/chat-native/components/ChatAvatar.tsx`
  - `src/chat-native/components/__tests__/ChatAvatar.test.tsx`
  - `src/chat-native/services/chatNormalizers.ts`
  - `src/chat-native/services/nativeChatProfileService.ts`
- Room, action, keyboard, and pagination:
  - `src/chat-native/screens/NativeChatRoomPage.tsx`
  - `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
  - `src/chat-native/components/MessageList.tsx`
  - `src/chat-native/components/__tests__/MessageList.test.tsx`
  - `src/chat-native/components/MessageBubble.tsx`
  - `src/chat-native/components/__tests__/MessageBubble.test.tsx`
  - `src/chat-native/components/MessageActionSheet.tsx`
  - `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
  - `src/chat-native/components/ChatComposer.tsx`
  - `src/chat-native/services/__tests__/nativeChatSendService.test.ts`
  - `src/chat-native/ui/chatRoomUi.ts`
  - `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
  - `src/chat-native/ui/messageActions.ts`
  - `src/chat-native/ui/__tests__/messageActions.test.ts`
  - `src/chat-native/ui/chatUiFormatters.ts`
  - `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
- Group info and Me/account containment:
  - `src/chat-native/components/GroupInfoDrawer.tsx`
  - `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
  - `src/chat-native/screens/NativeChatMePage.tsx`
  - `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
  - `src/chat-native/components/NativeChatAccountCard.tsx`
  - `src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx`
  - `src/chat-native/services/nativeChatGroupInfoService.ts`
  - `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`
- Mock fixtures only when supplemental state coverage is needed:
  - `src/chat-native/dev/nativeChatUiMockScenario.ts`
  - `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
  - `src/chat-native/dev/nativeChatMockScenario.ts`
  - `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`

## Task 0: Preflight, Branch/Worktree, And Baseline Verification

**Purpose:** Establish a clean execution boundary before simulator or code work.

**Files likely touched:** none unless creating evidence logs for baseline. If logs are kept, create only the P1.2.5 evidence directory and baseline logs listed above.

**Entry criteria:**

- Current checkout is the source repo at `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`.
- No product implementation is started in this task.
- If execution uses a separate worktree, create it with `superpowers:using-git-worktrees` and a `codex/` branch.

- [ ] Confirm repository state.

  Run:

  ```bash
  git status --short --branch
  git branch --show-current
  git log --oneline --decorate --max-count=12
  git merge-base --is-ancestor dd1969d HEAD
  git merge-base --is-ancestor 71b9405 HEAD
  ```

  Expected:

  - Branch is `main` before branching, or the new execution branch descends from current `main`.
  - `dd1969d` and `71b9405` are ancestors.
  - Any unrelated dirty files are ignored unless they block execution.

- [ ] Create the execution branch or worktree.

  Recommended branch:

  ```bash
  git switch -c codex/native-idchat-p1-2-5-release-readiness-stabilization
  ```

  Expected:

  - Work starts off `main` that includes P1.2 and avatar endpoint fixes.
  - No implementation files have changed yet.

- [ ] Run baseline verification.

  Run:

  ```bash
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-baseline-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-baseline-tsc.log > /tmp/idchat-p1-2-5-baseline-tsc-chat-native-filter.log || true
  ```

  Expected:

  - `yarn test:chat-native` passes.
  - `git diff --check` passes.
  - The chat-native TypeScript filter file is empty.

**Evidence/log requirements:**

- Save `git status --short --branch` to `logs/git-status-before.txt`.
- Save `git log --oneline --decorate --max-count=12` to `logs/git-log-under-test.txt`.
- Save baseline verification logs if evidence directory is created in this task.

**Completion criteria:**

- Execution branch/worktree is ready.
- Baseline verification is recorded.
- No code changes are made.

## Task 1: Evidence-First Live Simulator Audit On Current Main

**Purpose:** Produce live truth before deciding what to fix.

**Files likely touched:**

- Create/modify: P1.2.5 evidence directory `README.md`, logs, and redacted screenshots.
- No product code files should be touched in this task.

**Entry criteria:**

- Task 0 baseline is complete.
- Mock state is absent before launch.
- Audit starts from current `main` or a branch with no product edits beyond baseline.

- [ ] Prove mock state is disabled.

  Run and save output to `logs/mock-mode-proof-live.txt`:

  ```bash
  printenv | rg "EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" || true
  node -e "const cfg=require('./app.config.js'); const out=typeof cfg==='function'?cfg({config:{}}):cfg; console.log(JSON.stringify(out.expo?.extra ?? out.extra ?? {}, null, 2));" | rg "nativeIdchatMock" || true
  ```

  Expected:

  - No environment mock scenario is set for the live run.
  - No embedded `nativeIdchatMockScenario` value is present for live acceptance.

- [ ] Start the live dev-client and simulator.

  Run:

  ```bash
  env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
    -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
    npx --no-install expo start --dev-client --host localhost --port 8081 --clear
  ```

  In another terminal, run:

  ```bash
  xcrun simctl list devices
  xcrun simctl bootstatus <UDID> -b
  xcrun simctl openurl <UDID> 'com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
  ```

  Expected:

  - The live Native app opens without mock labels or mock-only list data.
  - No red screen, warning overlay, or Metro fatal error appears.

- [ ] Capture redacted live screenshots.

  Required live screenshots:

  - `01-live-chat-list-redacted.png`
  - `02-live-local-search-match-redacted.png`
  - `03-live-local-search-no-result-redacted.png`
  - `04-live-remote-discovery-loading-or-result-redacted.png`
  - `05-live-remote-discovery-no-result-or-failure-redacted.png`
  - `06-live-online-bot-panel-redacted.png`
  - `07-live-private-room-redacted.png`
  - `08-live-group-room-redacted.png`
  - `09-live-message-actions-redacted.png`
  - `10-live-group-info-redacted.png`
  - `11-live-me-account-redacted.png`
  - `12-live-route-cycle-back-to-chats-redacted.png`

  Expected:

  - Private/group message bodies and previews are redacted if sensitive.
  - Layout, avatar, clipping, action availability, and product-copy evidence remain visible after redaction.

- [ ] Write the first audit README.

  Required sections:

  - commit under test;
  - simulator device, runtime, UDID;
  - commands used;
  - mock-mode proof;
  - sensitive-data handling;
  - live screenshot inventory;
  - PASS/FAIL per area: list, avatars, search, discovery, Online Bot, private room, group room, actions, group info, Me, navigation;
  - finding classification: P1.2.5 blocker, P1.3 deferral, P2/P3 polish, or no issue.

**Acceptance command:**

```bash
git diff --check -- docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616
```

**Completion criteria:**

- A reviewer can distinguish live from mock evidence without asking the agent.
- At least one concrete PASS/FAIL blocker list exists before any code fix.
- If no P1.2.5 blockers are found, Tasks 2 through 5 become verification-only and the execution can skip directly to Task 6.

## Task 2: Avatar Visual Acceptance And Remaining Avatar Blockers Only If Any

**Purpose:** Verify the already-merged avatar endpoint fix visually, and fix only remaining avatar blockers proven by Task 1.

**Files likely touched if blocker exists:**

- `src/chat-native/ui/avatarSource.ts`
- `src/chat-native/ui/__tests__/avatarSource.test.ts`
- `src/chat-native/components/ChatAvatar.tsx`
- `src/chat-native/components/__tests__/ChatAvatar.test.tsx`
- `src/chat-native/services/chatNormalizers.ts`
- `src/chat-native/services/nativeChatProfileService.ts`
- evidence README and avatar screenshots

**Entry criteria:**

- Task 1 live chat list and room evidence exists.
- The evidence shows either PASS for avatar visual acceptance or a specific blocker such as blank settled avatar circles, JSON-returning URL passed to image rendering, Web-renderable avatar missing in Native, or broken room header avatar.
- Do not edit avatar code if Task 1 proves visual PASS.

- [ ] If avatar PASS, document containment and skip code.

  Required README text:

  - `dd1969d` and `71b9405` are baseline;
  - visible rows/headers use image avatars where live data provides Web-renderable avatars;
  - fallback initials are visible where no image is available;
  - no final avatar URL points at `/metafile-indexer/api/v1/files/accelerate/content/`.

- [ ] If avatar FAIL, write a focused failing test before editing.

  Use the smallest relevant test target:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/avatarSource.test.ts src/chat-native/components/__tests__/ChatAvatar.test.tsx
  ```

  Expected before fix:

  - The new test fails because the observed blocker is reproduced.

- [ ] Implement the minimal avatar blocker fix.

  Constraints:

  - Keep the content endpoint baseline intact.
  - Do not change profile or avatar semantics that are not part of the failing evidence.
  - Preserve deterministic initials fallback while loading and after failure.

- [ ] Verify avatar fix.

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/avatarSource.test.ts src/chat-native/components/__tests__/ChatAvatar.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-avatar-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-avatar-tsc.log > /tmp/idchat-p1-2-5-avatar-tsc-chat-native-filter.log || true
  ```

  Expected:

  - Focused avatar tests pass.
  - Full chat-native suite passes.
  - TypeScript filter is empty.

**Screenshot/log requirements:**

- Before screenshot from Task 1 if avatar FAIL.
- After screenshot showing list and at least one room header.
- README states whether the account had any Web-renderable visible avatar. If none, include only non-sensitive query/proof of avatar availability.

**Completion criteria:**

- Avatar acceptance is PASS or a remaining failure is explicitly listed as a release blocker with next action.
- Avatar code is untouched when visual acceptance already passes.

## Task 3: First-Screen List, Search, Discovery, And Online Bot Blocker Fixes

**Purpose:** Make the first screen release-credible without expanding into new discovery features.

**Files likely touched if blockers exist:**

- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts`
- `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/__tests__/ConversationList.test.ts`
- `src/chat-native/components/OnlineBotPanel.tsx`
- `src/chat-native/components/__tests__/OnlineBotPanel.test.tsx`
- `src/chat-native/services/nativeChatDiscoveryService.ts`
- `src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- evidence README and first-screen screenshots

**Entry criteria:**

- Task 1 classifies at least one first-screen issue as a P1.2.5 blocker, or proves PASS.
- Blocker examples: raw JSON-like profile text, raw ciphertext preview, generic unavailable copy dominating without explanation, blank settled rows, clipped Online Bot title, dead primary action, unbounded ID as headline, no search no-result state, or route warning overlay.

- [ ] If no blocker exists, record PASS and skip code.

  README must cite screenshots for list, search, discovery, Online Bot, and route cycling.

- [ ] For each blocker, write the narrow failing test first.

  Choose the smallest target that owns the behavior:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/ConversationList.test.ts
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/OnlineBotPanel.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/chatUiSelectors.test.ts
  yarn test:chat-native --runTestsByPath src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts
  ```

  Expected before fix:

  - At least one focused test fails for the blocker being fixed.

- [ ] Apply minimal first-screen fix.

  Allowed fix classes:

  - product-copy containment for raw/debug content;
  - clipping, spacing, density, and safe-area fixes that directly affect first-screen quality;
  - hiding or disabling dead primary controls;
  - bounded previews and IDs;
  - loading, empty, no-result, and failure states in existing flows.

  Disallowed:

  - new Online Bot product direction;
  - new discovery protocol;
  - WebView fallback;
  - live message sending;
  - P1.3 account/group redesign.

- [ ] Verify first-screen fix.

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/components/__tests__/OnlineBotPanel.test.tsx src/chat-native/ui/__tests__/chatUiSelectors.test.ts src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-first-screen-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-first-screen-tsc.log > /tmp/idchat-p1-2-5-first-screen-tsc-chat-native-filter.log || true
  ```

  Expected:

  - Focused and full tests pass.
  - TypeScript filter is empty.

**Screenshot/log requirements:**

- Updated live screenshots for chat list, local search match, local search no-result, discovery result/failure or mock-labeled failure, Online Bot, and back-to-list route cycle.
- Redact private preview text when needed while preserving layout evidence.
- README maps each fixed blocker to before/after evidence.

**Completion criteria:**

- The Chats tab looks like a real chat app after data settles.
- Search/discovery/Online Bot primary surfaces show product copy and no raw/debug content.

## Task 4: Room, Action, Keyboard, And Pagination Blocker Fixes

**Purpose:** Stabilize room-level visible blockers from P1.2 without reopening full composer parity.

**Files likely touched if blockers exist:**

- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/__tests__/MessageList.test.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/__tests__/MessageBubble.test.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/services/__tests__/nativeChatSendService.test.ts`
- `src/chat-native/ui/chatRoomUi.ts`
- `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
- `src/chat-native/ui/messageActions.ts`
- `src/chat-native/ui/__tests__/messageActions.test.ts`
- `src/chat-native/ui/chatUiFormatters.ts`
- `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
- `src/chat-native/dev/nativeChatUiMockScenario.ts`
- `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
- evidence README and room screenshots

**Entry criteria:**

- Task 1 live room/action/navigation evidence exists.
- Any proposed room fix is tied to a P1.2.5 blocker: raw/debug content, unbounded ID dominance, blank media, clipped header/composer, keyboard covering composer, dead action, broken load-earlier/latest state, red screen, warning overlay, or impossible back navigation.

- [ ] If live room PASS, document PASS and use mock only for supplemental edge states.

  README must separately list live room PASS and mock-only edge coverage.

- [ ] Write the narrow failing test for each room blocker.

  Choose the smallest target:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/MessageList.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/MessageBubble.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/MessageActionSheet.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/messageActions.test.ts
  yarn test:chat-native --runTestsByPath src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts
  ```

  Expected before fix:

  - The focused test reproduces the blocker.

- [ ] Apply minimal room fix.

  Allowed fix classes:

  - product containment of raw ciphertext, raw JSON, stack traces, low-level crypto errors, full txids, and URI internals;
  - action-sheet hierarchy and action gating for already implemented native actions;
  - safe keyboard/composer layout and safe-area fixes;
  - bounded media placeholders;
  - pagination/latest copy and state containment;
  - route-cycle stability.

  Disallowed:

  - red packet behavior;
  - translate, Share to Buzz, reactions, delete/edit/pin/admin actions;
  - full image gallery or non-image attachment parity;
  - full send retry unless the blocker is a visible broken state and no new protocol behavior is required.

- [ ] Verify room fix.

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx src/chat-native/components/__tests__/MessageList.test.tsx src/chat-native/components/__tests__/MessageBubble.test.tsx src/chat-native/components/__tests__/MessageActionSheet.test.tsx src/chat-native/ui/__tests__/messageActions.test.ts src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-room-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-room-tsc.log > /tmp/idchat-p1-2-5-room-tsc-chat-native-filter.log || true
  ```

  Expected:

  - Focused and full tests pass.
  - TypeScript filter is empty.

**Screenshot/log requirements:**

- Updated live private and group room screenshots after fixes.
- Updated live or mock-labeled screenshots for message actions, keyboard-open composer, load-earlier/no-more/failure, latest/new-message affordance, media unavailable, and route cycle.
- README states exactly why any mock state could not be safely produced live.

**Completion criteria:**

- Private and group rooms are understandable without reading protocol internals.
- Message action sheet prioritizes implemented user actions, not raw identifiers.
- Keyboard and pagination evidence either passes live or is covered by clearly labeled deterministic mock evidence.

## Task 5: Group Info And Me/Account Entry Containment, Not Full P1.3

**Purpose:** Contain secondary-surface blockers enough that they do not undermine release readiness, while deferring full P1.3 group/account work.

**Files likely touched if blockers exist:**

- `src/chat-native/components/GroupInfoDrawer.tsx`
- `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
- `src/chat-native/screens/NativeChatMePage.tsx`
- `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
- `src/chat-native/components/NativeChatAccountCard.tsx`
- `src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx`
- `src/chat-native/services/nativeChatGroupInfoService.ts`
- `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`
- evidence README and secondary-surface screenshots

**Entry criteria:**

- Task 1 captured live group info and Me/account entry screenshots.
- Any proposed fix is containment only: clipped controls, debug headline copy, dead primary action, raw IDs dominating visible layout, or secret-risk presentation.

- [ ] If secondary surfaces PASS for containment, document P1.3 deferrals and skip code.

  README must state which group/account issues are P1.3 deferrals and why they are not P1.2.5 blockers.

- [ ] Write the narrow failing test for each blocker.

  Run the relevant target:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx
  yarn test:chat-native --runTestsByPath src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts
  ```

  Expected before fix:

  - The focused test reproduces clipped/debug/dead-action/secret-risk behavior.

- [ ] Apply minimal containment fix.

  Allowed fix classes:

  - hide or reword debug-only visible status such as `Notification status unknown`;
  - bound member rows and public IDs;
  - prevent clipped primary controls;
  - hide dead settings/account actions or make them read-only product copy;
  - preserve public identifier copy feedback.

  Disallowed:

  - invite/admin/member role writes;
  - mute writes or notification-state protocol work;
  - account redesign;
  - key recovery, mnemonic/private key/seed/shared-secret surfaces.

- [ ] Verify containment fix.

  Run:

  ```bash
  yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-secondary-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-secondary-tsc.log > /tmp/idchat-p1-2-5-secondary-tsc-chat-native-filter.log || true
  ```

  Expected:

  - Focused and full tests pass.
  - TypeScript filter is empty.

**Screenshot/log requirements:**

- Updated live Group info screenshot.
- Updated live Me/account screenshot and public-copy-feedback screenshot if copy behavior is affected.
- README lists P1.3 deferrals separately from fixed P1.2.5 blockers.

**Completion criteria:**

- Group info entry opens safely without clipped primary content or debug headline copy.
- Me/account entry exposes only public identity/status fields, no secrets, and no dead primary action.

## Task 6: Final Evidence Package And PASS/FAIL Readout

**Purpose:** Produce the final reproducible release-readiness package.

**Files likely touched:**

- `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/README.md`
- final logs and screenshots under the same evidence directory
- no product code unless a final verification-only doc correction is needed

**Entry criteria:**

- Task 1 audit exists.
- Tasks 2 through 5 are either PASS-without-code or fixed and verified.
- No uncommitted product code is left unverified.

- [ ] Run final automated gate.

  Run and save logs:

  ```bash
  yarn test:chat-native 2>&1 | tee docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/yarn-test-chat-native.log
  git diff --check 2>&1 | tee docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/git-diff-check.log
  npm exec tsc -- --noEmit --pretty false > docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/tsc-noemit.log 2>&1; true
  rg -n "src/chat-native" docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/tsc-noemit.log > docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/tsc-chat-native-filter.log || true
  git status --short --branch > docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/logs/git-status-after.txt
  ```

  Expected:

  - `yarn test:chat-native` passes.
  - `git-diff-check.log` shows success.
  - `tsc-chat-native-filter.log` is empty.

- [ ] Run final live simulator pass.

  Required:

  - mock disabled proof refreshed;
  - redacted live screenshots refreshed for all primary areas;
  - no red screen or warning overlay;
  - no forbidden sensitive or debug content in committed evidence.

- [ ] Add supplemental mock evidence only where needed.

  Conditions:

  - README says the state is mock.
  - Mock evidence does not replace the live acceptance path.
  - Mock evidence contains no secrets and no private message content.

- [ ] Finalize README PASS/FAIL readout.

  Required sections:

  - result: PASS or FAIL;
  - commit under test;
  - verification commands and status;
  - live/mock evidence boundary;
  - screenshot inventory;
  - sensitive-data handling;
  - blocker table with status;
  - P1.3/P2/P3 deferrals;
  - exact next action if FAIL.

**Acceptance command:**

```bash
git diff --check -- docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616
rg -n "mnemonic|private key|seed phrase|shared secret|QA wallet secret|U2Fsd|Unknown point format|TB[D]|TO[D]O|FIXM[E]" docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616
```

Expected:

- `git diff --check` passes.
- The `rg` scan prints no committed evidence leaks or placeholders. Public warnings inside this plan/spec are not evidence leaks; committed P1.2.5 evidence must not contain them.

**Completion criteria:**

- Evidence package is sufficient for another agent to reproduce the release-readiness judgment.
- PASS means no P1.2.5 release blockers remain.
- FAIL means the README names exact blockers and recommended next action.

## Task 7: Code Review, Verification, And Mergeback Handoff

**Purpose:** Prepare the completed stabilization branch for user review and later mergeback without starting extra implementation.

**Files likely touched:**

- No new files required.
- Optional: evidence README correction only if review finds traceability gaps.

**Entry criteria:**

- Task 6 evidence package is complete.
- All intended commits are present on the execution branch.
- No non-scope features were added.

- [ ] Run final local review commands.

  Run:

  ```bash
  git status --short --branch
  git log --oneline --decorate --max-count=16
  git diff --stat main...HEAD
  yarn test:chat-native
  git diff --check
  npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-2-5-final-tsc.log 2>&1; true
  rg -n "src/chat-native" /tmp/idchat-p1-2-5-final-tsc.log > /tmp/idchat-p1-2-5-final-tsc-chat-native-filter.log || true
  ```

  Expected:

  - Worktree has only expected changes before final staging.
  - Full chat-native tests pass.
  - TypeScript filter is empty.

- [ ] Perform code review before mergeback.

  Required:

  - Use `superpowers:requesting-code-review` or the user's requested review process.
  - Review focus: scope containment, evidence sufficiency, live/mock boundary, secret handling, no P1.3/red-packet/WebView/Android expansion, and test coverage for each code fix.

- [ ] Prepare mergeback handoff.

  Handoff notes must include:

  - branch name;
  - commits;
  - final PASS/FAIL result;
  - evidence directory;
  - verification summary;
  - any remaining P1.3/P2/P3 deferrals.

  Do not merge into `main` until the user reviews and explicitly asks for mergeback. When merging, use:

  ```bash
  git switch main
  git merge --no-ff <execution-branch>
  ```

**Completion criteria:**

- User can review the branch and evidence package.
- No further implementation starts until user approval.
- Mergeback remains a handoff action, not an automatic step from this plan.

## Self-Review Checklist

- [ ] Every task has entry criteria based on failing tests or evidence-first proof.
- [ ] Every task lists files likely touched.
- [ ] Every task has verification commands or evidence commands.
- [ ] Every task names screenshot/log requirements where simulator evidence is relevant.
- [ ] Live evidence and mock evidence cannot be confused.
- [ ] Secret-handling constraints are explicit.
- [ ] Red packet, full group management, full composer parity, Android/TestFlight/EAS, and WebView fallback are out of scope.
- [ ] Avatar endpoint fix is baseline and not reopened unless visual acceptance fails.
- [ ] `yarn test:chat-native` is the primary regression gate.
- [ ] Full `tsc` may fail only in existing non-`src/chat-native` paths, and every task requires an empty `src/chat-native` filter.
- [ ] The evidence directory is exactly `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/`.
- [ ] The plan contains no placeholder markers.
- [ ] The plan does not ask implementers to make vague experience improvements.
- [ ] The plan is an implementation plan, not a rewritten spec.
