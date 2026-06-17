# Native IDChat P1.3 Group Account Productization Evidence

Result: PASS

Commit under test: `1473ed3 feat: stabilize native p1.3 route state`

Branch: `codex/native-idchat-p1-3-group-account-productization`

Worktree: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Simulator: iPhone 17, iOS 26.5, UDID `CF3620CF-4769-486E-847B-911C96172049`

## Live Mode Proof

`logs/mock-mode-proof-live.txt` records:

- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK env: not set`
- `app.config nativeIdchatMock entries: none in live proof`

`logs/simctl-bootstatus.log` confirms the iPhone 17 simulator was already booted.

## Masking Rules

- `01-live-group-row-redacted.png`: preserves the app header, search UI, one group row layout, avatar/fallback placement, `Group chat` label, timestamp area, and bottom tabs; masks personal-looking avatar and row text areas.
- `02-live-group-room-header-redacted.png`: preserves the group room header structure, member count, back/info controls, `Load earlier messages`, and composer controls; masks live group avatar/name and the transcript region.
- `03-live-group-info-summary-redacted.png`: preserves `Group info`, `Close`, member count, `GROUP ID` and `Copy`, `MUTE`, search field, member row structure, `Member` role labels, and `Load more`; masks live group avatar/name, the group id value, and member avatars/names/identifiers.
- `04-live-group-member-search-match-redacted.png`: preserves the member search query, matching member row structure, `Member` role labels, and `Load more`; masks live group avatar/name, group id value, and member avatars/names/identifiers.
- `05-live-group-member-search-no-result-redacted.png`: preserves the no-result search query, `Members`, and `No members found`; masks live group avatar/name and group id value.
- `06-live-group-info-load-more-or-end-redacted.png`: preserves pagination evidence through `Load more`; masks live group avatar/name, group id value, and member avatars/names/identifiers.
- `07-live-me-account-redacted.png`: preserves Me page identity field labels, copy controls, and chat key/socket status labels; masks live account avatar and public identifier values.
- `08-live-me-copy-feedback-redacted.png`: preserves the chat public key copy feedback text plus Me page status labels; masks live account avatar and public identifier values.
- `09-live-route-cycle-redacted.png`: preserves route round-trip state evidence with existing redaction.

## Screenshot Inventory

| File | Status |
| --- | --- |
| `01-live-group-row-redacted.png` | present |
| `02-live-group-room-header-redacted.png` | present |
| `03-live-group-info-summary-redacted.png` | present |
| `04-live-group-member-search-match-redacted.png` | present |
| `05-live-group-member-search-no-result-redacted.png` | present |
| `06-live-group-info-load-more-or-end-redacted.png` | present |
| `07-live-me-account-redacted.png` | present |
| `08-live-me-copy-feedback-redacted.png` | present |
| `09-live-route-cycle-redacted.png` | present |

## Acceptance Table

| Area | Result | Evidence |
| --- | --- | --- |
| Group rows | PASS | `01-live-group-row-redacted.png` |
| Group room header | PASS | `02-live-group-room-header-redacted.png` |
| Group info | PASS | `03-live-group-info-summary-redacted.png` |
| Member search | PASS | `04-live-group-member-search-match-redacted.png`, `05-live-group-member-search-no-result-redacted.png` |
| Pagination | PASS | `06-live-group-info-load-more-or-end-redacted.png` |
| Me/account | PASS | `07-live-me-account-redacted.png` |
| Copy feedback | PASS | `08-live-me-copy-feedback-redacted.png` |
| Navigation | PASS | `09-live-route-cycle-redacted.png` |
| Privacy | PASS | Required redacted images exist; scan proofs are saved under `logs/evidence-*-scan.log`. |

## Verification Logs

- `logs/yarn-test-chat-native.log`: PASS, 43 suites and 412 tests.
- `logs/git-diff-check.log`: PASS, regenerated after intent-to-add for the full evidence package; no whitespace errors.
- `logs/tsc-noemit.log`: captured full TypeScript output.
- `logs/tsc-chat-native-filter.log`: PASS, empty.
- `logs/evidence-safety-scan.log`: PASS, evidence safety scan produced no matches.
- `logs/evidence-endpoint-scan.log`: PASS, local endpoint scan produced no matches.
- `logs/evidence-runtime-noise-scan.log`: PASS, runtime diagnostic noise scan produced no matches.
- `logs/git-status-before.txt`: captured before final packaging.
- `logs/git-status-after.txt`: captured after final packaging commands.
- `logs/git-log-under-test.txt`: commit under test.
- `logs/mock-mode-proof-live.txt`: live-mode proof.
- `logs/metro-live-task7.log`: Metro live capture log from the earlier live run.
- `logs/simctl-devices.txt`: simulator inventory.
- `logs/simctl-bootstatus.log`: boot status for the target simulator.
- `logs/simctl-openurl-live.log`: live open-url log from the earlier run.
- `logs/simctl-screenshot-live.log`: screenshot capture log with final packaging note.

## Blockers

None.

## P2/P3 Deferrals

- P3: `logs/tsc-noemit.log` still records existing TypeScript errors outside `src/chat-native`; `logs/tsc-chat-native-filter.log` is empty, so this does not block Task 7.
