# Native IDChat P1.2.5 Release Readiness Stabilization Spec

## Executive Summary

P1.2.5 is a short release-readiness stabilization pass between P1.2 and P1.3: prove the current Native IDChat mainline is credible on live simulator data, then fix only visible release blockers that make the app still feel unfinished after P1.1/P1.2, without expanding into new parity features.

## Why P1.2.5 Exists

P1.1 and P1.2 moved Native IDChat from a buildable technical shell toward a usable chat client:

- P1.1 covered the first screen: conversation rows, previews, avatar fallback behavior, local search, explicit remote discovery, Online Bot presentation, and list-level raw content containment.
- P1.2 covered the chat room: room states, transcript grouping, message actions, quote state, media placeholders, transaction actions, keyboard behavior, pagination, read-state observation, and room evidence.
- A post-P1.2 avatar endpoint fix is now merged to `main`: Native avatar pins render through the Web-compatible `https://file.metaid.io/metafile-indexer/content/` endpoint instead of the media accelerate endpoint.

The remaining problem is not that one feature is missing. The problem is that the product can still look less finished than Web IDChat when judged from the live simulator: fallback-heavy visuals, visible diagnostic copy, mock-vs-live evidence ambiguity, dense protocol metadata, clipped or low-polish secondary surfaces, and inconsistent release acceptance criteria.

P1.2.5 is therefore not a new feature phase. It is a release-readiness gate and focused fix phase. Its job is to make the current P1.1/P1.2 surfaces pass a product manager, development manager, and QA read before P1.3 group/account completion starts.

## Current Baseline

- Native repo: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Web reference repo: `/Users/tusm/Documents/MetaID_Projects/idchat`
- Baseline branch: `main`
- Baseline commit for this spec: `71b9405 fix: merge native chat avatar rendering`
- Avatar feature commit included in baseline: `dd1969d fix: render native chat avatars from content endpoint`
- P1 audit spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-productization-spec.md`
- P1 audit evidence: `docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`
- P1.1 implementation plan: `docs/superpowers/plans/2026-06-15-native-idchat-p1-1-main-chat-productization.md`
- P1.1 evidence: `docs/superpowers/qa/evidence/native-idchat-p1-1-main-chat-productization-20260615/`
- P1.2 spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-2-room-productization-spec.md`
- P1.2 implementation plan: `docs/superpowers/plans/2026-06-15-native-idchat-p1-2-room-productization.md`
- P1.2 evidence: `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/`

Known verification state at the time this spec was written:

- `yarn test:chat-native` passed on the avatar feature branch before merge: 42 suites, 342 tests.
- `yarn test:chat-native` passed on `main` after the avatar merge: 42 suites, 342 tests.
- `main` is ahead of `origin/main`; this spec does not require pushing.
- Existing repository TypeScript caveat remains from prior P1 work: full `tsc --noEmit` may still report non-`src/chat-native` errors. P1.2.5 must not introduce new `src/chat-native` TypeScript errors.

## Audit Inputs

P1.2.5 should use the following evidence and runtime observations:

- P1 audit screenshots:
  - `01-native-default-entry.png`
  - `03-native-search-sunny-filter.png`
  - `04-native-search-remote-discovery.png`
  - `05-native-room-group-test2.png`
  - `06-native-message-actions.png`
  - `07-native-group-info.png`
  - `08-native-me-account.png`
  - `11-native-online-bots-panel.png`
  - redacted Web reference screenshots `13` through `16`
- P1.1 evidence for list/search/discovery completion.
- P1.2 evidence for room completion, especially the difference between:
  - live private/group room screenshots `14` through `19`;
  - deterministic mock screenshots `00` through `13`.
- Current user observation after P1.2 merge: the simulator still looks far from release-ready, with avatar rendering being the first concrete visible defect called out.
- Avatar endpoint investigation:
  - Native had cached old avatar URLs under `/metafile-indexer/api/v1/files/accelerate/content/`.
  - The old accelerate URL returns JSON for avatar pins, not image bytes.
  - The Web-compatible `/metafile-indexer/content/<pin>` URL returns image data for the same pins.
  - The fix is already merged and should be verified visually, not reimplemented.

## P1.2.5 Product Goal

After P1.2.5, a reviewer should be able to open the Native simulator on `main`, compare the same broad flows against Web IDChat, and say:

- the first screen looks like a real chat app;
- visible avatars render when the same avatars render on Web;
- room screens are understandable without reading protocol internals;
- unsupported or failed states are contained in product copy;
- no primary flow exposes raw ciphertext, raw JSON, stack traces, `Unknown point format`, full unbounded txids, or dead actions;
- mock evidence is clearly supplemental and live evidence proves the app works on the user's account data;
- remaining gaps are known P1.3 or later scope, not accidental unfinished P1 work.

## P1.2.5 Scope

P1.2.5 includes only release-blocking or release-confidence work on already-in-scope P1.1/P1.2 surfaces:

- Live simulator acceptance on current `main`, with mock state explicitly disabled.
- Visual comparison against Web IDChat for chat list, search/discovery, private room, group room, message actions, group info entry, and Me/account entry.
- Avatar visual acceptance after the endpoint fix already merged to `main`.
- Product containment of raw/debug content in visible list, room, discovery, group info, Online Bot, and Me/account surfaces.
- Loading, empty, failure, and permission states that appear in primary flows.
- Safe-area, clipping, density, and spacing fixes that directly affect the visible release impression.
- Dead-action cleanup or containment for visible controls that do not open a real native surface.
- Evidence refresh under a new P1.2.5 evidence directory.

## Explicit Non-Scope

P1.2.5 must not expand into:

- Red packet creation, claiming, rendering parity, action surfacing, or composer entry.
- Full group management: invite, kick, admin, owner transfer, mute writes, whitelist, permission edits, or member role writes.
- Full P1.3 group/account redesign. P1.2.5 may only hide, contain, or clarify release-blocking visible issues in those surfaces.
- Full composer parity: file types beyond existing image baseline, stickers, advanced emoji parity, translation, Buzz sharing, fee selector parity, command palette, and subchannel authoring.
- Android, TestFlight, EAS, App Store signing, release channels, or production deployment.
- WebView fallback.
- Protocol changes, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, or shared-secret diagnostics.
- Live message sending during acceptance unless the user explicitly approves the account, room, and exact test content.
- A broad visual redesign. P1.2.5 should make the existing Native UI release-credible, not replace it.

## Release Blocker Definition

An issue is a P1.2.5 release blocker if it is visible in the simulator and any of the following are true:

- It makes a normal chat flow look broken, blank, or debug-only.
- It exposes sensitive or low-level technical content as primary product UI.
- It creates a dead primary action, red screen, warning overlay, or navigation trap.
- It shows a missing image/avatar/media state where Web can render the same public asset.
- It leaves the app in mock mode while claiming live acceptance.
- It prevents QA from proving the same behavior twice from commands and screenshots.

An issue is P2/P3 if:

- It requires full Web parity beyond P1.1/P1.2 scope.
- It is a deeper P1.3 group/account enhancement that does not block the main chat flow.
- It is cosmetic polish that does not create confusion, clipping, raw data leakage, or dead actions.
- It requires live sending, new protocol support, or product decisions not yet made.

## Gap Matrix

| Area | Expected Web/Product Behavior | Current Native Baseline | P1.2.5 Gap | Severity | Required Outcome |
| --- | --- | --- | --- | --- | --- |
| Runtime mode proof | Reviewer can tell whether app is using live data or deterministic mock data. | P1.2 evidence uses both live and mock screenshots. | Current acceptance can be misread unless live/mock state is recorded per screenshot. | High | Evidence README must prove mock disabled for live pass and name mock-only screenshots separately. |
| Avatar rendering | Web renders real public avatars when profile/group avatar pins exist. | Avatar endpoint fix is merged, but simulator visual proof after merge is not yet captured. | Need current-main screenshot proof that visible rows/headers no longer all fallback. | High | Capture list and room screenshots where at least one Web-renderable avatar renders in Native, or record why none are available in that account view. |
| Chat list first impression | Rows show avatar, name, useful preview, time, unread state when available, and stable density. | P1.1 improved row behavior, but user still judged current simulator low quality after P1.2. | Need current live review for fallback-heavy visuals, preview usefulness, spacing, and unread clarity. | High | Visible rows must not look like placeholders or debug data after settling. |
| Preview containment | Web does not show raw encrypted payloads or parser errors. | Native contains raw ciphertext but may overuse generic unavailable copy. | Too many generic previews can make the list feel unusable even if technically safe. | High | Raw content never appears; generic unavailable copy is used only where the account truly cannot decrypt. |
| Local search | Search filters local conversations and exits cleanly. | P1.1 added local search evidence. | Need confirm current `main` still works after P1.2 and avatar merge. | Medium | Search screenshot shows matching rows only and a clear no-result state. |
| Remote discovery | Explicit remote discovery has loading, result, no-result, and failure states. | P1.1 added discovery behavior. | Need current-main proof and no raw profile JSON/bio leakage. | Medium | Discovery states use product copy and never show raw objects. |
| Online Bot | Online Bot surface looks like a product sheet/list. | P1 audit saw cramped title and raw JSON-like profile text; P1.1 addressed parts. | Need current-main visual proof because this affects first-screen quality. | High | Sheet title, rows, empty/loading/error states, and actions are unclipped and product-safe. |
| Private room | Opening a private room shows readable header, transcript, composer, and back behavior. | P1.2 live evidence exists with redacted private room. | Need current-main acceptance after avatar merge and user low-quality observation. | High | Private room screenshot looks like a chat room, not a protocol viewer. |
| Group room | Opening a group room shows group identity, sender identity, readable transcript, and member context. | P1.2 live group room evidence exists. | Need check sender/avatar/name treatment and debug metadata after current main. | High | Group room remains understandable with no overdominant IDs or raw content. |
| Message actions | Supported actions are visible; unsupported actions are hidden. | P1.2 action sheet exists with copy/open/quote/image actions. | Full txid or raw internals may still dominate the sheet. | Medium | Action sheet prioritizes user actions; technical identifiers are bounded and not the main visual bulk. |
| Transaction messages | Web gives transaction context without overwhelming the transcript. | Native supports chain/tx metadata and actions. | Need current visual check for protocol-heavy appearance. | Medium | Tx metadata is compact and copy/open actions are relevant only when valid. |
| Media messages | Web renders media when public asset is available; otherwise product placeholder. | P1.2 mock evidence covers image available/unavailable. | Need live or controlled proof that current media failures are contained and not blank. | Medium | Media cards are bounded; failed media says what happened without exposing URI internals. |
| Keyboard and composer | Composer remains usable when keyboard opens. | P1.2 mock evidence covers keyboard state. | Need current-main spot check on simulator because keyboard/safe-area regressions are visible. | High | Keyboard does not cover composer or permanently hide latest message. |
| Loading/empty/error states | Product copy explains waiting, empty, retry, and permission states. | P1.1/P1.2 added multiple states. | Need live review for any remaining generic loaders or debug errors. | High | No blank screen, stack trace, raw response object, or unresolved placeholder in primary flows. |
| Group info entry | Header info opens a coherent read-only group surface. | P1 audit saw `Notification status unknown`, raw ids, and clipping. | Full P1.3 group polish is out, but release-blocking debug/clipping must be contained. | Medium | Entry opens safely, no clipped primary content, no debug status as headline copy. |
| Me/account entry | Me shows public identity and status without secrets or dead actions. | P1 audit found Me useful but diagnostic-heavy. | Full P1.3 redesign is out, but visible dead actions/debug-only copy should not block release impression. | Medium | Me page has no secrets, no dead primary action, and public fields have copy feedback. |
| Navigation stability | Back/tab cycles do not produce warnings or stale state. | P1.1/P1.2 evidence covers parts. | Need current-main route cycling proof. | High | Chats -> room -> list -> search -> Me -> Chats has no red screen or warning overlay. |
| Evidence traceability | QA can map screenshots to commit, mode, device, and commands. | P1.2 evidence improved traceability. | Need a P1.2.5 evidence README for final stabilization. | High | Evidence is sufficient for another agent to reproduce acceptance. |

## Requirements

### P1.2.5-R1: Current-Main Live Acceptance Gate

P1.2.5 must start from current `main` and record the exact commit under test.

Acceptance:

- `git status --short --branch` is captured before and after the pass.
- `git log --oneline --decorate -10` is captured.
- Any simulator mock flag, including `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO` and embedded `extra.nativeIdchatMockScenario`, is explicitly shown as absent for live acceptance.
- Live screenshots are labeled as live; deterministic screenshots are labeled as mock.
- A screenshot cannot be used as live evidence unless the evidence log proves the app was not launched in mock mode.

### P1.2.5-R2: Avatar Rendering Acceptance

The avatar endpoint fix is already implemented. P1.2.5 must verify it visually.

Acceptance:

- Chat list evidence shows no visible blank pale avatar circles after data settles.
- At least one visible avatar that exists in Web IDChat renders as an image in Native, unless the account's current visible list has no Web-renderable avatars. If none are available, the evidence README must say so and include the query used to inspect avatar availability without exposing message content.
- Group/private room headers use image avatars where available or deterministic initials fallback where not.
- Fallback initials remain visible while remote image loading is pending and after image load failure.
- No avatar URL returning JSON is passed to `expo-image` as the final resolved avatar source.

### P1.2.5-R3: Raw And Debug Content Containment

Native must not expose implementation artifacts in primary surfaces.

Forbidden as primary visible UI:

- raw ciphertext, including `U2Fsd`-style encrypted payloads;
- raw JSON objects or JSON-like profile strings;
- `Unknown point format`;
- stack traces, red screen content, raw exception names, or raw response objects;
- unbounded full txids or pin ids as headline content;
- file/metafile URI internals as media failure copy;
- mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive live content in committed evidence.

Acceptance:

- Screenshots for list, discovery, Online Bot, room, message actions, group info, and Me are reviewed for the forbidden content above.
- If forbidden content appears, it is a release blocker unless it is in a deliberate developer-only log outside the app UI and not committed as product evidence.

### P1.2.5-R4: First-Screen Product Confidence

The Chats tab must look credible as the first product screen.

Acceptance:

- Visible rows have stable avatar, title, preview, timestamp, and unread treatment where data exists.
- Row spacing is dense enough to scan several conversations without looking cramped or clipped.
- Generic unavailable preview text does not dominate the entire visible list unless the underlying account truly cannot decrypt those conversations.
- Local search supports match and no-result states.
- Remote discovery supports loading, result, no-result, and failure states.
- Online Bot opens without clipped header text, raw bio leakage, or dead primary actions.

### P1.2.5-R5: Room Product Confidence

Private and group rooms must look acceptable on live data after P1.2.

Acceptance:

- One private room and one group room open from the live list.
- Header title/subtitle/avatar fit within the safe area and do not overlap back/info controls.
- Transcript distinguishes own and peer/group messages without repeated low-value labels dominating the page.
- Long text wraps inside bubbles.
- Media cards are bounded and use product failure copy when unavailable.
- Transaction metadata is compact in the transcript and detailed actions are available only where relevant.
- Message action sheets do not make raw identifiers the dominant content.
- Quote selection and clear behavior remain usable where quote is available.
- Back navigation returns to the list without warning overlays or stale mock state.

### P1.2.5-R6: Keyboard, Scroll, And Pagination Spot Check

P1.2.5 must verify the highest-risk room interactions on the current simulator.

Acceptance:

- Keyboard-open screenshot shows composer visible and latest message not permanently covered.
- Dismissing keyboard restores layout.
- Load-earlier state is visible and has loading/no-more/failure product copy in deterministic or live evidence.
- Latest/new-message affordance is visible in deterministic evidence if live timing cannot produce it safely.
- Opening message actions while keyboard is open does not leave the UI in a broken state.

### P1.2.5-R7: Secondary Surface Containment

P1.2.5 may not redesign group info or Me, but it must contain visible release blockers in entry surfaces.

Acceptance:

- Group info entry opens from a group room and does not show clipped primary controls.
- Group info does not show `Notification status unknown` or raw implementation status as a primary headline.
- Member search has match and no-result states if visible.
- Me page shows public identity and status only; no secrets.
- Copy feedback still works for Global MetaID or another public field.
- Any visible settings/account action either opens a real native surface or is hidden/read-only.

### P1.2.5-R8: Final Evidence Package

P1.2.5 is not complete without an evidence package.

Create:

`docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/`

Required contents:

- `README.md` summarizing result, commit under test, simulator, commands, sensitive-data handling, live vs mock modes, and PASS/FAIL judgment.
- `logs/git-status-before.txt`
- `logs/git-log-under-test.txt`
- `logs/yarn-test-chat-native.log`
- `logs/git-diff-check.log`
- `logs/tsc-noemit.log`
- `logs/tsc-chat-native-filter.log`
- simulator launch/open logs;
- redacted live screenshots for chat list, local search, remote discovery, private room, group room, message action sheet, group info, Me, and back navigation;
- deterministic mock screenshots only for states that cannot be safely produced live, labeled as mock.

Acceptance:

- The README must say which screenshots are live and which are mock.
- The README must say whether P1.2.5 passes or fails.
- If it fails, the README must list exact blockers and recommended next action.
- No unredacted sensitive screenshots may be committed.

## Suggested Delivery Slices

These are product slices for a future implementation plan. They are not a code-level implementation plan.

### P1.2.5a: Evidence-First Live Audit

Goal: establish a reliable current-main truth before writing fixes.

Deliverables:

- Fresh live simulator run on current `main`.
- Screenshots for list, search, discovery, private room, group room, actions, group info, Me, and navigation.
- Evidence README with PASS/FAIL per area.
- A blocker list separated into P1.2.5 blockers, P1.3 deferrals, and P2/P3 polish.

Acceptance:

- Reviewer can reproduce the run from commands and logs.
- Mock and live screenshots cannot be confused.
- At least one concrete visual blocker list exists before any fix commit.

### P1.2.5b: Primary Flow Stabilization

Goal: fix only release blockers in the Chats list, discovery, and rooms.

Allowed fix classes:

- avatar visual failures after the merged endpoint fix, if any remain;
- raw/debug copy leakage;
- blank or clipped visible states;
- dead actions in primary flows;
- room header/transcript/action sheet issues that make the screen look unfinished;
- keyboard/safe-area regressions.

Acceptance:

- Focused automated tests cover each fix where practical.
- `yarn test:chat-native` passes.
- Updated screenshots show before/after resolution or final PASS state.

### P1.2.5c: Secondary Surface Containment And Final Gate

Goal: contain group info and Me/account blockers enough to avoid undermining release confidence before P1.3.

Allowed fix classes:

- hide or reword debug-only visible status;
- prevent clipped group/member rows;
- remove dead settings/account actions;
- preserve copy feedback and public identity safety.

Acceptance:

- Group info and Me screenshots have no release blockers.
- P1.3 items remain documented as deferrals.
- Final P1.2.5 evidence README declares PASS or lists remaining blockers.

## Acceptance Checklist

P1.2.5 is acceptable only if all of the following are true:

- `main` contains the work under test.
- `yarn test:chat-native` passes on the final state.
- `git diff --check` passes.
- Full TypeScript check is run; any nonzero result is filtered and no `src/chat-native` errors are present.
- Live simulator evidence is captured with mock state disabled.
- Deterministic mock evidence is used only for edge states that are unsafe or impractical to trigger live.
- Visible avatars are verified after the endpoint fix.
- Chat list, search, discovery, private room, group room, message actions, group info, Me, and navigation are all represented in evidence.
- No raw ciphertext, raw JSON, `Unknown point format`, red screen, stack trace, mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive live message content appears in committed screenshots or docs.
- Any remaining issue is explicitly categorized as P1.3, P2, P3, or a release blocker.

## Risks And Open Questions

- Live data may not contain a convenient private room, group room, media message, transaction message, unread state, or Web-renderable avatar at the time of acceptance. P1.2.5 may use deterministic mock evidence for those exact missing edge states, but the primary live path still needs real list and room proof.
- The account may legitimately fail to decrypt many historical conversations. Product copy can contain this safely, but the release decision needs a threshold for how much `Unable to decrypt`-style preview text is acceptable on the first screen.
- The avatar endpoint fix may reveal slow-loading images rather than broken URLs. If avatars are correct but slow, decide whether loading shimmer/performance is P1.2.5 or P2 based on first-screen visual impact.
- Full group info and Me/account cleanup belongs to P1.3. P1.2.5 can hide or contain visible blockers, but should not start a broad account/group redesign.
- Existing non-chat-native TypeScript errors remain a repo-level risk. P1.2.5 can proceed only if it proves no new `src/chat-native` TypeScript errors.
- If Web IDChat's live behavior differs because of a newer deploy or account state, the implementation session must record exact Web URL/session state rather than assume older screenshots still match.

## Implementation Plan Handoff Notes

For the next implementation-plan session:

- Start from current `main` or a newer `main` that includes `71b9405` and `dd1969d`.
- Use a branch or worktree with the `codex/` prefix.
- Use subagent-driven execution only after an implementation plan exists.
- Split agents by independent outcomes: live evidence audit, primary flow blockers, room/keyboard blockers, secondary surface containment, and final QA evidence.
- Do not reopen the already-merged avatar endpoint fix unless visual acceptance proves a remaining bug.
- Do not rely on mock screenshots as proof of live product readiness.
- Do not send live messages, upload live media, or expose sensitive account material without explicit user approval.
- Keep commits small and post a Lisa Hahn development-journal buzz for every commit, per `AGENTS.md`.
- If the current simulator shows a release blocker not listed here, classify it using the release blocker definition before deciding whether it belongs in P1.2.5 or should be deferred.
