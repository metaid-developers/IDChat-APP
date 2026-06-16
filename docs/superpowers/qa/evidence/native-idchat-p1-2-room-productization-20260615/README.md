# Native IDChat P1.2 Room Productization Evidence - 2026-06-15

## Result

P1.2 code, automated verification, and final Simulator interaction evidence: PASS.

The previous Simulator window blocker was resolved on 2026-06-16. Final acceptance screenshots were captured from the deterministic `ui-parity` Native IDChat mock scenario, not from live decrypted rooms.

## Commits Under Test

- Branch: `codex/native-idchat-p1-2-room-productization`
- Product-code commits under test:
  - `64c3a1c fix: align native room evidence fixture metadata`
  - `039c33b fix: expose native room latest mock state`
- Evidence commits after product code: `1f5b829 docs: capture native room p1.2 evidence`, `497930c docs: add native room final verification logs`
- Base: `0f0ae2d docs: add native idchat p1.2 room spec`

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

## Captured Simulator Evidence

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
- Final acceptance screenshots `00` through `13` are deterministic mock screenshots.
- Earlier diagnostic logs from the previously blocked Simulator pass remain historical diagnostics only and are not used as final room acceptance evidence.
