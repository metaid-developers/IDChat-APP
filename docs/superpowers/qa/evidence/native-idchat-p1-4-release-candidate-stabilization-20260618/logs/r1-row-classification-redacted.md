# P1.4-R1 Row Classification, Redacted

Date: 2026-06-18

This document records Native first-screen row observations only. It intentionally does not assert "Web readable, Native unreadable" because this R1 run did not establish Native/Web same-account and same-row equivalence. For audit purposes, Web comparison is marked not audit-equivalent in this batch.

## Method

- Native mode: live-mode simulator session; P1.4 mock env toggles were unset.
- Device: iPhone 17 simulator, iOS 26.5.
- App bundle: `com.meta.idchat`.
- List evidence: `../01-native-chat-list-r1-redacted.png`.
- Room evidence:
  - row-1: `../02-native-row-1-room-r1-redacted.png`
  - row-2: `../03-native-row-2-room-r1-redacted.png`
  - row-3: `../04-native-row-3-room-r1-redacted.png`
- Sensitive fields are redacted: account names, avatars, Global MetaID, txid, decrypted content, wallet secrets, and row ids.

## Decision Tree Used

1. If Native/Web account and same-row equivalence is not proven, do not classify a row as "Web readable / Native unreadable"; mark parity as not audit-equivalent.
2. If the row or room content is clearly outside supported Native protocol/content-type handling, classify as protocol unsupported.
3. If the list preview is media-like but the room does not expose a media preview/card in the visible window, classify as media preview behavior gap unless protocol/account evidence proves a different cause.
4. If account/key equivalence is proven, protocol is supported, peer public key is present, and Native still fails to decrypt/render, classify as Native decrypt/render bug.
5. If the above evidence is insufficient, classify as inconclusive and carry the needed evidence into R2/R3/R4.

## Row Classifications

| Row | Native list position | List preview class | Room visible state, redacted | Web/Native parity | Classification | Rationale | Next evidence needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| row-1 | First visible private row | `Message unavailable` | Room opened; visible accessibility state included one decrypt-failure placeholder and one unsupported-message placeholder before screenshot redaction. | Not audit-equivalent; same Web account/session and same row were not proven. | Inconclusive | Native reproduced an unreadable private-row state, but R1 evidence cannot distinguish account/key mismatch from Native decrypt/render failure or unsupported payload handling. | Capture non-sensitive account/session parity, peer public-key presence class, protocol/content-type class, and a same-row Web reference if available. |
| row-2 | Second visible private row | `[Image]` | Room opened; visible accessibility state included repeated decrypt-failure placeholders and unsupported-message placeholders; no visible media preview/card appeared in the opened room window before screenshot redaction. | Not audit-equivalent; same Web account/session and same row were not proven. | Media preview behavior gap, with root cause unproven | List preview classified the latest item as media-like, but the opened room did not expose a visible media preview/card in the captured window. R1 cannot yet prove whether this is a media attachment/URI handling gap, unsupported payload class, or key/account mismatch. | Capture non-sensitive normalized message kind, attachment URI scheme class, content-type/protocol class, and room renderer decision for the same row. |
| row-3 | Third visible private row | `Message unavailable` | Room opened; visible accessibility state included multiple unsupported-message placeholders and decrypt-failure placeholders before screenshot redaction. | Not audit-equivalent; same Web account/session and same row were not proven. | Inconclusive | Native reproduced an unreadable private-row state, but R1 evidence cannot prove whether the cause is account/key mismatch, protocol unsupported, or Native decrypt/render failure. | Capture non-sensitive protocol/content-type class, peer public-key presence class, ECDH/decrypt outcome class, and same-row Web reference if available. |

## Code Path Notes

- `src/chat-native/ui/chatUiSelectors.ts` returns `[Image]` for image-kind last messages and otherwise routes previews through product-safe text selection.
- `src/chat-native/services/chatMessageDecryption.ts` skips text decrypt for image and simplefile-style protocols, and maps private decrypt failures to product-safe decrypt-failure text when ciphertext-like content cannot be decrypted.
- `src/chat-native/ui/chatUiSelectors.ts` treats non-image messages outside the current supported text protocol/content-type set as `Unsupported message`.
- `src/chat-native/ui/nativeChatMedia.ts` resolves only supported media URI schemes; unknown schemes resolve to `undefined`.

## R1 Gate Result

R1 has reproduced at least three Native first-screen rows and classified each without hiding or rewriting `Message unavailable`, `Unable to decrypt this message`, or `Unsupported message`.

Product-code work for P1.4-R2/R3/R4 may begin only after this R1 evidence is accepted as the classification baseline.

