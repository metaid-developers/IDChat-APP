# Native IDChat Migration Design

Status: Draft for user review
Date: 2026-06-08
Workspace: `/Users/tusm/Documents/MetaID_Projects/IDChat-APP`
Related web app: `/Users/tusm/Documents/MetaID_Projects/idchat`

## Summary

Replace the IDChat web chat entry inside `IDChat-APP` with native React Native chat screens. The app should no longer open the IDChat home experience by loading `https://www.idchat.io/chat` in a WebView. Core chat behavior will be implemented directly in the existing Expo/React Native wallet app while preserving the current backend HTTP APIs, Socket.IO contract, wallet behavior, encryption formats, and MetaID createPin sending flow.

This migration is limited to the IDChat chat experience. The generic wallet DApp browser and external WebView container remain available for external apps, DApps, and future compatibility needs.

## Goals

- Replace the current IDChat home WebView with native screens for conversation list and chat rooms.
- Support MVP chat features:
  - private chat
  - group chat
  - text sending
  - image sending
  - emoji input
  - message history loading
  - Socket.IO realtime incoming messages
  - basic unread state
- Keep existing backend HTTP and Socket.IO interfaces unchanged.
- Reuse the existing wallet, signing, ECDH, createPin, and chain broadcast capabilities in `IDChat-APP`.
- Keep encrypted message compatibility with the existing `idchat` web app.
- Keep a minimal native shell for links/apps opened from chat messages so the UI flow does not break, while deferring full app-link feature parity.

## Non-Goals

- No red packet implementation in the MVP.
- No MRC20 chat or asset-message support in the MVP.
- No full rewrite of the generic DApp browser or wallet WebView system.
- No backend API redesign.
- No replacement of the existing wallet architecture.
- No full group-management feature set in the MVP, including advanced admin tools, invite flows, permission dashboards, and private-group onboarding screens.
- No full parity with every historical IDChat web feature before the native chat MVP ships.

## Current State

`IDChat-APP` is already an Expo/React Native wallet app. It includes multi-chain wallet dependencies and wallet-side primitives such as ECDH, getPKHByPath, createPin, DOGE/BTC/MVC transaction construction, image picker dependencies, notifications, React Query, and Zustand.

The current IDChat entry is `src/chat/page/ChatHomePage.tsx`. It loads the web app URL and injects `window.metaidwallet` through a WebView bridge. The bridge dispatches wallet actions such as Connect, ECDH, SignBTCMessage, GetPKHByPath, createPin-style operations, badge updates, and browser-opening events.

The `idchat` web app currently owns the chat business behavior:

- HTTP API access under the chat API base, especially `/chat-api/group-chat/*`.
- Socket.IO connection using the runtime chat WS URL and a path ending in `/socket.io`.
- IndexedDB local persistence for channels, messages, read indexes, red packet ids, mentions, and settings.
- Group/private message encryption before sending.
- MetaID node construction and createPin/broadcast for outgoing messages.
- Image compression, file-to-attachment conversion, MetaFile creation, and encrypted image payloads.

The native migration should move these chat responsibilities into `IDChat-APP` without moving generic DApp browsing responsibilities.

## Scope Boundary

### Replace

- The IDChat chat homepage WebView.
- Conversation list UI.
- Chat room UI.
- Message composer.
- Text, image, and emoji send flows.
- Message history, local cache, and realtime receive flows.

### Keep

- Generic WebView/DApp browser screens.
- External wallet bridge behavior for non-chat DApps.
- Existing wallet account creation, import, signing, payment, and chain-send flows.
- Existing backend services and existing production route shapes.

### Add Minimal Shell

When a user taps a chat message link that currently opens a web app or application-like route, native chat will route to a lightweight `ChatLinkShell` screen. The shell should provide a stable navigation surface with:

- title or fallback host/path label
- back navigation
- link/app identifier display
- option to open with the existing generic WebView or external browser when the URL is safe and supported
- unsupported state for app links that are not implemented natively yet

The shell is intentionally not a full app runtime in the MVP.

## Recommended Architecture

Add a native chat module inside `IDChat-APP` rather than creating a separate mobile app or rewriting both iOS and Android independently.

Conceptual module layout:

- `chat-native/screens`
  - conversation list
  - chat room
  - image preview
  - chat link shell
- `chat-native/components`
  - message bubble
  - composer
  - emoji picker
  - image picker entry
  - unread badge
- `chat-native/services`
  - HTTP chat API client
  - Socket.IO client
  - crypto compatibility service
  - wallet adapter
  - image/file service
  - message send service
- `chat-native/storage`
  - SQLite repository
  - schema migration helpers
  - local pending/mock message handling
- `chat-native/state`
  - active account state
  - channel list state
  - message list state
  - socket state
  - unread/read-index state

This keeps UI, protocol, wallet access, crypto, and persistence separately testable.

## Data Flow

### App Entry

1. User opens IDChat in the native app.
2. App resolves the active wallet/account and globalMetaId.
3. Native chat initializes local storage for that globalMetaId.
4. Native chat fetches runtime chat config or uses the bundled production defaults.
5. Native chat loads conversation list from local storage, then syncs from the server.
6. Native chat connects Socket.IO using the current account.

### Conversation List Sync

1. Native chat requests latest chat info from the existing chat HTTP API.
2. Server channels are normalized into native channel records.
3. Local channel records are merged, preserving local read indexes and pending message state.
4. UI renders the merged list.

### Message History

1. User opens a private or group chat.
2. Native chat reads cached messages from SQLite.
3. Native chat requests indexed history from the existing server endpoint.
4. Server messages and local pending/mock messages are deduplicated by txid, pin id, mock id, channel id, and continuous index where available.
5. Native chat decrypts content for display after merge.

### Incoming Socket Message

1. Socket.IO receives `WS_SERVER_NOTIFY_GROUP_CHAT` or `WS_SERVER_NOTIFY_PRIVATE_CHAT`.
2. Native chat normalizes the payload into the same message model used by history.
3. Native chat stores the message in SQLite.
4. Native chat updates unread/read state.
5. Active chat room receives the message without a full page refresh.

### Sending Text

1. Composer validates non-empty text and length limit.
2. Native chat encrypts content according to channel type.
3. Native chat creates a local pending/mock message immediately.
4. Native chat builds the MetaID node:
   - group: `SimpleGroupChat`
   - private: `SimpleMsg`
5. Native chat calls the existing wallet/createPin pipeline.
6. On success, pending message is reconciled to the returned txid/reveal txid.
7. On cancellation or failure, pending message becomes retryable or is removed according to the error type.

### Sending Image

1. User selects an image through the native image picker.
2. Native chat compresses or resizes within the agreed size limits.
3. Native chat converts image data to the same attachment form expected by the createPin file flow.
4. Native chat encrypts image payload when required.
5. Native chat creates a MetaFile attachment pin.
6. Native chat builds the chat file node:
   - group: `SimpleFileGroupChat`
   - private: `SimpleFileMsg`
7. Native chat sends through the existing createPin pipeline and reconciles the local pending message.

## Protocol Compatibility

### Runtime Config

Native chat should support loading the same runtime config source used by the web app where practical. The production fallback should preserve these meanings:

- chat API base: `https://api.idchat.io/chat-api`
- chat WS base: `https://api.idchat.io`
- Socket.IO path: `/socket/socket.io`

The app should not derive the Socket.IO path by appending socket routes under `/chat-api`.

### HTTP Interfaces

The MVP should use the existing compatible chat interfaces, including:

- latest conversation info
- group chat history by timestamp or index
- channel/sub-channel chat history by timestamp or index
- private chat history by timestamp or index
- group info
- group member list only where required for basic display
- private chat user profile/public-key hydration where required for ECDH

No backend route shape changes are part of this spec.

### Socket.IO

Socket initialization should preserve:

```ts
{
  url: chatWsBase,
  path: `${chatWsPath}/socket.io`,
  query: {
    metaid: globalMetaId,
    type: 'app'
  }
}
```

The native client should handle reconnect, app foreground/background transitions, duplicate connection prevention, and account switching.

### Encryption

Native chat must remain compatible with the web app encryption formats.

Group text:

- AES-CBC
- fixed IV string `0000000000000000`
- key for normal public group: first 16 characters of channel id
- output: hex-compatible string used by current server/indexer data

Private group text:

- same AES-CBC format as group text
- key from cached `passwordKey`, or derived through wallet getPKHByPath for creator-owned groups where supported

Private chat text:

- peer public key is loaded from profile/chat metadata
- native wallet ECDH derives shared secret
- message encrypted using the same AES behavior as current web private chat

Images:

- image payload must preserve web-compatible hex/base64 conversion rules
- private image payloads use ECDH-derived encryption
- private-group image payloads use group password key encryption
- public group image payloads preserve current non-private behavior

### Sending Nodes

Native message send must preserve the existing protocol names and body shapes:

- `SimpleGroupChat` for group text
- `SimpleMsg` for private text
- `SimpleFileGroupChat` for group image
- `SimpleFileMsg` for private image

The native implementation should treat send as a MetaID/createPin operation, not as a direct HTTP POST.

## Local Storage

Use SQLite for native chat persistence. The web app's IndexedDB model should be translated into a native schema rather than copied directly.

Minimum SQLite entities:

- `channels`
  - account globalMetaId
  - channel id
  - channel type
  - display name
  - avatar
  - last message summary
  - last activity timestamp
  - server metadata needed for routing and encryption
- `messages`
  - account globalMetaId
  - channel id
  - txid or reveal txid
  - pin id
  - mock id
  - protocol
  - sender globalMetaId
  - content
  - content type
  - encryption
  - timestamp
  - continuous index
  - pending/error status
  - reply metadata where supported
- `read_indexes`
  - account globalMetaId
  - channel id
  - last read index
  - updated timestamp
- `ecdh_cache`
  - account globalMetaId
  - peer public key
  - shared secret or encrypted shared-secret record
  - updated timestamp
- `settings`
  - account globalMetaId
  - per-chat lightweight preferences

Sensitive wallet seed material should stay in the existing wallet storage layer and should not be copied into chat storage.

## UI Requirements

### Conversation List

- Show private and group conversations in a single list.
- Show avatar, title, latest message preview, time, and unread count.
- Support pull-to-refresh.
- Support empty state for no conversations.
- Support offline/cache-first rendering from SQLite.

### Chat Room

- Show grouped message history with sender avatar/name where useful.
- Distinguish self and peer messages.
- Support text messages, image messages, and emoji text.
- Support pending, failed, and sent states.
- Support retry for failed outgoing messages.
- Support scroll-to-bottom behavior.
- Support loading older messages.

### Composer

- Text input with send button.
- Emoji entry that inserts emoji into text.
- Image picker entry.
- Disabled state while wallet/account is unavailable.
- Clear error feedback for send cancellation, insufficient fee/balance, network failure, and encryption failure.

### Chat Link Shell

- Open from links detected in chat message content or supported message metadata.
- Keep native navigation and back behavior.
- Show unsupported state for app links that do not yet have native handling.
- Allow fallback to generic WebView or external browser for safe external URLs.

## Error Handling

Native chat should distinguish these error classes:

- missing wallet/account
- missing globalMetaId
- missing peer chat public key
- ECDH failure
- encryption/decryption failure
- HTTP sync failure
- Socket disconnect/reconnect state
- createPin cancellation by user
- createPin transaction failure
- chain broadcast failure
- local database failure
- unsupported chat link/app route

HTTP sync failures should not clear local data. Socket failures should not block opening cached chats. Send failures should leave a retryable local message unless the user explicitly cancels payment/signing.

## Security And Privacy

- Do not store wallet mnemonic or private keys in chat storage.
- Do not log shared secrets, decrypted private messages, image payloads, or mnemonic-derived values.
- ECDH cache should be scoped by account globalMetaId and peer public key.
- The app should avoid sending private message plaintext to analytics, logs, or external monitoring.
- Image temporary files should be cleaned after send or cancel when safe.

## Phased Delivery

### Phase 0: Protocol Compatibility POC

Goal: prove native services can interoperate with existing web/backend behavior before building full UI.

Deliverables:

- group text encryption/decryption fixture
- private text ECDH encryption/decryption fixture
- image payload conversion/encryption fixture
- Socket.IO connection fixture using production-equivalent path behavior
- createPin node-shape fixture for the four MVP protocols

Acceptance:

- Native-generated group/private encrypted messages can be decrypted by web-compatible code.
- Web-generated group/private encrypted messages can be decrypted by native-compatible code.
- Native Socket.IO connects with `type=app` and receives expected message events in a controlled test account.
- Node payloads match existing protocol names and required body fields.

### Phase 1: Native Read-Only Chat

Goal: replace the chat homepage WebView with a native conversation list and read-only chat room.

Deliverables:

- native IDChat route in app navigation
- conversation list from HTTP sync and SQLite cache
- chat room history loading
- message display for text and image records
- decryption for supported message types
- Socket.IO incoming message handling

Acceptance:

- Opening IDChat no longer loads the IDChat web homepage WebView.
- Existing conversations are visible.
- Opening a conversation shows cached and server-fetched history.
- Incoming private/group messages appear without refreshing the web app.

### Phase 2: Text And Emoji Sending

Goal: support MVP text sending for private chat and group chat.

Deliverables:

- native composer
- emoji insertion into text
- group text send
- private text send
- pending/sent/failed states
- retry behavior

Acceptance:

- Native group text appears in the existing web app conversation.
- Native private text appears in the existing web app conversation.
- Web-sent replies can still be received and displayed natively.
- User cancellation of signing/payment does not leave a misleading sent state.

### Phase 3: Image Sending

Goal: support image send and preview for private and group chat.

Deliverables:

- native image picker
- image compression/resizing
- attachment conversion
- MetaFile create flow
- image chat node send flow
- local image preview/cache

Acceptance:

- Native-sent group images display in the web app.
- Native-sent private images display in the web app for the recipient.
- Web-sent images display in the native app.
- Failed image sends are retryable or removable.

### Phase 4: Productization And Shell

Goal: make the MVP usable as the default chat experience.

Deliverables:

- unread count polish
- foreground/background socket handling
- account switching behavior
- basic notification/badge integration
- chat link shell
- empty/loading/error states
- performance pass for long histories

Acceptance:

- The native chat route can be set as the default IDChat entry.
- The old chat WebView remains available only as a fallback/debug escape hatch during rollout.
- Tapping supported links opens the native shell or safe fallback.
- The app remains usable after account switch, app background/resume, and network reconnect.

## Rollout Strategy

1. Keep current WebView chat entry available behind a fallback flag during development.
2. Add native chat behind an internal feature flag.
3. Run native and web side-by-side with the same test accounts.
4. Promote native chat as default after phases 1 through 3 pass compatibility tests.
5. Keep generic DApp/WebView support unchanged.
6. Remove the IDChat homepage WebView dependency only after native chat is stable for the MVP surface.

## Testing Strategy

### Unit Tests

- crypto compatibility fixtures
- channel/message normalization
- SQLite repository methods
- message deduplication
- pending-message reconciliation
- link classification for `ChatLinkShell`

### Integration Tests

- HTTP latest chat list sync
- HTTP group/private history loading
- Socket.IO connect/reconnect/message receive
- createPin node construction for text and image
- wallet ECDH wrapper behavior

### Device Verification

- iOS development build
- Android development build
- account switch
- app background/resume
- offline open from cache
- send failure and retry
- image selection permissions

### Compatibility Verification

- Native sends, web receives.
- Web sends, native receives.
- Native encrypted content can be decrypted by web-compatible logic.
- Web encrypted content can be decrypted by native-compatible logic.
- Existing backend HTTP and Socket.IO endpoints do not require code changes.

## Key Risks

### Identity Field Mismatch

The web app has historical use of both `metaId` and `globalMetaId`. Native chat must standardize internal identity handling around the account globalMetaId while preserving backend field names expected by each API.

Mitigation:

- Add normalization tests for private and group payloads.
- Keep API request/response DTOs separate from native domain models.

### Crypto Drift

Small differences in AES mode, IV, encoding, ECDH curve handling, or key derivation can break private chat or image compatibility.

Mitigation:

- Complete Phase 0 fixtures before full UI work.
- Compare native outputs against known web-compatible fixtures.
- Avoid replacing crypto libraries during MVP unless a fixture proves the replacement is equivalent.

### createPin And Broadcast Failures

Message send depends on wallet signing, fee state, UTXO state, and chain broadcast. Failures are user-visible and more complex than normal chat HTTP sends.

Mitigation:

- Model pending, cancelled, failed, and retryable states explicitly.
- Reuse existing wallet/createPin code paths rather than duplicating chain logic.
- Keep send service independent from UI.

### Local History Complexity

The web app relies on local persistence, continuous indexes, server merge behavior, and unread/read-index tracking.

Mitigation:

- Use SQLite from the start.
- Preserve continuous-index semantics.
- Keep merge and dedupe logic covered by tests before enabling send.

### Scope Creep From App Links

Chat links may point to app-like experiences that are currently rendered by WebView.

Mitigation:

- Ship a `ChatLinkShell` in MVP.
- Treat full app-link native implementations as future separate specs.
- Allow safe fallback to existing generic WebView where appropriate.

## Decisions Locked For MVP

- Use the existing Expo/React Native app as the host.
- Replace only the IDChat chat WebView for the MVP.
- Preserve generic DApp/WebView container behavior.
- Preserve existing backend APIs.
- Preserve current Socket.IO contract and production path semantics.
- Preserve current MetaID protocol node names for MVP message sending.
- Use SQLite for native chat local persistence.
- Exclude red packets and MRC20 from the MVP.

## Future Extensions

- Red packets.
- MRC20 and asset message types.
- Full group creation and admin flows.
- Private group invite and onboarding flows.
- Native implementations for specific app links opened from chat.
- Rich reply, forwarding, search, mentions, and advanced notification controls.
- Removal of the IDChat web fallback after native parity is proven.

## Next Step After Spec Approval

Create an implementation plan that starts with Phase 0 compatibility fixtures, then proceeds to native read-only chat before enabling send. The plan should be task-based and include exact files, tests, commands, and commit checkpoints.
