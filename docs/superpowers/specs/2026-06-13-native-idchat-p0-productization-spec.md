# Native IDChat P0 Productization Spec

## Purpose

This spec defines the next Native IDChat development cycle. It is intentionally limited to P0 productization work so the implementation plan can stay short, reviewable, and suitable for subagent-driven development.

The goal for this cycle is not to finish all Web IDChat parity. The goal is to make the native app launch reliably and make the core chat shell trustworthy enough for later P1 feature-parity work.

Native app repo:

`/Users/tusm/Documents/MetaID_Projects/IDChat-APP`

Web reference repo:

`/Users/tusm/Documents/MetaID_Projects/idchat`

Red packet features remain explicitly out of scope. Historical red packet messages must not crash the native app, but red packet creation, claiming, and detailed rendering are not required.

## Source Of Truth

- Web IDChat remains the functional reference for all non-red-packet behavior.
- Native mobile layout may use iOS/Telegram-like patterns when the web layout does not map cleanly to a phone screen.
- Existing native code is the implementation base. Do not reintroduce the old WebView chat shell as a fallback for normal chat usage.
- Existing dirty or unrelated worktree changes must not be reverted, staged, or reformatted unless the implementation task directly owns them.
- This P0 cycle must not include P1 scope such as full group admin tooling, complete composer parity, translation, Buzz sharing, or full subchannel management.

## 2026-06-13 Audit Findings

These findings define the current baseline for this spec.

Simulator and build:

- `npx expo run:ios --device CF3620CF-4769-486E-847B-911C96172049` built and installed the current checkout successfully.
- The installed app initially showed a red screen: `Could not connect to development server`.
- Relaunch required `npx expo start --dev-client --host localhost --port 8081` plus a manual red-screen reload.
- First iOS JS bundle took about 50 seconds for `index.js`.
- Metro emitted export fallback warnings for `@scure/bip39/wordlists/english` and `@noble/hashes/crypto.js`.

Visible native app state:

- The chat list eventually loaded live conversations.
- Most conversation avatars rendered as pale placeholder circles instead of real images.
- Some rows rendered initials, but not enough to claim real avatar hydration.
- The list initially showed readable message previews for several rows.
- Typing `Sunny` in the search field did not visibly reduce the list to matching conversations.
- After search/navigation, Metro logged `ERROR Error: [Error: Unknown point format]`.
- The app displayed a bottom toast: `Error: Unknown point format`.
- Returning to Chats after that error caused many conversation previews to show raw `U2Fsd...` encrypted payloads.
- The Me tab showed account/key/socket diagnostics plus `Native settings` and `No native chat settings available yet`, which is not a product-grade account screen.

Code evidence:

- Conversation rows are rendered in `src/chat-native/components/ConversationList.tsx` with a `TouchableOpacity` row but without a row-level `accessibilityRole="button"` or stable accessibility label.
- Private decrypt failures in `src/chat-native/services/chatMessageDecryption.ts` currently return the original message, which allows raw ciphertext to leak into product UI.
- `src/chat-native/components/ChatAvatar.tsx` uses React Native `Image` directly and only falls back to initials when no URI exists; it does not implement the web avatar resolver, image cache behavior, or load-error fallback.
- `src/chat-native/screens/NativeChatMePage.tsx` is still a thin account/debug status page rather than a complete user/account product surface.

Relevant web references:

- `/Users/tusm/Documents/MetaID_Projects/idchat/src/stores/simple-talk.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/utils/avatar.ts`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/components/UserAvatar/UserAvatar.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/MessageItem.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/TheInput.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/ChannelMemberListDrawer.vue`
- `/Users/tusm/Documents/MetaID_Projects/idchat/src/views/talk/components/direct-contact/Search.vue`

## P0 Scope

The P0 cycle has five product outcomes.

### 1. Reliable Native Launch

Required behavior:

- A developer or QA worker can launch the current native app on iOS Simulator with documented commands.
- The app must not remain on a red screen after following the documented launch flow.
- The app must not require stale installed bundles, hidden manual steps, or trial-and-error reloads.
- The app must make clear whether the verified flow is a dev-client flow or a release/debug bundled flow.
- The chat list must load without debugger warning overlays, red screens, or unhandled startup toasts.

Acceptance:

- The implementation plan must define one canonical simulator launch flow for this P0 cycle.
- A clean QA run must include exact commands used, simulator device name/UDID, and the first successful screen.
- If a release-style bundled app is not supported in this cycle, the spec is still satisfied only if the dev-client flow is deterministic and documented.

Out of scope:

- App Store signing.
- EAS production release automation.
- Android launch parity.

### 2. Decryption Stability And Ciphertext Containment

Required behavior:

- Web-readable private messages must render as plaintext in native.
- Web-readable group messages must render as plaintext in native.
- A malformed public key, missing key, or protocol-incompatible payload may fail one row, but must not poison the whole conversation list or convert unrelated previews into ciphertext.
- Product UI must never show raw `U2Fsd...` ciphertext as the main preview or message body.
- Product UI must never show low-level errors such as `Unknown point format` as an unexplained toast.
- Decryption failures must have a user-safe display string such as `Message unavailable` or `Unable to decrypt this message`, plus developer logs with enough context to debug without exposing secrets.

Acceptance:

- Triggering search, switching tabs, opening Me, and returning to Chats must not change readable previews into raw ciphertext.
- A decrypt failure test must prove the original ciphertext is not surfaced to conversation preview selectors.
- ECDH/public-key parsing must validate malformed peer keys before calling point parsing code that throws `Unknown point format`.
- The final simulator evidence must include a mixed chat list where normal readable previews remain readable after tab/search navigation.

Out of scope:

- Changing protocol semantics.
- Supporting encrypted protocols that Web IDChat cannot read.
- Printing mnemonic, private keys, shared secrets, or raw decrypted secret material in logs or docs.

### 3. Real Avatar Hydration

Required behavior:

- Native must hydrate real avatars wherever Web IDChat has enough profile data.
- Conversation list private rows, group rows, room headers, message sender avatars, group member rows, and Me account card must share the same avatar resolution rules.
- Native must port the useful behavior from the web avatar resolver:
  - ignore empty `/content`, `/thumbnail`, `metafile://`, and default placeholder values;
  - resolve pin ids and `metafile://` values to content URLs;
  - support data-image URLs and normal remote URLs;
  - retry/hydrate from profile lookup candidates when local avatar data is missing or fails to load.
- Avatar image rendering must use `expo-image` or an equivalent optimized native image component with cache and load-error behavior.
- If an avatar cannot be resolved, fallback must be deterministic initials plus a stable color. It must not be a blank pale circle.

Acceptance:

- At least one visible contact/member that has a real web avatar must show a real native avatar image in final evidence.
- A failed avatar URL must fall back to initials without leaving an empty circle.
- Unit tests must cover pin id, `metafile://`, default placeholder filtering, load-error fallback, and profile-hydration candidate selection.

Out of scope:

- User avatar editing.
- Uploading new profile images.

### 4. Core Shell Interaction And Testability

Required behavior:

- Conversation rows must be reliable touch targets.
- Bottom Chats/Me navigation must be reliable touch targets.
- Online bot/search/discovery entry points must either open their native surface or be hidden until working.
- Search must have a clear P0 contract:
  - filter local conversations immediately; and
  - only offer remote discovery when that remote path is implemented and safe.
- Interactive elements must expose correct accessibility roles and labels so Computer Use and future UI automation can operate the app.
- The native shell must avoid generic `element` controls for tappable product actions when a button/tab role is appropriate.

Acceptance:

- Computer Use or an equivalent deterministic simulator driver can tap a conversation row and open a room.
- Computer Use or an equivalent deterministic simulator driver can switch Chats and Me.
- Typing a local search term filters visible rows without triggering crypto/key parsing errors.
- Tappable controls in the chat shell have meaningful accessibility labels and roles.

Out of scope:

- Full end-to-end Detox/Appium setup.
- Pixel-perfect UI automation for every message action.

### 5. Product-Grade Me Screen

Required behavior:

- Me must feel like an account/settings screen, not a diagnostic panel.
- Me must show:
  - avatar and display name;
  - Global MetaID with copy action;
  - MVC address with copy action;
  - BTC address if available in current native wallet state;
  - chat public key status;
  - socket connection status in user-facing language;
  - wallet/account entry points that already exist natively;
  - backup/security/settings entry points only when they open real native routes.
- Unsupported settings must be hidden or shown as read-only product copy. Do not show `No native chat settings available yet`.
- Copy actions must provide user feedback without exposing secret material.

Acceptance:

- Me page screenshot must have no debug placeholder text.
- Me page must not show private key, mnemonic, seed phrase, raw shared secret, or other secret material.
- Copy actions for public identifiers must be tested.
- The Me tab must remain usable after socket reconnect or decrypt errors elsewhere.

Out of scope:

- Implementing new wallet backup flows.
- Implementing full account editing.
- Implementing profile avatar upload.

## P0 Non-Goals

Do not include these in the first implementation plan unless a P0 task cannot be completed without a minimal supporting change:

- Full group info drawer parity.
- Group invite/admin/whitelist/mute write operations.
- Full composer parity beyond not regressing current text/emoji/image basics.
- Translation service.
- Share to Buzz.
- Red packet features.
- Full historical message-type parity for protocol cards.
- Android QA.
- App Store/EAS production release.

These are P1/P2 topics for later specs and plans.

## Required Developer Workflow

The future implementation plan must instruct the development session to:

- Read `AGENTS.md` first.
- Read this spec before editing.
- Use `superpowers:subagent-driven-development` for execution unless explicitly told otherwise.
- Keep tasks short and independently reviewable.
- Commit each independent verified unit.
- Stage only files changed and understood.
- Post the required Lisa Hahn development-journal buzz after every commit.
- Stop and report if a P0 task needs a protocol change, backend change, or secret material that is not available locally.

Recommended implementation slices for the future plan:

1. Launch and evidence harness.
2. Decryption stability and ciphertext containment.
3. Avatar resolver, cache, and rendering.
4. Interaction/accessibility/search shell.
5. Me screen productization.

These slices may be split across multiple development sessions if one session becomes too large. A session must not claim P0 complete until all P0 acceptance gates below pass.

## Required Automated Verification

Run before claiming P0 completion:

```bash
git status --short --branch
git diff --check main...HEAD
git diff --check
yarn test:chat-native
yarn jest --runInBand src/webs/actions/common/__tests__/ecdh.test.ts
npm exec tsc -- --noEmit --pretty false
```

TypeScript rule:

- If full `tsc` still fails on known legacy files, the final report must list those separately.
- There must be no TypeScript errors in `src/chat-native`, modified files, new tests, launch scripts/config touched by the task, or avatar/decrypt code touched by the task.

## Required Focused Tests

The implementation plan must include focused tests for:

- Malformed private peer public key does not throw an uncaught `Unknown point format` into UI.
- Decrypt failure produces a safe display value and does not expose `U2Fsd...` ciphertext in list previews.
- Readable previews remain readable after search, tab switching, and Me navigation.
- Avatar resolver handles content pin ids, `metafile://`, default placeholders, empty placeholders, and normal URLs.
- Avatar load failure falls back to deterministic initials.
- Conversation rows expose button semantics and call the open-channel handler.
- Chats and Me tab controls expose tab semantics and switch reliably.
- Search filters local conversations without invoking remote discovery unless explicitly selected.
- Me page renders product account sections and excludes `No native chat settings available yet`.
- Public identifier copy actions call clipboard APIs with the expected values.

## Required Simulator Evidence

Final QA evidence must be current, minimal, and named after what it actually shows:

- Deterministic launch to first native screen.
- Chat list after sync, with readable previews and avatar images/fallbacks.
- Chat list after local search and clearing search, still with readable previews.
- Private room opened from a row.
- Group room opened from a row if a group row is present.
- Me tab product screen.
- Me tab public copy feedback.
- No red screen, debugger overlay, raw `U2Fsd...` preview, or `Unknown point format` toast in passing screenshots.

Do not use stale screenshots from previous runs as passing evidence.

## Stop Conditions

Stop and report a blocker instead of claiming P0 complete if:

- The app cannot be launched deterministically on iOS Simulator.
- Normal chat list usage still exposes raw encrypted payloads.
- `Unknown point format` still appears during normal search/tab/navigation flows.
- Web shows a real avatar for a visible contact but native cannot resolve it after endpoint/schema comparison.
- Conversation rows cannot be opened through a deterministic simulator interaction.
- Me page still contains placeholder settings copy.
- Any required fix would expose or commit mnemonic, seed, private key, shared secret, or other sensitive material.

The blocker report must include exact commands, file paths, logs, and the decision needed.
