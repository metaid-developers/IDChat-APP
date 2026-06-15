# Native IDChat P0.6 iOS Build Gate Evidence - 2026-06-14

## Result

iOS build gate: PASS

The Expo dev-client iOS simulator build now completes on the current Xcode environment and installs
on the simulator. P0.5 product acceptance remains separate and still requires the five
Search/Me/Back-to-Chats screenshots in a later acceptance run.

## Commit Under Test

- Branch: `codex/native-idchat-p0-6-ios-build-gate`
- Commit: `8c0db61`
- Base: `66e99ed docs: capture native chat p0.5 release evidence`

## Environment

- Xcode: Xcode 26.5; Build version 17F42
- xcrun: xcrun version 72.
- Simulator UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Simulator: iPhone 17

## Fix Path

- Version alignment alone did not fix the build gate.
- `logs/version-alignment-build-summary.txt` records the same `ios/Pods/fmt/include/fmt/format-inl.h`
  `FMT_STRING(...)` consteval blocker after upgrading to Expo `~53.0.27` and React Native `0.79.6`.
- The local Expo config plugin `plugins/withIosFmtXcode26Fix.js` was required.
- `logs/podfile-fmt-plugin-proof.txt` records the generated Podfile snippet that patches
  `FMT_USE_CONSTEVAL` for generated `Pods/fmt/include/fmt/base.h`.

## Commands

- `yarn test:chat-native`
  - Result before build-gate evidence: PASS, 41 suites / 261 tests.
- `yarn jest --runInBand plugins/__tests__/withIosFmtXcode26Fix.test.js`
  - Result: PASS, 1 suite / 3 tests.
- `EXPO_NO_GIT_STATUS=1 npx --no-install expo prebuild --platform ios --clean`
  - Result: PASS, generated Podfile included the `fmt` config-plugin snippet.
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx --no-install expo start --dev-client --host localhost --port 8081 --clear`
  - Result: PASS, Metro reached `Waiting on http://localhost:8081`.
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx --no-install expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler`
  - Result: PASS, build succeeded, installed on iPhone 17, and opened the Expo dev-client URL.
- `scripts/qa/native-idchat-p0-5-open-dev-client.sh`
  - Result: PASS, Metro was reachable and `openurl_status=success`.

## Build Evidence

- `logs/expo-run-ios.log`: contains `Build Succeeded`, `0 error(s), and 3 warning(s)`, install on
  iPhone 17, and dev-client URL open.
- `logs/expo-run-ios.log`: no `format-inl.h`, `FMT_STRING`, `consteval`, or `Failed to build iOS project`
  failure remains.
- `logs/dev-client-open-summary.txt`: records `metro_status=reachable` and `openurl_status=success`.
- `00-after-dev-client-openurl.png`: screenshot after opening the dev client.

## Logs

- `logs/version-alignment-commit.txt`
- `logs/xcodebuild-version.txt`
- `logs/xcrun-version.txt`
- `logs/simctl-devices.txt`
- `logs/selected-simulator.txt`
- `logs/version-alignment-build.log`
- `logs/version-alignment-build-summary.txt`
- `logs/prebuild-with-fmt-plugin.log`
- `logs/podfile-fmt-plugin-proof.txt`
- `logs/metro.log`
- `logs/metro-status.txt`
- `logs/expo-run-ios.log`
- `logs/dev-client-open-summary.txt`
- `logs/simctl-bootstatus.log`
- `logs/simctl-openurl.log`
- `logs/simctl-screenshot.log`
- `logs/simctl-terminate.log`

## Dependency Boundary

- No committed or staged `node_modules` patch.
- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
- No committed `node_modules/expo-image/ios` patch.
- The generated `ios/` project was used only for local build proof and must be removed before final
  verification/commit.
