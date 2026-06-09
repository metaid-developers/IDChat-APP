# Native IDChat UI Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing `src/chat-native` React Native UI from a functional baseline into an IDChat-parity native chat experience guided by `generated/native-idchat-design-v2.png` and verified through iOS simulator screenshots.

**Architecture:** Keep the 2026-06-08 protocol, crypto, storage, socket, and send-service work intact. Add focused UI helpers, selectors, components, and screen polish inside `src/chat-native` so IDChat web remains the functional reference while Telegram-style native polish guides density and interaction. Treat the v2 static design as a baseline, then make high-fidelity decisions inside the running RN app.

**Tech Stack:** Expo SDK 53, React Native 0.79, TypeScript, Jest/Jest Expo, React Navigation, existing `src/chat-native` store/services, `expo-clipboard`, `react-native-vector-icons`, iOS Simulator.

---

## Fresh Section Brief

Start here in a fresh development section:

```bash
cd /Users/tusm/Documents/MetaID_Projects/IDChat-APP
```

The user explicitly approved developing directly on `main`. The worktree may contain unrelated dirty changes. Do not revert, stage, or overwrite unrelated changes.

Read these before editing:

1. `docs/superpowers/specs/2026-06-09-native-idchat-ui-parity-design.md`
2. `generated/native-idchat-design-v2.png`
3. `docs/superpowers/specs/2026-06-08-native-idchat-migration-design.md`
4. `docs/superpowers/plans/2026-06-08-native-idchat-migration.md`
5. IDChat web reference files under `/Users/tusm/Documents/MetaID_Projects/idchat`:
   - `src/views/talk/components/direct-contact/Item.vue`
   - `src/views/talk/components/direct-contact/List.vue`
   - `src/views/talk/components/direct-contact/Search.vue`
   - `src/views/talk/components/MessageItem.vue`
   - `src/views/talk/components/MessageMenu.vue`
   - `src/views/talk/components/TheInput.vue`
   - `src/stores/simple-talk.ts`

Current native UI files to improve:

- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/components/EmojiBar.tsx`
- `src/chat-native/components/ImageMessage.tsx`

Commit rules:

- Commit each independent task.
- Stage only files changed and understood in that task.
- Commit messages must use `feat`, `fix`, `refactor`, `docs`, or `chore`.
- After each commit, use Lisa Hahn (`--from lisa-hahn`) to post a development buzz. If a buzz attempt fails once, skip it until the next commit.

## Success Criteria

This plan is complete only when:

- Chat list is one mixed private/group list with no category tabs.
- IDChat shell has exactly two chat-surface tabs: `Chats` and `Me`.
- Both incoming and outgoing message rows show avatars.
- Message bubbles show time and shortened txid/pin id or pending/sent/failed status.
- Message actions support Copy text, Copy txid, Open tx, Quote, Buzz/share, and Translate where data allows.
- Composer is compact and icon-first, with text, emoji, and image entry.
- New-user empty state has a recommended group prompt.
- Mock scenario demonstrates all UI states.
- Jest focused tests pass.
- iOS Simulator screenshots are captured and reviewed for the high-fidelity pass.

## File Structure

Create these files:

- `src/chat-native/ui/chatTheme.ts`
  - shared colors, spacing, typography, and compact control sizes
- `src/chat-native/ui/chatUiFormatters.ts`
  - pure functions for time, preview, tx shortening, chain labels, and explorer URLs
- `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`
  - formatter and explorer URL tests
- `src/chat-native/ui/chatUiSelectors.ts`
  - pure selectors mapping domain data to list rows and message view models
- `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
  - mixed list and message metadata selector tests
- `src/chat-native/components/ChatAvatar.tsx`
  - native avatar component with fallback initials
- `src/chat-native/components/ChatBadge.tsx`
  - unread, mention, and group/private badges
- `src/chat-native/components/MessageActionSheet.tsx`
  - native action sheet/bottom sheet for message actions
- `src/chat-native/components/NewUserJoinPrompt.tsx`
  - empty/new-user recommended group prompt
- `src/chat-native/screens/NativeChatMePage.tsx`
  - lightweight Me tab for the IDChat shell
- `src/chat-native/dev/nativeChatUiMockScenario.ts`
  - UI-rich mock data for screenshot validation
- `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`
  - proves mock data includes required UI states
- `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`
  - iOS screenshot and manual UI QA runbook

Modify these files:

- `src/chat-native/domain/types.ts`
- `src/chat-native/components/ConversationList.tsx`
- `src/chat-native/components/__tests__/ConversationList.test.ts`
- `src/chat-native/components/MessageList.tsx`
- `src/chat-native/components/MessageBubble.tsx`
- `src/chat-native/components/ChatComposer.tsx`
- `src/chat-native/screens/NativeChatHomePage.tsx`
- `src/chat-native/screens/NativeChatRoomPage.tsx`
- `src/chat-native/index.ts`
- `src/base/AppNavigator.jsx`
- `docs/superpowers/qa/native-idchat-simulator-runbook.md`

## Task 1: UI Formatters And Explorer Helpers

**Files:**
- Create: `src/chat-native/ui/chatUiFormatters.ts`
- Create: `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`

- [ ] **Step 1: Write formatter tests**

Create `src/chat-native/ui/__tests__/chatUiFormatters.test.ts`:

```ts
import {
  formatNativeChatClockTime,
  getNativeChatChainLabel,
  getNativeChatTxExplorerUrl,
  shortenNativeChatTxId,
} from '../chatUiFormatters';

describe('chatUiFormatters', () => {
  it('formats second and millisecond timestamps as compact clock time', () => {
    expect(formatNativeChatClockTime(1710000000)).toMatch(/^\d{1,2}:\d{2}$/);
    expect(formatNativeChatClockTime(1710000000000)).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('shortens txids without hiding short pending ids', () => {
    expect(shortenNativeChatTxId('a8d142e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76990b')).toBe(
      'a8d1...90b',
    );
    expect(shortenNativeChatTxId('mock-1')).toBe('mock-1');
    expect(shortenNativeChatTxId(undefined)).toBe('');
  });

  it('maps chain labels and explorer urls using IDChat web behavior', () => {
    expect(getNativeChatChainLabel('btc')).toBe('BTC');
    expect(getNativeChatChainLabel('doge')).toBe('DOGE');
    expect(getNativeChatChainLabel('mvc')).toBe('MVC');
    expect(getNativeChatChainLabel(undefined)).toBe('MVC');
    expect(getNativeChatTxExplorerUrl('btc', 'tx1')).toBe('https://mempool.space/tx/tx1');
    expect(getNativeChatTxExplorerUrl('doge', 'tx1')).toBe('https://dogechain.info/tx/tx1');
    expect(getNativeChatTxExplorerUrl('mvc', 'tx1')).toBe('https://mvcscan.com/tx/tx1');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/chatUiFormatters.test.ts
```

Expected: FAIL with module not found for `../chatUiFormatters`.

- [ ] **Step 3: Implement formatters**

Create `src/chat-native/ui/chatUiFormatters.ts`:

```ts
export type NativeChatChain = 'btc' | 'doge' | 'mvc' | string | undefined;

export function normalizeNativeChatTimestamp(timestamp: number | undefined): number | undefined {
  if (!timestamp) return undefined;
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
}

export function formatNativeChatClockTime(timestamp: number | undefined): string {
  const normalized = normalizeNativeChatTimestamp(timestamp);
  if (!normalized) return '';
  const date = new Date(normalized);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function shortenNativeChatTxId(txId: string | undefined): string {
  if (!txId) return '';
  if (txId.length <= 12) return txId;
  return `${txId.slice(0, 4)}...${txId.slice(-3)}`;
}

export function getNativeChatChainLabel(chain: NativeChatChain): string {
  const normalized = String(chain || 'mvc').toLowerCase();
  if (normalized === 'btc') return 'BTC';
  if (normalized === 'doge') return 'DOGE';
  return 'MVC';
}

export function getNativeChatTxExplorerUrl(chain: NativeChatChain, txId: string): string {
  const normalized = String(chain || 'mvc').toLowerCase();
  if (normalized === 'btc') return `https://mempool.space/tx/${txId}`;
  if (normalized === 'doge') return `https://dogechain.info/tx/${txId}`;
  return `https://mvcscan.com/tx/${txId}`;
}
```

- [ ] **Step 4: Run formatter tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/chatUiFormatters.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit and buzz**

```bash
git add src/chat-native/ui/chatUiFormatters.ts src/chat-native/ui/__tests__/chatUiFormatters.test.ts
git commit -m "feat: add native chat UI formatters"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 2: UI Selectors For List Rows And Message View Models

**Files:**
- Modify: `src/chat-native/domain/types.ts`
- Create: `src/chat-native/ui/chatUiSelectors.ts`
- Create: `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`

- [ ] **Step 1: Extend domain types with UI metadata fields**

Modify `NativeChatMessageSummary` and `NativeChatMessage` in `src/chat-native/domain/types.ts` to include optional UI metadata:

```ts
export type NativeChatMessageSummary = {
  content: string;
  kind: NativeChatMessageKind;
  timestamp: number;
  senderGlobalMetaId?: string;
  senderName?: string;
};

export type NativeChatMessage = {
  accountGlobalMetaId: string;
  channelId: string;
  channelType: NativeChatChannelType;
  kind: NativeChatMessageKind;
  content: string;
  contentType: string;
  encryption?: string;
  protocol: string;
  timestamp: number;
  senderGlobalMetaId?: string;
  senderName?: string;
  senderAvatar?: string;
  txId?: string;
  pinId?: string;
  chain?: string;
  mockId?: string;
  index?: number;
  attachmentUri?: string;
  localPreviewUri?: string;
  replyPin?: string;
  status: NativeChatSendStatus;
  errorMessage?: string;
  raw?: Record<string, unknown>;
};
```

Preserve existing fields and order where practical. Do not remove current properties.

- [ ] **Step 2: Write selector tests**

Create `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../../domain/types';
import {
  getConversationRowViewModel,
  getMessageRowViewModel,
  sortConversationRows,
} from '../chatUiSelectors';

function channel(overrides: Partial<NativeChatChannel>): NativeChatChannel {
  return {
    accountGlobalMetaId: 'self',
    id: 'channel',
    type: 'group',
    title: 'Channel',
    unreadCount: 0,
    lastReadIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}

function message(overrides: Partial<NativeChatMessage>): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'channel',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1710000000,
    status: 'sent',
    ...overrides,
  };
}

describe('chatUiSelectors', () => {
  it('keeps private and group channels in one recency-sorted list', () => {
    const rows = sortConversationRows([
      channel({ id: 'private-1', type: 'private', updatedAt: 10 }),
      channel({ id: 'group-1', type: 'group', updatedAt: 20 }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(['group-1', 'private-1']);
  });

  it('builds group preview with sender name and image placeholder', () => {
    const row = getConversationRowViewModel(
      channel({
        type: 'group',
        title: 'MetaWeb Builders',
        lastMessage: {
          content: 'metafile://x',
          kind: 'image',
          timestamp: 1710000000,
          senderName: 'Nina',
        },
        unreadCount: 3,
      }),
    );
    expect(row.typeLabel).toBe('G');
    expect(row.preview).toBe('Nina: [Image]');
    expect(row.unreadCount).toBe(3);
  });

  it('builds self message metadata with tx label and outgoing avatar requirement', () => {
    const row = getMessageRowViewModel(message({
      senderGlobalMetaId: 'self',
      senderName: 'Me',
      senderAvatar: 'avatar://me',
      txId: 'a8d142e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76990b',
      chain: 'mvc',
    }), 'self');
    expect(row.isSelf).toBe(true);
    expect(row.avatar).toBe('avatar://me');
    expect(row.txLabel).toBe('MVC a8d1...90b');
    expect(row.statusLabel).toBe('');
  });

  it('uses status label while pending tx is unavailable', () => {
    const row = getMessageRowViewModel(message({ status: 'pending', txId: undefined }), 'self');
    expect(row.txLabel).toBe('');
    expect(row.statusLabel).toBe('Sending');
  });
});
```

- [ ] **Step 3: Run the failing selector tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/chatUiSelectors.test.ts
```

Expected: FAIL with module not found for `../chatUiSelectors`.

- [ ] **Step 4: Implement selectors**

Create `src/chat-native/ui/chatUiSelectors.ts`:

```ts
import type { NativeChatChannel, NativeChatMessage } from '../domain/types';
import {
  formatNativeChatClockTime,
  getNativeChatChainLabel,
  shortenNativeChatTxId,
} from './chatUiFormatters';

export type ConversationRowViewModel = {
  id: string;
  title: string;
  avatar?: string;
  typeLabel: 'G' | 'P';
  preview: string;
  timeLabel: string;
  unreadCount: number;
  mentionCount: number;
  updatedAt: number;
  raw: NativeChatChannel;
};

export type MessageRowViewModel = {
  id: string;
  isSelf: boolean;
  avatar?: string;
  senderName: string;
  body: string;
  kind: NativeChatMessage['kind'];
  timeLabel: string;
  txLabel: string;
  fullTxId: string;
  statusLabel: string;
  raw: NativeChatMessage;
};

export function getNativeChatPreviewContent(channel: NativeChatChannel): string {
  const lastMessage = channel.lastMessage;
  if (!lastMessage) return '';
  const content = lastMessage.kind === 'image' ? '[Image]' : lastMessage.content || '';
  if (channel.type === 'group' && lastMessage.senderName) {
    return `${lastMessage.senderName}: ${content}`;
  }
  return content;
}

export function getConversationRowViewModel(channel: NativeChatChannel): ConversationRowViewModel {
  return {
    id: channel.id,
    title: channel.title,
    avatar: channel.avatar,
    typeLabel: channel.type === 'private' ? 'P' : 'G',
    preview: getNativeChatPreviewContent(channel),
    timeLabel: formatNativeChatClockTime(channel.lastMessage?.timestamp || channel.updatedAt),
    unreadCount: Math.max(0, channel.unreadCount || 0),
    mentionCount: Number((channel.serverData as any)?.unreadMentionCount || 0),
    updatedAt: channel.lastMessage?.timestamp || channel.updatedAt || 0,
    raw: channel,
  };
}

export function sortConversationRows(channels: NativeChatChannel[]): NativeChatChannel[] {
  return [...channels].sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || a.updatedAt || 0;
    const bTime = b.lastMessage?.timestamp || b.updatedAt || 0;
    return bTime - aTime;
  });
}

export function getMessageRowViewModel(
  message: NativeChatMessage,
  accountGlobalMetaId: string,
): MessageRowViewModel {
  const txId = message.txId || message.pinId || '';
  const shortenedTxId = shortenNativeChatTxId(txId);
  const isSelf = message.senderGlobalMetaId === accountGlobalMetaId;
  const statusLabel =
    message.status === 'pending'
      ? 'Sending'
      : message.status === 'failed'
      ? 'Failed'
      : message.status === 'cancelled'
      ? 'Cancelled'
      : '';

  return {
    id:
      message.mockId ||
      message.txId ||
      message.pinId ||
      `${message.timestamp}:${message.index ?? ''}:${message.senderGlobalMetaId || ''}:${message.content}`,
    isSelf,
    avatar: message.senderAvatar,
    senderName: message.senderName || (isSelf ? 'You' : message.senderGlobalMetaId || 'Unknown'),
    body: message.content,
    kind: message.kind,
    timeLabel: formatNativeChatClockTime(message.timestamp),
    txLabel: shortenedTxId ? `${getNativeChatChainLabel(message.chain)} ${shortenedTxId}` : '',
    fullTxId: txId,
    statusLabel,
    raw: message,
  };
}
```

- [ ] **Step 5: Update ConversationList preview test import**

Modify `src/chat-native/components/__tests__/ConversationList.test.ts` to import `getNativeChatPreviewContent` from `../../ui/chatUiSelectors` instead of using the old component-local helper.

- [ ] **Step 6: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/chatUiSelectors.test.ts src/chat-native/components/__tests__/ConversationList.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit and buzz**

```bash
git add src/chat-native/domain/types.ts src/chat-native/ui/chatUiSelectors.ts src/chat-native/ui/__tests__/chatUiSelectors.test.ts src/chat-native/components/__tests__/ConversationList.test.ts
git commit -m "feat: add native chat UI selectors"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 3: Shared Theme, Avatar, And Badges

**Files:**
- Create: `src/chat-native/ui/chatTheme.ts`
- Create: `src/chat-native/components/ChatAvatar.tsx`
- Create: `src/chat-native/components/ChatBadge.tsx`

- [ ] **Step 1: Create shared theme**

Create `src/chat-native/ui/chatTheme.ts`:

```ts
export const nativeChatTheme = {
  color: {
    background: '#f5f7fb',
    surface: '#ffffff',
    border: '#e5eaf2',
    text: '#111827',
    mutedText: '#657287',
    faintText: '#94a3b8',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    incomingBubble: '#ffffff',
    outgoingBubble: '#2563eb',
    failed: '#c62828',
    success: '#18a957',
    avatarFallback: '#111827',
  },
  size: {
    listAvatar: 46,
    messageAvatar: 30,
    iconButton: 36,
    bottomTab: 68,
    listRowMinHeight: 72,
  },
  radius: {
    bubble: 18,
    compact: 12,
    round: 999,
  },
  font: {
    headerTitle: 17,
    listTitle: 15,
    body: 14,
    meta: 11,
    badge: 10,
  },
};
```

- [ ] **Step 2: Create avatar component**

Create `src/chat-native/components/ChatAvatar.tsx`:

```tsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';

type ChatAvatarProps = {
  uri?: string;
  name?: string;
  size?: number;
};

function initialsForName(name?: string): string {
  const cleaned = String(name || 'ID').trim();
  if (!cleaned) return 'ID';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export default function ChatAvatar({ uri, name, size = nativeChatTheme.size.listAvatar }: ChatAvatarProps) {
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        accessibilityLabel={`${name || 'User'} avatar`}
        source={{ uri }}
        style={[styles.avatar, { borderRadius, height: size, width: size }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { borderRadius, height: size, width: size }]}>
      <Text style={[styles.initials, { fontSize: size <= 32 ? 11 : 14 }]}>{initialsForName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.avatarFallback,
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
```

- [ ] **Step 3: Create badge component**

Create `src/chat-native/components/ChatBadge.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';

type ChatBadgeProps = {
  label: string;
  tone?: 'primary' | 'neutral' | 'mention';
};

export default function ChatBadge({ label, tone = 'primary' }: ChatBadgeProps) {
  return (
    <View style={[styles.badge, tone === 'neutral' && styles.neutral, tone === 'mention' && styles.mention]}>
      <Text style={[styles.text, tone === 'neutral' && styles.neutralText, tone === 'mention' && styles.mentionText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.round,
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  mention: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.primary,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mentionText: {
    color: nativeChatTheme.color.primary,
  },
  neutral: {
    backgroundColor: nativeChatTheme.color.primarySoft,
  },
  neutralText: {
    color: nativeChatTheme.color.primary,
  },
  text: {
    color: '#ffffff',
    fontSize: nativeChatTheme.font.badge,
    fontWeight: '800',
  },
});
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui src/chat-native/components/__tests__/ConversationList.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit and buzz**

```bash
git add src/chat-native/ui/chatTheme.ts src/chat-native/components/ChatAvatar.tsx src/chat-native/components/ChatBadge.tsx
git commit -m "feat: add native chat UI primitives"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 4: Conversation List Parity

**Files:**
- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`

- [ ] **Step 1: Update ConversationList tests**

Add tests to `src/chat-native/components/__tests__/ConversationList.test.ts`:

```ts
import { sortConversationRows } from '../../ui/chatUiSelectors';

it('sorts private and group channels together instead of splitting tabs', () => {
  const privateChannel = createChannel({
    content: 'private',
    kind: 'text',
    timestamp: 10,
  });
  privateChannel.id = 'private';
  privateChannel.type = 'private';

  const groupChannel = createChannel({
    content: 'group',
    kind: 'text',
    timestamp: 20,
  });
  groupChannel.id = 'group';
  groupChannel.type = 'group';

  expect(sortConversationRows([privateChannel, groupChannel]).map((item) => item.id)).toEqual([
    'group',
    'private',
  ]);
});
```

- [ ] **Step 2: Run list tests**

Run:

```bash
yarn test:chat-native src/chat-native/components/__tests__/ConversationList.test.ts
```

Expected: PASS after Task 2 selectors exist.

- [ ] **Step 3: Replace sparse list UI**

Modify `src/chat-native/components/ConversationList.tsx` so it:

- imports `ChatAvatar`, `ChatBadge`, `nativeChatTheme`, `getConversationRowViewModel`, and `sortConversationRows`
- renders search row with `Bot` shortcut and search placeholder
- renders mixed recency-sorted rows
- shows avatar, group/private badge, title, preview, time, unread count, and mention badge
- does not render any All/Private/Groups segmented tabs

Use this structure as the implementation target:

```tsx
const sortedChannels = sortConversationRows(channels);

<FlatList
  data={sortedChannels}
  ListHeaderComponent={(
    <View style={styles.searchRow}>
      <View style={styles.botPill}><Text style={styles.botText}>Bot</Text></View>
      <View style={styles.searchBox}><Text style={styles.searchText}>Search chats, groups, MetaID</Text></View>
    </View>
  )}
  renderItem={({ item }) => {
    const row = getConversationRowViewModel(item);
    return (
      <TouchableOpacity style={styles.row} onPress={() => onOpenChannel(item)}>
        <ChatAvatar uri={row.avatar} name={row.title} />
        <View style={styles.rowBody}>
          <View style={styles.titleLine}>
            <ChatBadge label={row.typeLabel} tone="neutral" />
            <Text style={styles.title} numberOfLines={1}>{row.title}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>{row.preview}</Text>
        </View>
        <View style={styles.metaColumn}>
          <Text style={styles.time}>{row.timeLabel}</Text>
          {row.unreadCount > 0 ? <ChatBadge label={String(row.unreadCount)} /> : null}
          {row.mentionCount > 0 ? <ChatBadge label="@" tone="mention" /> : null}
        </View>
      </TouchableOpacity>
    );
  }}
/>
```

- [ ] **Step 4: Update NativeChatHomePage header**

Modify `src/chat-native/screens/NativeChatHomePage.tsx` to add a compact IDChat header above `ConversationList`:

- left avatar fallback `ID`
- title `IDChat`
- subtitle `Chats`
- plus/create icon button

Do not add category tabs.

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/components/__tests__/ConversationList.test.ts src/chat-native/ui
```

Expected: PASS.

- [ ] **Step 6: Commit and buzz**

```bash
git add src/chat-native/components/ConversationList.tsx src/chat-native/screens/NativeChatHomePage.tsx src/chat-native/components/__tests__/ConversationList.test.ts
git commit -m "feat: refine native chat conversation list"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 5: Two-Tab IDChat Shell

**Files:**
- Create: `src/chat-native/screens/NativeChatMePage.tsx`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify: `src/chat-native/index.ts`
- Modify: `src/base/AppNavigator.jsx`

- [ ] **Step 1: Create lightweight Me page**

Create `src/chat-native/screens/NativeChatMePage.tsx`:

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';

export default function NativeChatMePage() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Me</Text>
        <Text style={styles.subtitle}>IDChat profile and account identity</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  subtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Add a two-tab visual shell to NativeChatHomePage**

In `NativeChatHomePage.tsx`, add local state:

```tsx
const [activeTab, setActiveTab] = useState<'chats' | 'me'>('chats');
```

Render `ConversationList` for `chats`, `NativeChatMePage` for `me`, and a bottom two-tab bar with exactly `Chats` and `Me`.

Keep this shell inside the native IDChat surface. Do not add Wallet/Discover tabs.

- [ ] **Step 3: Export Me page**

Modify `src/chat-native/index.ts` to export `NativeChatMePage`.

- [ ] **Step 4: Confirm AppNavigator still registers room and link shell routes**

Inspect `src/base/AppNavigator.jsx`. Keep existing native chat route names intact. Only add a route for `NativeChatMePage` if the current navigation structure needs it. Do not remove generic WebView/DApp routes.

- [ ] **Step 5: Run focused tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui src/chat-native/components/__tests__/ConversationList.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit and buzz**

```bash
git add src/chat-native/screens/NativeChatMePage.tsx src/chat-native/screens/NativeChatHomePage.tsx src/chat-native/index.ts src/base/AppNavigator.jsx
git commit -m "feat: add native IDChat two-tab shell"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 6: Message Bubbles With Two-Sided Avatars And Metadata

**Files:**
- Modify: `src/chat-native/components/MessageList.tsx`
- Modify: `src/chat-native/components/MessageBubble.tsx`
- Modify: `src/chat-native/ui/__tests__/chatUiSelectors.test.ts`

- [ ] **Step 1: Add message selector coverage for peer avatars**

Extend `chatUiSelectors.test.ts`:

```ts
it('keeps peer avatar and sender name for incoming group messages', () => {
  const row = getMessageRowViewModel(message({
    senderGlobalMetaId: 'peer',
    senderName: 'Nina Xu',
    senderAvatar: 'avatar://nina',
    txId: 'f41342e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76972e',
  }), 'self');
  expect(row.isSelf).toBe(false);
  expect(row.avatar).toBe('avatar://nina');
  expect(row.senderName).toBe('Nina Xu');
  expect(row.txLabel).toBe('MVC f413...72e');
});
```

- [ ] **Step 2: Run selector tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/chatUiSelectors.test.ts
```

Expected: PASS.

- [ ] **Step 3: Update MessageList to pass account id into view model**

Modify `MessageList.tsx` to map each item through `getMessageRowViewModel(item, accountGlobalMetaId)` and pass the row view model into `MessageBubble`.

- [ ] **Step 4: Update MessageBubble layout**

Modify `MessageBubble.tsx` so:

- row uses `flexDirection: isSelf ? 'row-reverse' : 'row'`
- `ChatAvatar` renders on both sides
- group/private sender label renders above bubble
- bubble footer renders `timeLabel`
- footer renders `txLabel` and a compact `Copy` chip when tx exists
- pending/failed status renders when tx does not exist
- image messages still use `ImageMessage`
- failed state remains visually obvious

Keep text compact: message body 14-15 pt and metadata 10-11 pt.

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui src/chat-native/components/__tests__/ImageMessage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit and buzz**

```bash
git add src/chat-native/components/MessageList.tsx src/chat-native/components/MessageBubble.tsx src/chat-native/ui/__tests__/chatUiSelectors.test.ts
git commit -m "feat: add native chat message metadata UI"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 7: Message Action Sheet

**Files:**
- Create: `src/chat-native/components/MessageActionSheet.tsx`
- Modify: `src/chat-native/components/MessageBubble.tsx`
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Create: `src/chat-native/ui/__tests__/messageActions.test.ts`
- Create: `src/chat-native/ui/messageActions.ts`

- [ ] **Step 1: Write action helper tests**

Create `src/chat-native/ui/__tests__/messageActions.test.ts`:

```ts
import type { NativeChatMessage } from '../../domain/types';
import { getNativeChatMessageActions } from '../messageActions';

function message(overrides: Partial<NativeChatMessage>): NativeChatMessage {
  return {
    accountGlobalMetaId: 'self',
    channelId: 'group',
    channelType: 'group',
    kind: 'text',
    content: 'hello',
    contentType: 'text/plain',
    protocol: 'simplegroupchat',
    timestamp: 1710000000,
    status: 'sent',
    txId: 'tx123',
    ...overrides,
  };
}

describe('messageActions', () => {
  it('includes IDChat text actions for text messages with txid', () => {
    expect(getNativeChatMessageActions(message({})).map((item) => item.id)).toEqual([
      'copy-text',
      'copy-txid',
      'open-tx',
      'quote',
      'buzz',
      'translate',
    ]);
  });

  it('omits tx actions for pending messages without txid', () => {
    expect(getNativeChatMessageActions(message({ status: 'pending', txId: undefined })).map((item) => item.id)).toEqual([
      'copy-text',
      'quote',
      'buzz',
      'translate',
    ]);
  });

  it('does not expose red packet or MRC20 actions', () => {
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('mrc20'))).toBe(false);
    expect(getNativeChatMessageActions(message({})).some((item) => item.id.includes('red'))).toBe(false);
  });
});
```

- [ ] **Step 2: Implement action helper**

Create `src/chat-native/ui/messageActions.ts`:

```ts
import type { NativeChatMessage } from '../domain/types';

export type NativeChatMessageActionId =
  | 'copy-text'
  | 'copy-txid'
  | 'open-tx'
  | 'quote'
  | 'buzz'
  | 'translate';

export type NativeChatMessageAction = {
  id: NativeChatMessageActionId;
  label: string;
};

export function getNativeChatMessageActions(message: NativeChatMessage): NativeChatMessageAction[] {
  const actions: NativeChatMessageAction[] = [];

  if (message.kind === 'text' && message.content) {
    actions.push({ id: 'copy-text', label: 'Copy text' });
  }

  if (message.txId || message.pinId) {
    actions.push({ id: 'copy-txid', label: 'Copy txid' });
    actions.push({ id: 'open-tx', label: 'Open tx' });
  }

  actions.push({ id: 'quote', label: 'Quote' });

  if (message.protocol.includes('simplegroupchat') || message.protocol.includes('simplefilegroupchat')) {
    actions.push({ id: 'buzz', label: 'Buzz' });
  }

  if (message.kind === 'text') {
    actions.push({ id: 'translate', label: 'Translate' });
  }

  return actions;
}
```

- [ ] **Step 3: Run action tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui/__tests__/messageActions.test.ts
```

Expected: PASS.

- [ ] **Step 4: Create MessageActionSheet**

Create `src/chat-native/components/MessageActionSheet.tsx` with:

- visible prop
- message row view model
- actions from `getNativeChatMessageActions`
- full txid display when present
- buttons for each action
- close button/backdrop
- `expo-clipboard` for copy actions
- `Linking.openURL` for tx explorer action using `getNativeChatTxExplorerUrl`

Quote, Buzz, and Translate may call optional callbacks. If no callback is supplied, close the sheet without claiming success.

- [ ] **Step 5: Wire long press**

Modify `MessageBubble.tsx`:

- wrap the bubble in `Pressable`
- call `onLongPress(message.raw)` or `onOpenActions(message.raw)` from props
- add accessibility label for opening actions

Modify `NativeChatRoomPage.tsx`:

- hold `selectedMessage` state
- render `MessageActionSheet`
- pass action opener through `MessageList` to `MessageBubble`

- [ ] **Step 6: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/ui
```

Expected: PASS.

- [ ] **Step 7: Commit and buzz**

```bash
git add src/chat-native/components/MessageActionSheet.tsx src/chat-native/components/MessageBubble.tsx src/chat-native/components/MessageList.tsx src/chat-native/screens/NativeChatRoomPage.tsx src/chat-native/ui/messageActions.ts src/chat-native/ui/__tests__/messageActions.test.ts
git commit -m "feat: add native chat message action sheet"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 8: Room Header, Composer Density, And Image Preview Polish

**Files:**
- Modify: `src/chat-native/screens/NativeChatRoomPage.tsx`
- Modify: `src/chat-native/components/ChatComposer.tsx`
- Modify: `src/chat-native/components/ImageMessage.tsx`

- [ ] **Step 1: Polish room header**

Modify `NativeChatRoomPage.tsx` header so it shows:

- compact back icon
- channel avatar using `ChatAvatar`
- title
- subtitle:
  - group: `Group chat` or member count if available in `serverData`
  - private: `Private chat` or profile/online state if available
- info icon button

Keep header title 17 pt and subtitle 12 pt.

- [ ] **Step 2: Replace oversized composer text buttons**

Modify `ChatComposer.tsx`:

- use icon buttons for image and send
- keep accessibility labels `Pick image`, `Send message`, `Insert emoji`
- keep draft restoration on send failure
- keep input height compact
- keep emoji entry visible but not tall

Do not use wide text buttons for final UI.

- [ ] **Step 3: Polish image messages**

Modify `ImageMessage.tsx` so image bubbles:

- have stable max width and aspect ratio
- show loading or placeholder state
- do not stretch layout
- can be tapped for preview if existing preview support is available

- [ ] **Step 4: Run focused tests**

Run:

```bash
yarn test:chat-native src/chat-native/components/__tests__/ImageMessage.test.tsx src/chat-native/ui
```

Expected: PASS.

- [ ] **Step 5: Commit and buzz**

```bash
git add src/chat-native/screens/NativeChatRoomPage.tsx src/chat-native/components/ChatComposer.tsx src/chat-native/components/ImageMessage.tsx
git commit -m "feat: polish native chat room controls"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 9: New-User Join Prompt And Empty State

**Files:**
- Create: `src/chat-native/components/NewUserJoinPrompt.tsx`
- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/dev/nativeChatUiMockScenario.ts`
- Create: `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`

- [ ] **Step 1: Create new-user prompt component**

Create `src/chat-native/components/NewUserJoinPrompt.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ChatAvatar from './ChatAvatar';
import { nativeChatTheme } from '../ui/chatTheme';

type NewUserJoinPromptProps = {
  onJoinGroup?: () => void;
  onExplore?: () => void;
};

export default function NewUserJoinPrompt({ onJoinGroup, onExplore }: NewUserJoinPromptProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}><Text style={styles.logoText}>ID</Text></View>
      <Text style={styles.title}>Join the official group</Text>
      <Text style={styles.body}>Start in the public IDChat room and verify native chat immediately.</Text>
      <View style={styles.groupBox}>
        <ChatAvatar name="MetaWeb Builders" size={42} />
        <View style={styles.groupText}>
          <Text style={styles.groupTitle}>MetaWeb Builders</Text>
          <Text style={styles.groupMeta}>Public group - recommended</Text>
        </View>
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={onJoinGroup} style={styles.primaryButton}>
        <Text style={styles.primaryText}>Join group</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onExplore} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Explore chats first</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  groupBox: {
    alignItems: 'center',
    borderColor: nativeChatTheme.color.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: 24,
    padding: 14,
    width: '100%',
  },
  groupMeta: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  groupText: {
    marginLeft: 10,
  },
  groupTitle: {
    color: nativeChatTheme.color.text,
    fontSize: 15,
    fontWeight: '700',
  },
  logo: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.avatarFallback,
    borderRadius: 22,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
    width: '100%',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  secondaryText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Render prompt for empty chat list**

Modify `ConversationList.tsx` so `ListEmptyComponent` renders `NewUserJoinPrompt`, not only `No chats yet`.

- [ ] **Step 3: Add UI-rich mock scenario**

Create `src/chat-native/dev/nativeChatUiMockScenario.ts` exporting:

- one private chat
- two group chats
- one image last message
- unread count
- mention count through `serverData.unreadMentionCount`
- incoming and outgoing messages with avatars, names, chain, txId, and image message
- pending outgoing message
- failed outgoing message

- [ ] **Step 4: Add mock scenario tests**

Create `src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts`:

```ts
import { nativeChatUiMockChannels, nativeChatUiMockMessages } from '../nativeChatUiMockScenario';

describe('nativeChatUiMockScenario', () => {
  it('contains mixed private and group channels', () => {
    expect(nativeChatUiMockChannels.some((channel) => channel.type === 'private')).toBe(true);
    expect(nativeChatUiMockChannels.some((channel) => channel.type === 'group')).toBe(true);
  });

  it('contains UI states needed for screenshot validation', () => {
    const messages = nativeChatUiMockMessages;
    expect(messages.some((message) => message.senderAvatar && message.senderGlobalMetaId === 'self')).toBe(true);
    expect(messages.some((message) => message.senderAvatar && message.senderGlobalMetaId !== 'self')).toBe(true);
    expect(messages.some((message) => message.kind === 'image')).toBe(true);
    expect(messages.some((message) => message.status === 'pending')).toBe(true);
    expect(messages.some((message) => message.status === 'failed')).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts src/chat-native/ui
```

Expected: PASS.

- [ ] **Step 6: Commit and buzz**

```bash
git add src/chat-native/components/NewUserJoinPrompt.tsx src/chat-native/components/ConversationList.tsx src/chat-native/dev/nativeChatUiMockScenario.ts src/chat-native/dev/__tests__/nativeChatUiMockScenario.test.ts
git commit -m "feat: add native chat onboarding empty state"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 10: Mock Scenario Navigation And Screenshot Runbook

**Files:**
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Modify: `src/chat-native/dev/nativeChatMockScenario.ts`
- Modify: `docs/superpowers/qa/native-idchat-simulator-runbook.md`
- Create: `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`

- [ ] **Step 1: Wire UI mock data into dev scenario**

Modify `nativeChatMockScenario.ts` or `NativeChatHomePage.tsx` so `route.params.mockScenario === 'ui-parity'` seeds the UI-rich scenario from `nativeChatUiMockScenario.ts`.

The route must show:

- mixed list
- group room
- private room
- image message
- outgoing avatar
- metadata footer
- action sheet
- new-user prompt when seeded with empty list

- [ ] **Step 2: Add UI parity runbook**

Create `docs/superpowers/qa/native-idchat-ui-parity-runbook.md` with these sections:

```md
# Native IDChat UI Parity QA Runbook

## Purpose

Validate that the native IDChat UI matches the 2026-06-09 UI parity spec and is polished in the running iOS app, not only in static design artifacts.

## Start iOS

```bash
npx expo run:ios
```

If the simulator is already booted and Metro is running, use the existing app session.

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

## Evidence

Save screenshots under a local evidence folder such as:

`docs/superpowers/qa/evidence/native-idchat-ui-parity-YYYYMMDD/`

Do not commit screenshots unless the user asks.
```

- [ ] **Step 3: Update simulator runbook**

Modify `docs/superpowers/qa/native-idchat-simulator-runbook.md` to reference the new UI parity runbook and clarify that UI polish is a release gate.

- [ ] **Step 4: Run tests**

Run:

```bash
yarn test:chat-native src/chat-native/dev src/chat-native/ui src/chat-native/components
```

Expected: PASS for all focused native chat tests.

- [ ] **Step 5: Commit and buzz**

```bash
git add src/chat-native/screens/NativeChatHomePage.tsx src/chat-native/dev/nativeChatMockScenario.ts docs/superpowers/qa/native-idchat-simulator-runbook.md docs/superpowers/qa/native-idchat-ui-parity-runbook.md
git commit -m "docs: add native chat UI parity QA runbook"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 11: iOS Simulator Polish Pass

**Files:**
- Modify only files needed based on screenshot findings, usually:
  - `src/chat-native/components/ConversationList.tsx`
  - `src/chat-native/components/MessageBubble.tsx`
  - `src/chat-native/components/ChatComposer.tsx`
  - `src/chat-native/components/MessageActionSheet.tsx`
  - `src/chat-native/screens/NativeChatHomePage.tsx`
  - `src/chat-native/screens/NativeChatRoomPage.tsx`
  - `src/chat-native/ui/chatTheme.ts`

- [ ] **Step 1: Start iOS app**

Run:

```bash
npx expo run:ios
```

Expected: app builds and launches in iOS Simulator. If the build fails because of unrelated native/iOS setup, record the exact error and use the existing working simulator/dev-server path if available.

- [ ] **Step 2: Navigate to native chat UI mock scenario**

Use the app route or dev entry that opens `NativeChatHomePage` with `mockScenario: 'ui-parity'`.

If no UI route is available from the app shell, temporarily add a dev-only entry point behind `__DEV__` and commit it only if it is safe and clearly scoped.

- [ ] **Step 3: Capture screenshots**

Capture screenshots for:

- chat list
- group room
- private room
- action sheet
- composer with emoji
- image message
- new-user prompt

Save screenshots locally under:

```bash
mkdir -p docs/superpowers/qa/evidence/native-idchat-ui-parity-$(date +%Y%m%d)
```

Do not commit screenshots unless the user asks.

- [ ] **Step 4: Polish code from screenshot evidence**

Adjust only the visual issues visible in screenshots:

- oversized text
- oversized buttons
- cramped or overlapping metadata
- missing avatar
- wrong bottom tab count
- chat list density
- composer keyboard/safe-area spacing
- action sheet density

- [ ] **Step 5: Re-run tests**

Run:

```bash
yarn test:chat-native
```

Expected: PASS.

- [ ] **Step 6: Re-run iOS screenshots**

Repeat screenshots for any screen changed in Step 4. Confirm issues are resolved.

- [ ] **Step 7: Commit and buzz**

```bash
git add src/chat-native
git commit -m "fix: polish native IDChat UI density"
```

Only stage the files changed in this task. Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Task 12: Live Backend Smoke Regression

**Files:**
- Modify: `docs/superpowers/qa/native-idchat-ui-parity-runbook.md`
- Modify code only if the smoke test exposes a UI regression caused by this plan.

- [ ] **Step 1: Run native chat focused tests**

Run:

```bash
yarn test:chat-native
```

Expected: PASS.

- [ ] **Step 2: Run iOS app against live backend**

Use the available QA/new-user flow. The user previously said a new account can be created and the app has a prompt to join a group. If old-user mnemonic is required for private-chat smoke, ask the user only at this stage.

Verify:

- IDChat opens native UI, not the old IDChat WebView.
- Conversation list loads.
- Public/recommended group can be opened or joined.
- Group text send works.
- Group emoji text send works.
- Group image send works.
- Private chat opens if a contact is available.
- Private text send works if QA contact is available.
- Message actions show tx/copy where sent messages have txid.

- [ ] **Step 3: Record results**

Update `docs/superpowers/qa/native-idchat-ui-parity-runbook.md` with:

- date
- simulator/device
- account type: new user or old QA user
- flows passed
- flows blocked
- exact blocker text for any failed live flow

- [ ] **Step 4: Commit runbook update**

```bash
git add docs/superpowers/qa/native-idchat-ui-parity-runbook.md
git commit -m "docs: record native IDChat UI parity smoke"
```

Then post a Lisa Hahn buzz for the commit. If buzz fails once, skip.

## Final Verification

Before claiming completion:

```bash
yarn test:chat-native
```

Also run the iOS simulator flow and capture screenshots listed in the runbook.

If TypeScript full-project validation is requested, run:

```bash
npx tsc --noEmit
```

Known caveat from prior work: full-project `tsc --noEmit` may fail on unrelated pre-existing errors outside `src/chat-native`. If that happens, document the exact unrelated errors and keep `yarn test:chat-native` plus simulator verification as the focused gate for this UI parity plan.

## Execution Handoff

Recommended execution mode:

1. Subagent-driven development.
2. One fresh subagent per task.
3. Parent agent reviews changed files and test output after every task.
4. Commit each completed task.
5. Attempt Lisa Hahn buzz after each commit; skip after one failure.

The next section can start with this prompt:

```text
Continue Native IDChat UI parity in /Users/tusm/Documents/MetaID_Projects/IDChat-APP on main.

Read and follow:
- docs/superpowers/specs/2026-06-09-native-idchat-ui-parity-design.md
- docs/superpowers/plans/2026-06-09-native-idchat-ui-parity.md
- generated/native-idchat-design-v2.png
- docs/superpowers/specs/2026-06-08-native-idchat-migration-design.md
- docs/superpowers/plans/2026-06-08-native-idchat-migration.md

Use IDChat web repo /Users/tusm/Documents/MetaID_Projects/idchat as the functional source of truth, especially direct-contact Item/List/Search, MessageItem, MessageMenu, TheInput, and stores/simple-talk.ts.

Use subagent-driven development. Execute tasks in the 2026-06-09 plan in order. Commit each independent task. Do not revert unrelated dirty files. After each commit, attempt Lisa Hahn buzz once and skip if it fails.

Goal: make the existing src/chat-native UI product-grade: mixed private/group list, two-tab Chats/Me shell, both-side avatars, time/txid/copy metadata, message actions, compact composer, new-user join prompt, iOS screenshot polish, and live backend smoke.
```
