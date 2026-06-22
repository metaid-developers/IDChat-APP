# P1.4-R4 Media Row Observations, Redacted

Date: 2026-06-22

Scope: Native media-row release-candidate behavior only. This batch changed only the Native image row render path, the latest-entry pinning needed to land on the audited media zone, room-entry display containment for a newer image summary, and focused tests. It did not change Web IDChat, upload flows, non-image file parity, WebView fallback, composer parity, group management, Me/account, Android, EAS/TestFlight, or red packets.

R4.1 follow-up captured after review: the original R4 evidence did not sufficiently prove that the tapped `[Image]` list row landed on the latest room media zone. R4.1 adds direct room-entry tests and a new redacted simulator screenshot showing the opened room at the media zone with `Private chat`, multiple `Image unavailable` cards, and the empty disabled composer visible.

## Implementation Boundary

- Image rows now pass `message.content` into `ImageMessage` only when `attachmentUri` is absent, so content-only renderable media rows reuse the existing media resolver without changing attachment precedence.
- `ImageMessage` continues to distinguish a renderable media frame from the bounded fallback `Image unavailable`.
- `MessageList` now re-pins to the latest edge on content-size changes when the room is already marked `isAtLatest`, so opening the audited `[Image]` row no longer lands on an older unreadable transcript segment.
- `NativeChatRoomPage` now uses the newer channel image summary as display-only room content when the cached room window is stale and that latest summary is not already visible.
- `MessageList` also re-pins to the latest edge after initial layout when the room is already marked `isAtLatest`.
- Ciphertext/decrypt containment from R3 remains unchanged. R4 does not reclassify media failures as decrypt failures.

## Test-First Evidence

RED was verified before and during implementation with focused tests for:

- `MessageBubble`: content-only image rows render the image component, attachment URI precedence is preserved, and non-renderable image rows stay bounded as `Image unavailable`.
- `ImageMessage`: supported URI schemes, metafile normalization, local-preview fallback ordering, and bounded unavailable behavior.
- `MessageList`: latest-pinning predicate remains narrow, and the transcript list keeps the content-size repin hook wired when the room starts at the latest edge.
- `NativeChatRoomPage`: a stale cached window opened from a newer `[Image]` channel summary renders the latest image display row immediately, suppresses stale newer-message affordances, and keeps room display at latest while sync catches up.
- `MessageActionSheet` and `messageActions`: image rows keep image actions only when a renderable media URI exists.

The same focused media/message tests passed after implementation, and the full Native chat suite was rerun for this batch.

## Verification

- `yarn test:chat-native`: pass. See `logs/yarn-test-chat-native-r4.log`.
- `git diff --check`: pass. See `logs/git-diff-check-r4.log`.
- `npx tsc --noEmit --pretty false`: repo-level result recorded in `logs/tsc-noemit-r4.log`; `logs/tsc-chat-native-filter-r4.log` records the `src/chat-native` filter result.
- Sensitive value scan: see `logs/sensitive-value-scan-r4.log`.
- R4.1 `yarn test:chat-native`: pass, 43 suites and 430 tests. See `logs/yarn-test-chat-native-r4-1.log`.
- R4.1 `git diff --check`: pass. See `logs/git-diff-check-r4-1.log`.
- R4.1 `npx tsc --noEmit --pretty false`: repo-level exit 2 on pre-existing non-chat-native errors; `logs/tsc-chat-native-filter-r4-1.log` is empty.
- R4.1 sensitive value scan: pass. See `logs/sensitive-value-scan-r4-1.log`.

## Live-Mode Simulator Evidence

- Simulator: iPhone 17, iOS 26.5.
- Bundle id: `com.meta.idchat`.
- Metro: live mode from this checkout, with Native IDChat mock env toggles unset. See `logs/mock-mode-proof-r4-live.txt` and `logs/metro-r4-live.log`.
- List screenshot: `10-native-media-row-rc-redacted.png`.
- Room screenshot: `11-native-media-room-rc-redacted.png`.
- R4.1 room-entry proof screenshot: `12-native-media-room-r4-1-redacted.png`.
- Raw screenshot directory: `/tmp/idchat-p1-4-r4-raw/` was deleted after redaction. See `logs/raw-tmp-deletion-r4.log`.
- On 2026-06-22, the committed R4 screenshots were refreshed with tighter crops and lighter overlays so the reviewer-visible labels remain `Private chat`, `[Image]`, `Image unavailable`, and `Loading image` while residual names, tx fragments, and action buttons stay redacted.
- The R4.1 raw screenshot directory `/tmp/idchat-p1-4-r4-1-raw/` was deleted after redaction. See `logs/raw-tmp-deletion-r4-1.log`.

## Redacted Media Observation

| Surface | Visible product state | R4 interpretation |
| --- | --- | --- |
| chat list row | `Private chat`; `[Image]` | The default list preview stays semantically specific for the audited row and does not collapse into a generic unavailable label. |
| room media fallback | `Image unavailable` | A non-renderable media row stays product-contained as media failure, not decrypt failure. |
| room renderable media card | `Loading image` in a visible media frame | The opened room now lands on the latest media zone, and a renderable row reaches the media-card path instead of staying on an older unreadable transcript segment. |
| R4.1 tapped-row proof | `Private chat`; multiple `Image unavailable` cards; empty `Message` composer; disabled empty send | Tapping the audited `[Image]` list row opened the room at the latest media zone rather than an older unreadable transcript segment. |
| raw URI / raw payload | Not visible | No raw media URI, raw payload, ciphertext, or full txid is printed in committed evidence. |

## Accessibility / Runtime Note

At the same room position used for the committed screenshot, the live simulator accessibility tree exposed `Open image preview` nodes for sibling image rows while the committed screenshot showed a visible `Loading image` card and a bounded `Image unavailable` fallback. R4 therefore records both media outcomes without claiming a deeper asset-access or account/key root cause.

## Native/Web Parity Boundary

Web same-row parity remains not proven for this R4 batch. R4 does not use Web IDChat as a media-rendering oracle and does not change Web IDChat. The Native improvement is limited to the audited media row and its product-contained room behavior.

## Recommendation

P1.4-R4 is ready for review as a media-row-only release-candidate stabilization slice. Stop after R4 review; R5 final recommendation remains a separate batch.
