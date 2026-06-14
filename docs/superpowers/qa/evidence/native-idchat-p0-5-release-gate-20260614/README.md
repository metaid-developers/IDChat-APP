# Native IDChat P0.5 Release-Gate Evidence - 2026-06-14

## Result

Release-gate simulator evidence: PASS

The P0.5 blocker is fixed. On iOS Simulator, the `ui-parity` scenario now enters the mock Native
IDChat runtime through an explicit QA route param. After entering `Discovery` and pressing the
explicit Search button, the screen renders mock remote discovery rows for `Discovery Peer` and
`Discovery Group` instead of falling back to only `No matching chats`.

## Commit Under Test

- Branch: `codex/native-idchat-p0-6-ios-build-gate`
- Commit: `7224ad1c83442266e41da1c1cfca6e9bc29e7503`
- Fix commits in this pass:
  - `9f774bc fix: stabilize native chat ui-parity discovery`
  - `7224ad1 fix: stabilize native chat mock route startup`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Xcode: 26.5, build 17F42

## Commands

- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx --no-install expo start --dev-client --host localhost --port 8081 --clear`
  - Result: PASS, Metro was reachable and bundled the app.
- `NATIVE_IDCHAT_SIMULATOR_UDID=CF3620CF-4769-486E-847B-911C96172049 NATIVE_IDCHAT_EVIDENCE_DIR=docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614 scripts/qa/native-idchat-p0-5-open-dev-client.sh`
  - Result: PASS, `metro_status=reachable`, `openurl_status=success`, `mock_route_openurl_status=success`.
- `yarn test:chat-native`
  - Result: PASS, 41 suites / 268 tests.
- `npm exec tsc -- --noEmit --pretty false`
  - Result: FAIL only in existing non-`src/chat-native` files. `logs/tsc-noemit.log` contains no `src/chat-native` errors.
- `git diff --check -- scripts/qa/native-idchat-p0-5-open-dev-client.sh src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts src/chat-native/screens/NativeChatHomePage.tsx src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
  - Result: PASS.

## Screenshot Evidence

- `01-chats-initial.png`
  - Native Chats starts in the UI parity mock list with `MetaWeb Builders`, `Lisa Hahn`, and `Bitcoin Circle`.
- `02-search-local-filter.png`
  - Entering `Discovery` performs local filtering and shows `No matching chats` before explicit Search.
- `03-explicit-remote-discovery.png`
  - Explicit Search renders `Discovery Peer` and `Discovery Group` from mock remote discovery.
- `04-me-copy-feedback.png`
  - Me page copy feedback is visible as `Copied Global MetaID`.
- `05-back-to-chats-containment.png`
  - Returning to Chats stays contained in the UI parity mock list and does not show live ciphertext/decryption-error rows.

`00-after-dev-client-openurl.png` is the helper bootstrap screenshot for the same final run.

## Fix Summary

- `NativeChatHomePage` now handles the QA mock route URL in dev and converts it into explicit
  `NativeChatHomePage` route params.
- Native chat startup now uses a sequence guard so stale live initialization cannot overwrite a
  later mock runtime seed.
- The P0.5 helper now cold-starts the mock route after loading the dev-client project, which makes
  the Simulator route-param path deterministic.
- Tests cover the route-param path, the helper cold-start shape, configured mock startup, and the
  stale-startup guard.

## Logs

- `logs/commit-under-test.txt`
- `logs/dev-client-open-summary.txt`
- `logs/metro.log`
- `logs/metro-status.txt`
- `logs/simctl-bootstatus.log`
- `logs/simctl-openurl.log`
- `logs/simctl-openurl-mock-route.log`
- `logs/simctl-screenshot.log`
- `logs/simctl-terminate.log`
- `logs/simctl-terminate-before-mock-route.log`
- `logs/yarn-test-chat-native.log`
- `logs/tsc-noemit.log`
- `logs/git-diff-check-code.txt`
- `logs/git-status-before-simulator.txt`
- `logs/git-status-after-simulator.txt`
- `logs/node-modules-expo-image-diff.txt`
- `logs/forbidden-artifact-branch-diff.txt`

## Dependency Boundary

- No committed or staged `node_modules` patch.
- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
- No P0.6 build-gate, red packet, full group management, full composer parity, translation,
  Buzz sharing, Android, TestFlight, EAS, or WebView fallback work was included in this pass.
