# P1.4-R1.1 Diagnostic Classes, Redacted

Date: 2026-06-18

Scope: docs/evidence correction only. No product code was changed. This file strengthens R1 classification by recording non-sensitive diagnostic classes for the first three Native first-screen rows.

## Evidence Boundary

- These rows were observed in Native live-mode simulator evidence.
- Raw screenshots and raw accessibility output are not committed.
- The temporary raw screenshot directory `/tmp/idchat-p1-4-r1-raw/` was deleted after regenerating redacted overlay screenshots.
- Native/Web same-account and same-row parity was not proven in this batch. Web is therefore not used as a readability oracle.
- The classes below are diagnostic inputs for R2/R3/R4; they are not final root-cause proof.

## Diagnostic Table

| Row | List preview class | Room primary product-state labels/counts | Normalized message kind class | Protocol/content-type class | Peer public-key presence class | Decrypt outcome class | Media URI scheme class | Renderer decision | Web same-row parity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| row-1 | `Message unavailable` | `Unable to decrypt this message`: 1 visible; `Unsupported message`: 1 visible | mixed/unknown; visible room includes decrypt-fallback text state plus unsupported state | mixed/unknown; unsupported state observed, raw protocol/content-type not stored | unknown | failed | absent | decrypt-fallback primary; unsupported also observed | not-proven |
| row-2 | `[Image]` | `Unable to decrypt this message`: multiple visible; `Unsupported message`: multiple visible; image/media card: 0 visible in captured viewport | image-like list preview; visible room state is mixed/unknown | mixed/unknown; raw protocol/content-type not stored | unknown | failed | unknown | decrypt-fallback primary; unsupported also observed; image-card absent | not-proven |
| row-3 | `Message unavailable` | `Unsupported message`: multiple visible; `Unable to decrypt this message`: multiple visible | mixed/unknown; visible room includes unsupported state plus decrypt-fallback text state | mixed/unknown; unsupported state observed, raw protocol/content-type not stored | unknown | failed | absent | unsupported primary; decrypt-fallback also observed | not-proven |

## Interpretation For Next Batches

- R2 list readability should not hide `Message unavailable`; it should make the list preview productized while preserving the diagnostic class.
- R3 room readability should keep decrypt-fallback and unsupported states visible, actionable, and non-misleading.
- R4 media preview behavior should start from row-2: the list preview is media-like, but no visible image/media card appeared in the opened room viewport.
- Account/session mismatch, missing peer key, unsupported protocol, and Native decrypt/render bugs remain distinct hypotheses. R2/R3/R4 must not collapse them into a single "Native unreadable" bucket without additional non-sensitive evidence.

