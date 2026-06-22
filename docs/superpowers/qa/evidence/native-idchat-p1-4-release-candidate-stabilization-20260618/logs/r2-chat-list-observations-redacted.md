# P1.4-R2 Chat List Observations, Redacted

Date: 2026-06-18

Scope: Native chat list release-candidate readability only. This batch changed list preview/display-safety behavior and related tests. It did not change Web IDChat, room UI, media renderer/card behavior, composer, group info, Me/account, Android, TestFlight/EAS, or WebView fallback.

## Implementation Boundary

- `Encrypted message` is used for Native list previews whose display input is ciphertext-like or an already-normalized decrypt failure.
- `Unsupported message` is used for Native list previews whose display input is a structured raw payload that should not be printed in the list.
- `[Image]` remains the list preview for image rows. Room media/card behavior remains assigned to P1.4-R4.
- `Message unavailable` is not hidden; it remains the generic fallback for empty or unclassified list preview input.
- Room message body text still uses the existing room-level decrypt/unsupported states. P1.4-R2 does not productize room layout or message actions.

## Test-First Evidence

RED was verified before implementation with focused tests for:

- `nativeChatDisplaySafety`: encrypted previews, structured unsupported previews, and generic empty fallback.
- `chatUiSelectors`: private and group list preview output for encrypted/decrypt-fallback/structured inputs.
- `ConversationList`: visible list rows render distinct `Encrypted message`, `Unsupported message`, and `[Image]` preview states without collapsing all rows to `Message unavailable`.

The same focused test set passed after implementation.

## Verification

- `yarn test:chat-native`: pass, 43 suites and 414 tests. See `logs/yarn-test-chat-native-r2.log`.
- `git diff --check`: pass. See `logs/git-diff-check-r2.log`.
- `npx tsc --noEmit --pretty false`: repo-level exit 2; `logs/tsc-chat-native-filter-r2.log` is empty, so no `src/chat-native` TypeScript errors were observed in this run.

## Live-Mode Simulator Evidence

- Simulator: iPhone 17, iOS 26.5.
- Bundle id: `com.meta.idchat`.
- Metro: live mode from this checkout, with Native IDChat mock env toggles unset. See `logs/mock-mode-proof-r2-live.txt` and `logs/metro-r2-live.log`.
- Screenshot: `05-native-chat-list-r2-redacted.png`.
- Redaction: row names, avatars, row ids, timestamps, Global MetaIDs, full txids, raw URIs, raw payloads, and message bodies are not committed. Non-sensitive product-state labels remain visible.
- Raw screenshot directory: `/tmp/idchat-p1-4-r2-raw/` was deleted after redaction. See `logs/raw-tmp-deletion-r2.log`.

## Redacted First-Viewport Observation

| Visible row class | Count in captured first viewport | Product-state label shown | R2 interpretation |
| --- | ---: | --- | --- |
| encrypted/decrypt-fallback preview | 7+ | `Encrypted message` | List preview is productized without claiming a root cause. Account/key mismatch, missing peer key, protocol mismatch, and Native decrypt failure remain separate hypotheses. |
| media-like preview | 1 | `[Image]` | List preview semantics are clear. Room/card rendering remains P1.4-R4 scope. |
| generic unavailable fallback | 0 visible | `Message unavailable` not visible in captured first viewport | The list is no longer dominated by one generic unavailable label in this live-mode viewport. |
| unsupported structured preview | 0 visible | `Unsupported message` not visible in captured first viewport | Covered by tests; not present in the captured visible viewport. |

## Native/Web Parity Boundary

Web same-row parity remains not proven for this R2 batch. R2 does not use Web IDChat as a readability oracle and does not change Web IDChat. The list-level Native improvement is based on Native diagnostic classes and productized display-safety behavior only.

## Recommendation

P1.4-R2 is ready for review as a chat-list-only release-candidate stabilization slice. Proceed to P1.4-R3 only after accepting that R2 is limited to list preview/readability and does not resolve room readability or media card behavior.
