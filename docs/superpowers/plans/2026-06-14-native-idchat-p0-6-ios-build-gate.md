# Native IDChat P0.6 iOS Build Gate Fix Implementation Plan

> **For agentic workers:** REQUIRED EXECUTION MODE: implement this plan directly in one development session with `superpowers:executing-plans`. Do **not** use `superpowers:subagent-driven-development` unless the supervisor explicitly changes direction. Use checkbox (`- [ ]`) syntax for tracking and stop before expanding scope.

**Goal:** Make the Native IDChat iOS dev-client build pass on the current Xcode 26.5 simulator environment without committing generated native artifacts or modifying chat product behavior.

**Architecture:** Treat the P0.5 failure as an iOS build-system gate, not a chat feature failure. First align Expo SDK 53 patch dependencies to the versions Expo already recommends; only if the same `fmt` consteval error remains, add a small Expo config plugin that injects a Podfile post-install fix for the generated `fmt` pod. The final proof is build-gate evidence, not a P0.5 product PASS.

**Tech Stack:** Expo SDK 53, React Native 0.79, Expo config plugins, CocoaPods, Xcode 26.5, iOS Simulator, Jest, TypeScript.

---

## Current State

- Start branch for this plan: `codex/native-idchat-p0-5-release-gate` at the commit that contains this P0.6 plan file.
- P0.5 source baseline: `66e99ed docs: capture native chat p0.5 release evidence`; this commit must be an ancestor of the P0.6 implementation branch.
- Prior P0.5 result: `FAIL / not accepted`.
- Prior blocker: `npx expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler` reached Xcode build, then failed while compiling `ios/Pods/fmt/include/fmt/format-inl.h` with five `FMT_STRING(...)` consteval errors and `xcodebuild` exit 65.
- Prior evidence path:
  - `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/README.md`
  - `docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/logs/expo-run-ios.log`
- Local version evidence from the failed run:
  - Xcode 26.5, build 17F42.
  - Expo 53.0.22, while Expo CLI reported recommended `~53.0.27`.
  - React Native 0.79.5, while Expo CLI reported recommended `0.79.6`.

## External Technical References

- `fmt` upstream issue: `https://github.com/fmtlib/fmt/issues/4740`
  - Apple clang 21 / Xcode 26.4 rejects `FMT_STRING(...)` call sites in `format-inl.h`.
  - The reported failing line numbers match the Native IDChat P0.5 evidence.
  - Passing only a compiler `-D` flag is not reliable because `fmt/base.h` defines the macro internally.
- Expo issue: `https://github.com/expo/expo/issues/44229`
  - Expo tracks the same Xcode 26.4+ / React Native / `fmt` build-from-source failure.
  - The accepted workaround is an Expo config plugin that patches the generated iOS project during prebuild.
- Expo config plugin docs: `https://docs.expo.dev/config-plugins/introduction/`
  - Config plugins are the right place for repeatable generated native project changes in CNG/prebuild projects.

## Non-Negotiable Scope

- [ ] Do not edit chat product behavior, P0.5 QA selectors, mock discovery data, or Me/Search UI unless a test proves this plan broke them.
- [ ] Do not implement red packets, full group management, full composer parity, translation, Buzz sharing, Android, TestFlight, or EAS release work.
- [ ] Do not mark P0.5 accepted in this plan. This plan can unblock the build; P0.5 product screenshots still need their own pass unless captured explicitly in a later plan.
- [ ] Do not commit `node_modules/`, `ios/Pods/`, `ios/build/`, or generated `ios/Podfile.lock`.
- [ ] Do not hand-edit or commit generated `ios/Pods/fmt` files.
- [ ] Do not patch `node_modules/expo-image/ios` or any other package under `node_modules`.
- [ ] If the build still fails after the planned fix, commit only accurate FAIL evidence and stop.
- [ ] For every commit, stage only files changed for that task and post a Lisa Hahn development-journal buzz as required by `AGENTS.md`.

## File Map

Modify:

- `package.json`
  - Align Expo/RN patch versions to the Expo SDK 53 recommendation.
- `yarn.lock`
  - Lock the aligned package versions.
- `app.json`
  - Register the local iOS `fmt` config plugin only if version alignment alone does not fix the build.

Create if needed:

- `plugins/withIosFmtXcode26Fix.js`
  - Expo config plugin that injects an idempotent Podfile post-install snippet to patch generated `Pods/fmt/include/fmt/base.h`.
- `plugins/__tests__/withIosFmtXcode26Fix.test.js`
  - Unit tests for plugin insertion, idempotency, and failure behavior.
- `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/README.md`
  - Build-gate evidence, PASS or FAIL.
- `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/logs/*`
  - Build, environment, and verification logs.

Generated but never committed:

- `node_modules` or a `node_modules` symlink.
- `ios/`
- `ios/Pods`
- `ios/build`
- `ios/Podfile.lock`

## Task 0: Preflight And Baseline

**Files:** none

- [ ] **Step 1: Create or confirm a clean worktree**

  If the session is not already in a clean worktree that contains this P0.6 plan and has `66e99ed` as an ancestor, create one from the plan-bearing branch:

  ```bash
  git worktree add /Users/tusm/.codex/worktrees/native-idchat-p0-6/IDChat-APP \
    -b codex/native-idchat-p0-6-ios-build-gate codex/native-idchat-p0-5-release-gate
  cd /Users/tusm/.codex/worktrees/native-idchat-p0-6/IDChat-APP
  ```

  If the worktree already exists, use it only when this passes:

  ```bash
  git status --short --branch
  test -f docs/superpowers/plans/2026-06-14-native-idchat-p0-6-ios-build-gate.md
  git merge-base --is-ancestor 66e99ed HEAD
  echo "ancestor_exit=$?"
  ```

  Expected:

  - `git status --short --branch` shows no modified or untracked files.
  - The P0.6 plan file exists in the implementation worktree.
  - `ancestor_exit=0`.

- [ ] **Step 2: Read governing docs and evidence**

  Run:

  ```bash
  sed -n '1,220p' AGENTS.md
  sed -n '1,220p' docs/superpowers/plans/2026-06-14-native-idchat-p0-5-release-gate-stabilization.md
  sed -n '1,220p' docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/README.md
  sed -n '1,220p' docs/superpowers/qa/evidence/native-idchat-p0-5-release-gate-20260614/logs/xcodebuild-error-summary.txt
  ```

  Expected:

  - P0.5 evidence is `FAIL`.
  - Blocker is `fmt` consteval compile failure, not a chat UI/test failure.

- [ ] **Step 3: Record baseline git and environment**

  Run:

  ```bash
  git log --oneline --decorate --max-count=12
  git status --short --branch
  xcodebuild -version
  xcrun --version
  node --version
  yarn --version
  ```

  Expected:

  - HEAD includes `66e99ed`.
  - Worktree is clean before edits.

## Task 1: Align Expo SDK 53 Patch Versions

**Files:**

- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Prepare external dependency storage**

  This repo does not ignore `node_modules`. Use an external dependency folder and a temporary symlink so dependencies never become a commit candidate:

  ```bash
  export IDCHAT_P06_DEPS="/Users/tusm/.codex/deps/idchat-p0-6-node_modules"
  rm -rf "$IDCHAT_P06_DEPS"
  mkdir -p "$(dirname "$IDCHAT_P06_DEPS")"
  ```

- [ ] **Step 2: Align package versions**

  Run:

  ```bash
  yarn add expo@~53.0.27 react-native@0.79.6 --modules-folder "$IDCHAT_P06_DEPS"
  rm -f node_modules
  ln -s "$IDCHAT_P06_DEPS" node_modules
  ```

  Expected:

  - `package.json` changes `expo` to `~53.0.27`.
  - `package.json` changes `react-native` to `0.79.6`.
  - `yarn.lock` changes only dependency lock entries needed by this version alignment.

- [ ] **Step 3: Verify package versions**

  Run:

  ```bash
  node - <<'NODE'
  const pkg = require('./package.json');
  const expected = {
    expo: '~53.0.27',
    'react-native': '0.79.6',
  };
  for (const [name, version] of Object.entries(expected)) {
    if (pkg.dependencies[name] !== version) {
      throw new Error(`${name} expected ${version} but found ${pkg.dependencies[name]}`);
    }
  }
  console.log('Expo/RN patch versions aligned');
  NODE
  ```

  Expected: prints `Expo/RN patch versions aligned`.

- [ ] **Step 4: Run native chat tests**

  Run:

  ```bash
  yarn test:chat-native
  ```

  Expected: 41 suites pass, or the exact current count passes if unrelated test count changed.

- [ ] **Step 5: Check staged boundaries before commit**

  Run:

  ```bash
  git diff --check
  git status --short -- package.json yarn.lock node_modules ios ios/Pods ios/build ios/Podfile.lock
  ```

  Expected:

  - `git diff --check` exits 0.
  - `package.json` and `yarn.lock` are modified.
  - `node_modules` is only a local symlink or absent.
  - No `ios/`, `ios/Pods`, `ios/build`, or `ios/Podfile.lock` are staged.

- [ ] **Step 6: Commit version alignment**

  Run:

  ```bash
  git add package.json yarn.lock
  git commit -m "chore: align native build dependencies"
  ```

- [ ] **Step 7: Post Lisa Hahn buzz**

  Post a development-journal buzz with:

  - commit hash;
  - package versions before/after;
  - `yarn test:chat-native` result;
  - note that no native generated artifacts were staged.

## Task 2: Re-Test iOS Build After Version Alignment

**Files:**

- Create or update: `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/logs/version-alignment-build.log`
- Create or update: `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/logs/version-alignment-build-summary.txt`

- [ ] **Step 1: Prepare evidence directory**

  Run:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614"
  mkdir -p "$EVIDENCE_DIR/logs"
  git rev-parse --short HEAD > "$EVIDENCE_DIR/logs/version-alignment-commit.txt"
  xcodebuild -version > "$EVIDENCE_DIR/logs/xcodebuild-version.txt"
  xcrun --version > "$EVIDENCE_DIR/logs/xcrun-version.txt"
  ```

- [ ] **Step 2: Confirm simulator**

  Run:

  ```bash
  xcrun simctl list devices available | tee "$EVIDENCE_DIR/logs/simctl-devices.txt"
  export NATIVE_IDCHAT_SIMULATOR_UDID="CF3620CF-4769-486E-847B-911C96172049"
  ```

  Expected:

  - Use `CF3620CF-4769-486E-847B-911C96172049` only if it is still listed as an available iPhone simulator.
  - Otherwise export another bootable iPhone simulator UDID from the `simctl` output.

- [ ] **Step 3: Run the build without a second bundler**

  Run:

  ```bash
  rm -rf ios
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx --no-install expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler \
    2>&1 | tee "$EVIDENCE_DIR/logs/version-alignment-build.log"
  ```

- [ ] **Step 4: Branch based on the build result**

  If Step 3 passes:

  - Skip Task 3.
  - Continue to Task 4 and record that version alignment alone fixed the build gate.

  If Step 3 fails with the same `ios/Pods/fmt/include/fmt/format-inl.h` consteval errors:

  ```bash
  rg -n "format-inl.h|FMT_STRING|consteval|xcodebuild.*65|Failed to build iOS project" \
    "$EVIDENCE_DIR/logs/version-alignment-build.log" \
    > "$EVIDENCE_DIR/logs/version-alignment-build-summary.txt"
  ```

  Expected:

  - Summary shows the same `fmt` consteval failure.
  - Continue to Task 3.

  If Step 3 fails with a different error:

  - Do not implement the `fmt` plugin.
  - Write a FAIL evidence README in Task 4 with the new exact blocker.
  - Stop after final verification.

- [ ] **Step 5: Clean generated artifacts before continuing**

  Run:

  ```bash
  rm -rf ios
  git status --short --ignored ios ios/Pods ios/build ios/Podfile.lock node_modules
  ```

  Expected:

  - No generated native artifacts are staged.
  - `node_modules` remains local only.

## Task 3: Add The Xcode 26 `fmt` Config Plugin

**Files:**

- Create: `plugins/withIosFmtXcode26Fix.js`
- Create: `plugins/__tests__/withIosFmtXcode26Fix.test.js`
- Modify: `app.json`

- [ ] **Step 1: Create the plugin directory**

  Run:

  ```bash
  mkdir -p plugins/__tests__
  ```

- [ ] **Step 2: Add plugin implementation**

  Create `plugins/withIosFmtXcode26Fix.js`:

  ```js
  const { createRunOncePlugin, withPodfile } = require('expo/config-plugins');

  const GENERATED_BEGIN = '# @generated begin IDChat fmt Xcode 26 consteval fix';
  const GENERATED_END = '# @generated end IDChat fmt Xcode 26 consteval fix';

  const PATCH_SNIPPET = `    ${GENERATED_BEGIN}
      fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
      if File.exist?(fmt_base)
        content = File.read(fmt_base)
        patched = content.gsub(/^#\\s*define FMT_USE_CONSTEVAL 1$/, '#  define FMT_USE_CONSTEVAL 0')
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
      ${GENERATED_END}`;

  function addFmtXcode26Fix(contents) {
    if (contents.includes(GENERATED_BEGIN)) {
      return contents;
    }

    const primaryAnchor = '    # This is necessary for Xcode 14';
    if (contents.includes(primaryAnchor)) {
      return contents.replace(primaryAnchor, `${PATCH_SNIPPET}\n\n${primaryAnchor}`);
    }

    const fallbackAnchor = /\n\s+end\nend\s*$/;
    if (contents.includes('post_install do |installer|') && fallbackAnchor.test(contents)) {
      return contents.replace(fallbackAnchor, `\n${PATCH_SNIPPET}$&`);
    }

    throw new Error('Unable to insert IDChat fmt Xcode 26 fix into Podfile');
  }

  function withIosFmtXcode26Fix(config) {
    return withPodfile(config, (modConfig) => {
      modConfig.modResults.contents = addFmtXcode26Fix(modConfig.modResults.contents);
      return modConfig;
    });
  }

  module.exports = createRunOncePlugin(withIosFmtXcode26Fix, 'with-ios-fmt-xcode26-fix', '1.0.0');
  module.exports.addFmtXcode26Fix = addFmtXcode26Fix;
  module.exports.GENERATED_BEGIN = GENERATED_BEGIN;
  module.exports.GENERATED_END = GENERATED_END;
  ```

- [ ] **Step 3: Add plugin tests**

  Create `plugins/__tests__/withIosFmtXcode26Fix.test.js`:

  ```js
  const {
    GENERATED_BEGIN,
    GENERATED_END,
    addFmtXcode26Fix,
  } = require('../withIosFmtXcode26Fix');

  const SAMPLE_PODFILE = `target 'IDChat' do
    post_install do |installer|
      react_native_post_install(
        installer,
        config[:reactNativePath],
        :mac_catalyst_enabled => false,
      )

      # This is necessary for Xcode 14, because it signs resource bundles by default
      installer.target_installation_results.pod_target_installation_results
        .each do |pod_name, target_installation_result|
      end
    end
  end
  `;

  describe('withIosFmtXcode26Fix', () => {
    it('injects the fmt patch before the existing Xcode 14 resource-bundle block', () => {
      const result = addFmtXcode26Fix(SAMPLE_PODFILE);

      expect(result).toContain(GENERATED_BEGIN);
      expect(result).toContain(GENERATED_END);
      expect(result).toContain("fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')");
      expect(result).toContain("patched = content.gsub(/^#\\\\s*define FMT_USE_CONSTEVAL 1$/, '#  define FMT_USE_CONSTEVAL 0')");
      expect(result.indexOf(GENERATED_BEGIN)).toBeLessThan(result.indexOf('# This is necessary for Xcode 14'));
    });

    it('is idempotent', () => {
      const once = addFmtXcode26Fix(SAMPLE_PODFILE);
      const twice = addFmtXcode26Fix(once);

      expect(twice).toBe(once);
      expect(twice.match(new RegExp(GENERATED_BEGIN, 'g'))).toHaveLength(1);
    });

    it('throws when the Podfile has no post_install block', () => {
      expect(() => addFmtXcode26Fix("target 'IDChat' do\nend\n")).toThrow(
        'Unable to insert IDChat fmt Xcode 26 fix into Podfile',
      );
    });
  });
  ```

- [ ] **Step 4: Register the plugin in `app.json`**

  Add `"./plugins/withIosFmtXcode26Fix"` after `"expo-notifications"` in the `expo.plugins` array:

  ```json
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "Used to scan QR codes to quickly import wallet addresses and complete transfers."
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "The app accesses your photos to let you share them with your friends."
      }
    ],
    "expo-notifications",
    "./plugins/withIosFmtXcode26Fix"
  ]
  ```

- [ ] **Step 5: Run plugin unit tests**

  Run:

  ```bash
  yarn jest --runInBand plugins/__tests__/withIosFmtXcode26Fix.test.js
  ```

  Expected: test suite passes.

- [ ] **Step 6: Verify generated Podfile contains the plugin snippet**

  Run:

  ```bash
  EXPO_NO_GIT_STATUS=1 npx --no-install expo prebuild --platform ios --clean \
    2>&1 | tee "$EVIDENCE_DIR/logs/prebuild-with-fmt-plugin.log"
  rg -n "IDChat fmt Xcode 26 consteval fix|FMT_USE_CONSTEVAL" ios/Podfile \
    | tee "$EVIDENCE_DIR/logs/podfile-fmt-plugin-proof.txt"
  ```

  Expected:

  - `ios/Podfile` includes `IDChat fmt Xcode 26 consteval fix`.
  - `ios/Podfile` includes `FMT_USE_CONSTEVAL`.

- [ ] **Step 7: Clean generated iOS project before committing**

  Run:

  ```bash
  rm -rf ios
  git diff --check
  git status --short -- app.json plugins ios ios/Pods ios/build ios/Podfile.lock
  ```

  Expected:

  - `app.json`, `plugins/withIosFmtXcode26Fix.js`, and `plugins/__tests__/withIosFmtXcode26Fix.test.js` are modified/untracked.
  - No generated `ios/` files are staged.

- [ ] **Step 8: Commit the plugin**

  Run:

  ```bash
  git add app.json plugins/withIosFmtXcode26Fix.js plugins/__tests__/withIosFmtXcode26Fix.test.js
  git commit -m "fix: add xcode fmt build gate plugin"
  ```

- [ ] **Step 9: Post Lisa Hahn buzz**

  Post a development-journal buzz with:

  - commit hash;
  - reason for the plugin;
  - link or mention of the P0.5 `fmt` evidence path;
  - plugin test result;
  - statement that generated `ios/` and `Pods` were not committed.

## Task 4: Capture P0.6 Build-Gate Evidence

**Files:**

- Create: `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/README.md`
- Create: `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/logs/*`
- Create when the build passes: `docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614/00-after-dev-client-openurl.png`

- [ ] **Step 1: Start Metro**

  Run in a long-running terminal:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614"
  mkdir -p "$EVIDENCE_DIR/logs"
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx --no-install expo start --dev-client --host localhost --port 8081 --clear \
    2>&1 | tee "$EVIDENCE_DIR/logs/metro.log"
  ```

  Expected: Metro reaches `Waiting on http://localhost:8081`.

- [ ] **Step 2: Run iOS dev-client build/install**

  Run in a second terminal:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614"
  export NATIVE_IDCHAT_SIMULATOR_UDID="CF3620CF-4769-486E-847B-911C96172049"
  rm -rf ios
  EXPO_PUBLIC_NATIVE_IDCHAT_MOCK_SCENARIO=ui-parity \
  npx --no-install expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler \
    2>&1 | tee "$EVIDENCE_DIR/logs/expo-run-ios.log"
  ```

  Expected for PASS:

  - Xcode build succeeds.
  - The app installs on the simulator.
  - `expo-run-ios.log` does not contain the prior `format-inl.h` consteval errors.

- [ ] **Step 3: If the build passes, open the dev-client URL**

  Run:

  ```bash
  NATIVE_IDCHAT_SIMULATOR_UDID="$NATIVE_IDCHAT_SIMULATOR_UDID" \
  NATIVE_IDCHAT_EVIDENCE_DIR="$EVIDENCE_DIR" \
  scripts/qa/native-idchat-p0-5-open-dev-client.sh
  ```

  Expected:

  - `logs/dev-client-open-summary.txt` exists.
  - `00-after-dev-client-openurl.png` exists.

- [ ] **Step 4: Write PASS evidence README when build passes**

  Run this after the build and dev-client open helper both succeed:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614"
  export COMMIT_UNDER_TEST="$(git rev-parse --short HEAD)"
  export XCODE_VERSION="$(xcodebuild -version | paste -sd ';' -)"
  export XCRUN_VERSION="$(xcrun --version)"
  export SIMULATOR_UDID="${NATIVE_IDCHAT_SIMULATOR_UDID:?NATIVE_IDCHAT_SIMULATOR_UDID is required}"
  node - <<'NODE'
  const fs = require('fs');

  const lines = [
    '# Native IDChat P0.6 iOS Build Gate Evidence - 2026-06-14',
    '',
    '## Result',
    '',
    'iOS build gate: PASS',
    '',
    'This run fixes the P0.5 simulator blocker by making the Expo dev-client iOS build complete on the current Xcode environment.',
    'P0.5 product acceptance remains separate and still requires the five Search/Me/Back-to-Chats screenshots.',
    '',
    '## Commit Under Test',
    '',
    '- Branch: `codex/native-idchat-p0-6-ios-build-gate`',
    `- Commit: \`${process.env.COMMIT_UNDER_TEST}\``,
    '- Base: `66e99ed docs: capture native chat p0.5 release evidence`',
    '',
    '## Environment',
    '',
    `- Xcode: ${process.env.XCODE_VERSION}`,
    `- xcrun: ${process.env.XCRUN_VERSION}`,
    `- Simulator UDID: \`${process.env.SIMULATOR_UDID}\``,
    '',
    '## Commands',
    '',
    '- `yarn test:chat-native`',
    '- `npm exec tsc -- --noEmit --pretty false`',
    '- `git diff --check main...HEAD`',
    '- `git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock`',
    '- `npx --no-install expo run:ios --device "$NATIVE_IDCHAT_SIMULATOR_UDID" --no-bundler`',
    '- `scripts/qa/native-idchat-p0-5-open-dev-client.sh`',
    '',
    '## Build Evidence',
    '',
    '- `logs/expo-run-ios.log`: Xcode build/install completed.',
    '- `logs/dev-client-open-summary.txt`: dev-client URL was opened.',
    '- `00-after-dev-client-openurl.png`: simulator screenshot after opening the dev client.',
    '',
    '## Dependency Boundary',
    '',
    '- No committed or staged `node_modules` patch.',
    '- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.',
    '- No committed `node_modules/expo-image/ios` patch.',
  ];

  fs.writeFileSync(`${process.env.EVIDENCE_DIR}/README.md`, `${lines.join('\n')}\n`);
  NODE
  ```

  Expected: the README contains concrete command output values, not prose instructions.

- [ ] **Step 5: Write FAIL evidence README when build still fails**

  If Task 4 Step 2 fails, first extract a concrete blocker line:

  ```bash
  export EVIDENCE_DIR="docs/superpowers/qa/evidence/native-idchat-p0-6-ios-build-gate-20260614"
  export BLOCKER="$(
    rg -n "error:|BUILD FAILED|xcodebuild exited|Unknown argument|format-inl.h|FMT_STRING" \
      "$EVIDENCE_DIR/logs/expo-run-ios.log" |
      head -n 1
  )"
  test -n "$BLOCKER"
  export COMMIT_UNDER_TEST="$(git rev-parse --short HEAD)"
  node - <<'NODE'
  const fs = require('fs');

  const lines = [
    '# Native IDChat P0.6 iOS Build Gate Evidence - 2026-06-14',
    '',
    '## Result',
    '',
    'iOS build gate: FAIL',
    '',
    'The attempted P0.6 fix did not make the iOS dev-client build pass. P0.5 remains blocked before simulator UI evidence.',
    '',
    '## Commit Under Test',
    '',
    '- Branch: `codex/native-idchat-p0-6-ios-build-gate`',
    `- Commit: \`${process.env.COMMIT_UNDER_TEST}\``,
    '- Base: `66e99ed docs: capture native chat p0.5 release evidence`',
    '',
    '## Blocker',
    '',
    process.env.BLOCKER,
    '',
    '## Logs',
    '',
    '- `logs/expo-run-ios.log`',
    '- `logs/metro.log`',
    '- `logs/version-alignment-build.log`',
    '- `logs/prebuild-with-fmt-plugin.log`',
    '',
    '## Dependency Boundary',
    '',
    '- No committed or staged `node_modules` patch.',
    '- No committed or staged `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.',
    '- No committed `node_modules/expo-image/ios` patch.',
  ];

  fs.writeFileSync(`${process.env.EVIDENCE_DIR}/README.md`, `${lines.join('\n')}\n`);
  NODE
  ```

  Expected: the README records one exact failing line from `logs/expo-run-ios.log`. If `test -n "$blocker"` fails, inspect the log manually and write the first concrete build blocker before committing.

- [ ] **Step 6: Sanitize logs and commit evidence**

  Run:

  ```bash
  perl -0pi -e 's/[ \t]+\n/\n/g' "$EVIDENCE_DIR"/logs/*.log "$EVIDENCE_DIR"/logs/*.txt 2>/dev/null || true
  rm -rf ios
  git diff --check
  git add "$EVIDENCE_DIR"
  git commit -m "docs: capture native chat p0.6 build evidence"
  ```

- [ ] **Step 7: Post Lisa Hahn buzz**

  Post a development-journal buzz with:

  - P0.6 PASS or FAIL;
  - evidence path;
  - whether version alignment alone fixed the build or the `fmt` plugin was required;
  - simulator screenshot path if PASS;
  - exact blocker if FAIL.

## Task 5: Final Verification And Handoff

**Files:** no new files unless evidence README needs a correction.

- [ ] **Step 1: Run final verification**

  Run:

  ```bash
  rm -rf ios
  git status --short --branch
  git log --oneline --decorate --max-count=20
  git diff --check main...HEAD
  git diff --check
  git diff --name-status main...HEAD -- node_modules ios/Pods ios/build ios/Podfile.lock
  yarn test:chat-native
  npm exec tsc -- --noEmit --pretty false
  ```

  Expected:

  - no staged files;
  - no generated iOS artifacts staged or committed;
  - `git diff --check main...HEAD` passes;
  - `git diff --check` passes;
  - forbidden artifact branch diff prints no files;
  - `yarn test:chat-native` passes;
  - `tsc` passes, or fails only in documented pre-existing non-`src/chat-native` files.

- [ ] **Step 2: Final response**

  Final response must include:

  - P0.6 build-gate PASS/FAIL conclusion;
  - commit hashes created in this plan;
  - Lisa Hahn buzz pin IDs or exact buzz failures;
  - whether version alignment alone fixed the build or the config plugin was required;
  - verification command results;
  - evidence README path;
  - simulator screenshot path if PASS;
  - explicit statement that P0.5 product acceptance is still separate unless the five P0.5 screenshots were also captured;
  - dirty/generated files left untouched or removed.

## If P0.6 Still Fails

- [ ] Do not patch `ios/Pods` manually.
- [ ] Do not commit generated `ios/`.
- [ ] Do not keep adding broader native workarounds.
- [ ] Commit accurate FAIL evidence.
- [ ] Final response must say `P0.6 build gate not accepted` and include the exact next blocker.

## Self-Review Checklist

- [ ] Plan starts from a clean worktree containing this P0.6 plan and with `66e99ed` as an ancestor.
- [ ] Plan first tries official Expo/RN patch version alignment.
- [ ] Config plugin is introduced only when the same `fmt` error remains.
- [ ] Plugin is idempotent and test-covered.
- [ ] No task commits `node_modules`, `ios/Pods`, `ios/build`, or generated `ios/Podfile.lock`.
- [ ] Build evidence is separate from P0.5 product acceptance.
- [ ] P0.5 five-screenshot PASS is not claimed by this plan.
