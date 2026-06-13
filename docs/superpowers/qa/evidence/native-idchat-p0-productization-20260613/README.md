# Native IDChat P0 Productization Evidence - 2026-06-13

## Result

Release-gate simulator evidence is **blocked / partial**.

Phases 1-4 passed code-level and Jest verification, but the Phase 5 reliable native launch gate did
not complete from a reproducible dependency state. No Chats/Search/Me release-gate screenshots were
accepted for this run.

## Commit Under Test

- Branch: `codex/native-idchat-p0-productization`
- Commit before Phase 5 docs: `cb43849 fix: productize native chat me screen`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`

## Commands Run

```bash
EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
npx expo start --dev-client --host localhost --port 8081 --clear

xcrun simctl launch booted com.meta.idchat

npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049
```

Metro bundled `index.js` successfully after a clean cache rebuild. Non-blocking Metro warnings were
recorded for package export fallbacks:

- `@scure/bip39/wordlists/english`
- `@noble/hashes/crypto.js`

## Blocker

The installed dev client did not contain the newly added `expo-image` native module and red-screened
with:

```text
[runtime not ready]: Error: Cannot find native module 'ExpoImage', js engine: hermes
```

Rebuilding the dev client failed first because the existing `ios/Podfile.lock` pinned
`SDWebImageWebPCoder` to `0.15.0`, while `expo-image@2.4.1` requires `~> 0.14.6`.

Following CocoaPods' suggested update path then failed on external GitHub clone operations:

```text
fatal: unable to access 'https://github.com/SDWebImage/SDWebImageAVIFCoder.git/': Empty reply from server
fatal: unable to access 'https://github.com/SDWebImage/SDWebImageAVIFCoder.git/': Failed to connect to github.com port 443 after 75038 ms: Couldn't connect to server
fatal: unable to access 'https://github.com/SDWebImage/SDWebImageSVGCoder.git/': Empty reply from server
fatal: unable to access 'https://github.com/SDWebImage/SDWebImageWebPCoder.git/': Failed to connect to github.com port 443 after 75260 ms: Couldn't connect to server
```

Temporary local `node_modules/expo-image/ios` podspec/code edits were attempted during diagnosis and
then restored. Those local-only attempts are not release-gate evidence and were not staged or
committed.

## Evidence Files

- `00-dev-client-native-module-blocker.png`: debug-only screenshot of the native module red screen.
  This is blocker evidence, not release-gate acceptance evidence.

## P0 Checklist

- First successful screen is Chats: **blocked**
- No red screen after canonical flow: **failed before flow**
- Avatars load for rows with usable avatar data: **blocked**
- Search filters local rows without remote discovery: **covered by Jest, simulator blocked**
- Explicit Search action runs discovery: **covered by Jest, simulator blocked**
- Switching to Me and back does not expose ciphertext: **blocked**
- Me screen has no placeholder Native settings section: **covered by Jest, simulator blocked**

## Required Follow-Up

Use a clean, reproducible dependency state to rebuild the iOS dev client with `expo-image` included.
The current blocker is the CocoaPods dependency/download path for `SDWebImageWebPCoder` and the
SDWebImage coder pods. After that rebuild succeeds, rerun the full Chats/Search/Me/Back to Chats
simulator flow and replace this blocker note with release-gate screenshots.
