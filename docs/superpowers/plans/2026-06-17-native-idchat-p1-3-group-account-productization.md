# Native IDChat P1.3 Group And Account Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Native IDChat group and account surfaces release-credible on iOS Simulator while keeping group writes, red packets, broad composer parity, release-channel work, WebView fallback, and protocol/key/secret-flow changes out of scope.

**Architecture:** Treat P1.3 as a bounded productization pass over existing Native chat data paths. Reuse current group/list/room/account modules, add small view-model helpers where formatting is currently embedded in components, and prove behavior through focused Jest tests plus redacted live-first simulator evidence. Use deterministic mock evidence only for states that cannot be safely produced with live account data.

**Tech Stack:** React Native 0.79, Expo SDK 53, Zustand store, Jest, TypeScript, iOS Simulator, `expo-image`, `expo-clipboard`, `xcrun simctl`, Metro dev-client.

---

## Authoring Baseline

- Repository: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Plan authoring branch: `main`
- Plan authoring status before edits: `## main...origin/main [ahead 52]`
- Plan authoring HEAD before this plan: `49411c1 docs: add native idchat p1.3 productization spec`
- P1.2.5 merge baseline: `588ea07 docs: merge native idchat p1.2.5 release readiness`
- P1.2.5 final development commit included in current `main`: `28a6f49 docs: clarify native p1.2.5 final evidence logs`
- P1.2.5 product fix included in current `main`: `17a65ac fix: contain native group info mute status`
- Baseline confirmation commands already checked during planning:

```bash
git status --short --branch
git log --oneline --decorate -8
git show --no-patch --pretty=fuller 588ea07
git merge-base --is-ancestor 588ea07 HEAD
git merge-base --is-ancestor 28a6f49 HEAD
git merge-base --is-ancestor 17a65ac HEAD
```

Expected for execution:

- Start from current `main` or a newer `main` that contains `588ea07`, `28a6f49`, and `17a65ac`.
- Treat the P1.2.5 mute-status copy `Notifications unavailable` as baseline behavior to preserve.
- Do not reopen P1.1 list/search/discovery or P1.2 transcript/composer behavior except where group row identity, group room header identity, Group info entry, route cycling, or Me/account behavior directly requires it.

## Assumptions And Data Boundaries

- Group info data should continue through the existing `loadNativeChatGroupInfo` boundary in `src/chat-native/services/nativeChatGroupInfoService.ts`, backed by `NativeChatApiClient` group endpoints and `chatRepository` cache.
- The implementation should use existing endpoints: `getGroupInfo`, `getGroupMembers`, and `searchGroupMembers`. Do not add a new remote API unless the existing path is proven insufficient during execution.
- Group info search query behavior for P1.3: reset search when opening Group info for a room or switching rooms; preserve the active search query while pressing Load more in the same drawer; clearing the query restores the default member list.
- Public-field copy behavior for P1.3: copy the full value to clipboard while rendering a bounded value in UI; show scoped feedback such as `Copied Global MetaID`, `Copied MVC address`, `Copied chat public key`, or `Copied group id`.
- Live simulator screenshots are redacted by default. Public identifiers may be visible only when necessary to prove copy/truncation behavior, and should be bounded or redacted in final committed evidence.

## Explicit Non-Scope

P1.3 execution must not implement:

- Red packet creation, claiming, rendering parity, action surfacing, or composer entry.
- Full group management writes: invite, kick, admin promotion or demotion, owner transfer, mute writes, whitelist, permission edits, member role edits, group creation, group deletion, or group announcement editing.
- Full composer parity: non-image file types, stickers, advanced emoji parity, translation, Buzz sharing, fee selector parity, command palette, subchannel authoring, or mention parity beyond current room behavior.
- Android, TestFlight, EAS, App Store signing, release channels, or production deployment.
- WebView fallback.
- Protocol changes, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, shared-secret diagnostics, or decrypted sensitive message display in committed evidence.
- Broad visual redesign of the Native app shell.

## Evidence Directory

All P1.3 execution evidence goes under:

`docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/`

Required structure:

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
- redacted screenshots listed in Task 7
- mock-labeled screenshots only where the README explains why live reproduction was unsafe or impractical

## Shared Verification Commands

Use these commands after every task that changes product code, tests, dev fixtures, or evidence docs:

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-tsc.log > /tmp/idchat-p1-3-tsc-chat-native-filter.log || true
```

Expected:

- `yarn test:chat-native` exits 0.
- `git diff --check` exits 0.
- Full `tsc --noEmit` may exit nonzero only because of existing non-`src/chat-native` repository errors.
- `/tmp/idchat-p1-3-tsc-chat-native-filter.log` is empty.

Docs-only tasks may use:

```bash
git diff --check -- docs/superpowers
rg -n "TB[D]|TO[D]O|FIXM[E]|优化体[验]|optimi[sz]e experience" docs/superpowers/plans/2026-06-17-native-idchat-p1-3-group-account-productization.md
```

Expected:

- `git diff --check -- docs/superpowers` exits 0.
- The scan prints no matches.

## Commit And Buzz Rules

- Use a `codex/` branch or isolated worktree for execution, such as `codex/native-idchat-p1-3-group-account-productization`.
- Stage and commit only files changed and understood for the current task.
- Prefer one commit per independent, verified task.
- After every commit, post a Lisa Hahn development-journal buzz:

```bash
mkdir -p /tmp/idchat-p1-3-buzz
$HOME/.metabot/bin/metabot buzz post --from lisa-hahn --request-file /tmp/idchat-p1-3-buzz/task-N.json
```

Buzz content must include:

- task name;
- short commit hash;
- verification summary;
- evidence path when screenshots or logs changed;
- no sensitive values, decrypted message text, raw private screenshots, or sensitive logs.

## File Map

Existing files expected to change during P1.3:

- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/__tests__/ConversationList.test.ts`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- `src/chat-native/components/GroupInfoDrawer.tsx`
- `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
- `src/chat-native/components/NativeChatAccountCard.tsx`
- `src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx`
- `src/chat-native/screens/NativeChatMePage.tsx`
- `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
- `src/chat-native/services/nativeChatGroupInfoService.ts`
- `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`
- `src/chat-native/services/chatApiClient.ts`
- `src/chat-native/services/__tests__/chatApiClient.test.ts`
- `src/chat-native/storage/chatRepository.ts`
- `src/chat-native/storage/__tests__/chatRepository.test.ts`
- `src/chat-native/state/useNativeChatStore.ts`
- `src/chat-native/state/__tests__/useNativeChatStore.test.ts`
- `src/chat-native/ui/chatRoomUi.ts`
- `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- `src/chat-native/dev/nativeChatUiMockScenario.ts`
- `src/chat-native/dev/nativeChatMockScenario.ts`
- `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
- `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`

New files allowed if execution confirms the helper split keeps components smaller and tests sharper:

- `src/chat-native/ui/groupInfoUi.ts`
- `src/chat-native/ui/__tests__/groupInfoUi.test.ts`

Do not create a new account UI helper unless `NativeChatAccountCard.tsx` becomes materially harder to test after P1.3 changes. Component tests are enough for the current account scope.

## Task 0: Execution Preflight And Baseline

**Goal:** Establish a clean execution boundary before any P1.3 implementation.

**Precise files:**

- No product files.
- Optional if committing baseline evidence early:
  - `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/README.md`
  - `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/git-status-before.txt`
  - `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/git-log-under-test.txt`

**Tests to add or modify:** none.

**Expected user-visible behavior:** none. This task changes no product behavior.

**Verification commands:**

```bash
git status --short --branch
git branch --show-current
git log --oneline --decorate --max-count=12
git merge-base --is-ancestor 588ea07 HEAD
git merge-base --is-ancestor 28a6f49 HEAD
git merge-base --is-ancestor 17a65ac HEAD
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-baseline-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-baseline-tsc.log > /tmp/idchat-p1-3-baseline-tsc-chat-native-filter.log || true
```

Expected:

- Execution branch descends from `main` containing the P1.2.5 merge baseline.
- `yarn test:chat-native` passes before implementation.
- `git diff --check` passes.
- TypeScript filter is empty.

**Simulator screenshot evidence requirement:** none for this task. Capture screenshots only after product-visible P1.3 changes begin.

**Commit boundary:** no commit if this task only creates a branch/worktree and local logs. If evidence logs are committed, use `docs: capture native idchat p1.3 baseline` and post a Lisa Hahn buzz with the baseline verification summary.

**Steps:**

- [ ] Create or switch to the execution branch.

  Recommended command:

  ```bash
  git switch -c codex/native-idchat-p1-3-group-account-productization
  ```

- [ ] Run the baseline verification commands above.
- [ ] Record unrelated dirty files, if any, but do not inspect or revert them unless they block P1.3 execution.

## Task 1: Group List Rows And Group Room Header Identity

**Goal:** Make group conversations identifiable in the main list and group room header without reopening the full chat-list or transcript scope.

**Precise files:**

- Modify: `src/chat-native/ui/chatUiSelectors.ts`
- Modify: `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`
- Modify: `src/chat-native/ui/chatRoomUi.ts`
- Modify: `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
- Modify only if needed for the info-button behavior: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify only if needed for the info-button behavior: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`

**Tests to add or modify:**

- `chatUiSelectors.test.ts`
  - group row title falls back to `Group chat` when title is empty or only whitespace;
  - group row keeps image avatar when available;
  - group row uses a scannable group context label rather than relying only on raw IDs;
  - preview still contains safe sender context and no raw ciphertext or JSON.
- `ConversationList.test.ts`
  - group row opens through the stable `native-chat-row-<id>` selector;
  - long group name truncation is represented through `numberOfLines={1}` on row title;
  - existing timestamp, unread, and mention behavior remain present.
- `chatRoomUi.test.ts`
  - group header title fallback is `Group chat`, not a raw group id;
  - member count subtitle renders when known;
  - missing member count subtitle renders `Group chat`;
  - private rooms do not enable Group info.
- `NativeChatRoomPage.test.tsx`
  - group info opens from group room only;
  - private room info action is disabled or absent and does not open a placeholder alert.

Focused test examples:

```ts
expect(getConversationRowViewModel(channel({ type: 'group', title: '   ' })).title).toBe('Group chat');
expect(getNativeChatRoomHeaderViewModel(channel({ type: 'group', title: '', serverData: {} }))).toEqual(
  expect.objectContaining({ title: 'Group chat', subtitle: 'Group chat', infoEnabled: true }),
);
expect(getNativeChatRoomHeaderViewModel(channel({ type: 'private', title: 'Lisa' })).infoEnabled).toBe(false);
```

**Expected user-visible behavior:**

- Group rows look like group chats before opening: avatar or deterministic fallback, group name or `Group chat`, visible group context, safe preview, existing timestamp and unread behavior.
- Group room header shows avatar or fallback, group name or `Group chat`, and member count when known.
- Long group names truncate without overlapping back or info controls.
- Info opens Group info only for group rooms.
- Tapping a group row still opens the room; Back returns to Chats without clearing visible rows unexpectedly.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/chatUiSelectors.test.ts src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/ui/__tests__/chatRoomUi.test.ts src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-group-row-header-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-group-row-header-tsc.log > /tmp/idchat-p1-3-group-row-header-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- `01-live-group-row-redacted.png`: Chats list with at least one visible group row.
- `02-live-group-room-header-redacted.png`: group room header and top transcript area.
- Redaction must preserve row layout, avatar/fallback, context label, timestamp/unread area, header title, member-count subtitle, safe area, and back/info controls.

**Commit boundary:** commit as `feat: productize native group row and header identity` after focused tests, full chat-native tests, diff check, TypeScript filter, and screenshot evidence pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing tests for group row fallback, group context label, and group header fallback/member subtitle.
- [ ] Update the smallest owning view-model code in `chatUiSelectors.ts` and `chatRoomUi.ts`.
- [ ] Update `ConversationList.tsx` only for display/accessibility changes needed by the new row model.
- [ ] Update `NativeChatRoomPage.tsx` only if the current private info alert remains reachable.
- [ ] Run focused and shared verification commands.
- [ ] Capture the required redacted screenshots.
- [ ] Commit only the changed task files and post the development-journal buzz.

## Task 2: Group Info Summary, Group Id Copy, Mute Copy, Loading, And Error Shell

**Goal:** Make Group info a coherent read-only summary with visible public-copy feedback and product-level loading/failure states.

**Precise files:**

- Create if useful: `src/chat-native/ui/groupInfoUi.ts`
- Create if useful: `src/chat-native/ui/__tests__/groupInfoUi.test.ts`
- Modify: `src/chat-native/components/GroupInfoDrawer.tsx`
- Modify: `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- Modify if failure/source signaling is needed: `src/chat-native/services/nativeChatGroupInfoService.ts`
- Modify if failure/source signaling is needed: `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`

**Tests to add or modify:**

- `groupInfoUi.test.ts`
  - summary title fallback is `Group info`;
  - public group id display is bounded while preserving the full copy value separately;
  - mute copy is exactly `Muted`, `Notifications on`, or `Notifications unavailable`.
- `GroupInfoDrawer.test.tsx`
  - summary renders avatar/fallback, name, member count, bounded group id, Copy action, mute copy, and announcement only when present;
  - missing group id hides or disables Copy and does not render `-` as the primary value;
  - copying group id can show scoped feedback text such as `Copied group id`;
  - loading state preserves Close and summary shell;
  - failure state uses product copy and exposes Retry or Close path;
  - failure copy contains no raw endpoint URL, raw response object, stack trace, or exception name.
- `NativeChatRoomPage.test.tsx`
  - group id copy copies the full `groupInfo.groupId` and sets drawer-visible feedback;
  - group info loading failure sets contained drawer failure copy and keeps fallback summary visible;
  - retry calls `loadNativeChatGroupInfo` again for the same group.
- `nativeChatGroupInfoService.test.ts`
  - if service failure signaling is added, failed group info/member fetches return cache when present and mark member/group failure without throwing raw errors into UI.

Helper shape to keep component formatting testable:

```ts
export type GroupInfoIdViewModel = {
  copyValue: string;
  displayValue: string;
  copyEnabled: boolean;
};

export function getGroupInfoIdViewModel(groupInfo: NativeChatGroupInfo | undefined, fallbackGroupId?: string): GroupInfoIdViewModel;
export function getGroupInfoMuteLabel(groupInfo: NativeChatGroupInfo | undefined): 'Muted' | 'Notifications on' | 'Notifications unavailable';
```

**Expected user-visible behavior:**

- Group info summary shows avatar/fallback, group name, member count, bounded public group id, Copy, mute status, and wrapped announcement if present.
- No empty announcement card appears when announcement is absent.
- Copying group id shows visible scoped feedback in the drawer or room, not only an OS alert.
- Loading preserves header and Close affordance.
- Failure shows contained product copy and Retry or Close, with no raw technical details.
- Mute remains read-only; no mute write action appears.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/groupInfoUi.test.ts src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-group-info-summary-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-group-info-summary-tsc.log > /tmp/idchat-p1-3-group-info-summary-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- `03-live-group-info-summary-redacted.png`: Group info summary with group id copy affordance and mute status.
- Supplemental mock screenshots if live cannot safely produce them:
  - `mock-group-info-loading-redacted.png`
  - `mock-group-info-failure-redacted.png`
- Redaction must preserve bounded id layout, feedback location, Close, Retry, announcement wrapping, and bottom clipping evidence.

**Commit boundary:** commit as `feat: productize native group info summary` after focused tests, full chat-native tests, diff check, TypeScript filter, and screenshots pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing helper/component/room tests for summary formatting, copy feedback, loading, and failure containment.
- [ ] Create `groupInfoUi.ts` only if it removes formatting logic from `GroupInfoDrawer.tsx` without broadening scope.
- [ ] Modify `GroupInfoDrawer.tsx` props and rendering for loading, error, retry, copy feedback, bounded id display, and optional announcement.
- [ ] Modify `NativeChatRoomPage.tsx` to track `groupInfoError`, `groupInfoCopyFeedback`, and retry behavior.
- [ ] Modify `nativeChatGroupInfoService.ts` only if the UI needs explicit failure/source signals that the current result cannot express.
- [ ] Run focused and shared verification commands.
- [ ] Capture required live and supplemental mock screenshots.
- [ ] Commit only task files and post the development-journal buzz.

## Task 3: Member Rows, Member Search, Pagination, And No-More States

**Goal:** Make member browsing scannable and safe: role labels, bounded identifiers, search match/no-result/failure, and understandable pagination.

**Precise files:**

- Modify or create: `src/chat-native/ui/groupInfoUi.ts`
- Modify or create: `src/chat-native/ui/__tests__/groupInfoUi.test.ts`
- Modify: `src/chat-native/components/GroupInfoDrawer.tsx`
- Modify: `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- Modify if deterministic role order is changed: `src/chat-native/storage/chatRepository.ts`
- Modify if deterministic role order is changed: `src/chat-native/storage/__tests__/chatRepository.test.ts`
- Modify if member search/failure contract changes: `src/chat-native/services/nativeChatGroupInfoService.ts`
- Modify if member search/failure contract changes: `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`

**Tests to add or modify:**

- `groupInfoUi.test.ts`
  - role labels map to `Owner`, `Admin`, `Speaker`, `Member`, `Blocked`;
  - primary text prefers display name, then bounded public identifier, then `Member`;
  - secondary text shows role plus at most one bounded public identifier;
  - no row model exposes raw member payload JSON.
- `GroupInfoDrawer.test.tsx`
  - member rows show avatar or initials fallback through `ChatAvatar`;
  - long names and identifiers use one-line bounded text;
  - `No members found` appears when loaded member list is empty;
  - member search loading state is visible;
  - member search failure state is contained and retryable;
  - Load more is disabled or visibly loading while a page is in flight;
  - Load more disappears or shows a noninteractive end cue when no more members exist.
- `NativeChatRoomPage.test.tsx`
  - typing query resets cursor and calls member search with query;
  - clearing query restores default member list;
  - Load more preserves the active query and appends/merges members;
  - load-more failure keeps existing members visible.
- `chatRepository.test.ts`
  - if role ordering changes, repository returns owner, admin, speaker, member, blocked before timestamp/id tie breakers.

Member view-model shape:

```ts
export type GroupMemberRowViewModel = {
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  roleLabel: 'Owner' | 'Admin' | 'Speaker' | 'Member' | 'Blocked';
};

export function getGroupMemberRowViewModel(member: NativeChatGroupMember): GroupMemberRowViewModel;
export function sortGroupMembersForDisplay(members: NativeChatGroupMember[]): NativeChatGroupMember[];
```

**Expected user-visible behavior:**

- Member rows are product-oriented: avatar/fallback, display name when available, human-readable role, and one bounded public identifier.
- Raw member IDs do not dominate the row when a name exists.
- Search match state shows matching rows; no-result shows `No members found`.
- Clearing search restores the default list.
- Remote-backed search loading and failure states are visible and do not cover controls.
- Load more appears only when more members exist; pressing it shows a loading/disabled state and preserves the active query.
- Existing member rows remain visible if a later page fails.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/ui/__tests__/groupInfoUi.test.ts src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts src/chat-native/storage/__tests__/chatRepository.test.ts
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-members-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-members-tsc.log > /tmp/idchat-p1-3-members-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- `04-live-group-member-search-match-redacted.png`: member search match state.
- `05-live-group-member-search-no-result-redacted.png`: member search no-result state.
- `06-live-group-info-load-more-or-end-redacted.png`: pagination loading/end state.
- Supplemental mock screenshot if live cannot safely produce failure:
  - `mock-group-member-search-failure-redacted.png`
- Redaction must preserve row count, role labels, avatar/fallback positions, search field, loading/failure/no-result copy, and Load more or end cue.

**Commit boundary:** commit as `feat: productize native group member browsing` after focused tests, full chat-native tests, diff check, TypeScript filter, and screenshots pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing tests for member row view models, role labels, empty/no-result/failure states, search reset, and pagination behavior.
- [ ] Implement row formatting in `groupInfoUi.ts` or the smallest existing owner if the helper split is not needed.
- [ ] Update `GroupInfoDrawer.tsx` to render member rows and member states from the new view model.
- [ ] Update `NativeChatRoomPage.tsx` to distinguish initial load, search load, load-more load, search/member failure, and end state.
- [ ] Update repository sorting only if current role lexicographic sorting conflicts with the intended role order.
- [ ] Run focused and shared verification commands.
- [ ] Capture live and supplemental mock screenshots.
- [ ] Commit only task files and post the development-journal buzz.

## Task 4: Me Page Account Identity, Public Copy, And Status Copy

**Goal:** Make Me read as a product account surface rather than a diagnostic panel.

**Precise files:**

- Modify: `src/chat-native/components/NativeChatAccountCard.tsx`
- Modify: `src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx`
- Modify: `src/chat-native/screens/NativeChatMePage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
- Modify only if account field sourcing is incomplete: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify only if account field sourcing is incomplete: `src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts`
- Modify only if account resolver semantics are touched: `src/chat-native/services/nativeChatAccount.ts`
- Modify only if account resolver semantics are touched: `src/chat-native/services/__tests__/nativeChatAccount.test.ts`

**Tests to add or modify:**

- `NativeChatAccountCard.test.tsx`
  - top section shows avatar/fallback, display name, and connected/not-connected state;
  - Global MetaID, MVC address, and Chat public key rows render full copy actions only when values exist;
  - visible public values are bounded but copy callback receives the exact full value;
  - chat public key copy feedback uses public-key wording and never private-key wording;
  - chat readiness copy is user-facing, such as `Private chat ready` or `Private chat unavailable`;
  - socket copy is replaced with chat sync copy, such as `Chat sync connected` and `Chat sync disconnected`;
  - no placeholder settings card appears.
- `NativeChatMePage.test.tsx`
  - copy feedback appears for Global MetaID, MVC address, and chat public key;
  - feedback does not persist after the Me page is unmounted and mounted again;
  - partial account state shows available public identity and hides unavailable copy buttons;
  - not-connected state shows coherent product copy and no broken rows.

Expected status strings for tests:

```ts
expect(screenText).toContain('Private chat ready');
expect(screenText).toContain('Chat sync connected');
expect(copyFeedback).toBe('Copied chat public key');
```

**Expected user-visible behavior:**

- Me shows avatar/fallback, display name, Global MetaID, MVC address, Chat public key, private-chat readiness, and chat sync state.
- Public identifiers are copyable with scoped feedback.
- Missing values render product copy and no Copy action.
- Chat public key is clearly labeled as public and never implied to be a private key.
- Socket implementation wording is not primary UI.
- No unsupported settings placeholder or dead account action appears.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/screens/__tests__/NativeChatHomePageProductError.test.ts src/chat-native/services/__tests__/nativeChatAccount.test.ts
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-me-account-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-me-account-tsc.log > /tmp/idchat-p1-3-me-account-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- `07-live-me-account-redacted.png`: Me/account with identity and status rows.
- `08-live-me-copy-feedback-redacted.png`: Me copy feedback after copying a public identifier.
- Supplemental mock screenshots if live cannot safely produce partial/no-account states:
  - `mock-me-partial-account-redacted.png`
  - `mock-me-not-connected-redacted.png`
- Redaction must preserve row labels, copy buttons, feedback, avatar/fallback, and status copy while hiding sensitive account-specific values by default.

**Commit boundary:** commit as `feat: productize native me account identity` after focused tests, full chat-native tests, diff check, TypeScript filter, and screenshots pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing account-card and Me page tests for identity hierarchy, bounded public values, scoped copy feedback, product status copy, partial account, no account, and feedback reset.
- [ ] Update `NativeChatAccountCard.tsx` with the smallest status-copy and layout changes needed.
- [ ] Update `NativeChatMePage.tsx` only for feedback lifetime or page-level copy behavior.
- [ ] Update account sourcing only if current store values cannot satisfy required public fields.
- [ ] Run focused and shared verification commands.
- [ ] Capture live and supplemental mock screenshots.
- [ ] Commit only task files and post the development-journal buzz.

## Task 5: Deterministic P1.3 QA Fixtures For Unsafe Or Impractical States

**Goal:** Provide deterministic simulator paths for P1.3 edge states without replacing live evidence.

**Precise files:**

- Modify: `src/chat-native/dev/nativeChatUiMockScenario.ts`
- Modify: `src/chat-native/dev/nativeChatMockScenario.ts`
- Modify: `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
- Modify: `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`
- Modify only if selectors are needed: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify only if selectors are needed: `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`

**Tests to add or modify:**

- `nativeChatUiMockScenario.test.ts`
  - `ui-parity` mock has at least one group with group avatar/name/member count and group members across Owner/Admin/Speaker/Member/Blocked roles;
  - fixture member names and public identifiers are non-sensitive QA values;
  - fixture does not include real private message content or secret-like fields.
- `nativeChatMockScenario.test.ts`
  - mock API exposes `getGroupInfo`, `getGroupMembers`, and `searchGroupMembers`;
  - searching a member query returns a match;
  - searching a no-result query returns an empty list;
  - no-account or partial-account mock state is reachable only through explicit dev/mock path and is labeled as mock in evidence.
- `NativeChatHomePageQaSelectors.test.tsx`
  - if new selectors are added, they are stable and scoped to QA screenshot navigation.

**Expected user-visible behavior:**

- Live mode remains unchanged and remains the primary acceptance path.
- Mock mode can produce member roles, search match, search no-result, optional failure, partial-account, and no-account screenshots without live data manipulation.
- Mock screenshots are clearly named with `mock-` filenames and documented as supplemental.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-qa-fixtures-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-qa-fixtures-tsc.log > /tmp/idchat-p1-3-qa-fixtures-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- Mock screenshots are optional and may be captured only for states the README says could not be safely produced live.
- If captured, filenames must start with `mock-` and live screenshots must still exist for group row, group room header, Group info, Me/account, copy feedback, and route cycle.

**Commit boundary:** commit as `feat: add native p1.3 qa fixture coverage` after focused tests, full chat-native tests, diff check, TypeScript filter, and any mock screenshots pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing dev fixture tests for group members, member search, and partial/no-account support.
- [ ] Extend mock API and mock fixture data without introducing live behavior changes.
- [ ] Add selectors only when simulator evidence cannot be captured reliably through existing controls.
- [ ] Run focused and shared verification commands.
- [ ] Capture mock screenshots only for states that need supplemental evidence.
- [ ] Commit only task files and post the development-journal buzz.

## Task 6: Route Cycling, State Persistence, And Feedback Lifetime

**Goal:** Prove group/account routes do not destabilize the Native chat shell and that transient state behaves intentionally.

**Precise files:**

- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
- Modify: `src/chat-native/screens/NativeChatMePage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
- Modify evidence docs only after simulator pass:
  - `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/README.md`

**Tests to add or modify:**

- `NativeChatRoomPage.test.tsx`
  - opening Group info resets search query for a new drawer session;
  - switching from one group room to another clears stale group members, stale search query, stale group info errors, and stale group id copy feedback;
  - load-more failure does not close the drawer or clear existing members;
  - close and reopen behavior is consistent with the documented search reset rule.
- `NativeChatMePage.test.tsx`
  - copy feedback resets after unmount/remount;
  - copy feedback is scoped to the latest copied public field.
- `NativeChatHomePageQaSelectors.test.tsx`
  - Chats -> Me -> Chats keeps the tab controls reachable and does not clear loaded rows in the test harness.

**Expected user-visible behavior:**

- Chats -> group room -> Group info -> close -> Back -> Chats works without red screen or warning overlay.
- Chats -> Me -> Chats keeps bottom tabs usable and loaded rows visible.
- Group info search state does not leak across rooms.
- Group id and Me copy feedback do not persist incorrectly after leaving and returning.

**Verification commands:**

```bash
yarn test:chat-native --runTestsByPath src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-route-state-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-route-state-tsc.log > /tmp/idchat-p1-3-route-state-tsc-chat-native-filter.log || true
```

**Simulator screenshot evidence requirement:**

- `09-live-route-cycle-redacted.png`: return to Chats after group info close, room back, Me tab, and Chats tab route cycle.
- README must record whether exact scroll position was preserved. If exact preservation is not guaranteed, record observed return behavior without turning it into a hidden requirement.

**Commit boundary:** commit as `feat: stabilize native p1.3 route state` after focused tests, full chat-native tests, diff check, TypeScript filter, and route screenshot pass. Post a Lisa Hahn buzz with commit hash, verification summary, and evidence filenames.

**Steps:**

- [ ] Add failing route/state tests for group drawer search reset, stale state cleanup, Me feedback reset, and bottom-tab route cycling.
- [ ] Implement only the state cleanup or test harness changes required by failing tests.
- [ ] Run focused and shared verification commands.
- [ ] Capture the route-cycle screenshot.
- [ ] Commit only task files and post the development-journal buzz.

## Task 7: Final P1.3 Evidence Package And Release Readout

**Goal:** Produce a reproducible PASS/FAIL package for P1.3 group/account productization.

**Precise files:**

- Create/modify: `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/README.md`
- Create/modify: `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/*`
- Create/modify redacted screenshots under `docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/`
- No product code unless final verification exposes a blocker; if it does, return to the owning task and make a focused commit there.

**Tests to add or modify:** none unless evidence reveals an untested blocker. If a blocker is found, add the failing test in the owning task before fixing it.

**Expected user-visible behavior:**

- Group rows, group room header, Group info, member search, pagination/end state, Me/account, copy feedback, and route cycle are all represented by redacted evidence.
- Evidence proves no red screen, warning overlay, unsupported write action, raw member/group payload dump, raw ciphertext, raw JSON, raw endpoint, stack trace, mnemonic/private-key/seed/shared-secret value, QA wallet secret, token, or decrypted sensitive message content is committed.

**Verification commands:**

```bash
yarn test:chat-native 2>&1 | tee docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/yarn-test-chat-native.log
git diff --check 2>&1 | tee docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/git-diff-check.log
npm exec tsc -- --noEmit --pretty false > docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/tsc-noemit.log 2>&1; true
rg -n "src/chat-native" docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/tsc-noemit.log > docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/tsc-chat-native-filter.log || true
git status --short --branch > docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/logs/git-status-after.txt
```

Expected:

- `yarn test:chat-native` passes.
- `git-diff-check.log` shows no whitespace errors.
- `tsc-chat-native-filter.log` is empty.

**Simulator screenshot evidence requirement:**

Required live screenshots:

- `01-live-group-row-redacted.png`
- `02-live-group-room-header-redacted.png`
- `03-live-group-info-summary-redacted.png`
- `04-live-group-member-search-match-redacted.png`
- `05-live-group-member-search-no-result-redacted.png`
- `06-live-group-info-load-more-or-end-redacted.png`
- `07-live-me-account-redacted.png`
- `08-live-me-copy-feedback-redacted.png`
- `09-live-route-cycle-redacted.png`

Supplemental mock screenshots are allowed only for states that cannot be safely produced live, such as no-account, partial-account, member fetch failure, or group-info loading failure. Mock screenshots must be named with `mock-` prefix and listed separately from live screenshots in the README.

**Evidence README requirements:**

- result: PASS or FAIL;
- commit under test;
- branch and worktree path;
- simulator device/runtime/UDID;
- live-vs-mock mode proof;
- sensitive-data redaction rules;
- screenshot inventory;
- PASS/FAIL table for group rows, group room header, Group info, member search, pagination, Me/account, copy feedback, navigation, and privacy;
- final verification command outputs or log paths;
- exact blockers if result is FAIL;
- P2/P3 deferrals if result is PASS with concerns.

**Commit boundary:** commit as `docs: capture native idchat p1.3 evidence` after final tests, diff check, TypeScript filter, README review, screenshot redaction review, and evidence leak scan pass. Post a Lisa Hahn buzz with commit hash, verification summary, PASS/FAIL result, and evidence path.

**Steps:**

- [ ] Prove live mode has mock flags disabled.

  ```bash
  printenv | rg "EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" || true
  node -e "const cfg=require('./app.config.js'); const out=typeof cfg==='function'?cfg({config:{}}):cfg; console.log(JSON.stringify(out.expo?.extra ?? out.extra ?? {}, null, 2));" | rg "nativeIdchatMock" || true
  ```

- [ ] Start live dev-client.

  ```bash
  env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
    -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
    npx --no-install expo start --dev-client --host localhost --port 8081 --clear
  ```

- [ ] Capture required live screenshots with redaction.
- [ ] Capture supplemental mock screenshots only where the README justifies mock use.
- [ ] Run final verification commands and save logs.
- [ ] Run evidence leak and placeholder scans.

  ```bash
  rg -n "TB[D]|TO[D]O|FIXM[E]|U2Fsd|Unknown point format|mnemonic|seed phrase|shared secret|QA wallet secret|token" docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617
  ```

  Expected:

  - No committed evidence leaks or placeholder matches.
  - Plan/spec files may mention forbidden classes as rules; committed evidence must not contain actual sensitive values or raw failure text.

- [ ] Finalize README PASS/FAIL table and deferrals.
- [ ] Commit only evidence files and post the development-journal buzz.

## Task 8: Review And Mergeback Handoff

**Goal:** Prepare completed P1.3 work for user review without automatically merging or pushing.

**Precise files:** no new files required unless review finds an evidence README traceability gap.

**Tests to add or modify:** none unless review finds an uncovered behavior gap.

**Expected user-visible behavior:** no additional product behavior beyond Tasks 1 through 7.

**Verification commands:**

```bash
git status --short --branch
git log --oneline --decorate --max-count=16
git diff --stat main...HEAD
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-final-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-final-tsc.log > /tmp/idchat-p1-3-final-tsc-chat-native-filter.log || true
```

Expected:

- Worktree has only expected committed P1.3 changes.
- Full chat-native tests pass.
- TypeScript filter is empty.

**Simulator screenshot evidence requirement:** no new screenshots unless review finds missing visual proof.

**Commit boundary:** no commit unless review requires a traceability correction. If a correction is committed, use `docs: clarify native idchat p1.3 evidence` and post a Lisa Hahn buzz.

**Steps:**

- [ ] Run final local review commands.
- [ ] Request code review using the user's requested process or `superpowers:requesting-code-review`.
- [ ] Prepare handoff notes with branch, commits, evidence directory, PASS/FAIL result, verification summary, and remaining deferrals.
- [ ] Do not merge into `main` until the user explicitly asks. When asked, use `git merge --no-ff <execution-branch>`.

## Requirement Coverage Matrix

- P1.3-R1 Group rows in main list: Task 1, Task 7.
- P1.3-R2 Group room header identity: Task 1, Task 6, Task 7.
- P1.3-R3 Group info summary: Task 2, Task 7.
- P1.3-R4 Group info loading, empty, and error states: Task 2, Task 3, Task 5, Task 7.
- P1.3-R5 Member row identity and role: Task 3, Task 5, Task 7.
- P1.3-R6 Member search: Task 3, Task 5, Task 7.
- P1.3-R7 Member pagination: Task 3, Task 7.
- P1.3-R8 Unsupported group management containment: Task 2, Task 3, Task 7.
- P1.3-R9 Me page identity hierarchy: Task 4, Task 7.
- P1.3-R10 Me page status copy: Task 4, Task 7.
- P1.3-R11 Me page copy feedback: Task 4, Task 6, Task 7.
- P1.3-R12 Not-connected and partial-account states: Task 4, Task 5, Task 7.
- P1.3-R13 Navigation and state persistence: Task 1, Task 6, Task 7.
- P1.3-R14 Sensitive-data handling: Task 0, Task 5, Task 7, Task 8.

## Self-Review Checklist For Plan Execution

- [ ] Every implementation task lists goal, exact files, tests, user-visible behavior, verification commands, screenshot evidence, and commit boundary.
- [ ] Every P1.3 requirement maps to at least one task and one acceptance mechanism.
- [ ] Group list/header, Group info summary, group id copy, mute copy, member rows, member search, pagination/end/failure states, Me identity, public-copy feedback, status copy, route cycle, and privacy/redaction are covered.
- [ ] Red packets, full group management writes, full composer parity, Android/TestFlight/EAS, WebView fallback, protocol/key/secret flow redesign, and broad visual redesign are explicitly out of scope.
- [ ] Plan does not ask implementers to use unapproved live sending, live media upload, or unredacted private content to manufacture evidence.
- [ ] Live evidence remains primary; mock evidence is only supplemental and labeled.
- [ ] `yarn test:chat-native`, `git diff --check`, and empty `src/chat-native` TypeScript filter are required before task commits.
- [ ] Each task has a small commit boundary and Lisa Hahn buzz requirement.
- [ ] The plan contains no placeholder markers and no vague untestable product statements.
