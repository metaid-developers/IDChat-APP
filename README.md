# IDChatN (MetaID Wallet App)

A React Native (Expo) wallet application supporting multiple chains (DOGE, BTC, MVC). The project includes wallet UI, transaction construction and broadcasting, and an experimental DOGE inscription flow that stores data inside a P2SH scriptSig.

## Quick overview

- Platform: React Native (Expo)
- Language: TypeScript / JavaScript
- Main features: multi-chain wallet UI, transaction construction & broadcast, DOGE inscription/reveal flow, address-type switching

## Project layout

- `src/` — application source code
  - `page/` — React Native screens (e.g. `AssetsDogeDetailPage.tsx`)
  - `webs/actions/lib/authorize/doge/inscribe.ts` — DOGE inscription and transaction-building logic
  - `chat/wallet/doge/wallet.ts` — DOGE wallet helper
  - `wallet/MetaletWallet.tsx` — wallet container and active wallet reference
  - `utils/WalletUtils.ts` — helpers for storage and address-type switching
- `assets/` — images and static assets
- Standard config files: `package.json`, `tsconfig.json`, `babel.config.js`, etc.

## Prerequisites

- Node.js (recommended LTS)
- Yarn or npm
- Expo CLI (for running the app in development)
- Xcode / Android SDK for native builds or EAS submissions

## Install

```bash
yarn install
# or
npm install
```

## Run (development)

Start Metro / Expo dev server:

```bash
yarn start
# or
npm run start
```

Open the app with Expo Go or run on simulators/emulators.

## Common scripts

- `yarn start` — start Expo / Metro
- `yarn ios` / `yarn android` — platform run (if configured)
- `eas submit --platform ios` — submit iOS build via EAS (example)

## Important development notes

- ECC backend selection on iOS: avoid importing native/JSI `secp256k1` modules at module load time on iOS to prevent crashes. The codebase uses `@noble/secp256k1` (pure JS) on iOS and dynamically selects ECC backends at runtime (see `inscribe.ts`).
- WebCrypto / random values: `@noble/secp256k1` async signing expects WebCrypto (`crypto.subtle`) and secure random. On React Native provide polyfills such as `react-native-get-random-values` and a WebCrypto shim, or ensure `globalThis.crypto` exists before invoking ECC functions.
- ScriptSig and stack ordering: P2SH unlock scripts depend on the order of pushed items. For the DOGE inscription flow the stack must place signature and pushes in the order expected by the redeem script (see `signP2SHInput` in `inscribe.ts`). If node validation fails, enable debug logs in `inscribe.ts` and collect the printed `scriptSig` hex.
- Address type switching: `AssetsDogeDetailPage.tsx` provides a UI to switch DOGE address types. Changes persist via `changeCurrentWalletDogeAddressType` and update the active wallet state on the Metalet container.

## Troubleshooting

- iOS crash related to secp library: ensure no native `secp256k1` is imported at top-level. Use the runtime initializer (`ensureEccInitialized`) to select a safe backend.
- Node RPC signature failures (e.g. `mandatory-script-verify-flag-failed`): inspect the `scriptSig` hex output from the app, verify signature is DER + SIGHASH, low-S normalized, and that push order/encoding matches the redeem script.

## Suggested improvements

- Add unit tests to validate signature formats and scriptSig stack ordering.
- Document WebCrypto polyfill installation steps and include guard logic in initialization.
- Add more exhaustive address-type derivations if required by product.

## Contributing / Contact

Provide runtime logs and the `scriptSig` / transaction hex printed by the app when requesting help. That information is critical for diagnosing signature and script verification issues.

If you want the README shortened, expanded with developer setup steps, or converted to another language, open an issue or request an update.


