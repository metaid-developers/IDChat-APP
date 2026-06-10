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

## Simulator Resume Smoke - 2026-06-10

- Date: 2026-06-10
- Device: iPhone 17 simulator, iOS 26.5
- Account type: existing QA account shown as `IDChat QA iOS`
- Evidence folder: `docs/superpowers/qa/evidence/native-idchat-simulator-resume-20260610/`

Evidence captured:

- `01-private-action-sheet-copy-text.png`: private text message action sheet opened with the Copy text control visible.
- `02-copy-text-alert.png`: Copy text action showed the copied alert; simulator pasteboard contained `IDChat iOS private smoke 2026-06-09`.
- `03-open-tx-safari-mvcscan.png` and `04-open-tx-mvcscan-transaction.png`: Open tx launched Safari/MVCScan and displayed transaction `4b07fb9cd8766200c1bd7fcb59988ca0c40b313b20d13ae40d2202498dbd982c`.
- `05-failed-image-preview-renders.png` and `06-failed-image-bubble-local-preview.png`: a live insufficient-balance image send kept a visible local image preview instead of collapsing to an empty row.
- `07-image-action-sheet-view-save.png`, `08-image-action-view-result.png`, and `09-save-image-saved-alert.png`: image row actions opened, View image rendered the local image, and Save image completed after Photos permission.
- `10-back-to-native-list-after-image-smoke.png`: standard room Back returned to the native list without a development warning.
- `11-success-image-preview-renders.png`: a small yellow IDChat image was selected and rendered in the direct image preview.
- `12-windowless-simctl-launch-native-list.png` and `13-windowless-native-list-after-single-booted.png`: after Simulator.app lost its device window, `xcrun simctl launch` and `xcrun simctl io ... screenshot` still showed the native chat list with `AI_Sunny` last message `[Image]` at 14:30.

Passed in this resume smoke:

- Message action sheet is reachable by ordinary iOS tapping in the private room.
- Copy text from the action sheet writes the expected text to the simulator pasteboard.
- Open tx from the action sheet opens MVCScan and shows the full transaction page.
- Inline Copy txid remains functional; pasteboard verification returned a full txid during this pass.
- Image row action sheet exposes View image, Save image, and Quote for an image row.
- View image and Save image paths work for a locally visible image row.
- A successful small-image send reached the live conversation list as `[Image]` at 14:30 and direct image preview rendered the selected image.
- Standard room Back returns to the native mixed chat list without warning.

Fixed after this smoke and covered by tests:

- Picker image previews are now copied into `FileSystem.cacheDirectory` as cache-backed `file://` URIs when base64 data is available. This avoids relying on picker-owned or photo-library URIs for outgoing bubble rendering.
- Local image previews now clear the `Loading image` overlay through a timeout fallback if React Native does not emit an image load event for a valid local source.

Automated verification after the fix:

- `yarn jest src/chat-native/services/__tests__/nativeChatImageService.test.ts src/chat-native/components/__tests__/ImageMessage.test.tsx --runInBand` passed, 2 suites / 16 tests.
- `yarn test:chat-native` passed, 25 suites / 150 tests.
- `npm exec tsc -- --noEmit --pretty false` still exits non-zero from existing non-`src/chat-native` errors in legacy app files; this run emitted no `src/chat-native` paths.

Still not confirmed after the fix:

- A newly sent live post-fix image visibly rendering inside the outgoing bubble. The pre-fix live small-image send produced live tx/list state and direct preview evidence, but the bubble later stayed on `Loading image` and then fell back to `Image unavailable`; that root cause is what the cache-backed preview and timeout fallback now address.
- A new post-fix live image send cannot be re-run from the current automation state because Simulator.app exposes no device window. Confirmed state: iPhone 17 is booted and `com.meta.idchat` has its data container, `xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot` captures the native list, but System Events reports `count of windows` as `0` and Computer Use returns `cgWindowNotFound`.
- Window recovery attempts that did not restore the frontend: `killall Simulator` plus `open -a Simulator --args -CurrentDeviceUDID ...`, `Window -> iPhone 17 - iOS 26.5`, `File -> Open Simulator -> iOS 26.5 (23F77) - iPhone 17`, and closing the unrelated booted iPhone 17e device. After these attempts, only iPhone 17 remained booted and Simulator.app still reported zero windows.
- Fresh-account new-user onboarding remains unverified live. The current simulator account is not empty, the Me tab is only a placeholder, and resetting this simulator would destroy local QA state. A fresh mnemonic/account or explicit permission to reset the simulator account is still needed for that smoke.

## Message Window Foundation - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 2 and Phase 3 foundation only: storage/repository message-window APIs and local-first room loading.
- Commits:
  - `e120875 feat: add native chat message window storage`
  - `af5244f feat: load native chat rooms from latest window`
- Development buzz pins:
  - Phase 2: `40a42a8db85891a3cd490eeb3a30994b8646479d91262d1607af2b21cf14848fi0`
  - Phase 3: `9c4ef3323e3c61583c1cd895671b1216a525383e6d705db4739f5d72298ac4d1i0`

Automated evidence:

- Baseline before edits: `yarn test:chat-native` passed, 25 suites / 150 tests.
- Phase 2 focused storage verification: `yarn jest --runInBand src/chat-native/storage/__tests__/chatRepository.test.ts` passed, 13 tests.
- Phase 2 full verification: `yarn test:chat-native` passed, 25 suites / 156 tests.
- Phase 3 focused sync verification: `yarn jest --runInBand src/chat-native/services/__tests__/nativeChatSyncService.test.ts` passed, 13 tests.
- Phase 3 focused store verification: `yarn jest --runInBand src/chat-native/state/__tests__/useNativeChatStore.test.ts` passed, 11 tests.
- Phase 3 full verification: `yarn test:chat-native` passed, 25 suites / 160 tests.

Passed in code and tests:

- Repository now supports newest local windows, older/newer index windows, indexed continuity checks, and per-channel message-window metadata in memory and SQLite-backed implementations.
- SQLite schema now has `message_index` plus indexes for account/channel window reads, `message_windows`, and the cache tables needed by later profile, group info/member, channel settings, mentions, and read timestamp parity work.
- Latest chat normalization preserves `lastMessage.index`, allowing native rooms to compute the same newest by-index server window that the web store uses.
- Native room focus now calls `syncChannelMessageWindow`, which replaces the visible room messages with the newest local repository window before awaiting server history.
- Unit coverage proves cached group messages render into the store before a deferred server promise resolves, and private room open requests the newest server index window.

Manual/simulator evidence:

- No new simulator screenshots were captured in this foundation pass. The implemented behavior is storage and sync-ordering infrastructure; the visible pagination affordances and scroll triggers are Phase 4 work.
- Exact manual evidence blocker if a live room smoke is required next: the previous 2026-06-10 simulator state still needs recovery or replacement before reliable UI capture. The known blocker was `Simulator.app` exposing zero device windows while `xcrun simctl io ... screenshot` could still capture the app framebuffer; Computer Use returned `cgWindowNotFound`.

Still not confirmed live:

- A live private or group room visibly showing the newest cached local window before remote history refresh.
- Upward older-pagination UI, scroll-to-latest, and new-message affordance; these are Phase 4 deliverables, not part of this storage/sync foundation pass.
- Fresh-account new-user onboarding remains unverified live for the same account-state reason recorded above.

## MessageList Pagination And Read Observation - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 4 only: older message pagination, local-first older range, server fallback, new-message/latest affordance, and visible-message read observation.
- Commits:
  - `f9b18ca feat: add native chat older message sync`
  - `ffbf156 feat: add native chat message window controls`
- Development buzz pins:
  - Service slice: `b9693b57af4660e49ea674cc997921e0ae2601efdd3e3b46424867c60dbdd180i0`
  - UI slice: `8af756adc20e7e1e5c79f3a1e16cb677ea46bf4109507d254ddb3f4097b5f610i0`

Automated evidence:

- Baseline before Phase 4 continuation: `yarn test:chat-native` passed, 25 suites / 160 tests.
- Service red/green focused verification: `yarn jest --runInBand src/chat-native/services/__tests__/nativeChatSyncService.test.ts` passed, 17 tests.
- Service full verification before commit: `yarn test:chat-native` passed, 25 suites / 164 tests.
- UI focused verification: `yarn jest --runInBand src/chat-native/components/__tests__/MessageList.test.tsx src/chat-native/services/__tests__/nativeChatSyncService.test.ts` passed, 2 suites / 21 tests.
- UI full verification before commit: `yarn test:chat-native` passed, 26 suites / 168 tests.

Passed in code and tests:

- `syncOlderChannelMessages` loads older messages before the current oldest loaded index, reads the requested index range from SQLite/repository first, and skips the server when the local range is continuous.
- If the local older range is incomplete, `syncOlderChannelMessages` fetches the missing by-index range from the existing group/private/sub-group history APIs, persists the result, re-reads the bounded local range, merges it into the visible window, and saves updated message-window metadata.
- Active realtime messages are persisted to local storage first. When the current room is not at the latest edge, the service preserves the visible message list and sets `hasMoreNewer` instead of jumping.
- `MessageList` exposes a top older-loader and also triggers older loading from the top scroll edge.
- `MessageList` reports the highest visible indexed message through FlatList viewability so read state can advance from observed rows.
- `NativeChatRoomPage` no longer marks the loaded room window read on focus. It now calls `markNativeChannelReadToIndex` from visible message observation and clears the local mention badge when read state advances.
- `MessageList` reports latest-edge state from scroll geometry and renders a compact `New messages` / `Latest` affordance. Pressing it refreshes the latest message window through `syncChannelMessageWindow`.

Manual/simulator evidence:

- No new simulator screenshots were captured during this Phase 4 code pass. The behavior is covered by component and service tests, but live scroll capture still needs a recovered simulator window or a replacement booted device.
- Exact simulator blocker remains the same as the 2026-06-10 resume smoke: `Simulator.app` exposed zero device windows while `xcrun simctl io ... screenshot` could still capture the app framebuffer, and Computer Use returned `cgWindowNotFound`. Window recovery or a fresh simulator session is required before collecting live older-pagination/new-message screenshots.

Still not confirmed live:

- A live group/private room upward scroll loading an older page from local cache and then server fallback when the local range is incomplete.
- A live active room receiving a socket message while scrolled away and showing the compact new-message affordance without jumping.
- A live read-index/mention-badge update tied to visible messages.
- Phase 5 profile/avatar hydration, Phase 6 group info drawer, Phase 7 composer parity, Phase 8 discovery/new-user flow, Phase 9 Me tab, and Phase 10 release-gate QA remain pending and should not be treated as complete.

## Profile And Avatar Hydration - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 5 first implementation slice: durable profile cache, private peer hydration, group sender hydration, and socket sender fallback through the native sync path.
- Commit:
  - `8a13903 feat: hydrate native chat profiles`
- Development buzz pin:
  - `98899b2586d5b0f84c874ab766e7bf9c542c72ac9cf70e7b8cf5b5acc844d7fai0`

Automated evidence:

- Focused Phase 5 verification: `yarn jest --runInBand src/chat-native/services/__tests__/chatApiClient.test.ts src/chat-native/storage/__tests__/chatRepository.test.ts src/chat-native/services/__tests__/nativeChatProfileService.test.ts src/chat-native/services/__tests__/nativeChatSyncService.test.ts` passed, 4 suites / 49 tests.
- Full native verification before commit: `yarn test:chat-native` passed, 27 suites / 177 tests.
- Diff hygiene: `git diff --check` passed for the profile hydration files.

Passed in code and tests:

- `NativeChatApiClient.getUserInfoByGlobalMetaId` calls the same metafile-indexer globalMetaId profile route used by web profile hydration.
- Memory and SQLite repositories now persist and read `user_profiles` rows by account/profile key.
- Socket/history normalizers preserve sender name and avatar from direct payload fields, `userInfo`, and `fromUserInfo`.
- `nativeChatProfileService` hydrates private channels from local profile cache first, then API fallback, and writes fetched profiles back to the repository.
- Group message senders hydrate from payload profile data first, then cached/fetched profile data.
- Latest-chat bootstrap persists hydrated private channel title/avatar/public key, and message-window sync persists hydrated group sender name/avatar.
- Realtime socket handling receives the API client so sender fallback can hydrate in live runtime without reintroducing the Phase 4 visible-window jump.

Manual/simulator evidence:

- No new simulator screenshots were captured for this Phase 5 code pass. Visual confirmation of newly hydrated private avatars and group sender avatars still requires a recovered simulator window or replacement device session.
- Exact simulator blocker remains the same as above: `Simulator.app` exposes zero device windows while `xcrun simctl io ... screenshot` can still capture the app framebuffer, and Computer Use returns `cgWindowNotFound`.

Still not confirmed live:

- A live private chat row changing from fallback title/avatar to hydrated peer profile after cache/API fallback.
- A live group message sender changing from globalMetaId fallback to hydrated display name/avatar.
- A live socket message with missing sender profile hydrating after arrival.
- Profile API base is currently the same hardcoded metafile-indexer base already used by native image metafile rendering. If runtime config later exposes a dedicated profile/metafile indexer base, native profile hydration should be switched to that config value and re-smoked.
- Phase 6 group info drawer, Phase 7 composer parity, Phase 8 discovery/new-user flow, Phase 9 Me tab, and Phase 10 release-gate QA remain pending.

## Group Info Drawer - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 6 read-first implementation: group info/member data cache, web-compatible read APIs, member search, group info drawer, copy group id, mute-state display, and room-header wiring.
- Commits:
  - `59617a5 feat: add native chat group info data`
  - `87ddb6c feat: add native chat group info drawer`
- Development buzz pins:
  - Data/service slice: `d8e446259b4413f579a568ba4d4aaed2412319c32759766479750bd9be20d206i0`
  - Drawer/UI slice: `3151b07d332749b0cbed4a1d6428eb1994071f3bec3e66f791e52618c91675eei0`

Automated evidence:

- API/repository/service focused verification: `yarn jest --runInBand src/chat-native/services/__tests__/chatApiClient.test.ts src/chat-native/storage/__tests__/chatRepository.test.ts src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts` passed, 3 suites / 31 tests.
- Full native verification before data commit: `yarn test:chat-native` passed, 28 suites / 182 tests.
- Drawer/room focused verification: `yarn jest --runInBand src/chat-native/services/__tests__/nativeChatGroupInfoService.test.ts src/chat-native/components/__tests__/GroupInfoDrawer.test.tsx src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx` passed, 3 suites / 6 tests.
- Full native verification before drawer commit: `yarn test:chat-native` passed, 30 suites / 185 tests.
- Diff hygiene: `git diff --check` passed for the Phase 6 data and UI files.

Passed in code and tests:

- `NativeChatApiClient` now calls the web-compatible `group-info`, `group-member-list`, and `search-group-members` routes under `/group-chat` with the same query shape used by `idchat/src/api/talk.ts`.
- Memory and SQLite repositories persist `group_info` and `group_members` rows by account/group, with query filtering for cached member search.
- `loadNativeChatGroupInfo` reads cached group info/members first, normalizes web role buckets (`creator`, `admins`, `whiteList`, `blockList`, `list`), writes fetched data back to local cache, and falls back to local cache when the server path fails.
- `GroupInfoDrawer` renders group metadata, member count, mute status, announcement, member rows, search input, copy group id, close, and load-more controls.
- `NativeChatRoomPage` now opens the drawer from the group-room `Chat info` action instead of showing the old group alert, and wires member search/load-more through the loader service.
- Red packet UI remains absent.

Manual/simulator evidence:

- No new simulator screenshots were captured for this Phase 6 code pass. Visual confirmation of the live drawer still requires a recovered simulator window or replacement device session.
- Exact simulator blocker remains unchanged: `Simulator.app` exposes zero device windows while `xcrun simctl io ... screenshot` can still capture the app framebuffer, and Computer Use returns `cgWindowNotFound`.

Read-only/write-action blocker:

- The inspected web source of truth exposes read routes for Phase 6 data: `getOneChannel` -> `group-info`, `getChannelMembers` -> `group-member-list`, and `searchChannelMembers` -> `search-group-members` in `idchat/src/api/talk.ts`.
- The inspected mute state path in `idchat/src/stores/simple-talk.ts` is `muteNotifyList` persisted in localStorage (`initMuteNotify`, `updateMuteNotify`, `clearMuteNotifyList`); no confirmed backend mute write route was found in the inspected Phase 6 API surface.
- Native therefore implements read-only mute/status display and does not invent invite, role mutation, or mute-write UI. Those actions need an exact backend/web contract before native write parity.

Still not confirmed live:

- Opening the group info drawer in a live group room and observing fetched group metadata/member roles.
- Live member search through `search-group-members`.
- Live member pagination through `group-member-list` with nonzero cursor.
- Copy group id pasteboard verification in the simulator.
- Phase 7 composer parity, Phase 8 discovery/new-user flow, Phase 9 Me tab, and Phase 10 release-gate QA remain pending.
