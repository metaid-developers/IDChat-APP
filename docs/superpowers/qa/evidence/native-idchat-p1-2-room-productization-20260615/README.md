# Native IDChat P1.2 Room Productization Evidence - 2026-06-15

## Result

P1.2 code and automated verification: PASS.

P1.2 final Simulator interaction evidence: BLOCKED by the local Simulator window state. This directory is not a full P1.2 acceptance PASS because the required room-interaction screenshots could not be captured from the current environment.

## Commit Under Test

- Branch: `codex/native-idchat-p1-2-room-productization`
- Commit: `64c3a1c fix: align native room evidence fixture metadata`
- Base: `0f0ae2d docs: add native idchat p1.2 room spec`

## Automated Verification

- `yarn test:chat-native` passed.
  - Evidence: `logs/yarn-test-chat-native.log`
  - Result: 42 suites passed, 340 tests passed.
- `git diff --check` passed.
  - Evidence: `logs/git-diff-check.log`
- `npm exec tsc -- --noEmit --pretty false` still exits non-zero from existing non-chat-native errors.
  - Evidence: `logs/tsc-noemit.log`
  - `logs/tsc-chat-native-filter.log` is empty, proving no emitted `src/chat-native` TypeScript errors in this run.

Final verification refresh after the evidence commit:

- Evidence: `logs/final-verification-summary.txt`
- `TEST_STATUS=0`
- `DIFF_STATUS=0`
- `TSC_STATUS=2`
- `CHAT_NATIVE_TSC_LINES=0`
- Detailed logs: `logs/final-yarn-test-chat-native.log`, `logs/final-git-diff-check.log`, `logs/final-tsc-noemit.log`, `logs/final-tsc-chat-native-filter.log`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Dev-client URL: `logs/dev-client-url.txt`
- Device inventory: `logs/simctl-devices.txt`
- Boot/open logs: `logs/simctl-bootstatus.log`, `logs/simctl-openurl.log`

## Captured Simulator Evidence

- `logs/00-after-live-openurl.png`
  - Live Native IDChat chat list after opening the dev client.
  - Confirms the native shell loaded, the list rendered, product preview copy is visible, and no decrypted message body content is preserved in the screenshot.
  - This is not a room-level P1.2 screenshot.
- `logs/00-after-simulator-reopen.png`
  - Attempted screenshot during the window recovery pass.
- `logs/00-after-reboot-current-device.png`
  - Simulator framebuffer after reboot/reopen attempts; the device returned to the iOS home screen.

## Simulator Interaction Blocker

The P1.2 checklist requires screenshots for private room, group room, long message, message actions, transaction actions, image/media, quote composer, keyboard-open composer, load earlier/latest affordance, disabled composer, and back to list.

Those screenshots could not be captured in this pass because the booted simulator exposes a framebuffer to `xcrun simctl io ... screenshot`, but Simulator.app exposes no accessible device window for clicks or keyboard interaction.

Evidence:

- `logs/simulator-window-count.txt`: `0`
- `logs/simulator-window-count-after-reopen.txt`: `0`
- `logs/simulator-window-count-after-current-device.txt`: `0`
- `logs/simulator-window-recovery-attempt.log`: `open -n ... Simulator.app --args -CurrentDeviceUDID ...` and AppleScript activation still ended with `windows=0`.
- `logs/computer-use-window-error.txt`: Computer Use returned `cgWindowNotFound`.
- `logs/simctl-io-help.log`: this Xcode `simctl io` supports screenshots and recording, but no tap/key operation.

No simulator reset, account erase, mnemonic import, live message send, or live media send was performed.

## Missing Required Screenshots

These P1.2 final acceptance screenshots remain pending until a usable Simulator window or another approved UI automation path is available:

- private room
- group room
- long message wrapping
- message actions
- transaction actions
- image/media rendering
- quote composer
- keyboard-open composer
- load earlier affordance
- latest/new messages affordance
- disabled composer
- back to list

## Sensitive Data Handling

- No mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message content is included.
- A raw database payload was not saved to this evidence directory.
- The retained live screenshot shows list-level product fallback previews such as `Message unavailable` and `[Image]`, not decrypted message bodies.
