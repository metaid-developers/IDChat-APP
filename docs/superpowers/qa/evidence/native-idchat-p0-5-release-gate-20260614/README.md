# Native IDChat P0.5 Release-Gate Evidence - 2026-06-14

## Result

Release-gate simulator evidence: FAIL

P0.5 is not accepted. The run reached Metro startup and iOS dev-client rebuild, but Xcode failed while
compiling the generated CocoaPods project before the app could be installed and driven through the
required Search/Me/Back-to-Chats simulator flow.

## Commit Under Test

- Branch: `codex/native-idchat-p0-5-release-gate`
- Commit: `f2fe2df`
- Base: `965f18f docs: add native chat p0.5 implementation plan`

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
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx expo start --dev-client --host localhost --port 8081 --clear`
  - Result: PASS, Metro reached `Waiting on http://localhost:8081`.
- `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler`
  - Result: FAIL, Xcode build exited with error code 65.

## Blocker

`expo run:ios --no-bundler` generated `ios/`, installed CocoaPods, then failed while compiling
`ios/Pods/fmt/include/fmt/format-inl.h`.

The failing diagnostics were:

- `format-inl.h:59:24`: `FMT_STRING("{}{}")` consteval expression is not constant.
- `format-inl.h:60:22`: `FMT_STRING("{}{}")` consteval expression is not constant.
- `format-inl.h:1387:35`: `FMT_STRING("{:x}")` consteval expression is not constant.
- `format-inl.h:1391:33`: `FMT_STRING("{:08x}")` consteval expression is not constant.
- `format-inl.h:1394:33`: `FMT_STRING("p{}")` consteval expression is not constant.

The build ended with `5 error(s), and 1 warning(s)` and
`CommandError: Failed to build iOS project. "xcodebuild" exited with error code 65.`

## Screenshot Evidence

No passing P0.5 screenshots were captured because the dev client did not install after the Xcode
build failure.

Missing required screenshots:

- `01-chats-initial.png`
- `02-search-local-filter.png`
- `03-explicit-remote-discovery.png`
- `04-me-copy-feedback.png`
- `05-back-to-chats-containment.png`

## Logs

- `logs/git-status-before-simulator.txt`
- `logs/simctl-devices.txt`
- `logs/metro.log`
- `logs/expo-run-ios.log`
- `logs/xcodebuild-error-summary.txt`
- `logs/xcodebuild-version.txt`
- `logs/forbidden-artifact-branch-diff.txt`
- `logs/forbidden-artifact-branch-diff-after-build.txt`
- `logs/node-modules-expo-image-diff.txt`

## Dependency Boundary

- No committed or staged `node_modules` patch.
- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
- The local build generated `ios/` artifacts but they are not part of this evidence commit.
- No `node_modules/expo-image/ios` files were modified to bypass native-module integration.

## Remaining Out Of Scope

Red packets, full group management, full composer parity, translation, Buzz sharing, Android parity,
TestFlight, and EAS release remain out of scope for P0.5.
