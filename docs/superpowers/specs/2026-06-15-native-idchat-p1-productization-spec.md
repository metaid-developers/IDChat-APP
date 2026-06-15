# Native IDChat P1 Productization Spec

## Executive Summary

Native IDChat has passed the P0.5/P0.6 launch and build gates, but it is not yet release-grade because the live core chat experience still exposes too much technical state and does not consistently match Web IDChat's list, search, room, group, and account product behavior.

## Audit Method

### Baseline

- Native repo: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
- Web reference repo: `/Users/tusm/Documents/MetaID_Projects/idchat`
- Branch under audit: `main`
- Commit under audit: `bbf7586 fix: avoid native image picker warning overlay`
- P0.5/P0.6 baseline was present in the audited history:
  - `8268e97 feat: merge native idchat p0 release work`
  - `e0a2756 docs: capture native chat p0.5 pass evidence`
  - `e93acb1 docs: sanitize native chat p0.6 evidence logs`
  - `e62fc79 docs: capture native chat p0.6 build evidence`

### Native Runtime

- Device: iPhone 17 Simulator
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`
- Native launch command:

```bash
env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO \
  -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST \
  npx --no-install expo start --dev-client --host localhost --port 8081 --clear
```

- Dev-client URL opened with `xcrun simctl openurl` against `com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`.
- Evidence directory: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP/docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`
- Native screenshots:
  - `01-native-default-entry.png`
  - `02-native-default-after-bundle.png`
  - `03-native-search-sunny-filter.png`
  - `04-native-search-remote-discovery.png`
  - `05-native-room-group-test2.png`
  - `06-native-message-actions.png`
  - `07-native-group-info.png`
  - `08-native-me-account.png`
  - `09-native-me-copy-feedback.png`
  - `10-native-back-to-chats.png`
  - `11-native-online-bots-panel.png`

### Web Runtime

- Local Web reference command:

```bash
yarn vite --host 127.0.0.1 --port 5173 --mode mainnet
```

- Local unauthenticated Web screenshot: `12-web-chat-welcome.png`
- User's existing Chrome IDChat tab was also observed because it contained the active logged-in Web session.
- Chrome URL observed: `https://www.idchat.io/chat/talk/channels/public/welcome`
- Chrome screenshots were redacted before being saved. Real message text, contact names, and preview content are not preserved in the evidence screenshots.
- Native room screenshot `05-native-room-group-test2.png` keeps the room layout evidence but redacts visible message body text.
- Redacted Web screenshots:
  - `13-web-chrome-list-redacted.png`
  - `14-web-search-sunny-redacted.png`
  - `15-web-search-mode-redacted.png`
  - `16-web-room-redacted.png`

### Sensitive Data Handling

- No messages were sent during the audit.
- No mnemonic, private key, shared secret, QA wallet secret, or decrypted sensitive message content is included in this spec.
- Raw Chrome captures containing user-visible message content were redacted and the unredacted files were removed before documentation.
- Visible Native room message bodies were redacted where needed while preserving layout evidence.
- Public IDs and public group labels may still be visible in Native screenshots where they are part of the product UI under audit.

## P1 Scope

P1 is the first release-readiness productization pass after P0.5/P0.6. It should make Native IDChat usable as a real chat client for the existing account and live data, while staying narrower than full Web parity.

P1 includes:

- Main chat list productization: avatars, names, previews, timestamps, unread indicators, sorting, loading, empty, error, and list density.
- Search and discovery productization: local search, explicit remote discovery, search result grouping, no-result states, failure states, and Online Bot presentation.
- Core decryption containment: never surface raw ciphertext, raw JSON profile payloads, or low-level crypto errors in user-facing chat surfaces.
- Chat room baseline: message bubbles, sender/receiver layout, sender avatars, timestamps, long messages, images/media, transaction metadata, copy/open transaction actions, quote action, load-earlier behavior, scroll behavior, and keyboard behavior.
- Basic group chat productization: group list rows, group room headers, group names, group avatars, group member information, and group info drawer readability.
- Me/account productization: Global MetaID, display avatar/name, copy feedback, public account identifiers, connection/key status, and removal or containment of unsupported placeholders.

## Explicit Non-Scope

The following are not part of P1:

- Red packet creation, claiming, rendering parity, or historical red packet feature support beyond safe containment.
- Full group management, including invite, admin, owner transfer, whitelist, mute writes, kick, or permission editing.
- Full composer parity, including every Web attachment type, mentions, advanced emoji/sticker panels, translation, Buzz sharing, and subchannel authoring.
- Android acceptance, Android release work, TestFlight, EAS production release, App Store signing, and release-channel automation.
- WebView fallback for normal chat usage.
- Protocol changes, wallet secret flows, account migration flows, or key recovery flows.
- Complete desktop Web layout replication where a native mobile pattern is more appropriate.

## Gap Matrix

| Area | Web Behavior Observed | Native Behavior Observed | Parity Status | Severity | Priority |
| --- | --- | --- | --- | --- | --- |
| Launch and first usable screen | Chrome Web opens directly into the chat shell or a logged-out welcome state. Local Web shows a clean welcome screen with Connect Wallet. | Dev-client launch works but first bundle showed a prolonged Bundling screen before the list rendered. Metro bundled `index.js` in about 73 seconds on this run. | Partial | Medium | P2 unless it affects release QA |
| Chat list avatars | Web list shows dense conversation rows with real avatars or intentional fallbacks. | Native initially showed many pale/blank avatar placeholders, then some initials fallbacks after hydration. Real avatar parity was not established. | Partial | High | P1.1 |
| Chat list names and row density | Web rows fit avatar, name, timestamp, preview, unread badge, and status in a compact desktop list. | Native rows are readable but looser, with less information density and inconsistent avatar readiness. | Partial | Medium | P1.1 |
| Chat list previews | Web logged-in list showed readable previews where the account could read messages. | Native list was dominated by `Unable to decrypt this message`; one image preview and some group previews were contained, but normal readability is not release-grade. | Behavior error | Release blocker | P1.1 |
| Raw ciphertext containment | Web does not expose encrypted payloads in normal list rows. | Native did not show raw `U2Fsd...` ciphertext in this run, which is an improvement over the earlier P0 audit, but the replacement string is too common to be a product-ready preview. | Partial | High | P1.1 |
| Low-level error containment | Web does not surface crypto parser errors as primary UI. | No `Unknown point format` toast or red screen appeared in this run after bundle, search, room open, group info, Me, and Online Bot flows. | Matches for this run | Medium residual risk | P1.1 |
| Unread, pinned, and sorting behavior | Web list displays unread badges such as small numeric chips and preserves recent conversation ordering. | Native list showed timestamps and ordering, but no clear unread badges or pin treatment were visible in the audited list. | Missing or unverified | High | P1.1 |
| Local search | Web search is inline and has a dedicated search mode with cancel and recent-contact context. | Native local search filtered rows after entering a query and showed matching conversations. | Partial | Medium | P1.1 |
| Remote discovery | Web search and Online Bot discovery are integrated into the shell. | Native uses a separate blue `Search` button that reveals a Discovery section with remote results. It works, but the interaction and grouping do not yet feel like Web IDChat. | Partial | Medium | P1.1 |
| Search no-result/failure states | Web has explicit search-mode structure and cancel behavior. | Native no-result and failure states were not fully exercised in the live audit; P0.5 covered mock discovery only. | Missing evidence | Medium | P1.1 |
| Online Bot surface | Web exposes Online Bot as a first-class left-rail action. | Native Online Bot opens a sheet and lists bots, but the sheet title is visually cramped and one row leaked raw JSON-like profile text. | Behavior error | High | P1.1 |
| List loading and error states | Web logged-out state and welcome state are product framed. | Native bundle/loading state is technical. Chat data loading/error states need product-level copy and layout acceptance. | Partial | Medium | P1.1 |
| Chat room header | Web group room header includes title, public-channel label, truncated group id, member controls, and menu affordances. | Native group header shows group title, member count, back, and info. It is serviceable but less expressive than Web. | Partial | Medium | P1.2 |
| Message bubbles and grouping | Web room shows dense grouped history with avatars, names, varied content, and scroll affordances. | Native room renders bubbles and sender names, but repeated sender labels and transaction text make the stream feel more like debug output than a polished chat transcript. | Partial | High | P1.2 |
| Incoming/outgoing layout | Web visually distinguishes senders in the conversation stream. | Native had visible sender labels and bubbles; a full private sent/received comparison was not completed because the audit avoided sending messages. | Partial | High | P1.2 |
| Timestamps | Web room and list provide temporal context. | Native list had times; room timestamp grouping needs clearer product acceptance because screenshots did not prove full Web-like timestamp behavior. | Partial | Medium | P1.2 |
| Long text handling | Web room supports long message content within the scroll stream. | Native long-message wrapping was not conclusively covered by the visible live sample. | Missing evidence | Medium | P1.2 |
| Images and media | Web room supports media content within messages. | Native list showed `[Image]`, the room composer has an image control, and P0.6 removed a picker warning overlay. Message-level media rendering still needs acceptance evidence. | Partial | High | P1.2 |
| Transaction messages | Web presents transaction-related messages as product content. | Native renders transaction metadata inline and provides Copy/Open tx actions, but the visual treatment is too raw for normal users. | Partial | High | P1.2 |
| Message actions | Web supports message-level actions through menus. | Native bottom sheet supports Copy text, Copy txid, Open tx, and Quote. The full txid display is useful for QA but too prominent for product UI. | Partial | Medium | P1.2 |
| Quote action | Web supports reply/quote patterns in the composer flow. | Native exposes Quote in the action sheet; quote composer behavior was not fully verified. | Partial | Medium | P1.2 |
| Keyboard and scroll | Web composer and unread jump behavior are integrated with the scroll stream. | Native composer remained visible; keyboard send/scroll behavior was not fully exercised to avoid sending live messages. | Missing evidence | High | P1.2 |
| Load earlier messages | Web room supports historical scrolling and unread navigation. | Native shows `Load earlier messages` in the group room. Its loading, empty, and failure states need visual acceptance. | Partial | Medium | P1.2 |
| Group list rows | Web group rows include avatars, names, previews, times, and unread badges. | Native group rows appear in the main list and can open a group room, but avatar, unread, preview, and group metadata parity are incomplete. | Partial | High | P1.3 |
| Group info drawer | Web has group/member controls integrated into the room header and drawers. | Native Group info sheet shows group id, copy, mute row, member search, and members, but it includes `Notification status unknown`, raw member ids, and clipped lower content. | Partial | High | P1.3 |
| Group member information | Web member drawers show people in a product-oriented structure. | Native member list exists with names and IDs, but it needs clearer hierarchy, fallback states, and no clipping. | Partial | Medium | P1.3 |
| Me/account identity | Web keeps profile/account controls in the chat shell. | Native Me shows avatar/name, Global MetaID, MVC address, chat public key, chat key status, and socket status. It has good copy feedback but remains too diagnostic. | Partial | High | P1.3 |
| Copy feedback | Web and Native should provide visible feedback for copyable public IDs. | Native Global MetaID copy feedback worked and showed `Copied Global MetaID`. | Matches | Low | P1.3 |
| Placeholder/dead actions | Web production UI avoids unsupported empty routes in the main shell. | Native no longer showed the old `No native chat settings available yet` placeholder in this run, but Me still lacks real settings/account entry-point clarity. | Partial | Medium | P1.3 |
| Visual safety and safe areas | Web uses mature desktop spacing. | Native major screens were not red-screening, but Online Bot title spacing, group drawer clipping, and row density need mobile polish. | Partial | Medium | P1.1/P1.3 |

## P1.1 / P1.2 / P1.3 Split

### P1.1: Main Chat List, Search, Discovery, And Containment

Goal: the first screen after launch must feel like a usable chat app, not a diagnostic shell.

Required product outcomes:

- Conversation list rows show stable avatar, name, timestamp, preview, unread state when available, and correct row ordering.
- Avatar fallbacks are deterministic initials or real images; blank pale circles are not acceptable after loading settles.
- Normal readable Web messages render as useful Native previews for the same account.
- Decrypt failures are contained to a specific safe preview and never expose raw ciphertext, raw JSON, or low-level crypto errors.
- Local search filters visible conversations immediately after typing.
- Remote discovery is explicit, grouped, and has loading, empty, and failure states.
- Online Bot sheet/list never exposes raw JSON profile fields and does not clip its title or primary controls.
- List loading, empty, and error states use product copy and do not look like Metro/debug output after app launch.

P1.1 acceptance:

- Start default Native IDChat on iPhone Simulator from the documented dev-client command.
- Capture a chat-list screenshot after data settles; it must show no blank avatar circles in visible rows.
- Capture the same list after switching Chats -> Me -> Chats; readable previews must not degrade into raw ciphertext or broad `Unable to decrypt this message` rows.
- Enter a query that matches at least two local conversations; capture the filtered list and verify nonmatching rows are hidden.
- Trigger explicit remote discovery; capture loading and result states, and capture no-result or failure state using a deterministic QA condition.
- Open Online Bot; capture the sheet and verify no raw JSON profile text, no clipped heading, and no dead actions.
- Save Metro logs and simulator screenshots in the P1.1 evidence directory.

### P1.2: Chat Room Baseline Productization

Goal: opening a private or group conversation must produce a readable chat transcript with safe, useful message actions.

Required product outcomes:

- Room header shows the conversation name, avatar or group fallback, member/channel context when applicable, and working back/info actions.
- Messages show sender/receiver orientation, avatar or initials, display name where needed, message body, and timestamp context.
- Consecutive messages are grouped enough that repeated sender labels do not dominate the transcript.
- Long text wraps without overlapping controls or changing row touch targets.
- Image/media messages render as visible media cards or clear safe placeholders, not only `[Image]` text.
- Transaction messages render as product cards or compact metadata with copy/open transaction actions.
- Message actions support Copy text, Copy txid when applicable, Open tx when applicable, and Quote without exposing excessive raw internals as the main sheet content.
- Load-earlier, scroll-to-bottom, and keyboard-open behavior remain stable and do not cover the composer or latest message.

P1.2 acceptance:

- Open at least one private chat and one group chat from the live list or a non-sensitive QA fixture.
- Capture room screenshots showing incoming and outgoing messages, timestamp context, and avatar/name behavior.
- Capture a long text message or fixture and verify wrapping within the bubble.
- Capture image/media rendering or a deterministic media placeholder.
- Capture a transaction message and its action sheet; verify Copy/Open actions are visible only when relevant.
- Open the keyboard in the room and capture the composer area; the input must remain visible and the latest message must not be permanently hidden.
- Tap Load earlier messages and capture either loaded history or a product-level empty/failure state.

### P1.3: Basic Group And Account Completion

Goal: groups and account surfaces must be credible enough for release even though full group management remains out of scope.

Required product outcomes:

- Group rows and room headers use clear group avatar/name/member context.
- Group info shows group name, group id copy, member count, member search, and member rows without clipped content or raw low-value identifiers dominating the screen.
- Unsupported group settings are hidden or presented as read-only product text. `Notification status unknown` is not acceptable as a primary visible state.
- Me page presents public account identity, avatar/name, Global MetaID copy, address copy, connection status, and chat key status in user-facing language.
- Me page does not expose secrets and does not show unsupported settings as empty/dead actions.
- Copy feedback is visible and scoped to the copied public field.

P1.3 acceptance:

- Open at least one group room, open Group info, and capture the full drawer including member list and member search.
- Run a member search with a matching and no-result query; capture both states.
- Verify group info has no clipped bottom rows, no raw debug status, and no unsupported write controls.
- Open Me, capture identity and status content, copy Global MetaID, and capture the copy feedback.
- Verify Me shows no mnemonic, private key, seed phrase, shared secret, or decrypted sensitive content.
- Verify any visible settings/account entry opens a real native surface or is clearly read-only.

## Acceptance Criteria By Batch

### P1.1 Simulator Evidence

Required commands and artifacts:

- `git status --short --branch`
- `git log --oneline -8 --decorate`
- default Native Metro/dev-client launch command
- `xcrun simctl bootstatus CF3620CF-4769-486E-847B-911C96172049 -b`
- `xcrun simctl openurl CF3620CF-4769-486E-847B-911C96172049 <dev-client-url>`
- screenshots for list, local search, discovery, Online Bot, list after navigation, and error/no-result states
- Metro log covering launch and audited actions

Pass criteria:

- No red screen or debugger warning overlay in final evidence.
- No raw ciphertext, raw JSON, `Unknown point format`, or stack trace text in user-facing chat list/search/discovery UI.
- Search and discovery have visible loading/result/no-result/failure states.
- Visible list rows include stable avatar or initials, name, timestamp, preview, and unread state when the account has unread data.

### P1.2 Simulator Evidence

Required commands and artifacts:

- same baseline git and launch evidence as P1.1
- screenshots for private room, group room, message actions, media/transaction message, keyboard-open composer, load-earlier state
- logs proving no red screen or unhandled fatal error during room navigation

Pass criteria:

- Room header, transcript, composer, and message actions remain usable after opening and returning from at least two rooms.
- Long text, media, transaction metadata, and quote/copy actions are represented with product UI rather than raw protocol/debug text.
- Keyboard does not cover the composer permanently and scrolling returns to the latest message predictably.

### P1.3 Simulator Evidence

Required commands and artifacts:

- same baseline git and launch evidence as P1.1
- screenshots for group info, member search match/no-result, Me page, and Me copy feedback
- logs proving no secret material is printed during these flows

Pass criteria:

- Group info is readable, unclipped, and free of unsupported write actions.
- Member rows show product-level identity information and deterministic fallbacks.
- Me page is an account surface rather than a debug panel.
- Public identifier copy feedback works.
- No secret material is visible in screenshots, logs, or docs.

## Risks And Open Questions

- The biggest release risk is whether Native can decrypt the same normal private/group messages that the active Web account can read. If Native and Web are using different accounts or key material, P1.1 must define a non-sensitive fixture account before judging decrypt parity.
- The audit avoided sending live messages. P1.2 needs a safe QA fixture or explicit permission to send non-sensitive test messages for outgoing layout, keyboard, and quote acceptance.
- Web screenshots were taken from the user's live Chrome session and redacted. Future acceptance should prefer a controlled QA account so evidence can show more UI text without exposing user content.
- The team needs a product decision on whether Chat public key belongs on the first-level Me page or should move behind a technical/account detail screen.
- The team needs a product decision on whether Online Bot is a required P1.1 entry point or can move to P2 if search discovery becomes the primary discovery path.
- The team needs a product decision on public group/channel labeling in Native, including whether Web labels such as public channel should be visible in room headers.
- Full list performance was not benchmarked. P1.1 should include a large-list manual scroll acceptance run when a suitable account or fixture is available.
- Notification/mute state in group info currently appears under-specified. P1.3 should either show a real state from data or remove the row.

## Implementation Plan Handoff Notes

These notes are boundaries for a later implementation-planning session, not an implementation plan for this audit session.

- Split the next development work into P1.1, P1.2, and P1.3. Do not combine all P1 scope into one long development task.
- P1.1 should go first because it controls the first user impression and contains the release-blocking preview/decryption/discovery issues.
- Keep red packet behavior explicitly out of scope except for safe containment when historical data appears.
- Keep Android, TestFlight, EAS, App Store signing, and WebView fallback out of the implementation plan.
- Do not print, screenshot, or commit mnemonic, private key, shared secret, QA wallet secret, or decrypted sensitive message content.
- Preserve the P0.5/P0.6 launch/build gates while improving product behavior; every P1 batch should keep its own simulator evidence.
- Use Web IDChat as the product reference, but choose native mobile layout patterns where the desktop layout does not fit a phone screen.
- Any implementation plan should start from the evidence in `/Users/tusm/Documents/MetaID_Projects/IDChat-APP/docs/superpowers/qa/evidence/native-idchat-p1-product-audit-20260615/`.
