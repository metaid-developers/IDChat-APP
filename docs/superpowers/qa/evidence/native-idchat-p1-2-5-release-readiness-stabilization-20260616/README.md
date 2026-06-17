# Native IDChat P1.2.5 Release Readiness Stabilization Evidence

Status: PASS

This package contains the P1.2.5 evidence-first release-readiness audit, the single blocker fix, and the post-fix live visual acceptance evidence. The first live audit produced screenshots 01 through 12 before product-code changes. The post-fix pass produced screenshots 13 through 15 after the Task 5 containment fix.

## Commit Under Test

- Repository: `/Users/tusm/.codex/worktrees/native-idchat-p1-2-5/IDChat-APP`
- Branch: `codex/native-idchat-p1-2-5-release-readiness-stabilization`
- Commit at first live-audit pass: `f65ce884d52ebd5bdc8223e71f888e1fed473d7a`
- Short commit at first live-audit pass: `f65ce88 docs: capture native p1.2.5 baseline evidence`
- Commit at continuation pass: `38c1c7864a5d9c2bc3eb913e3fab86dc1df9a3d7`
- Short commit at continuation pass: `38c1c78 docs: capture native p1.2.5 live audit evidence`
- Product fix commit: `17a65ac fix: contain native group info mute status`
- Product-code changes before Task 1 evidence: none.
- Product-code changes after Task 1 evidence: one Task 5 containment fix in `src/chat-native/components/GroupInfoDrawer.tsx` plus a regression test in `src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx`.
- Avatar endpoint baseline remains `dd1969d` plus `71b9405`; avatar implementation was not reopened.

## Final Automated Gate

Result: PASS for P1.2.5 Native IDChat release-readiness.

- `yarn test:chat-native`: PASS, 42 suites and 343 tests. Evidence: `logs/yarn-test-chat-native.log`.
- `git diff --check`: PASS with empty output. Evidence: `logs/git-diff-check.log`.
- `npm exec tsc -- --noEmit --pretty false`: expected nonzero from existing non-`src/chat-native` errors. Evidence: `logs/tsc-noemit.log`.
- `rg -n "src/chat-native" logs/tsc-noemit.log`: PASS with 0 lines. Evidence: `logs/tsc-chat-native-filter.log`.
- `logs/final-git-log.txt` and `logs/final-diff-stat-main-head.txt` are branch-history snapshots captured before this docs-only evidence-log clarification follow-up. They intentionally avoid `--decorate` HEAD markers and do not try to include future metadata-only commits; use `git log -1` or the handoff answer for the final branch HEAD.

## Simulator

- Device: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Boot proof: `logs/simctl-bootstatus.log`
- Device inventory: `logs/simctl-devices.txt`

## Commands Used

Mock-mode proof:

```bash
printenv | rg "EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" || true
node -e "const cfg=require('./app.config.js'); const out=typeof cfg==='function'?cfg({config:{}}):cfg; console.log(JSON.stringify(out.expo?.extra ?? out.extra ?? {}, null, 2));" | rg "nativeIdchatMock" || true
xcrun simctl get_app_container CF3620CF-4769-486E-847B-911C96172049 com.meta.idchat app
rg -n --hidden --no-ignore "nativeIdchatMock|EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" "<installed IDChat.app>" || true
plutil -p "<installed IDChat.app>/Expo.plist" | rg "nativeIdchatMock|EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" || true
```

Live dev-client:

```bash
env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
  -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
  npx --no-install expo start --dev-client --host localhost --port 8081 --clear
```

Simulator:

```bash
xcrun simctl list devices
xcrun simctl bootstatus CF3620CF-4769-486E-847B-911C96172049 -b
xcrun simctl openurl CF3620CF-4769-486E-847B-911C96172049 'com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot <temp raw path>
```

Verification:

```bash
git diff --check -- docs/superpowers/qa/evidence/native-idchat-p1-2-5-release-readiness-stabilization-20260616
```

## Mock-Mode Proof

Result: PASS.

- `printenv | rg "EXPO_PUBLIC_NATIVE_IDCHAT_MOCK" || true` printed no mock env variables.
- `app.config.js` extra inspection printed only the EAS project id and no `nativeIdchatMock*` keys.
- Installed simulator app bundle was found at `com.meta.idchat`.
- Installed app bundle search found no `nativeIdchatMock` or `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK` strings.
- Installed `Expo.plist` contains update settings only and no `nativeIdchatMock*` keys.
- Live Metro was started with `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO` and `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST` explicitly unset.

Evidence:

- `logs/mock-mode-proof-live.txt`
- `logs/metro-live.log`
- `logs/metro-live-continuation.log`
- `logs/simctl-openurl-live.log`
- `logs/simctl-openurl-live-continuation.log`
- `logs/metro-postfix-group-info.log`
- `logs/simctl-openurl-postfix-group-info.log`
- `logs/simctl-coldstart-postfix-group-info.log`

## Sensitive-Data Handling

- No live messages were sent.
- No live media was uploaded.
- Mock mode was not used for live screenshots.
- Private/group message bodies, list preview text, contact names, group names, user-identifying content, and message-identifying content were redacted by default.
- Redaction preserves the visible layout, avatar positions, loading/status/product copy where safe, action availability, clipping, safe-area, and navigation evidence.
- Raw simulator screenshots were used only as temporary local inputs for redaction, were deleted after the final redacted evidence was generated, and were not added to the repository.
- Continuation redaction details are recorded in `logs/redaction-continuation-task1.log`.
- Post-fix redaction details are recorded in `logs/redaction-postfix-release-readiness.log`.

## Live Screenshot Inventory

| File | State | Live | Redacted | Result |
| --- | --- | --- | --- | --- |
| `01-live-chat-list-redacted.png` | Chat list | yes | yes | captured |
| `02-live-local-search-match-redacted.png` | Local search match | yes | yes | captured |
| `03-live-local-search-no-result-redacted.png` | Local search no-result | yes | yes | captured |
| `04-live-remote-discovery-loading-or-result-redacted.png` | Remote discovery result | yes | yes | captured |
| `05-live-remote-discovery-no-result-or-failure-redacted.png` | Remote discovery no-result | yes | yes | captured |
| `06-live-online-bot-panel-redacted.png` | Online Bot panel | yes | yes | captured |
| `07-live-private-room-redacted.png` | Private room | yes | yes | captured |
| `08-live-group-room-redacted.png` | Group room | yes | yes | captured |
| `09-live-message-actions-redacted.png` | Message action sheet | yes | yes | captured |
| `10-live-group-info-redacted.png` | Group info | yes | yes | captured |
| `11-live-me-account-redacted.png` | Me/account | yes | yes | captured |
| `12-live-route-cycle-back-to-chats-redacted.png` | Route cycle back to Chats | yes | yes | captured |
| `13-postfix-group-info-redacted.png` | Group info after containment fix | yes | yes | captured |
| `14-live-avatar-visual-acceptance-redacted.png` | Avatar visual acceptance after fresh bundle | yes | yes | captured |
| `15-live-room-keyboard-open-redacted.png` | Room keyboard-open and Load earlier edge | yes | yes | captured |

## PASS/FAIL/UNKNOWN By Area

| Area | Result | Classification | Notes |
| --- | --- | --- | --- |
| List | PASS_WITH_CONCERNS | P2/P3 polish or UNKNOWN until decrypt availability is proven | Live list loaded with stable rows, search, avatars, tab bar, and no red screen. Visible data before redaction was heavily fallback-preview based; this may be expected account decrypt limitation, but was not proven. |
| Avatars | PASS | no issue | Task 1 showed stable fallback avatars with no blank settled avatar circles. Screenshot 14 shows multiple live image avatars rendered from the existing avatar baseline after a fresh bundle. Some fallback initials remain where live data does not provide a visible image avatar. |
| Search | PASS | no issue | Local match and no-result states rendered with product copy and no raw error UI. |
| Discovery | PASS | no issue | Remote discovery result and no-result states rendered with product sectioning/type badges/product copy and no raw JSON visible in the committed redacted evidence. |
| Online Bot | PASS_WITH_CONCERNS | P2/P3 polish | Panel opened with title, refresh, close, row avatars, and status layout. No raw JSON was observed in committed evidence. Dense live bot identity/status text was redacted. |
| Private room | PASS_WITH_CONCERNS | P2/P3 polish or UNKNOWN until a readable-room sample is captured | Private room opened after a short loading state; composer, back, info, load-earlier, inline copy, and overflow actions were visible. Captured room content was unavailable/unsupported rather than readable chat content. Screenshot 15 adds live keyboard-open evidence without sending content. |
| Group room | PASS_WITH_CONCERNS | P1.3 deferral for full group experience | Group room opened with back/info controls, member count, composer, media, and send affordances. Message bodies and group identity were redacted, and no live message/media was sent. |
| Actions | PASS | no issue | Message action sheet opened and exposed Close, Copy text, Copy txid, Open tx, Quote, and transaction-id labeling. No action was executed against live content. |
| Group info | PASS_WITH_CONTAINMENT | fixed P1.2.5 blocker | Task 1 found `Notification status unknown` as primary Mute-card copy. Commit `17a65ac` replaces that release-blocking fallback with `Notifications unavailable`. Screenshot 13 proves the post-fix live surface keeps Close, group-id Copy, Mute, Search members, Members, and Load more without debug headline copy. |
| Me | PASS_WITH_CONTAINMENT | P1.3 deferral for full account UX | Me/account surface opened with account sections, Copy buttons, Chat key active, Socket connected, and bottom-tab navigation. Account name, Global MetaID, MVC address, and chat public key values were redacted. |
| Navigation | PASS | no issue | Route cycle from group room to group info, Me/account, and back to Chats was captured with bottom-tab state preserved. |

## Blocker List

### P1.2.5 Blockers

- Resolved by `17a65ac`: Group info exposed `Notification status unknown` as primary copy in the Mute card. Screenshot 13 proves the post-fix live copy is `Notifications unavailable`.
- Resolved by continuation screenshots 08 through 12: the earlier Task 1 coverage gap for group room, actions, group info, Me/account, and route cycling.
- Resolved by screenshot 14: avatar image rendering is visually proven on live rows without reopening avatar endpoint implementation.

No open confirmed P1.2.5 product-code blocker remains in this evidence package after the final automated gate.

### P1.3 Deferrals

- Full group management remains out of scope for P1.2.5.
- Full account/Me completion remains out of scope for P1.2.5.
- Red packet, full composer parity, Android/TestFlight/EAS, and WebView fallback remain out of scope.

### P2/P3 Polish

- Live list and private room were fallback-heavy in the captured samples. This is not classified as a code-fix blocker without proving the account should be able to decrypt/render richer content.
- Online Bot panel is dense but functional in the captured state.
- Some room screenshots show unavailable or unsupported message states. This remains P2/P3 polish unless a user-approved readable live sample proves a P1.2.5 rendering blocker.

### No Issue Observed

- Mock mode remained disabled for live evidence.
- Metro opened the installed dev-client successfully.
- Local search match/no-result worked.
- Remote discovery result/no-result worked.
- Group room, message actions, group info containment, Me/account containment, and route-cycle back to Chats were captured.
- Post-fix group info containment was captured after a fresh bundle.
- Live room keyboard-open plus Load earlier evidence was captured without entering or sending content.
- No red screen, warning overlay, raw JSON, stack trace, or raw exception UI was observed in committed evidence.

## Environment Blockers

- `python3` on this machine failed due the known macOS Python.framework code-signing issue, so the final redaction pass used the existing Node `pngjs` dependency from the repo dependency set.
- Raw screenshots from the continuation and post-fix passes were deleted after redaction and were not added to the repository.
