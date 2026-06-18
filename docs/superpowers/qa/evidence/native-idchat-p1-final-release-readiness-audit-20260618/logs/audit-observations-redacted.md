# Native IDChat P1 Final Release Readiness Audit Observations

Date: 2026-06-18

## Runtime

- Native runtime: iPhone 17 Simulator, iOS 26.5, UDID `CF3620CF-4769-486E-847B-911C96172049`.
- Native command path: Expo dev-client launched through `com.meta.idchat://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`.
- Metro command: live mode with `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO` and `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST` unset.
- Web reference: Chrome logged-in IDChat session opened to `https://www.idchat.io/chat/talk/channels/public/welcome`.

## Native Observations

- Initial Native launch restored a group info route. The sheet rendered with group avatar/title area, member count, group id copy control, mute status, member search, member rows, and a Close action. No red screen or raw JSON was visible.
- Group room rendered with header avatar/title/member count/info, `Load earlier messages`, chat bubbles, Copy buttons, overflow action controls, and a composer with emoji, text input, image button, and disabled send button when empty. Historical unsupported-message states were visible in the transcript.
- Message actions opened from a transaction-like message. The action sheet rendered `Copy text`, `Copy txid`, `Open tx`, and `Quote`, plus a transaction-id section. No action was executed during audit.
- Keyboard behavior was verified by focusing the composer and toggling the Simulator software keyboard. The composer stayed visible above the keyboard and the empty send button stayed disabled.
- Default chat list rendered avatars/fallbacks, row timestamps, type badges, and bottom tabs. The visible private-chat rows were dominated by `Message unavailable`; one visible row used `[Image]` as its preview. This was visible before any search or discovery query.
- Local search with a known query returned a local group row. Local search with a no-match query rendered `No matching chats`.
- Explicit remote discovery showed a loading state, a no-result state for a no-match query, and a result state for a known query. No raw error payload was shown.
- Online bots panel opened from the Chats screen, showed Refresh and Close actions, and rendered multiple bot rows without a red screen.
- Me page rendered account/profile status, copy controls, `Private chat ready`, and `Chat sync connected`. Copying the Global MetaID showed a visible copied-feedback state.
- Opening a visible private chat row produced primary-room content where the first visible incoming bubble said `Unable to decrypt this message` and a visible outgoing bubble said `Unsupported message`.
- Opening the visible `[Image]` private-chat row did not show a visible image/media card in the captured viewport; the room again showed `Unable to decrypt this message` and `Unsupported message` states.

## Web Reference Observations

- The Chrome IDChat list rendered a denser left rail with group/channel entries, unread badges, timestamps, and readable preview text in the logged-in profile.
- The opened web group room rendered a readable message transcript, public-channel/group context, composer, and fee/chain controls.
- The web search input was observed but not successfully automated because the target element exposed by the browser snapshot was not editable through the automation layer. Search parity is therefore recorded from Native only and is not treated as a Web failure.

## Screenshot Map

- `01-native-chat-list-default-redacted.png`: Native default chat list with unavailable previews.
- `02-native-local-search-match-redacted.png`: Native local search match.
- `03-native-local-search-no-result-redacted.png`: Native local search no-result state.
- `04-native-remote-discovery-loading-redacted.png`: Native remote discovery loading state.
- `05-native-remote-discovery-no-result-redacted.png`: Native remote discovery no-result state.
- `06-native-remote-discovery-result-redacted.png`: Native remote discovery result state.
- `07-native-online-bots-redacted.png`: Native online bots panel.
- `08-native-group-room-redacted.png`: Native group room layout.
- `09-native-message-actions-redacted.png`: Native message actions sheet.
- `10-native-room-keyboard-redacted.png`: Native room keyboard/composer behavior.
- `11-native-group-info-redacted.png`: Native group info sheet.
- `12-native-me-account-redacted.png`: Native Me/account page.
- `13-native-me-copy-feedback-redacted.png`: Native Me/account copy feedback.
- `14-native-private-room-redacted.png`: Native private room with decrypt/unsupported states.
- `15-native-private-media-room-redacted.png`: Native private media row opening into decrypt/unsupported states.
- `16-web-chrome-list-redacted.png`: Web IDChat list reference.
- `17-web-chrome-room-redacted.png`: Web IDChat room reference.

## Sensitive Data Handling

- Raw screenshots were kept under `/tmp/idchat-p1-final-raw` during the audit and are not part of this evidence directory.
- Committed screenshots mask account avatars, profile names, Global MetaID/address/key values, member names, message bodies, and transaction identifiers.
- Observations intentionally name only product states and UI labels needed for release-readiness judgment.
