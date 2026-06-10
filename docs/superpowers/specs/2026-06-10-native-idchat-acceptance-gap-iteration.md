# Native IDChat Acceptance Gap Iteration Requirements

## Purpose

This document records the 2026-06-10 independent acceptance findings for the Native IDChat UI parity work on `main` and defines the next repair iteration.

The previous UI parity phase completed the native React Native chat foundation, but acceptance is not yet product-grade complete. The next worker should fix the concrete gaps below, verify them in iOS Simulator against the live backend, and update the QA runbook with evidence.

## Required Context

Work in:

`/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Continue directly on `main`. The worktree may contain unrelated dirty files. Do not revert, stage, or overwrite unrelated changes.

Read these files before editing:

1. `AGENTS.md`
2. `docs/superpowers/specs/2026-06-09-native-idchat-ui-parity-design.md`
3. `docs/superpowers/plans/2026-06-09-native-idchat-ui-parity.md`
4. `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`
5. `src/chat-native/components/ImageMessage.tsx`
6. `src/chat-native/services/nativeChatImageService.ts`
7. `src/chat-native/services/nativeChatImageSendService.ts`
8. `src/chat-native/components/MessageBubble.tsx`
9. `src/chat-native/components/MessageActionSheet.tsx`
10. `src/chat-native/screens/NativeChatRoomPage.tsx`
11. `src/base/AppNavigator.jsx`
12. `src/chat/page/ChatHomePage.tsx`

Relevant existing acceptance screenshots:

- `docs/superpowers/qa/evidence/native-idchat-ui-parity-20260609/`
- Fresh independent screenshots from the 2026-06-10 acceptance pass were saved outside the repo:
  - `/tmp/idchat-native-acceptance-list.png`
  - `/tmp/idchat-native-acceptance-current.png`

## Current Verified State

The following items passed in the 2026-06-10 acceptance pass:

- The main bottom-tab chat entry renders `NativeChatHomePage` instead of the old WebView component.
- The native chat list is visible in iOS Simulator.
- The list mixes private and group chats in one list.
- There are no All / Private / Groups filter tabs.
- The native shell shows only `Chats` and `Me`.
- A live group room opens.
- Group messages show avatars, timestamps, txid summaries, and Copy chips.
- Right-side self messages show the current account avatar.
- `yarn test:chat-native` passed on rerun: 23 suites / 135 tests.
- `npm exec tsc -- --noEmit --pretty false` still fails only in existing non-`src/chat-native` files.

Important nuance:

- A first full `yarn test:chat-native` run timed out once in `ChatComposer › restores the draft when onSend rejects before a pending row exists`, then the focused test and the second full run passed. Treat this as a flaky-risk signal and avoid making that test more timing-sensitive.

## Acceptance Gaps To Fix

### Gap 1: Live image message renders as `Image unavailable`

Evidence:

- In the 2026-06-10 live group room screenshot, a right-side self image message is present with tx metadata, but the image frame displays `Image unavailable`.
- This conflicts with the requirement that native chat supports image messages, not only image picker entry.

Relevant files:

- `src/chat-native/components/ImageMessage.tsx`
- `src/chat-native/services/nativeChatImageService.ts`
- `src/chat-native/services/nativeChatImageSendService.ts`
- `src/chat-native/ui/chatUiSelectors.ts`

Expected behavior:

- After selecting an image, the outgoing message should show a visible local preview immediately.
- After backend submission, the message should continue showing a visible image.
- If the remote metafile URL is not indexed yet, the UI should keep using the local preview instead of replacing the image with `Image unavailable`.
- Incoming remote image messages should resolve and render when their attachment URI is available.
- A failed image should show a compact failed state with a reason, but a successfully sent image with a local preview must not degrade to `Image unavailable`.

Implementation guidance:

- First root-cause the actual URI shape from the picker and sent row. Do not paper over the problem with a generic placeholder.
- Check whether live picker returns `file://`, `ph://`, `assets-library://`, or another local URI shape.
- Check whether `replaceLocalMessage()` preserves `localPreviewUri` through the sent-state merge.
- Check whether `resolveImageMessageUri()` rejects a valid simulator-local URI.
- If remote `metafile://...` content is not immediately available, keep local preview as the preferred source while it exists.

Required tests:

- Add or update tests proving local preview is preserved after a successful image send.
- Add or update `ImageMessage` tests for every supported local URI shape found during root-cause analysis.
- Add a test for fallback order: local preview first, remote attachment second, explicit unavailable state only when neither source can render.

Manual iOS verification:

- Send an image in a live private chat or live group chat.
- Confirm the selected image is visibly rendered in the outgoing bubble before and after tx metadata appears.
- Capture a screenshot showing the rendered image, not `Image unavailable`.

### Gap 2: Message copy and action sheet are not reliably triggerable

Evidence:

- `MessageBubble` renders a visual `Copy` chip, but the chip itself is not a separate actionable control.
- The existing smoke runbook says action sheet/copy actions were visible but not opened by the simulator driver.
- During acceptance, visible Copy chips existed, but actual copy/action behavior was not confirmed.

Relevant files:

- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/MessageActionSheet.tsx`
- `src/chat-native/ui/messageActions.ts`
- `src/chat-native/ui/chatUiSelectors.ts`
- `src/chat-native/components/__tests__/ConversationList.test.ts`
- Add a focused component test if needed under `src/chat-native/components/__tests__/`.

Expected behavior:

- Tapping the `Copy` chip on a text or txid-bearing message copies the txid when txid exists.
- Tapping or long-pressing the bubble opens `MessageActionSheet`.
- The action sheet displays full txid when available.
- The action sheet supports at least:
  - copy message text
  - copy txid
  - open tx link
  - view image
  - save image
- These actions must be reachable in iOS Simulator without relying on a hidden accessibility-only path.

Implementation guidance:

- Convert the visual Copy chip into a real `Pressable` with `accessibilityRole="button"` and a clear label such as `Copy txid`.
- Keep long-press support on the bubble, but also provide a visible action affordance or normal tap path for opening message actions.
- Avoid nesting interactive Pressables in a way that prevents taps from reaching the intended handler on iOS.
- If using a separate action icon, use a compact icon button and keep the bubble layout dense.

Required tests:

- Component test: pressing Copy calls the copy handler with the full txid.
- Component test: pressing the action affordance opens `MessageActionSheet`.
- Unit test: available actions for text, txid, and image messages match `messageActions.ts`.
- Existing `yarn test:chat-native` must pass.

Manual iOS verification:

- Open a live room with a txid-bearing message.
- Tap Copy and confirm pasteboard contains the expected full txid.
- Open the message action sheet and confirm full txid is visible.
- Use the copy text and copy txid actions from the sheet.
- Capture screenshots of the action sheet and at least one successful copy path.

### Gap 3: New-user live onboarding was not verified

Evidence:

- `docs/superpowers/qa/native-idchat-ui-parity-runbook.md` records that live new-user onboarding was not rerun with a freshly created account.
- The user specifically asked for the new-account flow first because a new account has a prompt that can be used to join a group.

Relevant files:

- `src/chat-native/components/NewUserJoinPrompt.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/services/nativeChatSyncService.ts`
- `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`

Expected behavior:

- A fresh account with no chats should see a product-grade empty/new-user state.
- The state should present a clear recommended group join path or exploration path.
- The user can enter the recommended group and land in the native room UI.
- The flow must not fall back to the old IDChat WebView.

Implementation guidance:

- If the backend does not expose a dedicated recommended group API in the current native code, document the exact live blocker and keep the mock prompt isolated to dev-only mode.
- If a live recommended group is available in existing bootstrap data, wire the prompt to that group using existing HTTP APIs only.
- Do not modify backend APIs or Socket.IO contracts.

Required tests:

- Mock empty-state test still passes.
- Add or update tests proving the empty prompt actions are not accidentally exposed as fake live actions when no live recommended group exists.
- Existing `yarn test:chat-native` must pass.

Manual iOS verification:

- Create a new account in the app or use an available fresh QA account.
- Open native IDChat.
- Capture the empty/new-user prompt.
- Tap the recommended join/explore path.
- Confirm the resulting chat list or group room is native UI.
- If account creation cannot be completed in automation, record the exact blocker and ask the user for the minimum manual step needed.

### Gap 4: Old WebView route remains as fallback and must be clarified or redirected

Evidence:

- Main tab entry uses `NativeChatHomePage`.
- Stack route `ChatHomePage` still points to the old `src/chat/page/ChatHomePage.tsx`, which contains the IDChat WebView.
- `ENABLE_NATIVE_IDCHAT` is committed as `false`, so direct navigation to that old route can still render WebView.

Relevant files:

- `src/base/AppNavigator.jsx`
- `src/chat/page/ChatHomePage.tsx`
- `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`

Expected behavior:

- The homepage/main chat entry must never show the old IDChat WebView.
- If direct navigation to `ChatHomePage` is still needed as a compatibility route, document why and ensure normal app navigation does not use it.
- If direct navigation can be safely redirected, change the route to render or redirect to native chat.

Implementation guidance:

- Search all `navigate('ChatHomePage')` and `name="ChatHomePage"` usage.
- Decide from evidence whether the old stack route is still needed for compatibility.
- Prefer the smallest safe change:
  - keep route name `ChatHomePage` but render native home, or
  - keep old WebView under an explicitly named fallback route, or
  - redirect old `ChatHomePage` immediately to `NativeChatHomePage`.
- Update tests to reflect the chosen contract.

Required tests:

- Test that the default tab route renders native chat.
- Test or static assertion that direct `ChatHomePage` navigation cannot silently land on the old IDChat WebView unless an explicit fallback route is used.

Manual iOS verification:

- Launch the app through the normal home flow.
- Confirm the first chat screen is native UI.
- If any deep link or legacy path opens chat, confirm it lands in native UI or clearly documented fallback.

### Gap 5: Development warning noise during smoke should be eliminated or documented

Evidence:

- iOS dev smoke showed React Navigation warning: `The action 'GO_BACK' was not handled by any navigator.`
- The warning was development-only and appeared after using the room back button in a launch state with no prior navigator history.

Relevant files:

- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/base/NavigationService`
- `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`

Expected behavior:

- Room back button should not produce a dev warning during standard smoke.
- If the app is launched directly into a room with no navigation history, back should navigate to `NativeChatHomePage` instead of dispatching an unhandled goBack.

Implementation guidance:

- Check whether `goBack()` can report navigation availability in this app's navigation service.
- If not, add a room-level fallback that navigates to `NativeChatHomePage` when no previous route exists.
- Keep normal stack back behavior unchanged when there is history.

Required tests:

- Add a focused test or static assertion for the back fallback if the navigation service supports testable state.
- At minimum, add a runbook note explaining the direct-launch case and verify standard list-to-room-to-list navigation does not show the warning.

Manual iOS verification:

- Open a room from the native chat list.
- Tap Back.
- Confirm it returns to the native list without warning.
- Direct-launch room only if needed for debugging; it should also avoid warning after the fix.

## Verification Gate

Before claiming this iteration complete, run:

```bash
yarn test:chat-native
npm exec tsc -- --noEmit --pretty false
```

Expected:

- `yarn test:chat-native` passes.
- `tsc` may still fail in pre-existing non-`src/chat-native` files, but any new `src/chat-native` TypeScript error is a blocker.

Then run iOS Simulator live smoke:

1. Start Metro / iOS app.
2. Confirm native mixed chat list.
3. Open live group.
4. Send live text and emoji in group or private chat.
5. Send live image and confirm visible image rendering.
6. Open message actions.
7. Copy txid and verify pasteboard.
8. Run new-user onboarding with a fresh account or document the exact manual blocker.
9. Update `docs/superpowers/qa/native-idchat-ui-parity-runbook.md` with date, device, account type, passed items, remaining blockers, and screenshot evidence folder.

Do not mark unverified paths as passed.

## Commit And Buzz Requirements

Follow `AGENTS.md`:

- Commit each independent repair unit.
- Stage only files changed for that unit.
- Do not stage unrelated dirty files.
- Use commit messages in the required format, for example:
  - `fix: render native chat image previews`
  - `fix: make native chat copy actions reachable`
  - `fix: harden native chat onboarding smoke`
  - `fix: route legacy chat entry to native UI`
  - `docs: record native IDChat acceptance gap smoke`
- After each commit, attempt Lisa Hahn buzz once with identity slug `lisa-hahn`.
- If Lisa Hahn buzz fails once, skip that buzz and continue; try again on the next commit.

## Completion Criteria

This iteration is complete only when:

- Live image messages render visibly after send.
- Copy txid and message action sheet are reachable by normal iOS interaction.
- New-user onboarding has either passed live or has a precise user-action blocker recorded.
- Main and legacy chat entry behavior is clarified and tested so the old WebView does not appear in the homepage path.
- Dev warning noise from room back navigation is resolved or constrained to a documented direct-launch-only case.
- `yarn test:chat-native` passes.
- iOS live smoke evidence is recorded in the runbook.

