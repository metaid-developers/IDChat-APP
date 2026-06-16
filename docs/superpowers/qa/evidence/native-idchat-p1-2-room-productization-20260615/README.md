# Native IDChat P1.2 Room Productization Evidence - 2026-06-15

## Result

P1.2 code, automated verification, and final Simulator interaction evidence: PASS after the 2026-06-16 review-blocker refresh.

The final acceptance set now combines redacted live-room Simulator navigation evidence for one private room and one group room with deterministic `ui-parity` mock screenshots for unsafe, media, action, pagination, keyboard, and disabled-composer states. The mock scenario is supplemental; it no longer substitutes for the live private/group room acceptance evidence.

## Commits Under Test

- Branch: `codex/native-idchat-p1-2-room-productization`
- Base: `0f0ae2d docs: add native idchat p1.2 room spec`
- Product implementation span under acceptance: `2dacebc..039c33b`, including the boundary implementation commit `2dacebc feat: productize native chat room states` through `039c33b fix: expose native room latest mock state`.
- Evidence/documentation commits after product code: `1f5b829`, `497930c`, `5abe987`, `4c5322d`, `ad0f3fd docs: add live native room acceptance evidence`, and this traceability-only refresh commit.
- Live-room evidence payload commit: `ad0f3fd docs: add live native room acceptance evidence`.
- Final acceptance HEAD: this traceability-only refresh commit (`docs: refresh native room evidence traceability`).
- Detailed branch/base log: `logs/commit-under-test.txt`

## Automated Verification

- `yarn test:chat-native` passed.
  - Evidence: `logs/yarn-test-chat-native.log`
  - Result: 42 suites passed, 340 tests passed.
- `git diff --check` passed.
  - Evidence: `logs/git-diff-check.log`
- `npm exec tsc -- --noEmit --pretty false` still exits non-zero from existing non-chat-native errors.
  - Evidence: `logs/tsc-noemit.log`
  - `logs/tsc-chat-native-filter.log` is empty, proving no emitted `src/chat-native` TypeScript errors in this run.

Final verification refresh after the evidence commit:

- Evidence: `logs/final-verification-summary.txt`
- `TEST_STATUS=0`
- `DIFF_STATUS=0`
- `TSC_STATUS=2`
- `CHAT_NATIVE_TSC_LINES=0`
- Detailed logs: `logs/final-yarn-test-chat-native.log`, `logs/final-git-diff-check.log`, `logs/final-tsc-noemit.log`, `logs/final-tsc-chat-native-filter.log`

Simulator retry verification after the latest mock-state fixture:

- `yarn test:chat-native --runTestsByPath src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` passed.
- `git diff --check -- src/chat-native/dev/nativeChatUiMockScenario.ts src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` passed.

Final Simulator retry verification:

- Evidence: `logs/retry-final-verification-summary.txt`
- `TEST_STATUS=0`
- `DIFF_STATUS=0`
- `TSC_STATUS=2`
- `CHAT_NATIVE_TSC_LINES=0`
- Detailed logs: `logs/retry-final-yarn-test-chat-native.log`, `logs/retry-final-git-diff-check.log`, `logs/retry-final-tsc-noemit.log`, `logs/retry-final-tsc-chat-native-filter.log`

Review-blocker acceptance refresh on 2026-06-16:

- Evidence: `logs/review-blocker-final-verification-summary.txt`
- `yarn test:chat-native` passed.
- `git diff --check` passed.
- `npm exec tsc -- --noEmit --pretty false` still exits non-zero from existing non-chat-native errors.
- `logs/review-blocker-final-tsc-chat-native-filter.log` is empty, proving no emitted `src/chat-native` TypeScript errors in this final refresh.
- Detailed logs: `logs/review-blocker-final-yarn-test-chat-native.log`, `logs/review-blocker-final-git-diff-check.log`, `logs/review-blocker-final-tsc-noemit.log`, `logs/review-blocker-final-tsc-chat-native-filter.log`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Dev-client URL: `logs/dev-client-url.txt`
- Device inventory: `logs/simctl-devices.txt`
- Boot/open logs: `logs/simctl-bootstatus.log`, `logs/simctl-openurl.log`
- Retry method:
  - The installed Simulator app initially had no `main.jsbundle`, causing `No script URL provided`.
  - A local embedded bundle was generated with `npx --no-install expo export:embed --platform ios --dev false --unstable-transform-profile hermes --bytecode`.
  - The Simulator app bundle's `EXConstants.bundle/app.config` was set to `extra.nativeIdchatMockScenario = "ui-parity"` for deterministic mock evidence.
  - No live message, live media, mnemonic import, private key, seed phrase, shared secret, or QA wallet secret was used.
- Retry logs:
  - `logs/simctl-app-bundle-files-retry-20260616.txt`
  - `logs/export-embed-latest-fixture-retry-20260616.log`
  - `logs/exconstants-app-config-write-ui-parity-retry-20260616.txt`
  - `logs/simctl-launch-latest-fixture-retry-20260616.log`
- Live-room refresh logs:
  - `logs/live-room-acceptance-summary-20260616.txt`
  - `logs/live-room-exconstants-remove-mock-20260616.txt`
  - `logs/live-room-simctl-boot-20260616.log`
  - `logs/live-room-simctl-launch-20260616.log`
  - `logs/live-room-simctl-openurl-20260616.log`
  - `logs/live-room-simctl-launch-redirected-20260616.log`
  - `logs/live-room-simctl-list-pre-restart-20260616.log`
  - `logs/live-room-springboard-icon-state-20260616.log`

## Captured Simulator Evidence

Live-room acceptance evidence, captured from the real Native chat list with `extra.nativeIdchatMockScenario` removed from the Simulator app bundle:

- `14-live-private-list-redacted.png`
  - Real Native list before opening a private room; previews/timestamps are redacted.
- `15-live-private-room-redacted.png`
  - Real private room opened from the Native list; header shows the private room state and transcript content is redacted.
- `16-live-private-back-to-list-redacted.png`
  - Back navigation from the live private room returns to the Native list; previews/timestamps are redacted.
- `17-live-group-list-redacted.png`
  - Real Native list filtered to a known group room with a `G` badge; preview/timestamp is redacted.
- `18-live-group-room-redacted.png`
  - Real group room opened from the Native list; header shows the group room member subtitle and transcript content is redacted.
- `19-live-group-back-to-list-redacted.png`
  - Back navigation from the live group room returns to the Native list; preview/timestamp is redacted.

Deterministic mock supplemental evidence for full P1.2 state coverage:

- `00-mock-chat-list.png`
  - Deterministic mock list with private, group, disabled-composer, and media rooms.
- `01-private-room-text.png`
  - Lisa Hahn private room, readable transcript, tx metadata, composer.
- `02-group-room-text.png`
  - MetaWeb Builders group room, member subtitle, incoming/outgoing bubbles, unsupported message fallback.
- `03-long-message-wrapping.png`
  - Long message stays inside the bubble and wraps without horizontal clipping.
- `04-message-actions-text.png`
  - Text message actions bottom sheet: copy text, copy txid, open tx, quote.
- `05-transaction-actions.png`
  - Transaction presentation/actions with full txid visible in the action sheet.
- `06-image-message.png`
  - Image/media room with rendered image message.
- `07-image-unavailable-or-loading.png`
  - Image unavailable fallback shown in the same media room.
- `08-quote-composer.png`
  - Quote composer after selecting Quote from message actions.
- `09-keyboard-open-composer.png`
  - iOS software keyboard open with composer and quote preview retained.
- `10-load-earlier-state.png`
  - Load earlier messages affordance at room top.
- `11-latest-or-new-messages-affordance.png`
  - New messages/latest affordance rendered from the UI parity mock latest-index state.
- `12-disabled-composer-state.png`
  - Missing peer chat public key disables text, media, and send controls while preserving readable history.
- `13-back-to-chat-list.png`
  - Back navigation returns to the deterministic mock chat list.

## Sensitive Data Handling

- No mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message content is included.
- A raw database payload was not saved to this evidence directory.
- Live acceptance raw screenshots were written only under `/tmp`, then redacted before committing evidence screenshots `14` through `19`.
- The live group-room screenshot contains no committed decrypted message body because the transcript area is fully redacted.
- Final mock screenshots `00` through `13` remain deterministic supplemental evidence.
- Earlier diagnostic logs from the previously blocked Simulator pass remain historical diagnostics only and are not used as final room acceptance evidence.
