# Native IDChat P1.4 Release-Candidate Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task after this plan is approved. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Native IDChat from `FAIL needs P1.4 release-candidate stabilization` to a release-candidate state that is ready for a fresh P1 final audit.

**Architecture:** Treat P1.4 as an evidence-first release gate stabilization pass, not a new productization phase. Start by reproducing and classifying live readability gaps, then make only the smallest Native IDChat changes required for release-gate blockers. Do not hide or rename unreadable states to create an artificial pass.

**Tech Stack:** React Native, Expo, Zustand, Jest, TypeScript, iOS Simulator, Chrome Web IDChat reference, `xcrun simctl`, Metro dev-client.

---

## Authoring Baseline

- Repository: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Plan authoring branch: `main`
- Plan authoring status before edits: `## main...origin/main [ahead 63]`
- Plan authoring HEAD: `24010960575612c3722285b4082b5662552cd598`
- Plan authoring HEAD subject: `docs: add native idchat p1 final audit`
- Baseline includes the final P1 audit evidence added by `2401096`.
- Current worktree was clean before writing this plan.
- Existing older worktrees were present for P1.1 and P1.2. P1.4 execution must not modify those old worktrees.

Execution branch after this plan commit:

```bash
git switch -c codex/native-idchat-p1-4-release-candidate-stabilization
```

Expected execution baseline:

- Branch descends from current `main` containing `2401096`.
- Product code remains unchanged until P1.4-R1 evidence classifies the first-screen rows.
- P1.4-R1 classification evidence must be completed before any P1.4-R2, P1.4-R3, or P1.4-R4 product code change begins.

## Source Inputs

Read these before execution:

- `AGENTS.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/README.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/logs/audit-observations-redacted.md`
- `docs/superpowers/specs/2026-06-18-native-idchat-p1-4-release-candidate-stabilization-spec.md`

Primary current code boundaries:

- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/components/ImageMessage.tsx`
- `src/chat-native/services/chatMessageDecryption.ts`
- `src/chat-native/services/nativeChatDisplaySafety.ts`
- `src/chat-native/services/nativeChatSyncService.ts`
- `src/chat-native/services/chatNormalizers.ts`
- `src/chat-native/services/nativeChatAccount.ts`
- `src/chat-native/services/chatWalletAdapter.ts`
- `src/chat-native/services/nativeChatProfileService.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/chatRoomUi.ts`
- `src/chat-native/ui/nativeChatMedia.ts`

## Explicit Scope

P1.4 includes only release gate blockers:

- Default chat list readability for the live account or a clearly defined QA account.
- Private-room readability for visible list rows that Web IDChat can read under equivalent account/session conditions.
- Live media-preview row behavior, especially rows displayed as `[Image]`.
- Product-contained fallback rules for conversations or messages that are genuinely unreadable or unsupported.
- Native/Web account/session and row-alignment evidence.
- Final release-candidate evidence and recommendation.

P1.4 excludes:

- Red packet functionality.
- Full group management.
- Full composer parity.
- Android, TestFlight, EAS, or App Store release work.
- WebView fallback.
- Web IDChat changes.
- Protocol redesign, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, or shared-secret diagnostics.
- Sending live messages or uploading live media unless the user explicitly approves a controlled QA account and exact test content.

## Non-Negotiable Safety Rules

- Do not assume Web can read a row just because Native cannot.
- Do not assume Native and Web use equivalent account/key material until P1.4-R1 proves or disproves it.
- Do not hide `Message unavailable`, `Unable to decrypt this message`, or `Unsupported message` to manufacture a release pass.
- Do not expose mnemonics, private keys, shared secrets, QA wallet secrets, Global MetaID values, full txids, decrypted private message bodies, raw ciphertext, raw JSON payloads, raw media URIs, stack traces, or parser errors in committed evidence.
- Redact screenshots and logs by default.
- Store raw screenshots outside the repository only while actively auditing, then remove them when no longer needed.

## Evidence Directory

All P1.4 evidence goes under:

`docs/superpowers/qa/evidence/native-idchat-p1-4-release-candidate-stabilization-20260618/`

Required structure by the end of P1.4:

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
- `logs/r1-row-classification-redacted.md`
- Redacted Native screenshots for list, private room, media row, search/discovery smoke, group info smoke, Me/account smoke, and keyboard/composer smoke.
- Web IDChat reference screenshots, or a clear written explanation that Native/Web account/session conditions are not equivalent.

## Shared Verification Commands

Run these after each task that changes product code, tests, or evidence docs:

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-4-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-4-tsc.log > /tmp/idchat-p1-4-tsc-chat-native-filter.log || true
```

Expected:

- `yarn test:chat-native` exits 0.
- `git diff --check` exits 0.
- Full TypeScript may exit nonzero only because of pre-existing non-`src/chat-native` errors.
- The chat-native TypeScript filter is empty. Any `src/chat-native` TypeScript line is a P1.4 blocker unless explicitly accepted as a blocker in the final recommendation.

Docs-only tasks may use:

```bash
git diff --check -- docs/superpowers
rg -n "TB[D]|TO[D]O|FIXM[E]|优化体[验]|optimi[sz]e experience" docs/superpowers/plans/2026-06-18-native-idchat-p1-4-release-candidate-stabilization.md
```

Expected:

- `git diff --check -- docs/superpowers` exits 0.
- The placeholder scan prints no matches.

## Commit And Buzz Rules

- Use the `codex/native-idchat-p1-4-release-candidate-stabilization` branch for execution.
- Stage and commit only files changed and understood for the current task.
- Prefer one commit per independent, verified unit.
- Use commit messages in AGENTS.md format: `feat`, `fix`, `refactor`, `docs`, or `chore`.
- After every commit, post a Lisa Hahn development-journal buzz:

```bash
mkdir -p /tmp/idchat-p1-4-buzz
$HOME/.metabot/bin/metabot buzz post --from lisa-hahn --request-file /tmp/idchat-p1-4-buzz/task-N.json
```

Buzz content must include:

- task name;
- short commit hash;
- verification summary;
- evidence path when screenshots or logs changed;
- no sensitive values, decrypted message content, raw screenshots, full identifiers, or secrets.

## Task P1.4-R1: Reproduce And Classify Readability Gaps

**Goal:** Prove why at least three visible Native first-screen rows are unreadable or media-like before any release-candidate product changes begin.

**Files to read:**

- `docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/README.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/logs/audit-observations-redacted.md`
- `docs/superpowers/specs/2026-06-18-native-idchat-p1-4-release-candidate-stabilization-spec.md`
- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/services/chatMessageDecryption.ts`
- `src/chat-native/services/nativeChatSyncService.ts`
- `src/chat-native/services/chatNormalizers.ts`
- `src/chat-native/services/nativeChatAccount.ts`
- `src/chat-native/services/chatWalletAdapter.ts`
- `src/chat-native/services/nativeChatProfileService.ts`
- `src/chat-native/components/ImageMessage.tsx`
- `src/chat-native/ui/nativeChatMedia.ts`

**Expected change boundary:**

- Evidence and logs only.
- Product code must not change in R1.
- Test-only or diagnostic-only changes are disallowed unless the controller explicitly decides they are required and commits them separately as diagnostics. Prefer non-committed runtime observation and redacted logs.

**Classification categories:**

- `Web-readable`
- `account/key mismatch`
- `protocol unsupported`
- `media handling gap`
- `Native decrypt/render bug`
- `inconclusive`

**Steps:**

- [ ] Create evidence directory and capture baseline git state.
- [ ] Launch Native IDChat in live mode with mock env vars unset.
- [ ] Capture the default Native chat list screenshot.
- [ ] Identify at least three first-screen rows by non-sensitive labels only: row position, type badge, generic preview class, timestamp presence, and whether row is media-like.
- [ ] Open each sampled row in Native and capture redacted room evidence.
- [ ] Compare each sampled row with Web IDChat only when account/session equivalence is established. If equivalence is not established, record non-equivalence and do not claim Web-readable parity.
- [ ] For each row, classify the failure mode and cite the non-sensitive evidence used.
- [ ] Record whether any row is suitable as the R2 list target, R3 private room target, or R4 media target.

**Testing plan:**

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-4-r1-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-4-r1-tsc.log > /tmp/idchat-p1-4-r1-tsc-chat-native-filter.log || true
```

**Simulator acceptance:**

- iOS Simulator launches Native IDChat from Metro dev-client.
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO` and `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST` are unset.
- First screen is captured.
- At least three sampled row opens are captured or documented as blocked by a product-visible reason.

**Evidence paths:**

- `logs/r1-row-classification-redacted.md`
- `01-native-chat-list-r1-redacted.png`
- `02-native-row-1-room-r1-redacted.png`
- `03-native-row-2-room-r1-redacted.png`
- `04-native-row-3-room-r1-redacted.png`
- `05-web-list-reference-r1-redacted.png` if Web reference is valid
- `06-web-room-reference-r1-redacted.png` if Web room reference is valid

**Sensitive information handling:**

- Use row positions and type labels instead of names or IDs.
- Do not include full txids, Global MetaID values, raw media URLs, raw API payloads, raw ciphertext, or decrypted message text.
- Redact screenshots before committing.

**Subagent handoff:**

- Input: this plan, final audit README/logs, P1.4 spec, current git baseline, evidence path.
- Output: R1 evidence directory content and a concise classification table.
- Must not touch: product code, Web IDChat code, wallet/key flows, send/upload flows.

**Commit boundary:**

- If only evidence docs/screenshots/logs changed, commit as `docs: capture native idchat p1.4 row classification`.
- Post Lisa Hahn buzz with short commit hash, R1 classification summary, and evidence path.

## Task P1.4-R2: Chat List Release-Candidate Readiness

**Goal:** Make the default Native chat list credible as the first release-gate screen after R1 proves which visible rows should be readable.

**Files to read:**

- R1 classification evidence.
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/__tests__/ConversationList.test.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- `src/chat-native/services/nativeChatDisplaySafety.ts`
- `src/chat-native/services/__tests__/nativeChatDisplaySafety.test.ts`
- `src/chat-native/services/chatMessageDecryption.ts`
- `src/chat-native/services/__tests__/chatMessageDecryption.test.ts`
- `src/chat-native/services/nativeChatSyncService.ts`
- `src/chat-native/services/__tests__/nativeChatSyncService.test.ts`

**Expected change boundary:**

- Chat list preview/readability behavior only.
- Do not change room behavior, media rendering behavior, group info, Me/account, online bots, search/discovery, Web code, or protocol/key flows unless R1 proves the list blocker originates in the shared selector/decryption path.

**Testing plan:**

- Add or update targeted tests first for the classified list behavior.
- Run targeted list/display/decryption/sync tests.
- Run shared verification commands.

**Simulator acceptance:**

- Default first screen has useful previews for rows proven readable by the active account.
- Generic unavailable copy does not dominate Web-readable rows.
- Rows that are legitimately unreadable have bounded, specific product containment.

**Evidence paths:**

- `07-native-chat-list-rc-redacted.png`
- `logs/r2-chat-list-observations-redacted.md`
- Web list reference screenshot or non-equivalence note.

**Sensitive information handling:**

- Redact names, avatars, private previews, Global MetaID values, and any full identifiers.
- Preserve layout, state labels, type badges, timestamps, and the existence of useful previews.

**Subagent handoff:**

- Input: R1 classification table and exact files listed above.
- Output: minimal product/test diff for list readiness plus verification logs.
- Must not touch: private room implementation except shared selector/decryption functions proven by R1, media rendering, Web code, wallet/key flows.

**Commit boundary:**

- Commit as `fix: stabilize native chat list readability`.
- Post Lisa Hahn buzz with verification summary and evidence path.

## Task P1.4-R3: Private Room Release-Candidate Readiness

**Goal:** Make opening a normal visible private row feel like a supported chat room when R1 proves that row should be readable by the active account.

**Files to read:**

- R1 and R2 evidence.
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/__tests__/MessageList.test.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/__tests__/MessageBubble.test.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
- `src/chat-native/ui/chatRoomUi.ts`
- `src/chat-native/ui/__tests__/chatRoomUi.test.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`

**Expected change boundary:**

- Private room readability and bounded unreadable/unsupported containment only.
- Keep keyboard/composer stable.
- Do not implement full composer parity, live sends, red packet behavior, broad message action redesign, or Web changes.

**Testing plan:**

- Add or update focused room/message tests for readable supported content and bounded unreadable/unsupported states.
- Re-run keyboard/composer regression tests.
- Run shared verification commands.

**Simulator acceptance:**

- The audited private row opens to readable supported content when R1 proves equivalent account conditions.
- If messages are genuinely unreadable, unreadable states are specific, non-technical, and not the dominant common path.
- Composer remains visible above keyboard and empty send remains disabled.

**Evidence paths:**

- `08-native-private-room-rc-redacted.png`
- `09-native-room-keyboard-rc-redacted.png`
- `logs/r3-private-room-observations-redacted.md`

**Sensitive information handling:**

- Do not commit decrypted private message content unless the user explicitly approves controlled QA content.
- Redact names, avatars, txids, and identifiers.

**Subagent handoff:**

- Input: R1/R2 evidence, target row classification, files above.
- Output: minimal room/test diff plus simulator evidence.
- Must not touch: list behavior unless a shared selector regression must be fixed, media behavior, send/upload flows, Web code.

**Commit boundary:**

- Commit as `fix: stabilize native private room readability`.
- Post Lisa Hahn buzz with verification summary and evidence path.

## Task P1.4-R4: Media Row Release-Candidate Behavior

**Goal:** Make a visible `[Image]` or media-like row produce a trustworthy room result.

**Files to read:**

- R1 classification evidence for media row.
- `src/chat-native/components/ImageMessage.tsx`
- `src/chat-native/components/__tests__/ImageMessage.test.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/__tests__/MessageBubble.test.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/components/__tests__/MessageActionSheet.test.tsx`
- `src/chat-native/ui/nativeChatMedia.ts`
- `src/chat-native/ui/messageActions.ts`
- `src/chat-native/ui/__tests__/messageActions.test.ts`
- `src/chat-native/services/chatNormalizers.ts`
- `src/chat-native/services/__tests__/nativeChatSyncService.test.ts`

**Expected change boundary:**

- Media row rendering/fallback only.
- Do not add live upload, non-image file parity, WebView fallback, or Web code.

**Testing plan:**

- Add or update media URI, image fallback, message bubble, and action tests as needed.
- Run shared verification commands.

**Simulator acceptance:**

- A media-preview row opens to a visible media card when renderable.
- If media cannot render, the fallback is bounded and distinguishes media unavailability from decrypt/key failure.
- No raw URI or payload appears in screenshots.

**Evidence paths:**

- `10-native-media-row-rc-redacted.png`
- `11-native-media-room-rc-redacted.png`
- `logs/r4-media-row-observations-redacted.md`

**Sensitive information handling:**

- Redact raw media URLs, txids, account names, and identifiers.
- Do not commit raw payloads or stack traces.

**Subagent handoff:**

- Input: R1 media classification, files above.
- Output: minimal media/test diff plus evidence.
- Must not touch: Web code, live upload, composer parity, private key/account flows.

**Commit boundary:**

- Commit as `fix: stabilize native media row fallback`.
- Post Lisa Hahn buzz with verification summary and evidence path.

## Task P1.4-R5: Final RC Evidence And Recommendation

**Goal:** Produce the release-gate decision from the current P1.4 candidate branch after all required fixes and evidence are complete.

**Files to read:**

- All P1.4 evidence logs/screenshots.
- `docs/superpowers/specs/2026-06-18-native-idchat-p1-4-release-candidate-stabilization-spec.md`
- `docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/README.md`
- Prior evidence README examples in `docs/superpowers/qa/evidence/`.

**Expected change boundary:**

- Evidence docs/screenshots/logs only unless final verification finds a blocking regression.

**Testing plan:**

```bash
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-4-final-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-4-final-tsc.log > /tmp/idchat-p1-4-final-tsc-chat-native-filter.log || true
```

**Simulator acceptance:**

- Live-mode screenshots cover list, private room, media row, search/discovery smoke, group info smoke, Me/account smoke, and keyboard/composer smoke.
- Web IDChat reference screenshots are included, or the README clearly states Native/Web account/session non-equivalence.

**Evidence README requirements:**

- Branch and HEAD.
- Key commits.
- Command results.
- Screenshot map.
- Release-readiness matrix.
- Blocking issues.
- Non-blocking issues.
- Sensitive-data handling.
- Final recommendation exactly one of:
  - `PASS ready for release gate`
  - `FAIL needs further release-candidate stabilization`

**Sensitive information handling:**

- Run a redaction/sensitive scan before committing.
- No committed screenshot or log may contain secrets, full identifiers, raw txids, raw ciphertext, decrypted private content, or raw media URLs.

**Subagent handoff:**

- Input: final branch state, all verification outputs, all P1.4 evidence.
- Output: final evidence README and logs.
- Must not touch: product code unless a blocking verification failure is explicitly returned to the controller.

**Commit boundary:**

- Commit as `docs: capture native idchat p1.4 rc evidence`.
- Post Lisa Hahn buzz with final recommendation, commit hash, verification summary, and evidence path.

## Final Completion Report

The final response after P1.4 execution must include:

- branch;
- commit hash list;
- verification results;
- evidence path;
- Lisa Hahn buzz pin/local URL for each commit;
- whether Native IDChat should enter the next P1 final audit.
