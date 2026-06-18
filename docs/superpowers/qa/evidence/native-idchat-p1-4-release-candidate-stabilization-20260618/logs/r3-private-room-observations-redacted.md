# P1.4-R3 Private Room Observations, Redacted

Date: 2026-06-18

Scope: Native private chat room release-candidate readability and bounded unreadable/unsupported containment only. This batch did not change Web IDChat, media card rendering, composer parity, full group management, Me/account, Android, TestFlight/EAS, WebView fallback, or red packets.

## Implementation Boundary

- Room ciphertext/decrypt-fallback body text is productized as `Encrypted message` with the detail `This message cannot be displayed here.`
- Room unsupported payload body text is productized as `Unsupported message` with the detail `This message type is not supported here yet.`
- Blank supported private text is productized as `Message unavailable` with the detail `This message has no readable content.`
- Raw ciphertext-like strings, raw structured payloads, and the technical failure text `Unable to decrypt this message` are not rendered as room message bodies and are not offered as copy text.
- The outgoing unsupported placeholder keeps the outgoing bubble text color so the label remains readable on the blue bubble.
- Image/media card rendering remains unchanged and is still assigned to P1.4-R4.

## Test-First Evidence

RED was verified before implementation with focused tests for:

- `chatUiSelectors`: encrypted/decrypt-fallback room bodies must become product-contained room text.
- `MessageBubble`: encrypted fallback rows must render product text/detail without technical failure text.
- `MessageList`: mixed private room rows must contain encrypted, unsupported, readable, and unavailable states without exposing raw ciphertext or structured payload text.
- `messageActions`: blank private room rows must not offer copy text.
- `MessageBubble`: self unsupported placeholders must not use muted text on outgoing bubbles.

The same focused tests passed after implementation, and the full Native chat suite was rerun after the final style adjustment.

## Verification

- `yarn test:chat-native`: pass, 43 suites and 419 tests. See `logs/yarn-test-chat-native-r3.log`.
- `git diff --check`: pass. See `logs/git-diff-check-r3.log`.
- `npx tsc --noEmit --pretty false`: repo-level exit 2; `logs/tsc-chat-native-filter-r3.log` is empty, so no `src/chat-native` TypeScript errors were observed in this run.
- Sensitive value scan: pass. See `logs/sensitive-value-scan-r3.log`.

## Live-Mode Simulator Evidence

- Simulator: iPhone 17, iOS 26.5.
- Bundle id: `com.meta.idchat`.
- Metro: live mode from this checkout, with Native IDChat mock env toggles unset. See `logs/mock-mode-proof-r3-live.txt` and `logs/metro-r3-live.log`.
- Screenshot: `06-native-private-room-r3-redacted.png`.
- Redaction: account names, avatars, row ids, timestamps, Global MetaIDs, tx labels, raw payloads, and composer text are not committed. Non-sensitive product-state labels remain visible.
- Raw screenshot directory: `/tmp/idchat-p1-4-r3-raw/` was deleted after redaction. See `logs/raw-tmp-deletion-r3.log`.

## Redacted Room Observation

| Visible room state | Product-state label shown | R3 interpretation |
| --- | --- | --- |
| encrypted/decrypt-fallback body | `Encrypted message`; `This message cannot be displayed here.` | The room shows a bounded product state without claiming whether the root cause is account/key mismatch, missing peer key, protocol mismatch, or Native decrypt failure. |
| unsupported structured body | `Unsupported message`; `This message type is not supported here yet.` | The room contains unsupported content without exposing raw structured payload text or expanding into red packet/composer work. |
| generic decrypt failure text | Not visible | `Unable to decrypt this message` is not printed as the primary room body in the captured room. |
| raw ciphertext / raw JSON payload | Not visible | Sensitive or technical payload content is contained. |
| composer area | Stable and empty | No composer parity behavior was changed or tested beyond confirming the captured room did not show keyboard instability. |

## Native/Web Parity Boundary

Web same-row parity remains not proven for this R3 batch. R3 does not use Web IDChat as a readability oracle and does not change Web IDChat. The room-level Native improvement is based on Native diagnostic classes and productized display-safety behavior only.

## Recommendation

P1.4-R3 is ready for review as a private-room-only release-candidate stabilization slice. Proceed to P1.4-R4 only after accepting that R3 is limited to room readability/containment and does not resolve media card rendering.
