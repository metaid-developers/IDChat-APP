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
- The action sheet shows the full txid and exposes Copy text, Copy txid, Open tx, and Quote actions for a text message. Earlier 2026-06-10 screenshots also showed Buzz and Translate, but those actions are now intentionally hidden in product defaults until native callable service contracts are confirmed.
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

## Composer Parity - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 7 implementation slice: quote/reply state, group mention suggestions from cached members, pre-send image preview remove/replace/send, explicit disabled-state reason, and red packet exclusion.
- Commit:
  - `a7def7d feat: add native chat composer parity`
- Development buzz pin:
  - `6679237513b0e5871fff6a060f799032f8cf7c7a4ad90cb40bba57836a00b2a2i0`

Automated evidence:

- Focused composer/send/room verification: `yarn jest --runInBand src/chat-native/services/__tests__/nativeChatSendService.test.ts src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx` passed, 2 suites / 13 tests.
- Full native verification before commit: `yarn test:chat-native` passed, 30 suites / 190 tests.
- Diff hygiene: `git diff --check` passed for the Phase 7 files.

Passed in code and tests:

- Message action `Quote` is now wired from `MessageActionSheet` into `NativeChatRoomPage` quote state and displayed by `ChatComposer`.
- Text sends include `replyPin` in the local row and native node payload when a quote is active.
- Image sends also pass the active `replyPin` into image node payloads.
- Group mention suggestions are supplied from cached `group_members` rows loaded by the room/group-info path, rendered as mention chips after typing `@`, inserted into the draft, and sent as `mention` metadata in group text payloads.
- Image picking now creates a selected-image preview in the composer instead of immediately sending. The composer exposes remove, replace, and send-selected-image controls.
- Composer disabled states render explicit reasons, including missing peer chat public key, blocked/not-joined/cannot-send channel flags, missing channel, and runtime unavailable state.
- Red packet UI remains absent from native composer code.

Manual/simulator evidence:

- No new simulator screenshots were captured for this Phase 7 code pass. Mock/live screenshots for quote, mention insertion, image preview, emoji, and disabled state still require a recovered simulator window or replacement device session.
- Exact simulator blocker remains unchanged: `Simulator.app` exposes zero device windows while `xcrun simctl io ... screenshot` can still capture the app framebuffer, and Computer Use returns `cgWindowNotFound`.

Still not confirmed live:

- Quote action creating a visible reply strip and sending a live `replyPin`.
- Group member mention suggestions against a live group with cached/fetched members.
- Image remove/replace/send-selected-image flow in a live room.
- Disabled-state reason for a real missing private public key or not-joined/blocked group state.
- Phase 8 discovery/new-user flow, Phase 9 Me tab, and Phase 10 release-gate QA remain pending.

## Chat Discovery And New User Flow - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 8 implementation slice: native local search cleanup, remote user/group discovery reads, online bot panel, native private-start flow, dead create-chat control removal, and live empty-state guardrails.
- Commits:
  - `38f6a86 feat: add native chat discovery list surface`
  - `106671e feat: add native chat discovery services`
  - `f304df5 feat: wire native chat discovery flow`
- Development buzz pins:
  - List surface: `7362c403bd1e20c651290f3e89c97ea8d26a0963b448c2cc4f41738804d72f02i0`
  - Discovery services: `289eba5da153194de0afb524b8035a7a7914ce3565ff021eb8e10aa0ee539e4ci0`
  - Discovery flow: `6a26a2cf16d56a5a9251429c246ba5246e07ce1c8c19a4274f0ca6763f8b42c4i0`

Automated evidence:

- List surface focused verification before commit: `ConversationList` plus native mock-scenario tests passed.
- Discovery API/service focused verification before commit: `chatApiClient` plus `nativeChatDiscoveryService` tests passed, 2 suites / 17 tests.
- Discovery flow focused verification before commit: online bot panel, discovery service, and mock/home wiring tests passed, 3 suites / 22 tests.
- Full native verification after the flow commit: `yarn test:chat-native` passed, 32 suites / 203 tests.
- Current combined Phase 8/9 focused verification: `yarn jest --runInBand src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/components/__tests__/OnlineBotPanel.test.tsx src/chat-native/services/__tests__/chatApiClient.test.ts src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/state/__tests__/useNativeChatStore.test.ts src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` passed, 8 suites / 60 tests.

Passed in code and tests:

- The disabled `Create chat` header control was removed rather than leaving a dead product-mode affordance.
- Conversation search still filters local mixed private/group rows immediately.
- Remote discovery uses the web-compatible `/group-chat/search-groups-and-users` route through `NativeChatApiClient.searchGroupsAndUsers`.
- Online bot discovery uses `/group-chat/socket/online-users?withUserInfo=true` and renders a native `OnlineBotPanel`.
- Starting a private chat from discovery hydrates the peer profile when available and creates/opens a native private channel instead of falling back to a WebView.
- Remote group discovery rows are read-only when the native-safe join/write route is not confirmed; the visible disabled reason is `Native group join is not available yet`.
- Live empty state does not expose fake recommended-group actions unless mock/dev callbacks are supplied; mock fixtures still cover the UI parity empty-list path.

Manual/simulator evidence:

- No new simulator screenshots were captured for this Phase 8 code pass. Visual confirmation of remote discovery, online bots, and the live empty-state path still requires a recovered simulator window or replacement device session.
- Exact simulator blocker remains unchanged: `Simulator.app` exposes zero device windows while `xcrun simctl io ... screenshot` can still capture the app framebuffer, and Computer Use returns `cgWindowNotFound`.

Read/write blocker:

- The inspected web direct-contact flow exposes search and online-user read surfaces, but no confirmed backend-native group join/write route was found in the inspected Phase 8 API surface. Web direct-contact components route remote groups into web talk channel URLs or leave group join code commented, so native does not invent a join action.

Still not confirmed live:

- Remote user discovery against the live backend followed by opening a private native room.
- Online bot panel populated from live socket/online-user data.
- Remote group discovery read-only row rendering against live results.
- Fresh-account new-user onboarding. The current simulator account already has chats, and resetting or replacing it would destroy local QA state.

## Me Tab - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 9 implementation slice: native account/profile card, globalMetaId/address copy paths, chat public-key status, socket status, and no unsupported native settings links.
- Commit:
  - `2d1c3bf feat: add native chat me tab`
- Development buzz pin:
  - `4e261027b5129f291ecb861c7e2382e538d1a18e214ac41336f17074ebc91875i0`

Automated evidence:

- Focused Phase 9 verification before commit: `NativeChatAccountCard`, `NativeChatMePage`, native mock scenario, and native store tests passed, 4 suites / 31 tests.
- Full native verification before commit: `yarn test:chat-native` passed, 34 suites / 208 tests.
- Current combined Phase 8/9 focused verification: `yarn jest --runInBand src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/components/__tests__/OnlineBotPanel.test.tsx src/chat-native/services/__tests__/chatApiClient.test.ts src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/state/__tests__/useNativeChatStore.test.ts src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` passed, 8 suites / 60 tests.

Passed in code and tests:

- `NativeChatMePage` is no longer a placeholder.
- `NativeChatAccountCard` renders account avatar/name, globalMetaId, wallet address, chat public-key status, and socket status.
- Copy actions are exposed for globalMetaId and wallet address.
- `NativeChatHomePage` now stores the MVC address and attempts to hydrate the account chat public key from the existing profile lookup path.
- The native store clears account address and chat public-key state on account switch to avoid stale Me-tab data.
- Unsupported settings links are not shown.

Manual/simulator evidence:

- No new Me-tab screenshot was captured in this code pass because the simulator window remains unavailable.
- Exact simulator blocker remains unchanged: `Simulator.app` exposes zero device windows while `xcrun simctl io ... screenshot` can still capture the app framebuffer, and Computer Use returns `cgWindowNotFound`.

Still not confirmed live:

- Me-tab visual screenshot with the current QA account.
- Simulator pasteboard verification for globalMetaId/address copy.
- A live account without profile/avatar data showing the expected fallback state.

## Release-Gate QA - 2026-06-11

- Date: 2026-06-11
- Scope: product-parity spec Phase 10 evidence update for Phases 2 through 9, plus the final TypeScript boundary cleanup.
- Additional commit:
  - `a72946c fix: clean native chat test typings`
  - `09673ef fix: hide unimplemented native message actions`
- Additional development buzz pin:
  - TypeScript cleanup: `1c4fa60da2bf58fd68abb28f4c96d52984ab6478ddc379fd37c57e3fd309eb13i0`
  - Message actions cleanup: `718e1800464e0b888890b817e050c937defb40b49164d5cbc23db38a7245b796i0`

Final automated evidence:

- Focused TypeScript-cleanup verification: `yarn jest --runInBand src/chat-native/components/__tests__/MessageList.test.tsx src/chat-native/screens/__tests__/NativeChatRoomPage.test.tsx src/chat-native/services/__tests__/nativeChatSendService.test.ts` passed, 3 suites / 17 tests.
- Focused message-action verification: `yarn jest --runInBand src/chat-native/ui/__tests__/messageActions.test.ts src/chat-native/components/__tests__/MessageActionSheet.test.tsx` passed, 2 suites / 9 tests.
- Current combined Phase 8/9 focused verification: `yarn jest --runInBand src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/components/__tests__/OnlineBotPanel.test.tsx src/chat-native/services/__tests__/chatApiClient.test.ts src/chat-native/services/__tests__/nativeChatDiscoveryService.test.ts src/chat-native/components/__tests__/NativeChatAccountCard.test.tsx src/chat-native/screens/__tests__/NativeChatMePage.test.tsx src/chat-native/state/__tests__/useNativeChatStore.test.ts src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts` passed, 8 suites / 60 tests.
- Current full native verification: `yarn test:chat-native` passed, 34 suites / 208 tests.
- Current TypeScript boundary check: `npm exec tsc -- --noEmit --pretty false` still exits non-zero, but the remaining output contains no `src/chat-native` paths. The remaining legacy files reported are `src/chat/page/MergeFtPage.tsx`, `src/chat/page/MergeSpacePage.tsx`, `src/constant/Widget.tsx`, `src/lib/network.ts`, `src/page/BtcMRC721Page.tsx`, `src/page/home/ShowBuzzPage.tsx`, `src/page/home/transfer/SendColdBtcPrePage.tsx`, `src/page/Mrc721NftListPage.tsx`, `src/page/safe/SetPasswordPage.tsx`, `src/page/safe/SmallPayAutoPage.tsx`, `src/page/wallet/WalletAccountDetailPage.tsx`, `src/wallet/wallet.ts`, and `src/webs/actions/lib/authorize/btc/transfer.ts`.

Code acceptance status:

- Native chat list, private rooms, group rooms, local-first latest windows, older pagination service/UI triggers, socket persistence, profile/avatar hydration, group info drawer, composer quote/mention/image-preview states, discovery/online bot surfaces, and Me tab now have native code and focused tests.
- Product-default message actions now expose only implemented native actions: Copy text, Copy txid, Open tx, View image, Save image, and Quote. Buzz and Translate are hidden rather than shown as clickable no-ops.
- Red packet UI remains absent.
- The normal native IDChat flow does not introduce a new WebView fallback for chat list, room entry, discovery private-start, group info, composer, or Me-tab surfaces.

Manual/simulator evidence:

- No new simulator screenshots were captured during the Phase 8 through Phase 10 continuation.
- This runbook therefore should be treated as ready for code review with automated coverage and exact live blockers, not as a completed live manual acceptance pass.
- Exact simulator blocker remains unchanged from the 2026-06-10 evidence: the target iPhone simulator can still expose app framebuffer through `xcrun simctl io ... screenshot`, but `Simulator.app` reports zero device windows and Computer Use returns `cgWindowNotFound`. A recovered simulator window or replacement booted device is required before collecting the Phase 4 through Phase 9 screenshots.

Live/manual blockers to clear before release:

- Capture screenshots or simulator evidence for cached list before refresh, private latest-entry room, group latest-entry room, upward older pagination, socket/new-message affordance, profile/avatar hydration, group info drawer/search/pagination, composer quote/mention/image/emoji, message action sheet, Me tab, and fresh-account/new-user path.
- Confirm native callable service contracts for Buzz/share and Translate before re-exposing those message actions. The inspected web implementation uses web-only `toBuzz` emit/publish flow and `fetchTranlateResult`; native has no confirmed room-wired service contract yet.
- Confirm or provide the backend-native remote group join/write contract. Until then, remote group discovery remains read-only with the explicit disabled reason.
- Use a fresh mnemonic/account or get explicit permission to reset the simulator account before claiming the live new-user onboarding path.
