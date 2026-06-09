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
