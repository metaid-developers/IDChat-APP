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
