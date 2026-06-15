# Native IDChat P1 Product Audit Evidence - 2026-06-15

## Result

Product audit result: P1 required before release.

P0.5/P0.6 successfully moved Native IDChat past the release-gate and iOS build-gate checks, but the live product experience still falls short of Web IDChat parity in the main list, discovery, room rendering, group info, and Me/account surfaces.

## Commit Under Audit

- Branch: `main`
- Commit: `bbf7586 fix: avoid native image picker warning overlay`
- Baseline includes:
  - `8268e97 feat: merge native idchat p0 release work`
  - `e0a2756 docs: capture native chat p0.5 pass evidence`
  - `e62fc79 docs: capture native chat p0.6 build evidence`

## Devices And Runtimes

- Native device: iPhone 17 Simulator
- Native runtime: iOS 26.5
- Native UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Web local runtime: Vite at `http://127.0.0.1:5173`
- Web live reference: user's active Chrome IDChat tab at `https://www.idchat.io/chat/talk/channels/public/welcome`

## Commands

Native:

```bash
env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
  -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
  npx --no-install expo start --dev-client --host localhost --port 8081 --clear
```

Web:

```bash
yarn vite --host 127.0.0.1 --port 5173 --mode mainnet
```

Baseline:

```bash
git status --short --branch
git log --oneline -8 --decorate
xcrun simctl bootstatus CF3620CF-4769-486E-847B-911C96172049 -b
```

## Screenshot Index

### Native

- `01-native-default-entry.png` - Native dev-client while the default live bundle was still loading.
- `02-native-default-after-bundle.png` - Live Native chat list after the bundle completed.
- `03-native-search-sunny-filter.png` - Native local search filter with matching rows and explicit Search action.
- `04-native-search-remote-discovery.png` - Native remote discovery section after explicit Search.
- `05-native-room-group-test2.png` - Native group room with member count, load-earlier action, redacted message bodies, transaction metadata, and composer.
- `06-native-message-actions.png` - Native message action sheet with copy/open/quote actions.
- `07-native-group-info.png` - Native group info sheet with group id copy, mute state, member search, and member list.
- `08-native-me-account.png` - Native Me/account page with public identifiers and connection/key status.
- `09-native-me-copy-feedback.png` - Native copy feedback for Global MetaID.
- `10-native-back-to-chats.png` - Native chat list after returning from Me.
- `11-native-online-bots-panel.png` - Native Online Bot sheet showing layout and raw-profile-text issues.

### Web

- `12-web-chat-welcome.png` - Local Web IDChat unauthenticated welcome state.
- `13-web-chrome-list-redacted.png` - Live Chrome Web list reference, redacted.
- `14-web-search-sunny-redacted.png` - Live Chrome Web search input reference, redacted.
- `15-web-search-mode-redacted.png` - Live Chrome Web search-mode reference, redacted.
- `16-web-room-redacted.png` - Live Chrome Web room reference, redacted.

## Key Observations

- Native launch and live data loading work, but first bundle/loading remains technical and slow for a product audit run.
- Native chat list shows contained decrypt failures instead of raw ciphertext, but too many visible rows are still not useful previews.
- Native search can filter local rows and trigger explicit remote discovery.
- Native Online Bot sheet leaks raw JSON-like profile text and has visible layout pressure.
- Native group room can open, render messages, show message actions, and show group info.
- Native group info exists but includes raw/unclear states and clipped lower content.
- Native Me page copy feedback works, but the page still reads like an account diagnostics page rather than a finished user account surface.
- Web live screenshots confirm denser list rows, unread badges, search mode, and richer room structure; content was redacted to avoid storing live message text.

## Logs

- `logs/git-status-before-audit.txt`
- `logs/native-commit-under-test.txt`
- `logs/simctl-devices.txt`
- `logs/native-metro-default.log`
- `logs/native-default-open-summary.txt`
- `logs/native-default-metro-status.txt`
- `logs/native-default-simctl-bootstatus.log`
- `logs/native-default-simctl-terminate.log`
- `logs/native-default-simctl-openurl.log`
- `logs/native-default-screenshot.log`
- `logs/web-vite-mainnet.log`
- `logs/web-chrome-current-tab.json`

## Sensitive Data Handling

- No messages were sent.
- Chrome screenshots that contained live message text were redacted before being retained.
- Native room screenshot message bodies were redacted while preserving layout evidence.
- Unredacted Chrome captures were removed.
- No mnemonic, private key, shared secret, QA wallet secret, or decrypted sensitive message content is included in this evidence package.
