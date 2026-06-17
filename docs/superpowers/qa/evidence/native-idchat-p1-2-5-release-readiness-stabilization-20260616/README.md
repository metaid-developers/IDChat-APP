# Native IDChat P1.2.5 Release Readiness Stabilization - Task 1 Live Audit

Status: DONE_WITH_CONCERNS

This is a partial live simulator audit of the current Task 1 branch. Collection was stopped after the private-room screenshot, so screenshots 08 through 12 are intentionally marked missing/UNKNOWN rather than inferred.

## Commit Under Test

- Repository: `/Users/tusm/.codex/worktrees/native-idchat-p1-2-5/IDChat-APP`
- Branch: `codex/native-idchat-p1-2-5-release-readiness-stabilization`
- Commit: `f65ce884d52ebd5bdc8223e71f888e1fed473d7a`
- Short commit: `f65ce88 docs: capture native p1.2.5 baseline evidence`
- Product-code changes in this Task 1 pass: none.

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
- `logs/simctl-openurl-live.log`

## Sensitive-Data Handling

- No live messages were sent.
- No live media was uploaded.
- Mock mode was not used for live screenshots.
- Private/group message bodies, list preview text, contact names, group names, user-identifying content, and message-identifying content were redacted by default.
- Redaction preserves the visible layout, avatar positions, loading/status/product copy where safe, action availability, clipping, safe-area, and navigation evidence.
- Raw simulator screenshots were used only as temporary local inputs for redaction, were deleted after the final redacted evidence was generated, and were not added to the repository.

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
| `08-live-group-room-redacted.png` | Group room | no | n/a | missing, UNKNOWN |
| `09-live-message-actions-redacted.png` | Message action sheet | no | n/a | missing, UNKNOWN |
| `10-live-group-info-redacted.png` | Group info | no | n/a | missing, UNKNOWN |
| `11-live-me-account-redacted.png` | Me/account | no | n/a | missing, UNKNOWN |
| `12-live-route-cycle-back-to-chats-redacted.png` | Route cycle back to Chats | no | n/a | missing, UNKNOWN |

## PASS/FAIL/UNKNOWN By Area

| Area | Result | Classification | Notes |
| --- | --- | --- | --- |
| List | PASS_WITH_CONCERNS | P2/P3 polish or UNKNOWN until decrypt availability is proven | Live list loaded with stable rows, search, avatars, tab bar, and no red screen. Visible data before redaction was heavily fallback-preview based; this may be expected account decrypt limitation, but was not proven. |
| Avatars | UNKNOWN | P1.2.5 acceptance gap, not yet a proven code-fix blocker | Fallback avatars rendered and no blank pale avatar circles were observed. No live image avatar was proven in the captured visible rows, and no Web avatar availability comparison was completed. |
| Search | PASS | no issue | Local match and no-result states rendered with product copy and no raw error UI. |
| Discovery | PASS | no issue | Remote discovery result and no-result states rendered with product sectioning/type badges/product copy and no raw JSON visible in the committed redacted evidence. |
| Online Bot | PASS_WITH_CONCERNS | P2/P3 polish | Panel opened with title, refresh, close, row avatars, and status layout. No raw JSON was observed in committed evidence. Dense live bot identity/status text was redacted. |
| Private room | PASS_WITH_CONCERNS | P2/P3 polish or UNKNOWN until a readable-room sample is captured | Private room opened after a short loading state; composer, back, info, load-earlier, inline copy, and overflow actions were visible. Captured room content was unavailable/unsupported rather than readable chat content. |
| Group room | UNKNOWN | missing evidence | Not captured before the audit was stopped. |
| Actions | UNKNOWN | missing evidence | Inline copy/overflow affordances were visible in the private room, but the action sheet was not opened/captured. |
| Group info | UNKNOWN | missing evidence | Not captured before the audit was stopped. |
| Me | UNKNOWN | missing evidence | Not captured before the audit was stopped. |
| Navigation | UNKNOWN | missing evidence | Route-cycle screenshot was not captured before the audit was stopped. |

## Blocker List

### P1.2.5 Blockers

- No confirmed product-code P1.2.5 blocker was proven from the committed redacted evidence.
- Coverage blocker: the Task 1 live audit is incomplete because group room, message action sheet, group info, Me/account, and route-cycle screenshots were not captured.
- Acceptance gap: avatar image rendering is not proven. The captured live rows show fallback avatars only; this becomes a P1.2.5 blocker if Web-renderable avatars exist for the same visible account/rooms and Native still falls back.

### P1.3 Deferrals

- Full group-room and group-info product completion remains UNKNOWN in this partial audit.
- Full account/Me completion remains UNKNOWN in this partial audit.

### P2/P3 Polish

- Live list and private room were fallback-heavy in the captured samples. This is not classified as a code-fix blocker without proving the account should be able to decrypt/render richer content.
- Online Bot panel is dense but functional in the captured state.

### No Issue Observed

- Mock mode remained disabled for live evidence.
- Metro opened the installed dev-client successfully.
- Local search match/no-result worked.
- Remote discovery result/no-result worked.
- No red screen, warning overlay, raw JSON, stack trace, or raw exception UI was observed in committed evidence.

## Environment Blockers

- `python3` on this machine failed due the known macOS Python.framework code-signing issue, so the final redaction pass used the existing Node `pngjs` dependency from the repo dependency set.
- The audit was stopped before completing screenshots 08 through 12. Those areas are marked UNKNOWN rather than inferred.
