# Native IDChat P1.3 Group And Account Productization Spec

## Executive Summary

P1.3 must make Native IDChat's group and account surfaces release-credible: group rows, group rooms, group info, member browsing, and Me/account identity should feel like supported product UI rather than diagnostic or partially finished secondary screens, while full group management and advanced account/key flows remain out of scope.

## Background

Native IDChat is being productized in staged P1 passes after the P0.5/P0.6 launch, build, mock-discovery, and simulator-evidence gates. Those gates proved the app could build and open on iOS Simulator, not that the user-visible product was ready.

The P1 product audit split the remaining work into:

- P1.1: main chat list, search, discovery, Online Bot, and list-level raw-content containment.
- P1.2: chat room baseline productization, including transcript layout, message actions, media placeholders, transaction actions, keyboard behavior, and pagination.
- P1.2.5: release-readiness stabilization after P1.1/P1.2, including live evidence traceability, avatar visual acceptance, and visible blocker containment.
- P1.3: basic group and account completion.

P1.2.5 is now merged back to `main`. It produced a PASS evidence package and one product-code containment fix: Group info no longer exposes `Notification status unknown` as the primary Mute-card state. The remaining P1.3 work should build on that baseline rather than reopen P1.1/P1.2/P1.2.5 scope.

## Current Baseline

- Native repo: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Web reference repo: `/Users/tusm/Documents/MetaID_Projects/idchat`
- Baseline branch: `main`
- Baseline commit for this spec: `588ea07 docs: merge native idchat p1.2.5 release readiness`
- P1.2.5 final development commit included in `main`: `28a6f49 docs: clarify native p1.2.5 final evidence logs`
- P1.2.5 product fix included in `main`: `17a65ac fix: contain native group info mute status`
- Avatar endpoint baseline included in `main`: `dd1969d` merged by `71b9405`

Known verification state after P1.2.5:

- `yarn test:chat-native` passed on the P1.2.5 branch after the final evidence-log clarification: 42 suites and 343 tests.
- `git diff --check` passed after P1.2.5.
- Full `tsc --noEmit` still has known non-`src/chat-native` repository errors. P1.3 must keep `src/chat-native` TypeScript filter output empty.
- P1.2.5 evidence is live-first, redacted by default, and records that no live messages or live media were sent.

## Audit Inputs

P1.3 should use these existing artifacts as the starting truth:

- P1 product audit spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-productization-spec.md`
- P1 product audit evidence: `docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`
- P1.2 room productization spec: `docs/superpowers/specs/2026-06-15-native-idchat-p1-2-room-productization-spec.md`
- P1.2 evidence: `docs/superpowers/qa/evidence/native-idchat-p1-2-room-productization-20260615/`
- P1.2.5 release-readiness spec: `docs/superpowers/specs/2026-06-16-native-idchat-p1-2-5-release-readiness-stabilization-spec.md`
- P1.2.5 implementation plan: `docs/superpowers/plans/2026-06-17-native-idchat-p1-2-5-release-readiness-stabilization.md`
- P1.2.5 evidence: `docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616/`

Relevant P1.2.5 findings:

- Group room opened with back/info controls, member count, composer, media, and send affordances.
- Group info opened from a group room and kept Close, group-id Copy, Mute, Search members, Members, and Load more visible.
- The P1.2.5 Mute-card blocker was contained by replacing `Notification status unknown` with `Notifications unavailable`.
- Me/account opened with account sections, Copy buttons, Chat key status, Socket status, and bottom-tab navigation.
- P1.2.5 classified full group experience and full account UX as P1.3 deferrals.
- P1.2.5 kept full group management, red packets, full composer parity, Android/TestFlight/EAS, and WebView fallback outside scope.

Relevant current Native files:

- Group surfaces:
  - `src/chat-native/components/ConversationList.tsx`
  - `src/chat-native/screens/NativeChatRoomPage.tsx`
  - `src/chat-native/components/GroupInfoDrawer.tsx`
  - `src/chat-native/services/nativeChatGroupInfoService.ts`
  - `src/chat-native/services/chatApiClient.ts`
  - `src/chat-native/storage/chatRepository.ts`
  - `src/chat-native/domain/types.ts`
- Account surfaces:
  - `src/chat-native/screens/NativeChatMePage.tsx`
  - `src/chat-native/components/NativeChatAccountCard.tsx`
  - `src/chat-native/state/useNativeChatStore.ts`
  - `src/chat-native/services/nativeChatAccount.ts`
- Current focused tests:
  - `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`
  - `src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx`
  - `src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts`
  - `src/chat-native/services/__tests__/chatApiClient.test.ts`
  - `src/chat-native/storage/__tests__/chatRepository.test.ts`
  - `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
  - `src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx`

## P1.3 Product Goal

After P1.3, a reviewer should be able to use the Native simulator on `main`, compare group and account surfaces against Web IDChat's core expectations, and conclude:

- group conversations are identifiable from the list and room header;
- group info is a coherent read-only member and group summary;
- group members can be browsed and searched without raw IDs dominating the UI;
- unsupported group management actions are hidden or clearly read-only;
- Me is a product account surface rather than a debug panel;
- public account identifiers can be copied with clear feedback;
- connection/key status is understandable without exposing secrets;
- screenshots and logs can prove the above without leaking private message content or wallet/key material.

## P1.3 Scope

P1.3 includes:

- Group row and group-room identity polish: group avatar/fallback, group name, member count/context, preview safety, timestamp/unread behavior where data exists.
- Group info productization: group summary, group id copy, mute status containment, announcement display if available, member count, member search, member rows, loading/empty/error states, and unclipped layout.
- Member identity presentation: avatar or initials, display name fallback, role label, bounded public identifier, deterministic ordering, and no raw member payload dumps.
- Group member search: local or remote-backed search behavior, match state, no-result state, loading state, and failure containment.
- Me/account productization: avatar/name, Global MetaID, MVC address, chat public key, chat key status, socket/connection status, public-field copy feedback, empty/not-connected state, and unsupported-entry cleanup.
- Simulator evidence for group list entry, group room header, Group info, member search, Me/account, copy feedback, and route cycling.
- Tests that protect product copy, action availability, sensitive-data containment, and core rendering states.

## Explicit Non-Scope

P1.3 must not implement:

- Red packet creation, claiming, rendering parity, action surfacing, or composer entry.
- Full group management writes: invite, kick, admin promotion/demotion, owner transfer, mute writes, whitelist, permission edits, member role edits, group creation, group deletion, or group announcement editing.
- Full Web composer parity: non-image file types, stickers, advanced emoji parity, translation, Buzz sharing, fee selector parity, command palette, subchannel authoring, or mention parity beyond existing room behavior.
- Full room-message readability work that requires approved live sending or a new readable-room dataset. If readable private/group samples are needed, that becomes a user-approved evidence task before implementation.
- Android, TestFlight, EAS, App Store signing, release channels, or production deployment.
- WebView fallback.
- Protocol changes, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, shared-secret diagnostics, or decrypted sensitive message display in committed evidence.
- Broad visual redesign of the Native app shell.

## Product Principles

- Read-only is acceptable when write capability is not confirmed. A hidden unsupported write control is better than a visible dead action.
- Public identifiers are useful but secondary. Names, avatars, roles, counts, and product copy should be primary.
- Diagnostic status must be translated. For example, `Notifications unavailable` is acceptable; raw unknown-state labels or implementation names are not.
- Empty states must explain the surface. "No members found" is better than a blank member area.
- Every copy action must identify what was copied and only copy public fields.
- No P1.3 surface may expose mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message body in committed screenshots, logs, or buzz posts.

## Gap Matrix

| Area | Web/Product Behavior | Native Current Baseline | Gap | Severity | P1.3 Requirement |
| --- | --- | --- | --- | --- | --- |
| Group list identity | Group rows are identifiable before opening: group avatar/name, useful preview, time, unread state where data exists. | P1.2.5 live list loaded with stable rows and avatars, but group-row metadata remains mixed with list-level concerns. | Need P1.3 acceptance that group rows are clearly groups and do not look like generic fallback conversations. | High | P1.3-R1 |
| Group room header | Group room header identifies group name, avatar/fallback, and member context. | Header shows title, member count, back, and info. | Need long-name, missing-name, missing-member-count, and fallback-avatar rules. | Medium | P1.3-R2 |
| Group info summary | Group info summarizes group name, avatar, member count, id copy, mute status, and announcement if present. | Current drawer has summary, id copy, mute card, optional announcement. | Needs release-grade empty/loading/error behavior and no raw/diagnostic primary content. | High | P1.3-R3 |
| Group id handling | Group id is available to copy but does not dominate the screen. | Drawer shows shortId or groupId with Copy. | Need bounded display, copy feedback, and no full unbounded id as primary title. | Medium | P1.3-R4 |
| Mute status | Unsupported or unavailable status is product-contained. | P1.2.5 changed unknown state to `Notifications unavailable`. | Need preserve containment and avoid exposing a nonfunctional mute write control. | Medium | P1.3-R5 |
| Member rows | Member list shows avatar/name/role and bounded public identity. | Current row title uses name/globalMetaId/metaId/memberId and subtitle joins role plus id/address. | Raw IDs can dominate rows when names are missing. Need better fallback hierarchy and truncation. | High | P1.3-R6 |
| Member roles | Roles are human-readable and visually secondary. | Role is included in subtitle as raw role string. | Need role labels and ordering that help scanning without implying editable permissions. | Medium | P1.3-R7 |
| Member search | Search supports match/no-result/loading/failure states. | TextInput exists and repository supports query filtering; API has search endpoint. | Need visible no-result and failure states, plus evidence for match/no-result. | High | P1.3-R8 |
| Member pagination | Loading more members is understandable and does not clip drawer content. | `Load more` appears when `hasMoreMembers` is true. | Need loading/disabled/end states and no lower-content clipping. | Medium | P1.3-R9 |
| Group info errors | Fetch failures are contained in product UI. | Current drawer accepts props but does not own visible error copy. | Need room-level group-info load failure behavior and retry/back path. | High | P1.3-R10 |
| Account identity | Me shows avatar/name, Global MetaID, address, chat public key, status, and copy actions. | Current Me/account card shows these fields. | Needs hierarchy, sensitive-data guardrails, not-connected state, and less diagnostic status wording. | High | P1.3-R11 |
| Account public-field copy | Copy actions are scoped and visible. | Copy feedback works for Global MetaID and MVC address. | Need consistent copy feedback for all copyable public fields and no copy button for unavailable values. | Medium | P1.3-R12 |
| Chat key status | User can tell whether chat key is usable without seeing secrets. | Current card shows `Chat key active` or unavailable and can copy public key. | Need clarify public-key copy vs secret key, and avoid implying private key exposure. | High | P1.3-R13 |
| Socket/connection status | Connection state is understandable and useful. | Current card shows `Socket connected` / `Socket disconnected`. | Raw socket wording is too diagnostic unless it is reframed as chat sync status. Need product copy and safe status states. | Medium | P1.3-R14 |
| Unsupported settings | No dead placeholder settings remain. | Tests assert old `Native settings` placeholder is absent. | Need any visible future entry point either opens a real surface or is hidden/read-only. | Medium | P1.3-R15 |
| Navigation | Group info and Me route cycles return to chat context cleanly. | P1.2.5 route cycling passed. | Need P1.3 evidence after changes, including Group info close and bottom-tab switching. | High | P1.3-R16 |
| Evidence privacy | Live group/account screenshots preserve layout but redact private content. | P1.2.5 established redaction rules. | P1.3 must keep those rules while capturing more member/account detail. | High | P1.3-R17 |

## Requirements

### P1.3-R1: Group Rows In The Main List

Group conversations in the main Chats list must be distinguishable from private conversations without adding a separate group-management section.

Acceptance:

- Group rows use a group avatar image when available, otherwise deterministic initials/fallback.
- Group row title uses group name when available, otherwise a bounded fallback such as `Group chat`.
- Member count or group context is visible where the current list layout can support it without crowding.
- Preview content remains product-safe and does not expose raw ciphertext, raw JSON, raw group payloads, or low-level decrypt errors.
- Existing timestamp, unread, and ordering behavior from P1.1/P1.2.5 is preserved.
- Tapping a group row opens the group room and returns back to the Chats list without resetting visible rows unexpectedly; if exact scroll-position restoration cannot be guaranteed, the evidence README must record the observed return behavior.

### P1.3-R2: Group Room Header Identity

The group room header must make the room context clear before the user opens Group info.

Acceptance:

- Header shows group avatar/fallback, group name, and member count when known.
- Missing member count uses product copy such as `Group chat`, not a raw missing-value placeholder.
- Long group names truncate without overlapping back or info controls.
- Info action opens Group info only for group rooms.
- Header remains inside the safe area on iPhone 17 simulator.

### P1.3-R3: Group Info Summary

Group info must be a coherent read-only summary.

Acceptance:

- Drawer summary shows avatar/fallback, group name, and member count.
- Group id is shown as a bounded public identifier with a Copy action.
- Copying group id shows visible feedback in or near the drawer or parent room.
- Mute status uses product copy: `Muted`, `Notifications on`, or `Notifications unavailable`.
- If announcement exists, it is shown as product text with wrapping and without layout overlap.
- If announcement is absent, no empty announcement card is shown.
- Drawer content is not clipped at the bottom; `Load more` or empty/end states remain reachable.

### P1.3-R4: Group Info Loading, Empty, And Error States

Group info must handle slow or failed group metadata/member loading.

Acceptance:

- While group info is loading, the drawer shows a loading state that preserves header and close affordance.
- If no members are available after loading, the member area shows `No members found` or equivalent product copy.
- If member loading fails, the drawer shows a contained failure state and a retry or close path.
- Failure copy must not include raw endpoint URLs, raw response objects, stack traces, or exception names.
- Cached group info may be shown while network refresh is pending if the state is labeled or visually stable.

### P1.3-R5: Member Row Identity And Role

Member rows must be scannable and product-oriented.

Acceptance:

- Each member row shows avatar image or initials fallback.
- Primary text uses display name when available.
- If display name is unavailable, primary text uses a bounded identifier fallback that does not dominate the row.
- Secondary text shows role and at most one bounded public identifier.
- Role labels are human-readable: `Owner`, `Admin`, `Speaker`, `Member`, or `Blocked`.
- Member rows do not expose raw member payload JSON.
- Rows keep a stable height and do not overlap when names, roles, or identifiers are long.

### P1.3-R6: Member Search

Member search must be visibly useful and safely bounded.

Acceptance:

- Typing a query filters member rows or triggers the existing member search path according to the implementation plan's chosen data boundary.
- Match state shows only matching rows.
- No-result state shows product copy such as `No members found`.
- Clearing the query restores the default member list.
- Loading state remains visible for remote-backed search.
- Failure state is contained and does not expose raw API payloads.
- Search input does not cover the member list or drawer controls when the keyboard opens.

### P1.3-R7: Member Pagination

Member pagination must be understandable if more members exist.

Acceptance:

- `Load more` appears only when more members are available.
- Pressing `Load more` shows loading or disabled state until the request completes.
- End state removes `Load more` or replaces it with a noninteractive product cue.
- Failure state allows retry or leaves the prior list intact.
- Pagination must preserve existing search query behavior.

### P1.3-R8: Unsupported Group Management Containment

P1.3 must not expose group write controls unless they are already real and safe.

Acceptance:

- No visible invite, kick, role edit, owner transfer, mute write, whitelist, or permission-edit control appears unless it opens a real implemented native flow.
- If a group setting is visible but read-only, it is clearly presented as status text, not a pressable action.
- Any unsupported control observed in current UI is hidden or converted to read-only copy.
- There are no dead buttons that only close the sheet, no-op silently, or open an empty placeholder.

### P1.3-R9: Me Page Identity Hierarchy

The Me page must read as the user's IDChat account surface.

Acceptance:

- Top section shows avatar/fallback, display name, and connected/not-connected state.
- Global MetaID is visible as a public account identifier with copy action when present.
- MVC address is visible with copy action when present.
- Chat public key is visible as a public key, not as a secret or private key.
- Missing values use product copy and do not show copy actions.
- Text truncation preserves enough of each public identifier for recognition without layout overlap.

### P1.3-R10: Me Page Status Copy

Status rows must be user-facing rather than diagnostic.

Acceptance:

- Chat key status communicates whether private chat is ready without exposing any secret.
- Socket/connection status uses chat-sync product language, such as `Chat sync connected` and `Chat sync disconnected`, instead of raw socket implementation language.
- Disconnected and unavailable states are visually distinct from active states.
- Status rows remain read-only unless there is a real native action.
- No status row prints endpoint URLs, raw config, tokens, or secret material.

### P1.3-R11: Me Page Copy Feedback

Copy feedback must be clear, scoped, and nonintrusive.

Acceptance:

- Copying Global MetaID shows `Copied Global MetaID` or equivalent.
- Copying MVC address shows scoped feedback.
- Copying chat public key shows scoped feedback that does not say or imply private key.
- Feedback is visible long enough for simulator evidence.
- Copy actions copy the exact full value, while the visible row may remain truncated.
- Unavailable values have no copy action.

### P1.3-R12: Not-Connected And Partial-Account States

Me must handle incomplete account data without looking broken.

Acceptance:

- No account state shows a coherent empty surface with product copy and no broken rows.
- Account with Global MetaID but missing address still shows the available public identity.
- Account with missing chat public key explains private chat is unavailable.
- Socket disconnected state is contained.
- No placeholder settings card or empty native settings panel appears.

### P1.3-R13: Navigation And State Persistence

Group and account surfaces must not destabilize the core chat shell.

Acceptance:

- Chats -> group room -> Group info -> close -> back to Chats works without red screen or warning overlay.
- Chats -> Me -> Chats preserves bottom-tab state and does not clear loaded rows unexpectedly.
- Group info search query resets or persists consistently according to product behavior documented in the implementation plan.
- Copy feedback does not persist incorrectly after leaving and returning to Me or Group info.

### P1.3-R14: Sensitive-Data Handling

P1.3 evidence and UI must follow the P1.2.5 privacy boundary.

Acceptance:

- Live private/group message bodies, list previews, contact names, group names, and member names are redacted in committed screenshots unless the user explicitly approves retaining them.
- Redaction preserves layout, avatar positions, member row structure, search states, copy feedback, safe areas, and clipping evidence.
- Logs and buzz posts do not include mnemonic, private key, seed phrase, shared secret, QA wallet secret, decrypted sensitive message content, tokens, or raw screenshots.
- Public identifiers may appear in product UI evidence only when necessary for acceptance and should be bounded or redacted by default.

## Suggested Delivery Slices

These are product slices for the future implementation plan. They are not a code-level implementation plan.

### P1.3.1: Group List And Group Room Identity

Goal: make group conversations identifiable before and after opening.

Includes:

- group row avatar/name/member-context acceptance;
- group room header fallback and long-name behavior;
- preservation of existing list/search/room behavior;
- simulator evidence for Chats list, group room open, and back navigation.

Exit criteria:

- group rows no longer look like generic fallback private rows when group data exists;
- group room header has bounded title and member context;
- no red screen or navigation warning in group row -> room -> list cycle.

### P1.3.2: Group Info And Member Browsing

Goal: make Group info a release-credible read-only group surface.

Includes:

- summary, id copy, mute status, announcement;
- member row identity and role labels;
- member search match/no-result/loading/failure;
- member pagination states;
- unsupported group write controls hidden or read-only.

Exit criteria:

- Group info is unclipped and usable on iPhone 17 simulator;
- member search has visible match and no-result states;
- no raw group/member JSON or unsupported write action appears.

### P1.3.3: Me And Account Identity

Goal: make Me a product account surface rather than a diagnostic panel.

Includes:

- profile hierarchy;
- Global MetaID, MVC address, and chat public key public-field rows;
- chat readiness and sync status copy;
- not-connected and partial-account states;
- copy feedback for all copyable public fields.

Exit criteria:

- Me renders full, partial, and no-account states with product copy;
- public-field copy feedback is scoped and visible;
- no secret or placeholder settings surface appears.

### P1.3.4: Final Evidence And Release Readout

Goal: prove P1.3 with redacted live evidence and focused regression gates.

Includes:

- final P1.3 evidence README;
- live screenshots for group list, group room, Group info, member search, Me, copy feedback, and route cycling;
- supplemental mock screenshots only for unsafe or impractical account states;
- final test and TypeScript-filter logs.

Exit criteria:

- evidence README marks PASS or FAIL;
- all screenshots are mode-labeled and redacted by default;
- `yarn test:chat-native`, `git diff --check`, and `src/chat-native` TypeScript filter pass.

## Acceptance Criteria

### Required Commands

Each implementation branch must capture or rerun:

```bash
git status --short --branch
git log --oneline --decorate --max-count=12
yarn test:chat-native
git diff --check
npm exec tsc -- --noEmit --pretty false > /tmp/idchat-p1-3-tsc.log 2>&1; true
rg -n "src/chat-native" /tmp/idchat-p1-3-tsc.log > /tmp/idchat-p1-3-tsc-chat-native-filter.log || true
```

Expected:

- `yarn test:chat-native` exits 0.
- `git diff --check` exits 0.
- `tsc-chat-native-filter.log` is empty.
- Full `tsc --noEmit` may still fail only on known non-`src/chat-native` errors.

### Required Simulator Evidence

Create evidence under:

`docs/superpowers/qa/evidence/native-idchat-p1-3-group-account-productization-20260617/`

Required screenshots:

- `01-live-group-row-redacted.png`: Chats list with at least one visible group row.
- `02-live-group-room-header-redacted.png`: group room header and top transcript area.
- `03-live-group-info-summary-redacted.png`: Group info summary with group id copy and mute status.
- `04-live-group-member-search-match-redacted.png`: member search match state.
- `05-live-group-member-search-no-result-redacted.png`: member search no-result state.
- `06-live-group-info-load-more-or-end-redacted.png`: pagination or end state.
- `07-live-me-account-redacted.png`: Me/account with identity and status rows.
- `08-live-me-copy-feedback-redacted.png`: Me copy feedback after copying a public identifier.
- `09-live-route-cycle-redacted.png`: return to Chats after group info and Me route cycle.

Supplemental mock screenshots are allowed only for states that cannot be safely produced live, such as no-account, partial-account, member fetch failure, or group-info loading failure. They must be labeled as mock in filenames and README.

### Evidence README Requirements

The P1.3 evidence README must include:

- commit under test;
- branch and worktree path;
- simulator device/runtime/UDID;
- live-vs-mock mode proof;
- sensitive-data redaction rules used;
- screenshot inventory;
- PASS/FAIL table for group rows, group room header, Group info, member search, pagination, Me/account, copy feedback, navigation, and privacy;
- final verification command outputs or log paths;
- exact blockers if result is FAIL;
- P2/P3 deferrals if result is PASS with concerns.

## Risks And Open Questions

- Real live data may not contain a group with enough named members to prove all member-search states. If so, use live evidence for real group entry and supplemental mock evidence for search/no-result/failure.
- Web parity for full group management is intentionally deferred. If users expect invite/kick/mute writes in P1.3, that requires a new product decision and separate spec.
- Current Me page exposes chat public key as a public field. The implementation plan must keep copy wording explicit so no user mistakes it for a private key.
- Readable private/group message content remains P2/P3 unless the user approves a safe live sample. P1.3 should not send messages or upload media to manufacture evidence.
- Member identity source quality depends on API profile data. P1.3 can improve fallback hierarchy and containment, but it cannot invent missing names or avatars without a separate profile-enrichment task.

## Implementation Plan Handoff Notes

- Start from `main` containing `588ea07` or later.
- Do not reopen P1.1 list/search/discovery work except where group row identity is directly affected.
- Do not reopen P1.2 room transcript work except where group header or group-info entry is directly affected.
- Keep P1.2.5 avatar endpoint work as baseline; only verify avatars visually.
- Treat `17a65ac` as baseline containment for Mute status and preserve its behavior.
- Prefer small, evidence-first tasks: group rows/header, Group info/member search, Me/account, final evidence.
- Every implementation task should begin with a failing test or simulator evidence for the visible gap it addresses.
- Keep live screenshots redacted by default and delete raw screenshots before commit.
- The implementation plan should explicitly list likely touched files and forbid red packets, full group management, full composer parity, Android/TestFlight/EAS, and WebView fallback.
