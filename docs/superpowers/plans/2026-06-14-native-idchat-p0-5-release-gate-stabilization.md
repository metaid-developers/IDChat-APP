# Native IDChat P0.5 Release-Gate Stabilization Implementation Plan

> **For agentic workers:** REQUIRED EXECUTION MODE: implement this plan directly in one development session. Do **not** use `superpowers:subagent-driven-development` for this plan. Use checkbox (`- [ ]`) syntax for tracking, complete tasks in order, and stop before expanding scope.

**Goal:** Convert the current Native IDChat P0 partial result into a verifiable release-gate result by stabilizing the iOS dev-client flow, adding minimal QA selectors/mock discovery support, and capturing the missing Search/Me/Back-to-Chats evidence.

**Architecture:** Do not rework the P0 chat implementation. Keep Phase 1-4 code behavior intact, add only small QA-facing selectors and dev/mock fixtures needed to make the existing behavior verifiable, then run the iOS simulator gate from clean official dependencies without committing generated native artifacts.

**Tech Stack:** React Native 0.79.5, Expo SDK 53, Expo dev-client, CocoaPods, Jest, TypeScript, iOS Simulator, `expo-image`.

---

## Current State

- Branch under review: `codex/native-idchat-p0-productization`.
- Existing P0 code commits:
  - `aceb00e fix: contain native chat decrypt failures`
  - `6d8e0d0 fix: hydrate native chat avatars`
  - `9d82b4e fix: harden native chat shell interactions`
  - `cb43849 fix: productize native chat me screen`
  - `be74169 docs: document native chat p0 qa flow`
  - `1a05e52 docs: update native chat p0 simulator evidence`
- Current result: P0 is still **not accepted**. `ExpoImage` native-module integration was proved buildable, and one Chats screenshot exists, but Search/Me/Back-to-Chats simulator evidence is missing.
- Known verification issue to fix first: `git diff --check main...HEAD` fails on trailing whitespace in committed raw evidence logs under `docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs/`.

## Non-Negotiable Scope

- [ ] Do not redo Phase 1-4.
- [ ] Do not implement P1/P2 items: red packets, full group management, full composer parity, translation, Buzz sharing, Android parity, TestFlight, EAS release.
- [ ] Do not restore WebView chat as a normal fallback.
- [ ] Do not commit `node_modules/`, `ios/Pods/`, `ios/build/`, or generated `ios/Podfile.lock` unless the user explicitly changes the repo policy.
- [ ] Do not use local `node_modules/expo-image/ios` podspec or Swift hacks.
- [ ] Do not print mnemonic, private key, shared secret, QA wallet secret, or decrypted secret material in logs, docs, tests, screenshots, or buzz posts.
- [ ] For every commit, stage only files changed for that task, then post a Lisa Hahn development-journal buzz as required by `AGENTS.md`.

## File Map

Modify:

- `docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs/*.log`
  Remove trailing whitespace so historical evidence does not break `git diff --check`.
- `src/chat-native/components/ConversationList.tsx`
  Add stable `testID` selectors for search input, explicit Search button, and discovery rows.
- `src/chat-native/components/__tests__/ConversationList.test.ts`
  Verify selectors and keep the local-search/explicit-remote-search contract covered.
- `src/chat-native/screens/NativeChatHomePage.tsx`
  Add stable `testID` selectors for the home root and bottom tabs.
- `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
  Create a focused source-level test that locks these QA selectors.
- `src/chat-native/screens/NativeChatMePage.tsx`
  Add stable `testID` selectors for the Me screen and copy feedback.
- `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`
  Verify Me selectors and copy feedback.
- `src/chat-native/dev/nativeChatMockScenario.ts`
  Add dev-only mock discovery results so explicit Search has visible simulator evidence in `ui-parity`.
- `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`
  Verify mock discovery and profile lookup.
- `scripts/qa/native-idchat-p0-5-open-dev-client.sh`
  Create a small simulator launch helper that opens the Expo dev-client URL with timeout and captures a diagnostic screenshot.
- `docs/superpowers/qa/native-idchat-simulator-runbook.md`
  Document the P0.5 evidence flow and the new helper.
- `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/`
  Create the new evidence folder during simulator acceptance.

## Task 0: Preflight And Boundary Check

**Files:** none

- [ ] **Step 1: Read the governing docs**

  Read:

  ```bash
  sed -n '1,220p' AGENTS.md
  sed -n '1,220p' docs/superpowers/specs/2026-06-13-native-idchat-p0-productization-spec.md
  sed -n '1,220p' docs/superpowers/plans/2026-06-13-native-idchat-p0-productization.md
  sed -n '1,220p' docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/README.md
  ```

- [ ] **Step 2: Record current repo state**

  Run:

  ```bash
  git status --short --branch
  git log --oneline --decorate --max-count=12
  ```

  Expected:

  - branch is `codex/native-idchat-p0-productization`;
  - top commit is `1a05e52 docs: update native chat p0 simulator evidence`, unless a supervisor has already advanced the branch;
  - there may be unrelated dirty files and untracked `ios/`; do not stage or revert them.

- [ ] **Step 3: Confirm the known diff-check failure before fixing it**

  Run:

  ```bash
  git diff --check main...HEAD
  ```

  Expected before Task 1: FAIL on trailing whitespace in evidence logs. If it already passes, record that in the final summary and still continue with Task 2.

## Task 1: Sanitize Historical Evidence Logs

**Files:**

- Modify: `docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs/phase5-expo-run-ios-20260613.log`
- Modify: `docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs/phase5-pod-update-webpcoder-20260613.log`
- Possibly modify other `*.log` files in the same evidence folder if `git diff --check` reports trailing whitespace there.

- [ ] **Step 1: Remove trailing spaces and tabs from committed P0 evidence logs**

  Run:

  ```bash
  perl -0pi -e 's/[ \t]+\n/\n/g' docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs/*.log
  ```

- [ ] **Step 2: Verify the fix**

  Run:

  ```bash
  git diff --check main...HEAD
  git diff --check
  ```

  Expected: both commands exit 0 with no output.

- [ ] **Step 3: Commit only sanitized log files**

  Run:

  ```bash
  git status --short docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs
  git add docs/superpowers/qa/evidence/native-idchat-p0-productization-20260613/logs
  git commit -m "docs: sanitize native chat p0 evidence logs"
  ```

- [ ] **Step 4: Post Lisa Hahn buzz**

  Post a development-journal buzz stating that this commit only removes trailing whitespace from historical evidence logs and fixes `git diff --check main...HEAD`.

## Task 2: Add Stable P0.5 QA Selectors

**Files:**

- Modify: `src/chat-native/components/ConversationList.tsx`
- Modify: `src/chat-native/components/__tests__/ConversationList.test.ts`
- Modify: `src/chat-native/screens/NativeChatHomePage.tsx`
- Create: `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`
- Modify: `src/chat-native/screens/NativeChatMePage.tsx`
- Modify: `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`

- [ ] **Step 1: Add selectors to `ConversationList.tsx`**

  Add `testID="native-chat-search-input"` to the `TextInput` that already has `accessibilityLabel="Search chats"`:

  ```tsx
  <TextInput
    accessibilityLabel="Search chats"
    onChangeText={handleSearchQueryChange}
    onSubmitEditing={submitRemoteSearch}
    placeholder="Search chats, groups, MetaID"
    placeholderTextColor={nativeChatTheme.color.faintText}
    returnKeyType="search"
    style={styles.searchInput}
    testID="native-chat-search-input"
    value={searchQuery}
  />
  ```

  Add `testID="native-chat-remote-search-button"` to the explicit remote Search `Pressable`:

  ```tsx
  <Pressable
    accessibilityLabel={`Search IDChat for ${normalizedSearchQuery}`}
    accessibilityRole="button"
    onPress={submitRemoteSearch}
    style={styles.remoteSearchButton}
    testID="native-chat-remote-search-button"
  >
    <Text style={styles.remoteSearchText}>Search</Text>
  </Pressable>
  ```

  Inside `renderDiscoveryResult`, define a stable discovery row ID:

  ```tsx
  const discoveryTestID = `native-chat-discovery-result-${result.type}-${result.id}`;
  ```

  Add that `testID` to both the disabled `View` and enabled `Pressable` discovery row:

  ```tsx
  <View
    key={`${result.type}:${result.id}`}
    style={[styles.discoveryRow, styles.discoveryRowDisabled]}
    testID={discoveryTestID}
  >
    {content}
  </View>
  ```

  ```tsx
  <Pressable
    accessibilityLabel={`Open discovery result ${result.title}`}
    accessibilityRole="button"
    key={`${result.type}:${result.id}`}
    onPress={() => onOpenDiscoveryResult(result)}
    style={styles.discoveryRow}
    testID={discoveryTestID}
  >
    {content}
  </Pressable>
  ```

- [ ] **Step 2: Extend `ConversationList` tests**

  In `src/chat-native/components/__tests__/ConversationList.test.ts`, add this test:

  ```tsx
  it('exposes stable simulator selectors for search and discovery rows', () => {
    const onSearchRemote = jest.fn();
    const discoveryResult: NativeChatDiscoveryResult = {
      id: 'qa-discovery-peer',
      type: 'private',
      title: 'Discovery Peer',
      subtitle: 'qa-discovery-peer',
    };
    let renderer!: TestRenderer.ReactTestRenderer;

    renderer = renderConversationList({
      channels: [createChannel()],
      discoveryResults: [discoveryResult],
      onOpenChannel: jest.fn(),
      onOpenDiscoveryResult: jest.fn(),
      onSearchRemote,
    });

    const searchInput = renderer.root.findByProps({ testID: 'native-chat-search-input' });

    expect(searchInput.props.accessibilityLabel).toBe('Search chats');

    act(() => {
      searchInput.props.onChangeText('discovery');
    });

    expect(renderer.root.findByProps({ testID: 'native-chat-remote-search-button' })).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'native-chat-discovery-result-private-qa-discovery-peer' }),
    ).toBeTruthy();
  });
  ```

- [ ] **Step 3: Add selectors to `NativeChatHomePage.tsx`**

  Add `testID="native-chat-home-screen"` to the root `SafeAreaView`:

  ```tsx
  <SafeAreaView style={styles.container} testID="native-chat-home-screen">
  ```

  Add `testID="native-chat-header-subtitle"` to the header subtitle text:

  ```tsx
  <Text style={styles.headerSubtitle} testID="native-chat-header-subtitle">
    {activeTab === 'chats' ? 'Chats' : 'Me'}
  </Text>
  ```

  Add test IDs to the tab buttons:

  ```tsx
  <Pressable
    accessibilityLabel="Chats tab"
    accessibilityRole="tab"
    accessibilityState={{ selected: activeTab === 'chats' }}
    onPress={() => setActiveTab('chats')}
    style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
    testID="native-chat-tab-chats"
  >
  ```

  ```tsx
  <Pressable
    accessibilityLabel="Me tab"
    accessibilityRole="tab"
    accessibilityState={{ selected: activeTab === 'me' }}
    onPress={() => setActiveTab('me')}
    style={[styles.tabButton, activeTab === 'me' && styles.tabButtonActive]}
    testID="native-chat-tab-me"
  >
  ```

- [ ] **Step 4: Create a focused rendered home selector test**

  Create `src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx`:

  ```tsx
  import { afterEach, describe, expect, it, jest } from '@jest/globals';
  import React from 'react';
  import TestRenderer, { act } from 'react-test-renderer';
  import { NATIVE_CHAT_MOCK_SCENARIO } from '../../dev/nativeChatMockScenario';
  import NativeChatHomePage from '../NativeChatHomePage';

  jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(() => Promise.resolve()),
  }));

  describe('NativeChatHomePage QA selectors', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    afterEach(() => {
      act(() => {
        renderer?.unmount();
      });
      renderer = undefined;
    });

    it('renders stable selectors for the P0.5 simulator release gate', async () => {
      await act(async () => {
        renderer = TestRenderer.create(
          <NativeChatHomePage route={{ params: { mockScenario: NATIVE_CHAT_MOCK_SCENARIO.UI_PARITY } }} />,
        );
      });

      expect(renderer!.root.findByProps({ testID: 'native-chat-home-screen' })).toBeTruthy();
      expect(renderer!.root.findByProps({ testID: 'native-chat-header-subtitle' }).props.children).toBe('Chats');
      expect(renderer!.root.findByProps({ testID: 'native-chat-tab-chats' })).toBeTruthy();

      act(() => {
        renderer!.root.findByProps({ testID: 'native-chat-tab-me' }).props.onPress();
      });

      expect(renderer!.root.findByProps({ testID: 'native-chat-header-subtitle' }).props.children).toBe('Me');
      expect(renderer!.root.findByProps({ testID: 'native-chat-me-screen' })).toBeTruthy();
    });
  });
  ```

- [ ] **Step 5: Add selectors to `NativeChatMePage.tsx`**

  Add `testID="native-chat-me-screen"` to the root `ScrollView` and `testID="native-chat-copy-feedback"` to the copy feedback text:

  ```tsx
  <ScrollView
    contentContainerStyle={styles.content}
    contentInsetAdjustmentBehavior="automatic"
    style={styles.container}
    testID="native-chat-me-screen"
  >
  ```

  ```tsx
  {copiedLabel ? (
    <Text style={styles.copyFeedback} testID="native-chat-copy-feedback">
      {`Copied ${copiedLabel}`}
    </Text>
  ) : null}
  ```

- [ ] **Step 6: Extend `NativeChatMePage` tests**

  In `src/chat-native/screens/__tests__/NativeChatMePage.test.tsx`, add these expectations to the existing `renders account data from the native chat store and shows copy feedback` test after rendering and copying:

  ```tsx
  expect(renderer!.root.findByProps({ testID: 'native-chat-me-screen' })).toBeTruthy();
  expect(renderer!.root.findByProps({ testID: 'native-chat-copy-feedback' }).props.children).toBe(
    'Copied Global MetaID',
  );
  ```

- [ ] **Step 7: Run focused tests**

  Run:

  ```bash
  yarn jest --runInBand \
    src/chat-native/components/__tests__/ConversationList.test.ts \
    src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx \
    src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
  ```

  Expected: all listed suites pass.

- [ ] **Step 8: Commit QA selectors**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/components/ConversationList.tsx \
    src/chat-native/components/__tests__/ConversationList.test.ts \
    src/chat-native/screens/NativeChatHomePage.tsx \
    src/chat-native/screens/__tests__/NativeChatHomePageQaSelectors.test.tsx \
    src/chat-native/screens/NativeChatMePage.tsx \
    src/chat-native/screens/__tests__/NativeChatMePage.test.tsx
  git commit -m "fix: add native chat p0 qa selectors"
  ```

- [ ] **Step 9: Post Lisa Hahn buzz**

  Post a development-journal buzz describing the QA selectors and focused test results.

## Task 3: Add Dev-Only Mock Discovery Evidence Data

**Files:**

- Modify: `src/chat-native/dev/nativeChatMockScenario.ts`
- Modify: `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`

- [ ] **Step 1: Extend the mock API client type**

  In `src/chat-native/dev/nativeChatMockScenario.ts`, extend `MockChatApiClient` so it includes discovery/profile methods:

  ```ts
  type MockChatApiClient = Pick<
    NativeChatApiClient,
    'getLatestChatInfoList' | 'getGroupMessagesByIndex' | 'getChannelMessagesByIndex' | 'getPrivateMessagesByIndex'
  > &
    Pick<NativeChatApiClient, 'getGroupMessages' | 'getChannelMessages' | 'getPrivateMessages'> &
    Pick<NativeChatApiClient, 'searchGroupsAndUsers' | 'getOnlineUsers' | 'getUserInfoByGlobalMetaId'>;
  ```

- [ ] **Step 2: Add deterministic mock discovery records**

  Add these constants near the other mock constants:

  ```ts
  const MOCK_DISCOVERY_PUBLIC_KEY = `04${'1'.repeat(128)}`;

  const mockDiscoveryRecords = [
    {
      type: 'user',
      globalMetaId: 'qa-discovery-peer',
      name: 'Discovery Peer',
      avatar: 'https://www.idchat.io/logo.png',
      chatPublicKey: MOCK_DISCOVERY_PUBLIC_KEY,
    },
    {
      type: 'group',
      groupId: 'qa-discovery-group',
      roomName: 'Discovery Group',
      memberCount: 12,
      groupAvatar: 'https://www.idchat.io/logo.png',
    },
  ];

  function matchesMockDiscoveryQuery(record: Record<string, unknown>, query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    const haystack = [
      record.globalMetaId,
      record.name,
      record.groupId,
      record.roomName,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();

    return Boolean(normalizedQuery && haystack.includes(normalizedQuery));
  }
  ```

- [ ] **Step 3: Implement mock discovery methods**

  Inside `createNativeChatMockApiClient()`, add:

  ```ts
  async searchGroupsAndUsers({ query }) {
    return {
      data: {
        list: mockDiscoveryRecords.filter((record) => matchesMockDiscoveryQuery(record, query)),
      },
    };
  },
  async getOnlineUsers() {
    return {
      data: {
        cursor: 0,
        list: [],
        onlineWindowSeconds: 0,
        size: 100,
        total: 0,
      },
    };
  },
  async getUserInfoByGlobalMetaId(globalMetaId) {
    const record = mockDiscoveryRecords.find(
      (item) => item.type === 'user' && item.globalMetaId === globalMetaId,
    );

    return {
      data: record || {
        globalMetaId,
        name: globalMetaId,
        chatPublicKey: MOCK_DISCOVERY_PUBLIC_KEY,
      },
    };
  },
  ```

- [ ] **Step 4: Add mock discovery tests**

  In `src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts`, extend `provides mocked API and wallet behavior for offline simulator runs`:

  ```ts
  await expect(api.searchGroupsAndUsers({ query: 'discovery' })).resolves.toMatchObject({
    data: {
      list: expect.arrayContaining([
        expect.objectContaining({ globalMetaId: 'qa-discovery-peer', name: 'Discovery Peer' }),
        expect.objectContaining({ groupId: 'qa-discovery-group', roomName: 'Discovery Group' }),
      ]),
    },
  });
  await expect(api.getUserInfoByGlobalMetaId('qa-discovery-peer')).resolves.toMatchObject({
    data: expect.objectContaining({
      globalMetaId: 'qa-discovery-peer',
      chatPublicKey: expect.any(String),
    }),
  });
  ```

- [ ] **Step 5: Run focused tests**

  Run:

  ```bash
  yarn jest --runInBand src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts
  ```

  Expected: suite passes.

- [ ] **Step 6: Commit mock discovery fixture**

  Run:

  ```bash
  git diff --check
  git add \
    src/chat-native/dev/nativeChatMockScenario.ts \
    src/chat-native/dev/__tests__/nativeChatMockScenario.test.ts
  git commit -m "fix: add native chat mock discovery data"
  ```

- [ ] **Step 7: Post Lisa Hahn buzz**

  Post a development-journal buzz describing the dev-only mock discovery data and focused test results.

## Task 4: Add A Deterministic Dev-Client Open Helper

**Files:**

- Create: `scripts/qa/native-idchat-p0-5-open-dev-client.sh`
- Modify: `docs/superpowers/qa/native-idchat-simulator-runbook.md`

- [ ] **Step 1: Create the helper script**

  Create `scripts/qa/native-idchat-p0-5-open-dev-client.sh`:

  ```bash
  #!/usr/bin/env bash
  set -euo pipefail

  BUNDLE_ID="${NATIVE_IDCHAT_BUNDLE_ID:-com.meta.idchat}"
  METRO_URL="${NATIVE_IDCHAT_METRO_URL:-http://127.0.0.1:8081}"
  EVIDENCE_DIR="${NATIVE_IDCHAT_EVIDENCE_DIR:-docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-$(date +%Y%m%d-%H%M%S)}"
  UDID="${NATIVE_IDCHAT_SIMULATOR_UDID:-}"

  run_with_timeout() {
    local seconds="$1"
    shift
    perl -e 'alarm shift; exec @ARGV' "$seconds" "$@"
  }

  if [[ -z "$UDID" ]]; then
    UDID="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ && /iPhone/ { print $2; exit }')"
  fi

  if [[ -z "$UDID" ]]; then
    echo "No booted iPhone simulator found. Boot one with Xcode Simulator first." >&2
    exit 2
  fi

  mkdir -p "$EVIDENCE_DIR/logs"

  echo "bundle_id=$BUNDLE_ID" | tee "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  echo "udid=$UDID" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  echo "metro_url=$METRO_URL" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"

  if curl -fsS "$METRO_URL/status" > "$EVIDENCE_DIR/logs/metro-status.txt"; then
    echo "metro_status=reachable" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  else
    echo "metro_status=unreachable" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
    echo "Metro is not reachable at $METRO_URL/status" >&2
    exit 3
  fi

  encoded_url="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$METRO_URL")"
  dev_client_url="${BUNDLE_ID}://expo-development-client/?url=${encoded_url}"

  run_with_timeout 20 xcrun simctl bootstatus "$UDID" -b > "$EVIDENCE_DIR/logs/simctl-bootstatus.log" 2>&1
  run_with_timeout 20 xcrun simctl terminate "$UDID" "$BUNDLE_ID" > "$EVIDENCE_DIR/logs/simctl-terminate.log" 2>&1 || true

  if run_with_timeout 45 xcrun simctl openurl "$UDID" "$dev_client_url" > "$EVIDENCE_DIR/logs/simctl-openurl.log" 2>&1; then
    echo "openurl_status=success" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  else
    echo "openurl_status=timeout_or_failure" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  fi

  sleep 12
  xcrun simctl io "$UDID" screenshot "$EVIDENCE_DIR/00-after-dev-client-openurl.png" > "$EVIDENCE_DIR/logs/simctl-screenshot.log" 2>&1
  echo "screenshot=$EVIDENCE_DIR/00-after-dev-client-openurl.png" | tee -a "$EVIDENCE_DIR/logs/dev-client-open-summary.txt"
  ```

- [ ] **Step 2: Make it executable and syntax-check it**

  Run:

  ```bash
  chmod +x scripts/qa/native-idchat-p0-5-open-dev-client.sh
  bash -n scripts/qa/native-idchat-p0-5-open-dev-client.sh
  ```

  Expected: `bash -n` exits 0.

- [ ] **Step 3: Update the simulator runbook**

  In `docs/superpowers/qa/native-idchat-simulator-runbook.md`, add a subsection under `P0 Productization Dev-Client Gate` named `P0.5 stabilized open flow` with this content:

  ````markdown
  ### P0.5 stabilized open flow

  For the P0.5 release-gate pass, start Metro before opening the dev client:

  ```bash
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx expo start --dev-client --host localhost --port 8081 --clear
  ```

  In a second terminal, build or reinstall the dev client without starting a second bundler:

  ```bash
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler
  ```

  Then open the Expo dev-client URL through the helper:

  ```bash
  NATIVE_IDCHAT_SIMULATOR_UDID="$NATIVE_IDCHAT_SIMULATOR_UDID" \
  NATIVE_IDCHAT_EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614" \
  scripts/qa/native-idchat-p0-5-open-dev-client.sh
  ```

  If the helper reports `openurl_status=timeout_or_failure`, do not mark P0.5 complete until the Simulator UI still proves the app loaded the Metro bundle and all required screenshots were captured.
  ````

- [ ] **Step 4: Run focused verification**

  Run:

  ```bash
  bash -n scripts/qa/native-idchat-p0-5-open-dev-client.sh
  git diff --check
  ```

  Expected: both commands pass.

- [ ] **Step 5: Commit runbook and helper**

  Run:

  ```bash
  git add scripts/qa/native-idchat-p0-5-open-dev-client.sh docs/superpowers/qa/native-idchat-simulator-runbook.md
  git commit -m "docs: document native chat p0.5 launch flow"
  ```

- [ ] **Step 6: Post Lisa Hahn buzz**

  Post a development-journal buzz describing the launch helper, runbook update, and `bash -n` verification.

## Task 5: Capture P0.5 Release-Gate Evidence

**Files:**

- Create: `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/README.md`
- Create: `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/*.png`
- Create: `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/logs/*.log`

- [ ] **Step 1: Prepare the evidence directory**

  Run:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614"
  mkdir -p "$EVIDENCE_DIR/logs"
  git diff -- node_modules/expo-image/ios/ExpoImage.podspec node_modules/expo-image/ios/ImageModule.swift \
    > "$EVIDENCE_DIR/logs/node-modules-expo-image-diff.txt"
  git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock \
    > "$EVIDENCE_DIR/logs/forbidden-artifact-branch-diff.txt"
  git status --short --branch > "$EVIDENCE_DIR/logs/git-status-before-simulator.txt"
  ```

  Expected:

  - `node-modules-expo-image-diff.txt` is empty.
  - `forbidden-artifact-branch-diff.txt` is empty. If it is not empty, stop and ask for supervisor guidance before continuing.
  - `git-status-before-simulator.txt` may show unrelated dirty files and untracked `ios/`; do not stage those.

- [ ] **Step 2: Confirm simulator UDID**

  Run:

  ```bash
  xcrun simctl list devices available | tee "$EVIDENCE_DIR/logs/simctl-devices.txt"
  ```

  Choose a bootable iPhone simulator and export the real UDID, for example:

  ```bash
  export NATIVE_IDCHAT_SIMULATOR_UDID="CF3620CF-4769-486E-847B-911C96172049"
  ```

  Use `CF3620CF-4769-486E-847B-911C96172049` only if `simctl` still lists it as available. Otherwise use the UDID printed for another bootable iPhone simulator.

- [ ] **Step 3: Start Metro in terminal A**

  Run in a dedicated terminal and keep it running:

  ```bash
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx expo start --dev-client --host localhost --port 8081 --clear 2>&1 | tee "$EVIDENCE_DIR/logs/metro.log"
  ```

  Expected: Metro reaches a waiting/bundling state and serves `http://127.0.0.1:8081/status`.

- [ ] **Step 4: Rebuild or reinstall the dev client in terminal B**

  If CocoaPods reports the `SDWebImageWebPCoder 0.15.0` snapshot conflict, run the official update path:

  ```bash
  (cd ios && pod update SDWebImageWebPCoder --repo-update) 2>&1 | tee "$EVIDENCE_DIR/logs/pod-update-webpcoder.log"
  ```

  Then build/install:

  ```bash
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler 2>&1 | tee "$EVIDENCE_DIR/logs/expo-run-ios.log"
  ```

  Expected:

  - Xcode build succeeds.
  - `ExpoImage` native module is compiled into the dev client.
  - If `simctl openurl` times out after successful build/install, continue with the helper instead of treating build as failed.

- [ ] **Step 5: Open the dev-client URL with the helper**

  Run:

  ```bash
  NATIVE_IDCHAT_SIMULATOR_UDID="$NATIVE_IDCHAT_SIMULATOR_UDID" \
  NATIVE_IDCHAT_EVIDENCE_DIR="$EVIDENCE_DIR" \
  scripts/qa/native-idchat-p0-5-open-dev-client.sh
  ```

  Expected:

  - `logs/dev-client-open-summary.txt` is created.
  - `00-after-dev-client-openurl.png` is created.
  - If the helper times out but the UI loads the app, record that accurately in README and continue only if all required screenshots can still be captured.

- [ ] **Step 6: Capture required UI screenshots**

  Use Computer Use, Simulator screenshots, or another explicit UI automation method. Save these exact files:

  ```text
  docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/01-chats-initial.png
  docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/02-search-local-filter.png
  docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/03-explicit-remote-discovery.png
  docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/04-me-copy-feedback.png
  docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/05-back-to-chats-containment.png
  ```

  Required visible assertions:

  - `01-chats-initial.png`: Native Chats is the first successful screen; no red screen; list previews do not show `U2Fsd...` or `Unknown point format`.
  - `02-search-local-filter.png`: type a local query such as `Lisa` or `MetaWeb`; the local list filters immediately; Discovery section is not populated from remote results before pressing Search.
  - `03-explicit-remote-discovery.png`: press the explicit Search button; Discovery section shows mock discovery results such as `Discovery Peer` or `Discovery Group`.
  - `04-me-copy-feedback.png`: switch to Me; copy Global MetaID or MVC address; visible feedback says `Copied Global MetaID` or `Copied MVC address`; there is no `Native settings` placeholder.
  - `05-back-to-chats-containment.png`: switch back to Chats; previews still do not show raw `U2Fsd...` or `Unknown point format`.

- [ ] **Step 7: Write the evidence README**

  Create `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/README.md`:

  ```markdown
  # Native IDChat P0.5 Release-Gate Evidence - 2026-06-14

  ## Result

  Release-gate simulator evidence: FAIL

  ## Commit Under Test

  - Branch: `codex/native-idchat-p0-productization`
  - Commit: output of `git rev-parse --short HEAD`

  ## Simulator

  - Simulator: exact simulator name from `xcrun simctl list devices available`
  - Runtime: exact runtime shown by `xcrun simctl list`
  - UDID: exact simulator UDID used for the run

  ## Commands

  - `git diff --check main...HEAD`
  - `git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock`
  - `yarn test:chat-native`
  - `npm exec tsc -- --noEmit --pretty false`
  - `EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity npx expo start --dev-client --host localhost --port 8081 --clear`
  - `npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler`
  - `scripts/qa/native-idchat-p0-5-open-dev-client.sh`

  ## Screenshot Evidence

  - `01-chats-initial.png`: Native Chats first screen, no red screen, no raw ciphertext/error previews.
  - `02-search-local-filter.png`: local filtering before explicit remote Search.
  - `03-explicit-remote-discovery.png`: explicit Search shows mock discovery results.
  - `04-me-copy-feedback.png`: Me copy feedback visible, no Native settings placeholder.
  - `05-back-to-chats-containment.png`: returning to Chats preserves safe previews.

  ## Dependency Boundary

  - No committed or staged `node_modules` patch.
  - No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
  - `expo-image` native integration used official Expo/CocoaPods/Xcode commands.

  ## Remaining Out Of Scope

  Red packets, full group management, full composer parity, translation, Buzz sharing, Android parity, TestFlight, and EAS release remain out of scope for P0.5.
  ```

  Replace the command-output descriptions above with real values from the run before committing the README. Change `Release-gate simulator evidence: FAIL` to `PASS` only after all required commands pass and all five screenshots prove the required visible assertions.

- [ ] **Step 8: Sanitize generated logs**

  Run:

  ```bash
  perl -0pi -e 's/[ \t]+\n/\n/g' "$EVIDENCE_DIR"/logs/*.log "$EVIDENCE_DIR"/logs/*.txt
  ```

- [ ] **Step 9: Commit evidence**

  Run:

  ```bash
  git diff --check
  git add "$EVIDENCE_DIR"
  git commit -m "docs: capture native chat p0.5 release evidence"
  ```

- [ ] **Step 10: Post Lisa Hahn buzz**

  Post a development-journal buzz with the evidence directory, screenshot list, and verification summary. Do not include secrets.

## Task 6: Final Verification And Handoff

**Files:** no new files unless Task 5 evidence README needs a correction.

- [ ] **Step 1: Run full verification**

  Run:

  ```bash
  git status --short --branch
  git log --oneline --decorate --max-count=20
  git diff --check main...HEAD
  git diff --check
  yarn test:chat-native
  npm exec tsc -- --noEmit --pretty false
  ```

  Expected:

  - no staged files;
  - `git diff --check main...HEAD` passes;
  - `git diff --check` passes;
  - `yarn test:chat-native` passes;
  - `tsc` either passes or fails only in documented pre-existing non-`src/chat-native` files.

- [ ] **Step 2: Confirm forbidden artifacts are not staged or committed**

  Run:

  ```bash
  git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock
  git status --short --ignored \
    node_modules/expo-image/ios/ExpoImage.podspec \
    node_modules/expo-image/ios/ImageModule.swift \
    ios/Podfile.lock \
    ios/Pods \
    ios/build
  ```

  Expected:

  - `git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock` prints no files; if it prints any committed branch-range artifact, P0.5 is not accepted without explicit supervisor approval;
  - no tracked diff for `node_modules/expo-image/ios/ExpoImage.podspec`;
  - no tracked diff for `node_modules/expo-image/ios/ImageModule.swift`;
  - `ios/Pods` and `ios/build` are ignored or untracked local artifacts only;
  - `ios/Podfile.lock` is not staged unless the user explicitly changed native-project versioning policy.

- [ ] **Step 3: Final response**

  Final response must include:

  - pass/fail P0.5 conclusion;
  - commit hashes created in this plan;
  - Lisa Hahn buzz pin IDs or exact buzz failures;
  - verification command results;
  - evidence README path;
  - screenshot list;
  - explicit remaining P1/P2 out-of-scope list;
  - dirty files left untouched.

## If P0.5 Still Fails

If the dev-client or Simulator remains unstable after Task 4:

- [ ] Do not claim P0.5 pass.
- [ ] Do not keep editing unrelated chat functionality.
- [ ] Commit only verified docs/evidence that accurately describe the blocker.
- [ ] Final response must say `P0.5 not accepted` and include the exact blocker:
  - Metro not reachable;
  - Xcode build failed;
  - `ExpoImage` missing;
  - `simctl openurl` timed out and UI did not load;
  - Computer Use/Simulator could not complete Search/Me evidence;
  - another exact error.

## Self-Review Checklist

- [ ] No task uses `superpowers:subagent-driven-development`.
- [ ] Each task has a narrow commit boundary.
- [ ] `git diff --check main...HEAD` is explicitly required after the prior false-positive report.
- [ ] Search and Me evidence are not accepted from Jest alone; simulator screenshots are required.
- [ ] Mock discovery changes are dev-only and do not alter the live backend path.
- [ ] The plan does not include red packet, Android, TestFlight, EAS, translation, Buzz sharing, or full group-management work.
