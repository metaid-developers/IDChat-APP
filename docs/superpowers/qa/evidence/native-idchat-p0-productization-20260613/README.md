# Native IDChat P0 Productization Evidence - 2026-06-13

## Result

Release-gate simulator evidence is **partial**.

The prior native-module blocker was narrowed and the clean official dependency path succeeded in this
run: `ExpoImage` entered the iOS Pods graph, Xcode compiled `ExpoImage`, and the rebuilt dev client
installed on the iPhone 17 simulator without using any `node_modules` or podspec patch.

However, the full Chats/Search/Me/Back to Chats flow is still **not complete**. The rebuilt app did
render the Native Chats first screen once, but follow-up dev-client URL/openurl and Simulator UI
control became unstable before Search and Me could be captured. Do not mark Phase 5 or P0 complete
from this evidence set.

## Commit Under Test

- Branch: `codex/native-idchat-p0-productization`
- Commit before Phase 5 follow-up docs: `be74169 docs: document native chat p0 qa flow`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`

## Commands Run

```bash
git diff -- node_modules/expo-image/ios/ExpoImage.podspec \
  node_modules/expo-image/ios/ImageModule.swift

git ls-remote --tags https://github.com/SDWebImage/SDWebImageWebPCoder.git 0.14.6 0.15.0
git ls-remote --tags https://github.com/SDWebImage/SDWebImageAVIFCoder.git 0.11.0
git ls-remote --tags https://github.com/SDWebImage/SDWebImageSVGCoder.git 1.7.0

cd ios && pod install --repo-update --verbose
cd ios && pod update SDWebImageWebPCoder --repo-update --verbose

EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049 --no-bundler

EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo start --dev-client --host localhost --port 8081 --clear

xcrun simctl launch booted com.meta.idchat
xcrun simctl openurl booted \
  'com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
```

## Dependency Findings

- `node_modules/expo-image/ios/ExpoImage.podspec` and `ImageModule.swift` had no git diff before the
  official rebuild attempt.
- `expo-image@2.4.1` requires `SDWebImageWebPCoder ~> 0.14.6`.
- The existing local generated `ios/Podfile.lock` had `SDWebImageWebPCoder 0.15.0`, so plain
  `pod install --repo-update` failed with CocoaPods' snapshot conflict.
- `pod update SDWebImageWebPCoder --repo-update` succeeded and installed:
  - `ExpoImage (2.4.1)`
  - `SDWebImageWebPCoder 0.14.6`
  - `SDWebImageAVIFCoder 0.11.1`
  - `SDWebImageSVGCoder 1.7.0`
  - `libavif 1.0.0`
  - `libdav1d 1.2.0`
- `npx expo run:ios --device ... --no-bundler` built successfully with `0 error(s), and 3 warning(s)`.

## Simulator Findings

- The earlier installed dev client showed:

```text
[runtime not ready]: Error: Cannot find native module 'ExpoImage', js engine: hermes
```

- After the official Pod update and rebuild, that native-module red screen was no longer observed.
- `xcrun simctl get_app_container booted com.meta.idchat app` confirmed the rebuilt app was installed.
- The app rendered the Native Chats first screen once after Metro bundled `index.js`.
- On the visible Chats list and accessibility tree, previews used `Unable to decrypt this message`;
  raw ciphertext such as `U2Fsd...` and raw errors such as `Unknown point format` were not visible.
- Follow-up launch/openurl attempts were unstable:
  - `expo run:ios` ended with `simctl openurl ... code=60 Operation timed out` after successful build/install.
  - Later direct SpringBoard launches could stop on the dev-client splash without receiving a Metro URL.
  - Simulator UI control was not stable enough to finish Search, explicit remote discovery, Me copy
    feedback, and Back to Chats screenshots in this run.

## Evidence Files

- `00-dev-client-native-module-blocker.png`: debug-only screenshot of the old native module red screen.
- `01-after-build-launch-attempt.png`: post-rebuild launch attempt screenshot while recovering from the
  initial development-server red screen.
- `02-chats-loaded-no-red-screen.png`: rebuilt dev client showing Native Chats with no red screen and no
  raw ciphertext/error previews visible.
- `03-dev-client-splash-openurl-instability.png`: later direct launch stuck on dev-client splash while
  openurl/Simulator control was unstable.
- `logs/phase5-pod-install-20260613.log`: official `pod install --repo-update --verbose` conflict log.
- `logs/phase5-pod-update-20260613.log`: first `pod update` attempt showing new coder pods were not yet installed.
- `logs/phase5-pod-update-webpcoder-20260613.log`: official successful Pod update that installed `ExpoImage`
  and compatible SDWebImage coder pods.
- `logs/phase5-expo-run-ios-20260613.log`: Xcode build/install log; includes `Build Succeeded` and the
  final `simctl openurl` timeout.
- `logs/phase5-metro-20260613.log`: Metro bundle/runtime log.
- `logs/phase5-simctl-launch-20260613.log`: successful `simctl launch` PID outputs.

## P0 Checklist

- Official native dependency path includes `ExpoImage`: **passed**
- Dev client rebuild/install without `node_modules` or podspec hack: **passed**
- First successful screen is Chats: **passed once**
- No red screen after canonical flow: **partial**; old native-module red screen fixed, later openurl/splash instability remains
- Avatars load for rows with usable avatar data: **partially visible on Chats screenshot**
- Search filters local rows without remote discovery: **not completed in simulator; covered by Jest only**
- Explicit Search action runs discovery: **not completed in simulator; covered by Jest only**
- Switching to Me and back does not expose ciphertext: **not completed in simulator**
- Me screen has no placeholder Native settings section: **not completed in simulator; covered by Jest only**

## Release-Gate Boundary

This evidence does not depend on committed or staged `node_modules`, `ios/Pods`, `Podfile.lock`, or a
manual podspec hack. The successful native rebuild used official CocoaPods/Expo commands and produced
local generated native artifacts. Those generated `ios/` and `Pods` changes are local build artifacts
for this run and must not be treated as product deliverables or staged unless the repo explicitly
decides to version the native iOS project.

## Required Follow-Up

Minimum next step for Phase 5 acceptance:

1. Start from the committed JS dependency state (`expo-image@~2.4.1`) with no `node_modules` patch.
2. Regenerate/update local iOS Pods through the official path:

```bash
cd ios
pod update SDWebImageWebPCoder --repo-update
```

3. Rebuild/install:

```bash
EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049 --no-bundler
```

4. Start Metro, launch with the dev-client URL, and capture the missing Search, explicit remote
   discovery, Me copy feedback/no Native settings, and Back to Chats containment screenshots.
