# Native IDChat P1.1 Main Chat Productization Evidence - 2026-06-15

## Result

P1.1 simulator evidence: PASS after the live-evidence and final-review follow-up commits.

## Commit Under Test

- Branch: `codex/native-idchat-p1-1-main-chat-productization`
- Commit: `44f9812205f827ce0df5cb524ce3eacee66243c2`

## Simulator

- Simulator: iPhone 17
- Runtime: iOS 26.5
- UDID: `CF3620CF-4769-486E-847B-911C96172049`

## Commands

- `yarn test:chat-native`
- `npm exec tsc -- --noEmit --pretty false`
- `env -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO -u EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_EMPTY_LIST npx --no-install expo start --dev-client --host localhost --port 8081 --clear`
- `xcrun simctl openurl CF3620CF-4769-486E-847B-911C96172049 "$(cat logs/dev-client-url.txt)"`
- `xcrun simctl io CF3620CF-4769-486E-847B-911C96172049 screenshot ...`

## Screenshot Evidence

- `01-list-after-settle.png` - live chat list after sync settled; visible previews use product copy.
- `02-local-search-filter.png` - local search filters visible rows and exposes the explicit remote Search action.
- `03-remote-discovery-results.png` - explicit remote discovery returns grouped results above local matches.
- `04-remote-discovery-empty-or-failure.png` - explicit remote discovery no-result state remains visible as `No remote results`.
- `05-online-bots.png` - Online Bot sheet shows an unclipped header, product subtitles, and no raw JSON profile text.
- `06-back-to-chats-after-me.png` - Chats -> Me -> Chats navigation keeps list display and preview containment intact.

## Live Acceptance Notes

- The first live pass exposed a blocking list-preview issue: normalized decrypt-failure text was still visible in rows. The pre-fix screenshot is retained as `logs/pre-fix-decrypt-copy-blocker.png`.
- Follow-up commit `f795dbf9d4a0ac85c6ed74479fe869c1902037ba` changed list-preview containment so that the technical decrypt-failure copy renders as `Message unavailable` in previews while preserving message-body behavior.
- Final review exposed a blocking Online Bot header layout issue where the sheet title was clipped at the screen edge. Follow-up commit `44f9812205f827ce0df5cb524ce3eacee66243c2` adds an independent header inset, and `05-online-bots.png` was recaptured after reloading the fixed Metro bundle.
- Metro logged the known non-blocking export fallback warnings for `@scure/bip39/wordlists/english` and `@noble/hashes/crypto.js`.
- TypeScript output is saved in `logs/tsc-task5.log`; it contains no `src/chat-native` errors.

## Sensitive Data Handling

- No mnemonic, private key, seed phrase, shared secret, QA wallet secret, or decrypted sensitive message content is included.
- Screenshots with live readable message content were redacted in place while preserving layout, filtering, and discovery evidence.
- Me/account details were observed for navigation only and were not captured as committed screenshot evidence.
