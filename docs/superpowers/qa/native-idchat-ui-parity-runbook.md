# Native IDChat UI Parity QA Runbook

## Purpose

Validate that the native IDChat UI matches the 2026-06-09 UI parity spec and is polished in the running iOS app, not only in static design artifacts.

## Start iOS

```bash
npx expo run:ios
```

If the simulator is already booted and Metro is running, use the existing app session.

For the UI-rich mock fixture, open `NativeChatHomePage` with:

```ts
navigate('NativeChatHomePage', { mockScenario: 'ui-parity' });
```

For the empty/new-user prompt, open:

```ts
navigate('NativeChatHomePage', { mockScenario: 'ui-parity', mockEmptyList: true });
```

## Screens To Capture

- Chat list with mixed private/group sessions.
- Empty/new-user recommended group prompt.
- Group room with incoming and outgoing avatars.
- Private room with incoming and outgoing avatars.
- Message action sheet with full txid.
- Composer with emoji insertion.
- Image picker entry and image message preview.

## Visual Checks

- No All/Private/Groups tabs.
- Bottom IDChat shell has exactly Chats and Me.
- Both sides of chat messages show avatars.
- Message metadata includes time and txid/status.
- Text and buttons are not oversized.
- Composer is compact and icon-first.
- No text overlap on iPhone-sized simulator.

## Functional Checks

- Open group room.
- Open private room.
- Long-press message and copy text.
- Copy txid.
- Open tx link.
- Insert emoji.
- Pick image.
- Send text in mock scenario.
- Confirm failed/pending state remains visible.
- From the empty/new-user prompt, tap Join group or Explore chats first and confirm the UI parity chat list appears.

## Evidence

Save screenshots under a local evidence folder such as:

`docs/superpowers/qa/evidence/native-idchat-ui-parity-YYYYMMDD/`

Do not commit screenshots unless the user asks.

## Live Backend Smoke - 2026-06-09

- Date: 2026-06-09
- Device: iPhone 17 simulator, iOS 26.5
- Account type: existing QA account shown as `IDChat QA iOS`
- Evidence folder: `docs/superpowers/qa/evidence/native-idchat-ui-parity-20260609/`
- Focused tests: `yarn test:chat-native` passed, 23 suites / 135 tests

Passed:

- IDChat opened the native chat UI instead of the old IDChat WebView.
- Live conversation list loaded with mixed group/private chats and no All/Private/Groups tabs.
- Bottom native shell showed exactly Chats and Me.
- `MetaID Genesis Group` opened against the live backend and rendered live group messages.
- Live group room showed sender avatars, message timestamps, txid summaries, and Copy chips.
- Existing private chat `AI_Sunny` opened against the live backend.
- Private text send worked with `IDChat iOS private smoke 2026-06-09`.
- Private emoji send worked with `🔥`.
- Sent private messages rendered on the right with the current account avatar and tx metadata after backend submission.
- Image picker entry opened the system photo picker and returned to chat after selecting a simulator photo.

Blocked or not fully confirmed:

- Group text, group emoji, and group image send were not completed through automation. The live group has a large message accessibility tree (`showing 0-27 of 248 items`), and the composer was not exposed to the driver. Coordinate/CGEvent attempts did not focus the group TextInput; CUA reported `AXError.cannotComplete` for coordinate clicks.
- Message action sheet/copy actions were visible as `Open message actions` accessibility buttons and Copy chips, but the simulator driver did not open the sheet from CUA click/accessibility activation during this smoke. Exact observed blocker: CUA returned the same room tree with `button Description: Open message actions, Secondary Actions: Cancel, activate`; no `Message actions` modal appeared and no additional error text was emitted.
- Private image picker selected a photo and returned to chat, but an image message was not observed in the visible message list before the smoke ended. Metro only logged the known Expo warning: `[expo-image-picker] ImagePicker.MediaTypeOptions have been deprecated. Use ImagePicker.MediaType or an array of ImagePicker.MediaType instead.`
- New-user live onboarding was not re-run with a freshly created account in this pass. The new-user prompt was covered by the UI parity mock screenshots in the same evidence folder.

## Live Backend Smoke - 2026-06-10 Acceptance Gap Iteration

- Date: 2026-06-10
- Device: iPhone 17 simulator, iOS 26.5
- Account type: existing QA account shown as `IDChat QA iOS`
- Evidence folder: `docs/superpowers/qa/evidence/native-idchat-acceptance-gap-20260610/`

Evidence captured:

- `01-live-list.png`: native chat list with mixed private/group chats, no All/Private/Groups tabs, and only Chats/Me bottom navigation.
- `02-live-group-room-actions.png`: live group room with avatars, message metadata, Copy chips, and the `...` action affordance.
- `03-message-action-sheet-full-txid.png`: action sheet opened from a normal iOS tap target; it shows the full txid `0a1a6386af429b8b872d66005489f3b88b8a41d52215472e468ecf82710512ef`.
- `04-copy-txid-alert.png`: Copy txid action from the sheet showed the copied alert; simulator pasteboard was verified with the full txid.
- `05-copy-chip-alert.png`: footer Copy chip showed the copied alert; simulator pasteboard was verified with the full txid.
- `06-back-to-list-no-warning.png`: room Back returned to the native list with no `GO_BACK` warning overlay or new Metro warning.
- `07-current-headless-state.png`: current live private room framebuffer after Simulator.app lost its device window; IDChat process and screenshot output remained available, but ordinary picker taps could not be re-triggered.

Automated verification:

- `yarn test:chat-native` passed after the acceptance-gap code changes, 25 suites / 146 tests.
- Focused static route/back and action tests passed during the commits that introduced them.
- `npm exec tsc -- --noEmit --pretty false` still exits non-zero from existing non-`src/chat-native` errors; the new `src/chat-native` type error found in `MessageBubble.test.tsx` was fixed and the remaining output contains no `src/chat-native` paths.

Passed:

- Live native list opens from the app entry and shows mixed group/private conversations without filter tabs.
- The bottom native shell shows exactly Chats and Me.
- `MetaID Genesis Group` opens as a native room against the live backend.
- Message rows show avatars on both sides, time, txid summary, Copy chip, and the `...` action affordance.
- The message action sheet is reachable by ordinary iOS tapping on the `...` affordance.
- The action sheet shows the full txid and exposes Copy text, Copy txid, Open tx, Quote, Buzz, and Translate actions for a text message.
- Copy txid from the action sheet writes the full txid to the simulator pasteboard.
- The inline Copy chip writes the full txid to the simulator pasteboard.
- Standard list -> room -> Back returns to the native list without the previous development warning.
- Legacy root `ChatHomePage` is now routed to `NativeChatHomePage`; this was covered by static mock-scenario tests because direct stack launch was not manually exposed in the app UI.
- Live private text and emoji messages remain visible in `AI_Sunny` from the existing QA account smoke, including `Native iOS private smoke 🔥`.

Fixed in code and covered by tests, but not fully re-run live:

- New outgoing image previews now prefer `localPreviewUri`, support `file://`, `ph://`, `assets-library://`, `content://`, `data:image/`, `http(s)://`, and `metafile://` candidates, and fall through to remote attachment candidates on load error.
- The 2026-06-10 live attempt could not re-trigger the image picker after the app was in the correct private room because `Simulator.app` had no accessible device window. Exact observed blocker: `xcrun simctl io booted screenshot` continued to capture the app framebuffer, IDChat process `com.meta.idchat` stayed running, but `System Events` reported `count of windows` as `0`, Computer Use returned `cgWindowNotFound`, and `simctl` in this Xcode install does not expose a tap operation.

Still not confirmed:

- A newly sent live image rendering in the outgoing bubble after the image preview fix. Existing pre-fix image rows can still show `Image unavailable`; this pass did not prove a new post-fix image send because picker taps could not be re-triggered.
- Copy text pasteboard contents from the action sheet. The control is present and covered by tests, but the live pasteboard verification completed only for txid copy.
- Open tx link behavior from the action sheet. The control is present and covered by tests, but it was not opened during this pass.
- Image action sheet View image / Save image entries on a live image row after the preview fix. The action set is covered by tests; live image-row interaction remains pending until a new image can be sent and rendered.
- Fresh-account new-user onboarding against the live backend. The current simulator account already has chats, and resetting or replacing it would destroy local QA state. Live empty state now avoids fake recommended-group actions unless the mock/dev callbacks are present; the mock empty-list path is covered by tests. A fresh mnemonic/account or explicit permission to reset the simulator account is needed for a true live new-user smoke.
