# P1.4-R4.1 Media Row Navigation Evidence, Redacted

Date: 2026-06-22

Scope: evidence and R4 media-row entry stabilization only. This follow-up addresses the R4 review finding that the committed evidence needed to prove the tapped `[Image]` list row landed in the corresponding latest media zone instead of an older transcript segment.

## Review Finding Addressed

- Blocking evidence gap: the prior R4 package showed a chat-list `[Image]` row and a room media screenshot, but did not directly prove that tapping that row opened the latest media zone for the same Native room.
- Important test gap: latest-entry pinning was exercised through content-size behavior, but not directly through the room-entry state that can start from a stale cached window.

## R4.1 Implementation Boundary

- `NativeChatRoomPage` now treats a newer channel `lastMessage` image summary as display-only room content when the cached room window is stale and the summary is not already visible.
- The room opens that stale window as latest for display purposes, so the audited `[Image]` row does not show a stale unreadable segment while the sync catch-up is still pending.
- `MessageList` now also pins to the latest edge after initial layout when the room is already at latest.
- This follow-up did not change Web IDChat, media upload, non-image file parity, composer parity, group management, Me/account, Android, EAS/TestFlight, WebView fallback, or red packets.

## Redacted Live Navigation Observation

Simulator and runtime:

- Simulator: iPhone 17, iOS 26.5.
- Bundle id: `com.meta.idchat`.
- Native mock-mode env toggles were unset; see `mock-mode-proof-r4-1-live.txt`.
- The raw screenshot was captured from `/tmp/idchat-p1-4-r4-1-raw/` and deleted after redaction; see `raw-tmp-deletion-r4-1.log`.

Pre-tap list observation, redacted:

- Target row accessibility class: `button: Open chat [redacted private peer]. [Image]`.
- The row was in the visible chat list viewport.
- No row id, Global MetaID, full txid, raw URI, raw payload, or message body was committed.

Post-tap room observation, redacted:

- Header state preserved for reviewer-visible product status: `Private chat`.
- Multiple media cards were visible in the opened room position with `Image unavailable`.
- The captured bottom state showed the empty composer placeholder `Message` and a disabled empty send affordance.
- No raw media URI, raw payload, ciphertext, full txid, name, avatar, or decrypted message body is visible in the committed screenshot.

## Test Evidence

- `NativeChatRoomPage`: added coverage for opening a stale cached room window at a newer channel image summary from the list row. The test asserts first render already hides the stale newer-message affordance and includes the appended image display row.
- `NativeChatRoomPage`: added a negative coverage case proving a stale non-media room window is not automatically marked latest by the R4.1 media containment path.
- `MessageList`: added coverage for latest pinning on content growth, initial layout, and the negative case where older-history growth must not repin when the room is away from latest.

## Native/Web Parity Boundary

Web same-row parity remains not proven for this R4.1 follow-up. R4.1 does not use Web IDChat as a media-rendering oracle and does not change Web IDChat.
