# Native IDChat P1.4 Release-Candidate Stabilization Evidence

Date: 2026-06-18

Scope: P1.4-R1, reproduce and classify Native first-screen readability gaps before any P1.4-R2/R3/R4 product-code change.

## Status

P1.4-R1 evidence captured. No product code was changed in this batch.

The R1 gate remains evidence-first: the observations below do not assume that a Web IDChat row is readable when a Native row is unreadable. Native/Web same-account and same-row equivalence was not established in this R1 run, so Web was not used as a readability oracle.

R1.1 correction captured stronger redacted evidence overlays for reviewer-visible product-state labels and added diagnostic classes. The temporary raw screenshot directory `/tmp/idchat-p1-4-r1-raw/` was deleted after regenerating the redacted overlays.

## Evidence Files

- `01-native-chat-list-r1-redacted.png`: redacted Native first-screen chat list navigation evidence.
- `02-native-row-1-room-r1-redacted.png`: redacted room navigation evidence for first visible row.
- `03-native-row-2-room-r1-redacted.png`: redacted room navigation evidence for second visible row.
- `04-native-row-3-room-r1-redacted.png`: redacted room navigation evidence for third visible row.
- `logs/r1-row-classification-redacted.md`: row-by-row R1 classification table and decision notes.
- `logs/r1-diagnostic-classes-redacted.md`: R1.1 structured diagnostic classes for the first three Native rows.
- `logs/redacted-screenshot-sha256-r1-1.log`: hashes for the R1.1 redacted overlay screenshots.
- `logs/raw-tmp-deletion-r1-1.log`: deletion check for the temporary raw screenshot directory.
- `logs/git-diff-check-r1-1.log`, `logs/git-diff-check-r1-1-exit.txt`: R1.1 whitespace verification.
- `logs/sensitive-value-scan-r1-1.log`, `logs/sensitive-value-scan-r1-1-exit.txt`: R1.1 sensitive value pattern scan.
- `logs/yarn-test-chat-native.log`: baseline Native chat test output.
- `logs/git-diff-check.log`: baseline whitespace check output.
- `logs/tsc-noemit.log`, `logs/tsc-exit.txt`, `logs/tsc-chat-native-filter.log`: TypeScript noEmit output and chat-native filter.
- `logs/mock-mode-proof-live.txt`: proof that Native mock-mode env toggles were not set for this run.
- `logs/metro-live.log`: Metro live-mode server output.

## Redaction Rules Applied

- No mnemonic, private key, shared secret, QA wallet secret, Global MetaID, full txid, or decrypted sensitive message content is stored here.
- Screenshots are intentionally conservative: account names, avatars, row titles, message text areas, tx labels, row ids, raw URIs, raw payloads, and composer state are redacted.
- Product-state labels are safe overlay annotations in the R1.1 images, including `Message unavailable`, `[Image]`, `Unable to decrypt this message`, `Unsupported message`, and `no visible media card`.
- Raw screenshots were kept only as temporary audit inputs and were deleted from `/tmp/idchat-p1-4-r1-raw/` after R1.1 overlay regeneration.

## Code Paths Read

- List preview and row view model: `src/chat-native/ui/chatUiSelectors.ts`.
- Last-message and room-message decrypt path: `src/chat-native/services/chatMessageDecryption.ts`.
- Media URI resolution: `src/chat-native/ui/nativeChatMedia.ts`.
- Supporting paths identified for later batches: `src/chat-native/services/nativeChatSyncService.ts`, `src/chat-native/services/chatNormalizers.ts`, `src/chat-native/components/ConversationList.tsx`, `src/chat-native/components/MessageList.tsx`, `src/chat-native/components/MessageBubble.tsx`, `src/chat-native/screens/NativeChatHomePage.tsx`, `src/chat-native/screens/NativeChatRoomPage.tsx`.

## Verification Snapshot

- `yarn test:chat-native`: pass, 43 suites and 412 tests.
- `git diff --check`: pass.
- TypeScript noEmit: failed on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter.log` is empty.
- iOS Simulator live-mode: captured via iPhone 17 simulator, iOS 26.5, bundle `com.meta.idchat`.
- R1.1 correction: docs/evidence-only; the full `yarn test:chat-native` command was not rerun because no product code changed. This README continues to reference the R1 baseline test result above.
