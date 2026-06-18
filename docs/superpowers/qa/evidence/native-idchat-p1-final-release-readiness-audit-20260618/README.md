# Native IDChat P1 Final Release Readiness Audit

Date: 2026-06-18

## Executive Summary

FAIL: needs P1.4 release-candidate stabilization before Native IDChat enters the release gate.

## Baseline

- Repo: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Branch under audit: `main`
- Branch state: `main...origin/main [ahead 62]`
- HEAD: `2867501d74abedccc1cc9bb01d7982a7d433d700`
- HEAD subject: `chore: merge native idchat p1.3 group account productization`
- Key merge commit: `2867501d74abedccc1cc9bb01d7982a7d433d700`
- Key merge parents: `ac101fa957504aae31ee672d4cc57b635813601d` and `bb23e5659fdbf41b768b7a66e65a31ef7204ed4f`
- P1.2.5 merge proof: `588ea07` is an ancestor of HEAD.
- P1.3 proof: `49411c1` and `1473ed3` are ancestors of HEAD.
- Baseline logs:
  - `logs/git-status-before.txt`
  - `logs/git-branch.txt`
  - `logs/git-log-under-test.txt`
  - `logs/baseline-merge-proof.txt`

Note: the requested P1.2 spec path `docs/superpowers/specs/2026-06-16-native-idchat-p1-2-chat-room-productization-spec.md` was not present. The audit used the existing P1.2 room spec at `docs/superpowers/specs/2026-06-15-native-idchat-p1-2-room-productization-spec.md`.

## Audit Method

- Read the repository agent rules, P1/P1.2/P1.2.5/P1.3 specs, P1.2.5/P1.3 implementation plans, and P1.2.5/P1.3 evidence READMEs.
- Verified the git baseline with commands instead of assuming P1.3 was merged.
- Launched Native IDChat on iPhone 17 Simulator, iOS 26.5, with live mode enabled by unsetting Native IDChat mock scenario env vars.
- Used the Expo dev-client deep link against local Metro at `http://127.0.0.1:8081`.
- Exercised Native chat list, local search, explicit remote discovery, online bots panel, group room, group info, message action sheet, keyboard/composer, Me/account, Global MetaID copy feedback, private room, and visible media-preview row.
- Opened Web IDChat in Chrome using the logged-in Chrome profile at `https://www.idchat.io/chat/talk/channels/public/welcome`.
- Compared Web list and room behavior against Native outcomes. Web search was observed but not used for parity because the exposed browser element was not editable through automation.
- Captured and committed only redacted screenshots. Raw screenshots were kept outside the repo under `/tmp/idchat-p1-final-raw` during audit work.

Native and Web observation details are in `logs/audit-observations-redacted.md`.

## Verification Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `yarn test:chat-native` | PASS: 43 suites, 412 tests | `logs/yarn-test-chat-native.log` |
| `npm exec tsc -- --noEmit --pretty false` | FAIL: exit 2 from non-chat-native TypeScript errors | `logs/tsc-noemit.log`, `logs/tsc-exit.txt` |
| `rg -n "src/chat-native" logs/tsc-noemit.log` | PASS for chat-native filter: 0 lines | `logs/tsc-chat-native-filter.log` |
| `git diff --check` | PASS: exit 0 | `logs/git-diff-check.log` |

The TypeScript failure does not contain `src/chat-native` errors. The first observed errors are in non-chat-native files such as `src/chat/page/MergeFtPage.tsx`, `src/constant/Widget.tsx`, `src/lib/network.ts`, and wallet/page modules.

## Release Readiness Matrix

| Area | Status | Native Observation | Web Parity |
| --- | --- | --- | --- |
| Baseline and merge state | PASS | `main` HEAD is the P1.3 merge commit, with P1.2.5/P1.3 ancestors confirmed by command. | N/A |
| Chat list first screen | FAIL | Visible private rows are dominated by `Message unavailable`; one visible row showed `[Image]`. Avatars, timestamps, and row structure render. | Web logged-in list shows readable previews, unread badges, timestamps, and denser row context. |
| Local search | PASS | Known-query match and no-result state both rendered without red screen or raw payload. | Web search not automated; Native behavior is acceptable on its own. |
| Explicit remote discovery | PASS | Loading, no-result, and result states rendered without raw JSON or red screen. | Interaction differs from Web, but it is explicit and product-contained. |
| Online bots | PASS | Panel opens with Refresh/Close and multiple rows. | Acceptable for Native scope. |
| Group room | PARTIAL | Header, load-earlier control, bubbles, actions, and composer render. Historical unsupported-message states remain visible. | Web group room is denser and readable; Native is usable but less polished. |
| Message actions | PARTIAL | Action sheet exposes Copy text, Copy txid, Open tx, and Quote. The raw transaction id was visually prominent in the live sheet. | Web action patterns are more compact; this is a P2 polish issue unless it becomes the primary room experience. |
| Keyboard/composer | PASS | Composer stayed visible above software keyboard; empty send stayed disabled. | Acceptable for current Native scope. |
| Private room readability | FAIL | Opening a visible private row showed `Unable to decrypt this message` and `Unsupported message` as primary visible content. | Web reference room showed a readable transcript in the logged-in session. |
| Media row behavior | FAIL | Opening the visible `[Image]` row did not show a visible image/media card in the captured viewport; it again showed decrypt/unsupported states. | Web supports readable room content and mature media/chat rendering patterns. |
| Group info | PASS | Sheet opens, group identity/member count/copy/mute/member search/member rows render; no raw JSON or red screen. | Good enough for release gate after P1.3. |
| Me/account | PASS | Me shows account identity structure, copy controls, `Private chat ready`, `Chat sync connected`, and copy feedback. No settings placeholder or secrets were observed. | Good enough for release gate after P1.3. |
| Product integrity | FAIL | No red screen, raw ciphertext dump, `Unknown point format`, or debug JSON appeared. However, primary list and private room flows still rely too heavily on unavailable/decrypt/unsupported states. | Web gives the same product area a readable chat experience. |
| Sensitive evidence handling | PASS | Committed screenshots and logs are redacted and avoid secrets, message bodies, full transaction ids, and Global MetaID values. | N/A |

## Blocking Issues

1. Native first screen is still not release-grade because private-chat previews are dominated by `Message unavailable`.
   - Evidence: `01-native-chat-list-default-redacted.png`, `logs/audit-observations-redacted.md`
   - Why it blocks: the chat list is the first usable product surface. P1.2.5 explicitly left a release decision threshold for generic unavailable previews; this run shows the generic state still dominates visible private rows.
   - Web comparison: `16-web-chrome-list-redacted.png` plus the observation log show the logged-in Web list has readable preview structure and unread state.

2. Native private rooms are not release-grade because opening visible private rows produces decrypt/unsupported states as the primary content.
   - Evidence: `14-native-private-room-redacted.png`, `15-native-private-media-room-redacted.png`, `logs/audit-observations-redacted.md`
   - Why it blocks: the user can enter a normal-looking conversation from the list and immediately land on `Unable to decrypt this message` / `Unsupported message` as the main experience.
   - Web comparison: `17-web-chrome-room-redacted.png` plus the observation log show the Web room renders a readable transcript in the logged-in session.

3. Native media readiness is not proven for the live row that advertises `[Image]`.
   - Evidence: `15-native-private-media-room-redacted.png`, `logs/audit-observations-redacted.md`
   - Why it blocks: media was part of the P1/P1.2 acceptance surface. In this audit, the visible media-preview row did not produce a visible media card in the captured room viewport and instead fell into the same decrypt/unsupported pattern.

## Non-Blocking Issues

- Group room is serviceable but still less polished than Web: transcript density, historical unsupported-message containment, and technical transaction metadata should move to P2 unless they become dominant in common rooms.
- Message actions work at a basic level, but the transaction-id section is visually heavy. Bound or collapse technical identifiers in P2 unless P1.4 touches the same surface for a blocking fix.
- Native search/discovery uses a different explicit flow than Web. The Native flow is acceptable for this release gate as long as its states remain product-contained.
- Web search was not automated because Chrome exposed the search element as non-editable through the automation layer. This limits parity evidence but does not affect the Native release decision.
- Full TypeScript `noEmit` still fails in non-chat-native areas. The required chat-native filter returned 0 lines, so this is not a Native IDChat P1 release blocker from this audit.

## Sensitive Data Handling

- Raw Native and Web screenshots were kept only in `/tmp/idchat-p1-final-raw` during audit work and are not committed.
- Committed screenshots mask account avatars, profile names, Global MetaID/address/key values, member names, message bodies, and transaction identifiers.
- Logs and README avoid decrypted sensitive message content, full transaction ids, QA wallet material, shared secrets, private keys, mnemonics, and Global MetaID values.
- The audit describes UI states and labels such as `Message unavailable`, `Unable to decrypt this message`, and `Unsupported message` because those are product-state labels required to explain the release recommendation.

## Final Recommendation

FAIL needs P1.4 release-candidate stabilization.

Native IDChat should not enter the release gate until P1.4 proves that the default chat list and primary private/media room flows are readable or safely and narrowly contained for the same logged-in account conditions where Web IDChat can show readable content.

P1.4 spec: `docs/superpowers/specs/2026-06-18-native-idchat-p1-4-release-candidate-stabilization-spec.md`
