# Native IDChat P0.5 Release-Gate Evidence - 2026-06-14

## Result

Release-gate simulator evidence: FAIL

P0.5 is not accepted. The P0.6 build-gate work lets the Expo dev-client build, install, open Metro,
and render the Native Chats screen, but the required explicit remote discovery evidence still fails:
pressing the explicit Search button after entering `Discovery` returns to `No matching chats` instead
of showing the mock `Discovery Peer` or `Discovery Group` rows.

## Commit Under Test

- Branch: `codex/native-idchat-p0-6-ios-build-gate`
- Commit: `e93acb1`
- Base: `66e99ed docs: capture native chat p0.5 release evidence`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Xcode: 26.5, build 17F42

## Commands

- `git diff -- node_modules/expo-image/ios/ExpoImage.podspec node_modules/expo-image/ios/ImageModule.swift`
  - Result: PASS, no diff.
- `git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock`
  - Result: PASS, no committed branch-range artifacts.
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx --no-install expo start --dev-client --host localhost --port 8081 --clear`
  - Result: PASS, Metro reached `Waiting on http://localhost:8081` and bundled `index.js`.
- `scripts/qa/native-idchat-p0-5-open-dev-client.sh`
  - Result: PASS, `metro_status=reachable`, `openurl_status=success`, screenshot captured.
- `yarn test:chat-native`
  - Result: PASS, 41 suites / 261 tests.
- `npm exec tsc -- --noEmit --pretty false`
  - Result: FAIL in pre-existing non-`src/chat-native` files; no `src/chat-native` errors were reported.

## Screenshot Evidence

- `00-after-dev-client-openurl.png`
  - Dev-client opened through the helper.
- `01-chats-initial.png`
  - Native Chats first screen rendered with no red screen. Visible previews do not expose raw `U2Fsd...`
    ciphertext or `Unknown point format`.
- `02-search-local-filter.png`
  - Entering `Discovery` performs local filtering and shows `No matching chats` before explicit Search.
- `03-explicit-remote-discovery.png`
  - Missing. This is the blocking evidence. After pressing explicit Search, the UI briefly shows
    `Discovery / Searching IDChat...`, then returns to `No matching chats` instead of rendering
    `Discovery Peer` or `Discovery Group`.
- `04-me-copy-feedback.png`
  - Me page copy feedback is visible as `Copied Global MetaID`, and no `Native settings` placeholder
    section is present.
- `05-back-to-chats-containment.png`
  - Returning to Chats shows no raw `U2Fsd...` ciphertext or `Unknown point format` preview.

## Blocker

The build gate is no longer the blocker. The current blocker is the deterministic P0.5 simulator
flow for explicit remote discovery. Source-level tests prove the mock API can return
`Discovery Peer` and `Discovery Group`, but the simulator run did not surface those rows after the
explicit Search action.

Root-cause candidates for the next development pass:

- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity` may not be reliably taking effect at the
  `NativeChatHomePage` runtime entry.
- The current app route may be opening the native chat screen without `route.params.mockScenario`.
- The runtime context used by `searchNativeChatDiscovery` may still be backed by the live API client
  even though Metro was started with the mock scenario environment.

## Logs

- `logs/commit-under-test.txt`
- `logs/git-status-before-simulator.txt`
- `logs/simctl-devices.txt`
- `logs/p0-5-metro.log`
- `logs/metro-status.txt`
- `logs/dev-client-open-summary.txt`
- `logs/simctl-bootstatus.log`
- `logs/simctl-openurl.log`
- `logs/simctl-screenshot.log`
- `logs/simctl-terminate.log`
- `logs/node-modules-expo-image-diff.txt`
- `logs/forbidden-artifact-branch-diff.txt`

## Dependency Boundary

- No committed or staged `node_modules` patch.
- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
- No `node_modules/expo-image/ios` files were modified to bypass native-module integration.

## Required Next Step

Run a focused P0.5 discovery-evidence fix before claiming product acceptance. The fix should make the
canonical dev-client flow reliably enter the `ui-parity` scenario and prove that explicit Search
renders `Discovery Peer` or `Discovery Group`, then recapture all five required screenshots.
