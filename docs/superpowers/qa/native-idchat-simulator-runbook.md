# Native IDChat Simulator QA Runbook

## Purpose

Verify that native IDChat is close to release quality, not merely code-reviewed. This runbook covers mocked simulator validation and live backend smoke validation.

UI polish is a release gate for Native IDChat. Use
`docs/superpowers/qa/native-idchat-ui-parity-runbook.md` for the focused iOS UI parity screenshot pass.

## Preconditions

- Use a development branch or worktree.
- For broader release-candidate checks, keep generic WebView/DApp routes available; this is
  not a P1.1 Main Chat Productization Gate requirement.
- Keep `ENABLE_NATIVE_IDCHAT` and `ENABLE_NATIVE_IDCHAT_MOCK_SCENARIO` committed as `false`.
- For mock simulator QA, temporarily set both flags to `true` locally, run the checks, then revert those local flag edits before committing.
- For live backend QA, use dedicated funded QA wallet/accounts only.

## Automated Checks

Run:

```bash
yarn test:chat-native
npx tsc --noEmit
```

Expected:

- `yarn test:chat-native` passes.
- `npx tsc --noEmit` passes or reports only documented pre-existing errors outside `src/chat-native`.

## P0 Productization Dev-Client Gate

This P0 gate verifies a local Expo dev-client launch on iOS Simulator. It is not an App Store,
TestFlight, or EAS signing/release gate.

This gate must run from reproducible project dependencies. Do not count screenshots produced after
uncommitted `node_modules`, `ios/Pods`, `Podfile.lock`, or podspec hacks as release-gate evidence.
If the dev-client rebuild fails from a clean dependency state, mark this gate blocked and record the
exact build error instead of treating a local workaround as product acceptance.

Start Metro first:

```bash
EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo start --dev-client --host localhost --port 8081 --clear
```

In a second terminal, launch the iOS dev client:

```bash
npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049
```

### P0.5 stabilized open flow

For the P0.5 release-gate pass, start Metro before opening the dev client:

```bash
EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo start --dev-client --host localhost --port 8081 --clear
```

In a second terminal, build or reinstall the dev client without starting a second bundler:

```bash
EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler
```

Then open the Expo dev-client URL through the helper:

```bash
NATIVE_IDCHAT_SIMULATOR_UDID="$NATIVE_IDCHAT_SIMULATOR_UDID" \
NATIVE_IDCHAT_EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614" \
scripts/qa/native-idchat-p0-5-open-dev-client.sh
```

If the helper reports `openurl_status=timeout_or_failure`, do not mark P0.5 complete until the
Simulator UI still proves the app loaded the Metro bundle and all required screenshots were captured.

If that UDID is not available, choose one bootable iPhone from:

```bash
xcrun simctl list devices available
```

Record the exact simulator name and UDID in the evidence README.

Metro export fallback warnings for `@scure/bip39/wordlists/english` and
`@noble/hashes/crypto.js` are non-blocking unless they prevent bundling or launch.

P0 checklist:

- First successful screen is Chats.
- No red screen appears during the canonical flow.
- Avatars load for rows with usable avatar data.
- Search filters local rows without remote discovery on each keystroke.
- The explicit Search action runs discovery.
- Switching to Me and back to Chats does not expose raw `U2Fsd...` ciphertext previews.
- Me screen has no placeholder Native settings section.

Capture screenshots under:

```bash
docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/
```

## P1.1 Main Chat Productization Gate

P1.1 verifies the live main chat list, search/discovery, and Online Bot surfaces after
P0.5/P0.6.

Required evidence:

- list after live data settles;
- local search filter;
- explicit remote discovery result;
- explicit remote discovery empty or failure state;
- Online Bot sheet;
- list after Chats -> Me -> Chats navigation.

Pass criteria:

- no raw ciphertext, raw JSON profile text, `Unknown point format`, or stack traces in user-facing UI;
- no blank pale avatar circles after loading settles;
- unread badges render and cap high counts as `999+`;
- explicit discovery states remain visible after search;
- screenshots and logs contain no secrets or decrypted sensitive message content.

## Mocked Simulator Checks

This is the legacy broad simulator checklist. It is not required for the P1.1
Main Chat Productization Gate above; Android and WebView fallback items remain
outside P1.1 scope.

Run iOS:

```bash
yarn ios
```

Run Android:

```bash
yarn android
```

Verify in at least one simulator/emulator:

- IDChat opens native conversation list with mock group and private conversations.
- Opening the mock group shows text and image messages.
- Opening the mock private chat shows text and pending message states.
- Emoji insertion adds emoji into the composer.
- Sending text creates pending then sent state using mock wallet.
- Image button opens the platform image picker or permission prompt.
- Tapping a web URL opens `ChatLinkShellPage`, then falls back to existing WebView route.
- App background/resume does not crash.
- Generic `WebsPage`, `DappWebsPage`, and `OpenWebsPage` still open.

Capture screenshots or screen recordings for conversation list, chat room, composer, image entry, link shell, and fallback WebView.

For product-level UI parity, run the dedicated `ui-parity` mock scenario and screenshot checklist in
`docs/superpowers/qa/native-idchat-ui-parity-runbook.md`.

## Live Backend Smoke Checks

Use QA accounts and existing backend:

- Load conversation list from `https://api.idchat.io/chat-api`.
- Open a real group chat.
- Open a real private chat.
- Connect Socket.IO through `https://api.idchat.io` with path `/socket/socket.io`.
- Receive a message sent from the web IDChat app.
- Send native group text and confirm it appears in web IDChat.
- Send native private text and confirm it appears in web IDChat.
- Send native group image and confirm it appears in web IDChat.
- Send native private image and confirm it appears in web IDChat.
- Put app in background, resume, and verify socket reconnect or sync catches up.
- Disable network, open cached conversation, re-enable network, and verify sync resumes.

## Release Candidate Gate

This release-candidate checklist is broader than P1.1. Android, TestFlight/EAS,
and WebView/fallback verification are not part of the P1.1 gate.

Native IDChat cannot be treated as the default chat entry until:

- Mock simulator checks pass.
- UI parity screenshot checks pass on iOS with no oversized text, clipped controls, missing avatars, or missing tx metadata.
- Live backend smoke checks pass or each blocker has an exact reason and owner.
- Old IDChat WebView fallback is verified.
- Generic DApp/WebView routes are verified.
- No secrets, QA mnemonic, private keys, or generated credential files are committed.
