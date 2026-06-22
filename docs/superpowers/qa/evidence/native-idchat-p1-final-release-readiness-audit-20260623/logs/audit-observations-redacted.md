# Native IDChat P1 Final Audit Observations Redacted

Date: 2026-06-23

## Runtime And Evidence Boundary

- Audit target branch: `codex/native-idchat-p1-4-release-candidate-stabilization`.
- Audit HEAD: `96802ca`.
- Product candidate under R5 verification: `592d2a1`.
- The previous P1 final audit blocker commit `2401096` is an ancestor of the current branch.
- This audit reused already-redacted P1.4 live-mode screenshots. No new raw screenshot directory was created in this audit batch.
- Native/Web same-row parity remains not proven. The audit does not infer that Web can read the same rows under equivalent key/session conditions.

## Scope Review

- Product changes from `2401096..592d2a1` are limited to Native chat surfaces:
  - `src/chat-native/services/nativeChatDisplaySafety.ts`
  - `src/chat-native/ui/chatUiSelectors.ts`
  - `src/chat-native/components/MessageBubble.tsx`
  - `src/chat-native/components/MessageList.tsx`
  - `src/chat-native/screens/NativeChatRoomPage.tsx`
  - focused tests under `src/chat-native`
- R5 commit `96802ca` is evidence-only and changes only the P1.4 evidence package.
- No Web IDChat, Android, TestFlight/EAS, WebView fallback, wallet/key recovery, red packet, full group management, or broad composer parity changes were observed in the P1.4 product candidate.

## Surface Observations

- Chat list:
  - Final evidence shows `Private chat` rows with `Encrypted message` preview states and one `[Image]` preview.
  - Generic `Message unavailable` does not dominate the audited first viewport.
  - Names, avatars, timestamps, row identifiers, and message bodies are redacted.
- Private room:
  - The room renders `Encrypted message` with user-facing detail text and `Unsupported message` with user-facing detail text.
  - The old technical body text `Unable to decrypt this message` is not the primary visible room content.
  - Raw ciphertext, raw structured payload, full txid, Global MetaID, and decrypted message content are not visible.
- Keyboard/composer:
  - Focused composer remains visible above the software keyboard.
  - The field contains only the placeholder and no user-entered sensitive text.
  - Empty send remains disabled.
- Media row:
  - The audited media-room screenshot shows the room at the latest media zone.
  - Media failure is expressed as `Image unavailable`, not as a decrypt/key failure.
  - Raw media URI and raw payload are not visible.
- Search/discovery:
  - Online bots panel opens with `Refresh`, `Close`, and product-contained bot status rows.
- Group info:
  - Group info drawer renders member count, group id area, mute status, member search, and members list with sensitive values redacted.
- Me/account:
  - Me/account surface renders connected account state, `Private chat ready`, and `Chat sync connected`.
  - Global MetaID, address, public key, and account name values are redacted.

## Verification Summary

- `yarn test:chat-native`: pass, 43 suites and 430 tests.
- `git diff --check`: pass.
- TypeScript noEmit: repo-level exit 2 on existing non-chat-native errors.
- TypeScript `src/chat-native` filter: zero lines.
- Sensitive-value scan for this audit evidence: pass.
- Raw screenshot tmp proof: no audit raw screenshot tmp directory was created; previous P1.4 raw tmp directories are absent.

## Decision Notes

- The prior P1 blockers around list domination, room decrypt/unsupported wall behavior, and media row ambiguity are closed for the Native release gate by product-contained states and screenshot/test evidence.
- Native/Web same-row parity remains a documented non-equivalence gap, not a Native decrypt bug and not a claimed parity pass.
- Dev-client warning overlays are present only as redacted evidence artifacts from live-mode simulator capture and remain outside the P1.4 product scope.

## Recommendation

PASS ready for release gate.
