# P1.4-R5 Final Release-Candidate Observations Redacted

Date: 2026-06-23

## Scope

R5 is evidence-only. No product code, Web IDChat code, room behavior, media renderer behavior, composer behavior, account/key flow, Android, EAS/TestFlight, WebView fallback, or red packet behavior was changed in this batch.

Product candidate under final verification:

- Branch: `codex/native-idchat-p1-4-release-candidate-stabilization`
- Tested HEAD before this evidence-only batch: `592d2a1`
- Baseline final-audit commit present: `2401096`

## Live-Mode Smoke Evidence

- Chat list: `13-native-chat-list-r5-redacted.png`
  - Visible product states: `Private chat`, `Encrypted message`, `[Image]`.
  - Generic `Message unavailable` did not dominate the captured viewport.
- Search/discovery: `14-native-search-discovery-r5-redacted.png`
  - Online bot panel opened from the chat list.
  - Visible product states: `Online bots`, `Refresh`, `Close`, `Online now - 1 device`.
- Group info: `15-native-group-info-r5-redacted.png`
  - A live group row opened its group info drawer.
  - Visible product states: `Group info`, member count, `GROUP ID`, `MUTE`, `Notifications unavailable`, `Search members`, and `Members`.
- Me/account: `16-native-me-account-r5-redacted.png`
  - Me/account tab opened.
  - Visible product states: `Connected account`, `Private chat ready`, and `Chat sync connected`.
- Keyboard/composer: covered by R3 closeout screenshot `07-native-private-room-r3-keyboard-redacted.png`.
- Media room: covered by R4.1 screenshot `12-native-media-room-r4-1-redacted.png`.

Mock-mode proof:

- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=<unset>`
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST=<unset>`
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_ACCOUNT_STATE=<unset>`

## Native/Web Parity Position

Native/Web same-row parity remains not proven for the original blocker rows. The active Native and Web account/session/key conditions were not proven equivalent without exposing account/key material, so R5 does not use Web IDChat as a readability oracle and does not claim Web-readable parity for non-equivalent rows.

## Verification

- `yarn test:chat-native`: pass, 43 suites and 430 tests. See `yarn-test-chat-native-r5.log`.
- `git diff --check`: pass. See `git-diff-check-r5.log`.
- TypeScript noEmit: repo-level exit 2 on existing non-chat-native errors. See `tsc-noemit-r5.log`.
- TypeScript chat-native filter: zero lines. See `tsc-chat-native-filter-r5.log`.
- R5 sensitive-value scan: pass. See `sensitive-value-scan-r5.log`.
- R5 raw screenshot temp directory deleted. See `raw-tmp-deletion-r5.log`.

## Redaction

Committed R5 screenshots preserve only non-sensitive product labels and product-state classes. Names, avatars, row titles, account values, group names, member names, full identifiers, full txids, raw URIs, raw payloads, and message bodies are redacted.

Raw screenshot inputs were kept only under `/tmp/idchat-p1-4-r5-raw/` while generating redacted screenshots and were deleted before this evidence was committed.

## Recommendation

PASS ready for release gate
