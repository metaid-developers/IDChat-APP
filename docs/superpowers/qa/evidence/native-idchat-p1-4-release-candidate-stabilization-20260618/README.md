# Native IDChat P1.4 Release-Candidate Stabilization Evidence

Date: 2026-06-18

Scope: P1.4-R1, reproduce and classify Native first-screen readability gaps before any P1.4-R2/R3/R4 product-code change.

## Status

P1.4-R1 evidence captured. No product code was changed in this batch.

The R1 gate remains evidence-first: the observations below do not assume that a Web IDChat row is readable when a Native row is unreadable. Native/Web same-account and same-row equivalence was not established in this R1 run, so Web was not used as a readability oracle.

R1.1 correction captured stronger redacted evidence overlays for reviewer-visible product-state labels and added diagnostic classes. The temporary raw screenshot directory `/tmp/idchat-p1-4-r1-raw/` was deleted after regenerating the redacted overlays.

P1.4-R2 chat-list release-candidate readiness is captured. R2 changed only Native list preview/display-safety behavior and related tests. Room UI, media renderer/card behavior, composer, group info, Me/account, Android, EAS/TestFlight, WebView fallback, and Web IDChat were not changed.

R2 keeps the R1.1 diagnostic hypotheses separated: encrypted/decrypt-fallback list previews are productized as `Encrypted message`, structured unsupported payload previews are productized as `Unsupported message`, image rows remain `[Image]`, and `Message unavailable` remains available only as a generic empty/unclassified fallback. R2 does not classify unknown account/key, protocol, or renderer causes as a Native bug.

## Evidence Files

- `01-native-chat-list-r1-redacted.png`: redacted Native first-screen chat list navigation evidence.
- `02-native-row-1-room-r1-redacted.png`: redacted room navigation evidence for first visible row.
- `03-native-row-2-room-r1-redacted.png`: redacted room navigation evidence for second visible row.
- `04-native-row-3-room-r1-redacted.png`: redacted room navigation evidence for third visible row.
- `05-native-chat-list-r2-redacted.png`: redacted Native live-mode chat list evidence after R2 list preview productization.
- `logs/r1-row-classification-redacted.md`: row-by-row R1 classification table and decision notes.
- `logs/r1-diagnostic-classes-redacted.md`: R1.1 structured diagnostic classes for the first three Native rows.
- `logs/r2-chat-list-observations-redacted.md`: R2 implementation, test, and live-mode chat-list observations.
- `logs/redacted-screenshot-sha256-r1-1.log`: hashes for the R1.1 redacted overlay screenshots.
- `logs/redacted-screenshot-sha256-r2.log`: hash for the R2 redacted chat-list screenshot.
- `logs/raw-tmp-deletion-r1-1.log`: deletion check for the temporary raw screenshot directory.
- `logs/raw-tmp-deletion-r2.log`: deletion check for the temporary R2 raw screenshot directory.
- `logs/git-diff-check-r1-1.log`, `logs/git-diff-check-r1-1-exit.txt`: R1.1 whitespace verification.
- `logs/git-diff-check-r2.log`, `logs/git-diff-check-r2-exit.txt`: R2 whitespace verification.
- `logs/sensitive-value-scan-r1-1.log`, `logs/sensitive-value-scan-r1-1-exit.txt`: R1.1 sensitive value pattern scan.
- `logs/sensitive-value-scan-r2.log`, `logs/sensitive-value-scan-r2-exit.txt`: R2 sensitive value pattern scan for committed evidence.
- `logs/yarn-test-chat-native.log`: baseline Native chat test output.
- `logs/yarn-test-chat-native-r2.log`, `logs/yarn-test-chat-native-r2-exit.txt`: R2 Native chat test output.
- `logs/git-diff-check.log`: baseline whitespace check output.
- `logs/tsc-noemit-r2.log`, `logs/tsc-noemit-r2-exit.txt`, `logs/tsc-chat-native-filter-r2.log`: R2 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit.log`, `logs/tsc-exit.txt`, `logs/tsc-chat-native-filter.log`: TypeScript noEmit output and chat-native filter.
- `logs/mock-mode-proof-live.txt`: proof that Native mock-mode env toggles were not set for this run.
- `logs/mock-mode-proof-r2-live.txt`: proof that Native mock-mode env toggles were not set for the R2 live-mode run.
- `logs/metro-live.log`: Metro live-mode server output.
- `logs/metro-r2-live.log`: R2 Metro live-mode server output.
- `logs/simctl-openurl-r2-live-retry.log`, `logs/simctl-openurl-r2-live-retry-exit.txt`: R2 dev-client open retry used for the captured live bundle.
- `logs/simctl-screenshot-r2-live.log`, `logs/simctl-screenshot-r2-live-exit.txt`: R2 raw screenshot capture command output before redaction.

## Redaction Rules Applied

- No mnemonic, private key, shared secret, QA wallet secret, Global MetaID, full txid, or decrypted sensitive message content is stored here.
- Screenshots are intentionally conservative: account names, avatars, row titles, message text areas, tx labels, row ids, raw URIs, raw payloads, and composer state are redacted.
- Product-state labels are safe overlay annotations in the R1.1 images, including `Message unavailable`, `[Image]`, `Unable to decrypt this message`, `Unsupported message`, and `no visible media card`.
- Raw screenshots were kept only as temporary audit inputs and were deleted from `/tmp/idchat-p1-4-r1-raw/` after R1.1 overlay regeneration.
- The R2 redacted screenshot preserves only non-sensitive product labels such as `Private chat`, `Encrypted message`, and `[Image]`. Names, avatars, row ids, timestamps, Global MetaIDs, raw payloads, txids, URIs, and decrypted message text are not committed. The R2 raw screenshot directory `/tmp/idchat-p1-4-r2-raw/` was deleted after redaction.

## Code Paths Read

- List preview and row view model: `src/chat-native/ui/chatUiSelectors.ts`.
- Last-message and room-message decrypt path: `src/chat-native/services/chatMessageDecryption.ts`.
- Media URI resolution: `src/chat-native/ui/nativeChatMedia.ts`.
- Supporting paths identified for later batches: `src/chat-native/services/nativeChatSyncService.ts`, `src/chat-native/services/chatNormalizers.ts`, `src/chat-native/components/ConversationList.tsx`, `src/chat-native/components/MessageList.tsx`, `src/chat-native/components/MessageBubble.tsx`, `src/chat-native/screens/NativeChatHomePage.tsx`, `src/chat-native/screens/NativeChatRoomPage.tsx`.
- R2 implementation paths: `src/chat-native/services/nativeChatDisplaySafety.ts`, `src/chat-native/ui/chatUiSelectors.ts`, `src/chat-native/components/ConversationList.tsx`, and the corresponding focused Jest tests.

## Verification Snapshot

- `yarn test:chat-native`: pass, 43 suites and 412 tests.
- `git diff --check`: pass.
- TypeScript noEmit: failed on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter.log` is empty.
- iOS Simulator live-mode: captured via iPhone 17 simulator, iOS 26.5, bundle `com.meta.idchat`.
- R1.1 correction: docs/evidence-only; the full `yarn test:chat-native` command was not rerun because no product code changed. This README continues to reference the R1 baseline test result above.
- R2 `yarn test:chat-native`: pass, 43 suites and 414 tests.
- R2 `git diff --check`: pass.
- R2 TypeScript noEmit: repo-level exit 2 on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter-r2.log` is empty.
- R2 iOS Simulator live-mode: Metro bundled `index.js` from this checkout and the visible chat list showed `Encrypted message` and `[Image]` states with no visible `Message unavailable` rows in the captured first viewport.
