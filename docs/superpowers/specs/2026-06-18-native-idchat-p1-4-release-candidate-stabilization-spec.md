# Native IDChat P1.4 Release-Candidate Stabilization Spec

Date: 2026-06-18

## Executive Summary

P1.4 is required because the final P1 release-readiness audit found that Native IDChat still fails the release gate on the primary readable-chat experience: the default chat list is dominated by generic unavailable previews, and visible private/media rows open into decrypt/unsupported states while the Web reference session shows readable chat content.

P1.4 is not a new productization phase. It is a narrow release-candidate stabilization pass that must close the blocking gaps found in:

`docs/superpowers/qa/evidence/native-idchat-p1-final-release-readiness-audit-20260618/README.md`

## P1.4 Scope

P1.4 may only address release-candidate blockers that prevent Native IDChat from entering the release gate.

Included scope:

- Default chat list readability for the live account or a clearly defined QA account.
- Private-room readability for visible list rows that Web IDChat can read under the same account conditions.
- Live media-preview row behavior, especially rows displayed as `[Image]`.
- Product-contained fallback rules for conversations or messages that truly cannot be decrypted or rendered.
- Final side-by-side evidence against Web IDChat for the exact audited flows.
- Verification logs for chat-native tests, TypeScript chat-native filtering, and whitespace checks.

## Explicit Non-Scope

- Red packet functionality.
- Full group management.
- Full composer parity.
- Android, TestFlight, or EAS release work.
- WebView fallback.
- Web IDChat feature changes.
- Protocol redesign, wallet secret flows, account migration, key recovery, mnemonic/private-key/seed display, or shared-secret diagnostics.
- Broad UI redesign of group info, Me/account, online bots, or search/discovery beyond fixes required by the blocking gaps.
- Hiding all unavailable states without proving whether the underlying message should be readable.
- Sending live messages, uploading live media, or exposing decrypted sensitive message content in committed evidence unless explicitly approved for a controlled QA account.

## Blocking Gap Matrix

| Blocking gap | Evidence from final audit | Required P1.4 outcome | Acceptance evidence |
| --- | --- | --- | --- |
| Chat list dominated by unavailable previews | `01-native-chat-list-default-redacted.png`; `logs/audit-observations-redacted.md` | Native default list must show useful previews for Web-readable conversations, or a narrow product-contained reason for each unreadable row. Generic unavailable copy must not dominate the first visible screen unless the account is proven unable to read those conversations. | Simulator screenshot of default list; Web reference screenshot; observation note explaining account/session parity. |
| Private room opens into decrypt/unsupported primary content | `14-native-private-room-redacted.png`; `logs/audit-observations-redacted.md` | Opening a normal visible private row must produce readable supported content when Web can read that conversation, or a bounded product fallback that is specific, non-technical, and not the dominant experience for common rows. | Simulator screenshot of the opened room; Web reference screenshot; no raw ciphertext, parser errors, or secret material. |
| Media-preview row does not prove media rendering | `15-native-private-media-room-redacted.png`; `logs/audit-observations-redacted.md` | A row shown as `[Image]` must open into either a visible bounded media card or a clear product-level media-unavailable state. It must not collapse into generic decrypt/unsupported content without explanation. | Simulator screenshot of the media row and opened room; if media is unavailable, screenshot of the bounded fallback. |
| Web parity remains unproven for the blocker rows | `16-web-chrome-list-redacted.png`; `17-web-chrome-room-redacted.png` | P1.4 evidence must identify whether Native and Web are using the same account/key conditions. If they are not equivalent, the evidence must say so and use a controlled QA account or documented fixture before making a release recommendation. | Evidence README with exact account/session parity method, redacted screenshots, and non-sensitive observation records. |

## P1.4 Batch Breakdown

### P1.4-R1: Reproduce And Classify Readability Gaps

Goal: prove whether the Native unreadable rows are caused by account/key mismatch, unsupported protocol types, media handling, or Native-specific rendering gaps.

Acceptance:

- Evidence identifies at least three visible Native rows from the first screen by non-sensitive labels such as row position/type, not by account or message content.
- Each sampled row is classified as Web-readable, legitimately unreadable, unsupported message type, or inconclusive.
- Classification evidence does not expose message bodies, Global MetaID values, transaction ids, shared secrets, private keys, or decrypted sensitive content.

### P1.4-R2: Chat List Release-Candidate Readiness

Goal: make the default Native chat list credible as the first release-gate screen.

Acceptance:

- Visible rows include avatar/fallback, name, timestamp, type/unread state when present, and a useful preview where the account can read the latest message.
- Generic unavailable preview copy does not dominate the first visible screen unless the evidence proves that those rows are not readable by the active account.
- No raw ciphertext, raw parser error, `Unknown point format`, red screen, or debug JSON appears in the list.
- Simulator screenshot and Web reference screenshot are committed in a redacted evidence directory.

### P1.4-R3: Private Room Release-Candidate Readiness

Goal: make opening a normal visible private row feel like a supported chat room.

Acceptance:

- The audited private row opens to a room with readable supported content when Web can read the same conversation.
- If a message is genuinely unreadable, the room uses bounded product copy and does not let decrypt/unsupported states dominate the common path.
- Message actions remain available only where applicable and do not expose full raw identifiers as the main visual content.
- Keyboard/composer remains stable after the room fix.
- Simulator screenshot evidence covers room open, scroll or load-earlier if relevant, and keyboard/composer state.

### P1.4-R4: Media Row Release-Candidate Readiness

Goal: make a visible `[Image]` or media-like row produce a trustworthy room result.

Acceptance:

- A media-preview row opens into a visible media card when the asset can be rendered.
- If the media cannot be rendered, the fallback is bounded, user-facing, and specific enough to distinguish media failure from private-key/decrypt failure.
- No raw URI, raw payload, stack trace, ciphertext, or full txid appears in committed screenshots.

### P1.4-R5: Final RC Evidence And Recommendation

Goal: produce the release-gate decision from current `main` after P1.4 is merged.

Acceptance:

- Evidence directory includes redacted Native and Web screenshots for list, private room, media row, search/discovery smoke, group info smoke, Me/account smoke, and keyboard/composer smoke.
- Evidence README includes branch, HEAD, key merge commit, commands, screenshot map, release-readiness matrix, blocking issues, non-blocking issues, sensitive-data handling, and final recommendation.
- `yarn test:chat-native` passes.
- `git diff --check` passes.
- TypeScript noEmit result is recorded, and `src/chat-native` filtering is explicitly recorded.
- Final recommendation is exactly one of:
  - `PASS ready for release gate`
  - `FAIL needs further release-candidate stabilization`

## Acceptance Criteria

P1.4 is complete only when all of the following are true:

- Current `main` or the P1.4 candidate branch is confirmed by `git status --short --branch`, `git branch --show-current`, and `git log -5 --oneline --decorate`.
- Native IDChat is launched in iOS Simulator with mock scenario env vars unset.
- Web IDChat is opened from the user's Chrome session or a documented local/Web QA session.
- Default Native chat list no longer has generic unavailable previews dominating Web-readable conversations.
- At least one visible private row that Web can read opens in Native to readable supported content, or the evidence proves account/key non-equivalence and uses a controlled replacement case.
- At least one visible media-preview row opens to a media card or product-level media fallback.
- No raw ciphertext, decrypted sensitive content, full transaction id, Global MetaID value, mnemonic, private key, seed phrase, shared secret, debug JSON, red screen, or `Unknown point format` appears in committed evidence.
- `yarn test:chat-native` passes.
- `git diff --check` passes.
- TypeScript chat-native filter returns zero `src/chat-native` lines, or every remaining chat-native line is explicitly listed as a blocker with exact error text.

## Risks And Open Questions

- The active Native and Web sessions may not be using equivalent account/key material. P1.4 must resolve this before judging decrypt parity.
- Some historical messages may be legitimately unsupported. P1.4 must distinguish common release-path failures from old-data limitations.
- Web IDChat live behavior can drift independently. P1.4 evidence must record the exact Web URL/session state used for parity.
- A controlled QA account may be needed to capture stronger evidence without exposing user content.
- If media assets are remote or permission-gated, P1.4 must record whether failure is an asset-access issue, decrypt issue, or renderer issue without exposing raw URLs or secrets.

## Implementation Plan Handoff Notes

- Keep P1.4 narrow: fix only release-gate blockers found by the final audit.
- Start from live evidence and row classification before changing behavior.
- Do not change Web IDChat as part of this Native release-candidate pass.
- Do not add broad feature parity, new group management, red packet support, Android/EAS/TestFlight work, or WebView fallback.
- Do not make unsupported/decrypt states disappear without proving whether the conversation should be readable.
- Preserve P1.3 group info and Me/account behavior unless a blocking regression is found while verifying P1.4.
- Keep committed evidence redacted by default. Store raw screenshots outside the repo only while actively auditing, then remove them when no longer needed.
