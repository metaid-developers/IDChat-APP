# Native IDChat P1.4 Release-Candidate Stabilization Evidence

Date: 2026-06-18 through 2026-06-23

Scope: P1.4-R1 through P1.4-R5, reproduce and classify Native first-screen readability gaps, then stabilize list, private-room, media-row behavior, and final release-candidate evidence without expanding into excluded P1.4 scope.

## Status

P1.4-R1 evidence captured. No product code was changed in this batch.

The R1 gate remains evidence-first: the observations below do not assume that a Web IDChat row is readable when a Native row is unreadable. Native/Web same-account and same-row equivalence was not established in this R1 run, so Web was not used as a readability oracle.

R1.1 correction captured stronger redacted evidence overlays for reviewer-visible product-state labels and added diagnostic classes. The temporary raw screenshot directory `/tmp/idchat-p1-4-r1-raw/` was deleted after regenerating the redacted overlays.

P1.4-R2 chat-list release-candidate readiness is captured. R2 changed only Native list preview/display-safety behavior and related tests. Room UI, media renderer/card behavior, composer, group info, Me/account, Android, EAS/TestFlight, WebView fallback, and Web IDChat were not changed.

R2 keeps the R1.1 diagnostic hypotheses separated: encrypted/decrypt-fallback list previews are productized as `Encrypted message`, structured unsupported payload previews are productized as `Unsupported message`, image rows remain `[Image]`, and `Message unavailable` remains available only as a generic empty/unclassified fallback. R2 does not classify unknown account/key, protocol, or renderer causes as a Native bug.

P1.4-R3 private-room release-candidate readiness is captured. R3 changed only Native room message selector/display-safety behavior, message bubble readability, and focused tests. Media card rendering, composer parity, full group management, Me/account, Android, EAS/TestFlight, WebView fallback, red packets, and Web IDChat were not changed.

R3 keeps the diagnostic hypotheses separated: room encrypted/decrypt-fallback bodies are productized as `Encrypted message`, unsupported structured bodies are productized as `Unsupported message`, and blank supported bodies are productized as `Message unavailable`. R3 does not classify unknown account/key, protocol, or renderer causes as a Native bug.

R3 evidence closeout was updated on 2026-06-22 with one additional simulator screenshot for keyboard/composer acceptance. No product code changed in that follow-up. The new screenshot proves that the focused composer remains visible above the software keyboard, the input contains no user-entered text, and the empty send state remains disabled.

P1.4-R4 media-row release-candidate readiness is captured. R4 changed only Native media-row rendering/fallback behavior, the room-entry latest-pinning needed to land on the audited media zone, and focused tests. Web IDChat, upload flows, non-image file parity, WebView fallback, composer parity, group management, Me/account, Android, EAS/TestFlight, and red packets were not changed.

R4 keeps media failure separated from decrypt failure. Content-only renderable image URIs now reuse the existing media resolver path, bounded `Image unavailable` containment remains visible for non-renderable image rows, and the room-entry latest pin keeps the opened `[Image]` row on the latest media zone instead of an older unreadable transcript segment.

P1.4-R4.1 follow-up captured after review. R4.1 changed only Native room-entry media display and latest-pinning behavior needed to prove the audited `[Image]` row opens into the latest media zone. It adds direct room-entry tests, a layout-pinning test, and a new redacted simulator screenshot with the room media zone and empty disabled composer visible. R4.1 did not change Web IDChat, media upload flows, non-image file parity, composer parity, group management, Me/account, Android, EAS/TestFlight, WebView fallback, or red packets.

P1.4-R5 final release-candidate evidence is captured. R5 is evidence-only: no product code, Web IDChat code, composer behavior, media renderer behavior, account/key flow, Android, EAS/TestFlight, WebView fallback, or red packet behavior changed in this batch. The product candidate under final verification is branch `codex/native-idchat-p1-4-release-candidate-stabilization` at HEAD `592d2a1` (`fix: strengthen native media row entry readiness`), which descends from `c3dac17` and includes baseline `2401096`.

Native/Web same-row parity remains not proven for the original blocker rows because the active Native and Web account/session/key conditions are not proven equivalent without exposing account or key material. R5 therefore does not use Web IDChat as a readability oracle and does not claim Web-readable parity for rows whose sessions are non-equivalent. The release recommendation is based on the Native live-mode release gates and the product-contained R1-R4.1 outcomes captured here.

## Evidence Files

- `01-native-chat-list-r1-redacted.png`: redacted Native first-screen chat list navigation evidence.
- `02-native-row-1-room-r1-redacted.png`: redacted room navigation evidence for first visible row.
- `03-native-row-2-room-r1-redacted.png`: redacted room navigation evidence for second visible row.
- `04-native-row-3-room-r1-redacted.png`: redacted room navigation evidence for third visible row.
- `05-native-chat-list-r2-redacted.png`: redacted Native live-mode chat list evidence after R2 list preview productization.
- `06-native-private-room-r3-redacted.png`: redacted Native live-mode private room evidence after R3 room containment/readability changes.
- `07-native-private-room-r3-keyboard-redacted.png`: redacted Native live-mode private room evidence with keyboard/composer acceptance visible.
- `10-native-media-row-rc-redacted.png`: redacted Native live-mode chat-list evidence for the audited `[Image]` row after R4.
- `11-native-media-room-rc-redacted.png`: redacted Native live-mode private-room media evidence after R4.
- `12-native-media-room-r4-1-redacted.png`: redacted Native live-mode room-entry proof after R4.1, showing the audited media zone and empty disabled composer state.
- `13-native-chat-list-r5-redacted.png`: redacted Native live-mode final chat-list smoke evidence at the R5 product candidate.
- `14-native-search-discovery-r5-redacted.png`: redacted Native live-mode search/discovery smoke evidence via the online bot panel.
- `15-native-group-info-r5-redacted.png`: redacted Native live-mode group info smoke evidence.
- `16-native-me-account-r5-redacted.png`: redacted Native live-mode Me/account smoke evidence.
- `logs/r1-row-classification-redacted.md`: row-by-row R1 classification table and decision notes.
- `logs/r1-diagnostic-classes-redacted.md`: R1.1 structured diagnostic classes for the first three Native rows.
- `logs/r2-chat-list-observations-redacted.md`: R2 implementation, test, and live-mode chat-list observations.
- `logs/r3-private-room-observations-redacted.md`: R3 implementation, test, and live-mode private-room observations.
- `logs/r4-media-row-observations-redacted.md`: R4 implementation, test, and live-mode media-row observations.
- `logs/r4-1-navigation-accessibility-redacted.md`: R4.1 tapped-row navigation and latest-media-zone proof, redacted.
- `logs/r5-final-rc-observations-redacted.md`: R5 final release-candidate observation and recommendation notes.
- `logs/redacted-screenshot-sha256-r1-1.log`: hashes for the R1.1 redacted overlay screenshots.
- `logs/redacted-screenshot-sha256-r2.log`: hash for the R2 redacted chat-list screenshot.
- `logs/redacted-screenshot-sha256-r3.log`: hash for the R3 redacted private-room screenshot.
- `logs/redacted-screenshot-sha256-r3-keyboard.log`: hash for the R3 keyboard/composer redacted screenshot.
- `logs/redacted-screenshot-sha256-r4.log`: hashes for the R4 redacted media screenshots.
- `logs/redacted-screenshot-sha256-r4-1.log`: hash for the R4.1 redacted room-entry proof screenshot.
- `logs/redacted-screenshot-sha256-r5.log`: hashes for the R5 redacted final smoke screenshots.
- `logs/raw-tmp-deletion-r1-1.log`: deletion check for the temporary raw screenshot directory.
- `logs/raw-tmp-deletion-r2.log`: deletion check for the temporary R2 raw screenshot directory.
- `logs/raw-tmp-deletion-r3.log`: deletion check for the temporary R3 raw screenshot directory.
- `logs/raw-tmp-deletion-r3-keyboard.log`: deletion check for the temporary R3 keyboard/composer raw screenshot directory.
- `logs/raw-tmp-deletion-r4.log`: deletion check for the temporary R4 raw screenshot directory.
- `logs/raw-tmp-deletion-r4-1.log`: deletion check for the temporary R4.1 raw screenshot directory.
- `logs/raw-tmp-deletion-r5.log`, `logs/raw-tmp-deletion-r5-exit.txt`: deletion check for the temporary R5 raw screenshot directory.
- `logs/git-diff-check-r1-1.log`, `logs/git-diff-check-r1-1-exit.txt`: R1.1 whitespace verification.
- `logs/git-diff-check-r2.log`, `logs/git-diff-check-r2-exit.txt`: R2 whitespace verification.
- `logs/git-diff-check-r3.log`, `logs/git-diff-check-r3-exit.txt`: R3 whitespace verification.
- `logs/git-diff-check-r3-keyboard-evidence.log`, `logs/git-diff-check-r3-keyboard-evidence-exit.txt`: R3 evidence-only closeout whitespace verification.
- `logs/git-diff-check-r4.log`, `logs/git-diff-check-r4-exit.txt`: R4 whitespace verification.
- `logs/git-diff-check-r4-1.log`, `logs/git-diff-check-r4-1-exit.txt`: R4.1 whitespace verification.
- `logs/git-diff-check-r5.log`, `logs/git-diff-check-r5-exit.txt`: R5 whitespace verification.
- `logs/sensitive-value-scan-r1-1.log`, `logs/sensitive-value-scan-r1-1-exit.txt`: R1.1 sensitive value pattern scan.
- `logs/sensitive-value-scan-r2.log`, `logs/sensitive-value-scan-r2-exit.txt`: R2 sensitive value pattern scan for committed evidence.
- `logs/sensitive-value-scan-r3.log`, `logs/sensitive-value-scan-r3-exit.txt`: R3 sensitive value pattern scan for committed evidence.
- `logs/sensitive-value-scan-r3-keyboard.log`, `logs/sensitive-value-scan-r3-keyboard-exit.txt`: R3 evidence-only closeout sensitive value pattern scan for committed evidence.
- `logs/sensitive-value-scan-r4.log`, `logs/sensitive-value-scan-r4-exit.txt`: R4 sensitive value pattern scan for committed evidence.
- `logs/sensitive-value-scan-r4-1.log`, `logs/sensitive-value-scan-r4-1-exit.txt`: R4.1 sensitive value pattern scan for committed evidence.
- `logs/sensitive-value-scan-r5.log`, `logs/sensitive-value-scan-r5-exit.txt`: R5 sensitive value pattern scan for committed evidence.
- `logs/yarn-test-chat-native.log`: baseline Native chat test output.
- `logs/yarn-test-chat-native-r2.log`, `logs/yarn-test-chat-native-r2-exit.txt`: R2 Native chat test output.
- `logs/yarn-test-chat-native-r3.log`, `logs/yarn-test-chat-native-r3-exit.txt`: R3 Native chat test output.
- `logs/yarn-test-chat-native-r4.log`, `logs/yarn-test-chat-native-r4-exit.txt`: R4 Native chat test output.
- `logs/yarn-test-chat-native-r4-1.log`, `logs/yarn-test-chat-native-r4-1-exit.txt`: R4.1 Native chat test output.
- `logs/yarn-test-chat-native-r5.log`, `logs/yarn-test-chat-native-r5-exit.txt`: R5 Native chat test output.
- `logs/git-diff-check.log`: baseline whitespace check output.
- `logs/tsc-noemit-r2.log`, `logs/tsc-noemit-r2-exit.txt`, `logs/tsc-chat-native-filter-r2.log`: R2 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit-r3.log`, `logs/tsc-noemit-r3-exit.txt`, `logs/tsc-chat-native-filter-r3.log`: R3 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit-r4.log`, `logs/tsc-noemit-r4-exit.txt`, `logs/tsc-chat-native-filter-r4.log`: R4 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit-r4-1.log`, `logs/tsc-noemit-r4-1-exit.txt`, `logs/tsc-chat-native-filter-r4-1.log`: R4.1 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit-r5.log`, `logs/tsc-noemit-r5-exit.txt`, `logs/tsc-chat-native-filter-r5.log`: R5 TypeScript noEmit output and chat-native filter.
- `logs/tsc-noemit.log`, `logs/tsc-exit.txt`, `logs/tsc-chat-native-filter.log`: TypeScript noEmit output and chat-native filter.
- `logs/mock-mode-proof-live.txt`: proof that Native mock-mode env toggles were not set for this run.
- `logs/mock-mode-proof-r2-live.txt`: proof that Native mock-mode env toggles were not set for the R2 live-mode run.
- `logs/mock-mode-proof-r3-live.txt`: proof that Native mock-mode env toggles were not set for the R3 live-mode run.
- `logs/mock-mode-proof-r3-keyboard-live.txt`: proof that Native mock-mode env toggles were not set for the R3 keyboard/composer live-mode run.
- `logs/mock-mode-proof-r4-live.txt`: proof that Native mock-mode env toggles were not set for the R4 live-mode run.
- `logs/mock-mode-proof-r4-1-live.txt`: proof that Native mock-mode env toggles were not set for the R4.1 live-mode run.
- `logs/mock-mode-proof-r5-live.txt`: proof that Native mock-mode env toggles were not set for the R5 live-mode smoke run.
- `logs/r5-capture-context-redacted.txt`: branch, tested HEAD, and UTC capture timestamp for the R5 live-mode smoke run.
- `logs/metro-live.log`: Metro live-mode server output.
- `logs/metro-r2-live.log`: R2 Metro live-mode server output.
- `logs/metro-r3-live.log`: R3 Metro live-mode server output.
- `logs/metro-r3-keyboard-live.log`: R3 keyboard/composer follow-up Metro live-mode server output.
- `logs/metro-r4-live.log`: R4 Metro live-mode server output.
- `logs/simctl-openurl-r2-live-retry.log`, `logs/simctl-openurl-r2-live-retry-exit.txt`: R2 dev-client open retry used for the captured live bundle.
- `logs/simctl-screenshot-r2-live.log`, `logs/simctl-screenshot-r2-live-exit.txt`: R2 raw screenshot capture command output before redaction.
- `logs/simctl-openurl-r3-live.log`, `logs/simctl-openurl-r3-live-exit.txt`: R3 dev-client open command output.
- `logs/simctl-screenshot-r3-live.log`, `logs/simctl-screenshot-r3-live-exit.txt`: R3 raw screenshot capture command output before redaction.
- `logs/simctl-launch-r3-keyboard-live.log`, `logs/simctl-launch-r3-keyboard-live-exit.txt`: R3 keyboard/composer app launch command output.
- `logs/simctl-screenshot-r3-keyboard-live.log`, `logs/simctl-screenshot-r3-keyboard-live-exit.txt`: R3 keyboard/composer raw screenshot capture command output before redaction.
- `logs/simctl-launch-r4-live.log`, `logs/simctl-launch-r4-live-exit.txt`: R4 app launch command output for the live-mode session.
- `logs/simctl-launch-r4-relaunch.log`, `logs/simctl-launch-r4-relaunch-exit.txt`: R4 relaunch command output after the first room-entry pass.
- `logs/simctl-screenshot-r4-list-live.log`, `logs/simctl-screenshot-r4-list-live-exit.txt`: R4 raw list screenshot capture command output before redaction.
- `logs/simctl-screenshot-r4-list-refresh.log`, `logs/simctl-screenshot-r4-list-refresh-exit.txt`: refreshed R4 raw list screenshot capture output used for the cleaned committed R4 list image.
- `logs/simctl-screenshot-r4-room-live.log`, `logs/simctl-screenshot-r4-room-live-exit.txt`: R4 raw room screenshot capture command output before redaction.
- `logs/simctl-screenshot-r4-room-loading-live.log`, `logs/simctl-screenshot-r4-room-loading-live-exit.txt`: R4 raw room screenshot capture output for the media-card loading state.
- `logs/simctl-booted-r4-1-live.txt`: R4.1 booted simulator proof.
- `logs/simctl-screenshot-r4-1-room-live.log`, `logs/simctl-screenshot-r4-1-room-live-exit.txt`: R4.1 raw room screenshot capture command output before redaction.
- `logs/simctl-booted-r5-live.txt`: R5 booted simulator proof.
- `logs/metro-r5-live-port.txt`: R5 Metro port observation for the live-mode smoke run.
- `logs/simctl-screenshot-r5-list-live.log`, `logs/simctl-screenshot-r5-list-live-exit.txt`: R5 raw final-list screenshot capture command output before redaction.
- `logs/simctl-screenshot-r5-search-discovery-live.log`, `logs/simctl-screenshot-r5-search-discovery-live-exit.txt`: R5 raw search/discovery screenshot capture command output before redaction.
- `logs/simctl-screenshot-r5-group-info-live.log`, `logs/simctl-screenshot-r5-group-info-live-exit.txt`: R5 raw group-info screenshot capture command output before redaction.
- `logs/simctl-screenshot-r5-me-account-live.log`, `logs/simctl-screenshot-r5-me-account-live-exit.txt`: R5 raw Me/account screenshot capture command output before redaction.

## Redaction Rules Applied

- No mnemonic, private key, shared secret, QA wallet secret, Global MetaID, full txid, or decrypted sensitive message content is stored here.
- Screenshots are intentionally conservative: account names, avatars, row titles, message text areas, tx labels, row ids, raw URIs, raw payloads, and composer state are redacted.
- Product-state labels are safe overlay annotations in the R1.1 images, including `Message unavailable`, `[Image]`, `Unable to decrypt this message`, `Unsupported message`, and `no visible media card`.
- Raw screenshots were kept only as temporary audit inputs and were deleted from `/tmp/idchat-p1-4-r1-raw/` after R1.1 overlay regeneration.
- The R2 redacted screenshot preserves only non-sensitive product labels such as `Private chat`, `Encrypted message`, and `[Image]`. Names, avatars, row ids, timestamps, Global MetaIDs, raw payloads, txids, URIs, and decrypted message text are not committed. The R2 raw screenshot directory `/tmp/idchat-p1-4-r2-raw/` was deleted after redaction.
- The R3 redacted screenshot preserves only non-sensitive product labels such as `Private chat`, `Load earlier messages`, `Encrypted message`, `This message cannot be displayed here.`, `Unsupported message`, and `This message type is not supported here yet.` Names, avatars, row ids, timestamps, Global MetaIDs, tx labels, raw payloads, URIs, and any user-entered composer text are not committed. The R3 raw screenshot directory `/tmp/idchat-p1-4-r3-raw/` was deleted after redaction.
- The R3 keyboard/composer screenshot preserves only non-sensitive product labels such as `Private chat`, `Load earlier messages`, `Encrypted message`, `Unsupported message`, the empty `Message` composer placeholder, the disabled empty send affordance, and the software keyboard. Names, avatars, Global MetaIDs, tx labels, raw payloads, and any user-entered composer text are not committed. The R3 keyboard/composer raw screenshot directory `/tmp/idchat-p1-4-r3-keyboard-raw/` was deleted after redaction.
- The R4 redacted list screenshot preserves only non-sensitive product labels such as `Private chat` and `[Image]`. The R4 redacted room screenshot preserves only non-sensitive product labels such as `Private chat`, `Image unavailable`, and `Loading image`. Names, avatars, full identifiers, raw URIs, raw payloads, and decrypted message bodies are not committed. The R4 raw screenshot directory `/tmp/idchat-p1-4-r4-raw/` was deleted after redaction.
- On 2026-06-22, the committed R4 screenshots were refreshed with tighter crops and lighter overlays so reviewers can still see the non-sensitive product-state labels while residual name, tx, and action-button fragments stay redacted.
- The R4.1 redacted screenshot preserves only non-sensitive product labels such as `Private chat`, `Image unavailable`, the empty `Message` composer placeholder, and disabled empty send affordance. Names, avatars, tx fragments, raw URIs, raw payloads, and message bodies are not committed. The R4.1 raw screenshot directory `/tmp/idchat-p1-4-r4-1-raw/` was deleted after redaction.
- The R5 redacted screenshots preserve only non-sensitive product labels and status classes: `Private chat`, `Encrypted message`, `[Image]`, `Online bots`, `Online now - 1 device`, `Group info`, `96 members`, `Notifications unavailable`, `Members`, `Me`, `Connected account`, `Private chat ready`, and `Chat sync connected`. Names, avatars, row titles, group names, member names, account values, full identifiers, full txids, raw URIs, raw payloads, and message bodies are not committed. The R5 raw screenshot directory `/tmp/idchat-p1-4-r5-raw/` was deleted after redaction.

## Code Paths Read

- List preview and row view model: `src/chat-native/ui/chatUiSelectors.ts`.
- Last-message and room-message decrypt path: `src/chat-native/services/chatMessageDecryption.ts`.
- Media URI resolution: `src/chat-native/ui/nativeChatMedia.ts`.
- Supporting paths identified for later batches: `src/chat-native/services/nativeChatSyncService.ts`, `src/chat-native/services/chatNormalizers.ts`, `src/chat-native/components/ConversationList.tsx`, `src/chat-native/components/MessageList.tsx`, `src/chat-native/components/MessageBubble.tsx`, `src/chat-native/screens/NativeChatHomePage.tsx`, `src/chat-native/screens/NativeChatRoomPage.tsx`.
- R2 implementation paths: `src/chat-native/services/nativeChatDisplaySafety.ts`, `src/chat-native/ui/chatUiSelectors.ts`, `src/chat-native/components/ConversationList.tsx`, and the corresponding focused Jest tests.
- R3 implementation paths: `src/chat-native/ui/chatUiSelectors.ts`, `src/chat-native/components/MessageBubble.tsx`, `src/chat-native/components/MessageList.tsx`, and the corresponding focused Jest tests.
- R4 implementation paths: `src/chat-native/components/MessageBubble.tsx`, `src/chat-native/components/ImageMessage.tsx`, `src/chat-native/components/MessageList.tsx`, `src/chat-native/screens/NativeChatRoomPage.tsx`, `src/chat-native/ui/nativeChatMedia.ts`, and the corresponding focused Jest tests.
- R5 evidence-only paths: this README, `logs/r5-final-rc-observations-redacted.md`, R5 verification logs, and R5 redacted screenshots.

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
- R3 `yarn test:chat-native`: pass, 43 suites and 419 tests.
- R3 `git diff --check`: pass.
- R3 TypeScript noEmit: repo-level exit 2 on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter-r3.log` is empty.
- R3 sensitive value scan: pass; no sensitive value-pattern hits in committed R3 evidence.
- R3 iOS Simulator live-mode: Metro bundled `index.js` from this checkout and the visible private room showed product-contained `Encrypted message` and `Unsupported message` states with no visible `Unable to decrypt this message`, raw ciphertext, or raw structured payload in the captured room.
- R3 evidence-only closeout on 2026-06-22: no product code changed; `git diff HEAD --check` passed; the follow-up sensitive value scan passed; and the additional live-mode screenshot showed the focused composer above the software keyboard with no user-entered composer text and the empty send state still disabled.
- R4 `yarn test:chat-native`: see `logs/yarn-test-chat-native-r4.log`.
- R4 `git diff --check`: see `logs/git-diff-check-r4.log`.
- R4 TypeScript noEmit: see `logs/tsc-noemit-r4.log`; `logs/tsc-chat-native-filter-r4.log` records the chat-native filter result.
- R4 iOS Simulator live-mode: Metro bundled `index.js` from this checkout and the audited `[Image]` row opened into the latest media zone, where the captured room showed a bounded `Image unavailable` fallback alongside a visible `Loading image` card state for a renderable media row, with no raw URI or raw payload visible in committed evidence.
- R4.1 `yarn test:chat-native`: pass, 43 suites and 430 tests.
- R4.1 `git diff --check`: pass.
- R4.1 TypeScript noEmit: repo-level exit 2 on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter-r4-1.log` is empty.
- R4.1 sensitive value scan: pass; no prohibited raw-sensitive value-pattern hits in committed R4.1 evidence.
- R4.1 iOS Simulator live-mode: Metro bundled `index.js` from this checkout and the tapped `[Image]` row opened into the latest media zone, where the captured room showed `Private chat`, multiple `Image unavailable` media cards, and an empty disabled composer with no raw URI, raw payload, tx fragment, name, avatar, or message body visible in committed evidence.
- R5 `yarn test:chat-native`: pass, 43 suites and 430 tests.
- R5 `git diff --check`: pass.
- R5 TypeScript noEmit: repo-level exit 2 on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter-r5.log` is empty.
- R5 iOS Simulator live-mode: mock scenario, mock empty list, and mock account-state env toggles were unset. The final smoke screenshots cover chat list, search/discovery, group info, Me/account, and reuse R3/R4.1 evidence for keyboard/composer and media room acceptance.
- R5 sensitive value scan: pass; no prohibited raw-sensitive value-pattern hits in R5 authored text evidence. PNG bytes, redacted screenshot SHA256 logs, and localhost Metro logs are intentionally excluded from this text scan.

## Candidate Branch And Key Commits

- Branch under test: `codex/native-idchat-p1-4-release-candidate-stabilization`.
- Product candidate HEAD under final verification: `592d2a1` (`fix: strengthen native media row entry readiness`).
- Baseline final-audit commit included: `2401096` (`docs: add native idchat p1 final audit`).
- Plan commit: `c3dac17` (`docs: add native idchat p1.4 implementation plan`).
- R1 evidence commits: `221fed3`, `0e3ddab`.
- R2 product commit: `47cc4e4`.
- R3 product/evidence commits: `824e252`, `0a46d11`.
- R4 product commits: `53ea577`, `592d2a1`.

## Release-Readiness Matrix

| Gate | Status | Evidence |
| --- | --- | --- |
| Chat list readability | PASS | `13-native-chat-list-r5-redacted.png`, `logs/r2-chat-list-observations-redacted.md`, `logs/yarn-test-chat-native-r5.log` |
| Private room readability and containment | PASS | `06-native-private-room-r3-redacted.png`, `logs/r3-private-room-observations-redacted.md` |
| Keyboard/composer stability | PASS | `07-native-private-room-r3-keyboard-redacted.png`, `logs/r3-private-room-observations-redacted.md` |
| Media preview row behavior | PASS | `10-native-media-row-rc-redacted.png`, `12-native-media-room-r4-1-redacted.png`, `logs/r4-media-row-observations-redacted.md`, `logs/r4-1-navigation-accessibility-redacted.md` |
| Search/discovery smoke | PASS | `14-native-search-discovery-r5-redacted.png`, `logs/r5-final-rc-observations-redacted.md` |
| Group info smoke | PASS | `15-native-group-info-r5-redacted.png`, `logs/r5-final-rc-observations-redacted.md` |
| Me/account smoke | PASS | `16-native-me-account-r5-redacted.png`, `logs/r5-final-rc-observations-redacted.md` |
| Native/Web same-row parity | NOT PROVEN | Native/Web account/session/key equivalence is not established; P1.4 does not claim Web-readable parity for non-equivalent rows. |
| Sensitive evidence handling | PASS | `logs/sensitive-value-scan-r5.log`, `logs/raw-tmp-deletion-r5.log`, `logs/redacted-screenshot-sha256-r5.log` |

## Blocking Issues

None for the P1.4 release-candidate gate.

## Non-Blocking Issues

- Repository-wide TypeScript noEmit still exits 2 on known non-`src/chat-native` errors. The R5 chat-native filter is empty.
- Native/Web same-row parity remains not proven because account/session/key equivalence is not established in the redacted evidence. This is recorded as non-equivalent rather than treated as a Native decrypt bug.
- Historical media assets can still resolve to bounded `Image unavailable` fallback when the asset itself is not renderable or accessible. The fallback is product-contained and separate from decrypt failure.

## Final Recommendation

PASS ready for release gate
