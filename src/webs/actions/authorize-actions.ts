import { lazy } from "react";
import * as Pay from "./lib/authorize/pay";
import * as SignPartialTx from "./lib/authorize/signPartialTx";
import * as Merge from "./lib/authorize/merge";
import * as Connect from "./lib/authorize/connect";
import * as Transfer from "./lib/authorize/transfer";
import { AuthorizeAction } from "./action-dispatcher";
import * as Disconnect from "./lib/authorize/disconnect";
import * as SignMessage from "./lib/authorize/sign-message";
import * as EciesDecrypt from "./lib/authorize/ecies-decrypt";
import * as EciesEncrypt from "./lib/authorize/ecies-encrypt";
import * as TransferToken from "./lib/authorize/transfer-token";
import * as SwitchNetwork from "./lib/authorize/switch-network";
import * as UnlockP2PKHInput from "./lib/authorize/unlockP2PKHInput";

import * as SignTransaction from "./lib/authorize/sign-transaction";
import * as SignTransactions from "./lib/authorize/sign-transactions";

// // BTC
import * as Inscribe from "./lib/authorize/btc/inscribe";
import * as ConnectBTC from "./lib/authorize/btc/connect";
import * as BTCTransfer from "./lib/authorize/btc/transfer";
import * as SignBTCPsbt from "./lib/authorize/btc/sign-psbt";
import * as SignBTCMessage from "./lib/authorize/btc/sign-message";
import * as MRC20Deploy from "./lib/authorize/btc/mrc20-deploy";
import * as MRC20Mint from "./lib/authorize/btc/mrc20-mint";
import * as MRC20Transfer from "./lib/authorize/btc/mrc20-transfer";
import * as TransferNFT from "./lib/authorize/btc/transfer-nft";
import * as MRC20TransferWithInscribe from "./lib/authorize/btc/mrc20-transfer-with-inscribe";
import * as AutoPayment from "./auto-payment";

import * as ECDH from "./common/ecdh";
function doNothing() {}

export default {
  Connect: {
    name: "Connect",
    title: "Connect",
    descriptions: ["Connect"],
    process: Connect.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ConnectComPonent")),
  },
  Disconnect: {
    name: "Disconnect",
    title: "Disconnect",
    descriptions: ["Disconnect"],
    process: Disconnect.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
    AutoPayment: {
    name: "AutoPayment",
    title: "Requesting Approval for Auto-Payment",
    descriptions: ["AutoPayment"],
    process: AutoPayment.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/AutoPayment")),
  },
  SwitchNetwork: {
    name: "SwitchNetwork",
    title: "SwitchNetwork",
    descriptions: ["SwitchNetwork"],
    process: SwitchNetwork.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  TokenTransfer: {
    name: "TokenTransfer",
    title: "Token Transfer",
    descriptions: ["Transfer tokens from my wallet to another"],
    process: TransferToken.process,
    estimate: TransferToken.estimate,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  Transfer: {
    name: "Transfer",
    title: "Transfer",
    descriptions: ["Transfer tokens from my wallet to another"],
    process: Transfer.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/Transfer/Info")),
  },
  Merge: {
    name: "Merge",
    title: "Merge",
    descriptions: ["Merge all the UTXOs into one in my wallet"],
    process: Merge.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignTransaction: {
    name: "Sign a Transaction",
    title: "Sign a Transaction",
    descriptions: ["Sign a transaction with my wallet"],
    process: SignTransaction.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignTransactions: {
    name: "Sign Transactions",
    title: "Sign Multiple Transactions",
    descriptions: ["Sign multiple transactions with my wallet at once"],
    process: SignTransactions.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  UnlockP2PKHInput: {
    name: "Sign a Transaction",
    title: "Sign a Transaction",
    description: ["Sign a transaction with my wallet"],
    process: UnlockP2PKHInput.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
    // closeAfterProcess: true,
  },
  Pay: {
    name: "Pay",
    title: "Pay for transactions",
    descriptions: [
      "Third party apps create functional transaction(s), and ask Metalet to pay for them.",
    ],
    process: Pay.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignPartialTx: {
    name: "SignPartialTx",
    title: "Partial Transaction Signing",
    descriptions: ["Sign transactions with specified UTXOs"],
    process: SignPartialTx.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  EciesEncrypt: {
    name: "ECIES Encrypt",
    title: "ECIES Encrypt",
    descriptions: ["Encrypt a message with ECIES algorithm"],
    process: EciesEncrypt.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  EciesDecrypt: {
    name: "ECIES Decrypt",
    title: "ECIES Decrypt",
    descriptions: ["Decrypt an encrypted message with ECIES algorithm"],
    process: EciesDecrypt.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignMessage: {
    name: "Sign Message",
    title: "Sign Message",
    descriptions: ["Sign a message with ECDSA algorithm"],
    process: SignMessage.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignBTCPsbt: {
    name: "SignBTCPsbt",
    title: "Sign Transaction",
    descriptions: [
      "Third party apps request signing of the PSBT(s), and ask Metalet to sign for them.",
    ],
    process: SignBTCPsbt.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/SignBTCPsbt")),
  },
  ConnectBTC: {
    name: "Connect BTC",
    title: "Connect Account",
    descriptions: ["Connect Account"],
    process: ConnectBTC.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  BTCTransfer: {
    name: "BTC Transfer",
    title: "BTC Transfer",
    descriptions: [],
    process: BTCTransfer.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  SignBTCMessage: {
    name: "Sign BTC Message",
    title: "Signature request",
    descriptions: [
      "Only sign this message if you fully understand the content and trust the requesting site.",
    ],
    process: SignBTCMessage.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  Inscribe: {
    name: "Inscribe",
    title: "Inscribe",
    descriptions: [],
    estimate: Inscribe.estimate,
    process: Inscribe.process,
    // needEstimated: false,
    // component: lazy(() => import("../components/ComponentA")),
    needEstimated: true,
    component: lazy(() => import("../components/InscribeMetaPin/Info")),
    nextComponent: lazy(
      () => import("../components/InscribeMetaPin/Estimator")
    ),
  },
  MRC20Deploy: {
    name: "MRC20Deploy",
    title: "MRC20 Deploy",
    descriptions: [],
    estimate: doNothing,
    process: MRC20Deploy.process,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
    // nextComponent: lazy(
    //   () => import("../components/InscribeMetaPin/Estimator")
    // ),
  },
  MRC20Transfer: {
    name: "MRC20Transfer",
    title: "MRC20 Transfer",
    descriptions: [],
    estimate: doNothing,
    process: MRC20Transfer.process,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  MRC20TransferWithInscribe: {
    name: "MRC20TransferWithInscribe",
    title: "MRC20 Transfer",
    description: [],
    // description: ['MRC20 Transfer with Inscribe'],
    process: MRC20TransferWithInscribe.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
    // closeAfterProcess: true,
  },
  MRC20Mint: {
    name: "MRC20Mint",
    title: "MRC20 Mint",
    descriptions: [],
    estimate: doNothing,
    process: MRC20Mint.process,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  TransferNFT: {
    name: "TransferNFT",
    title: "Transfer NFT",
    descriptions: [],
    estimate: doNothing,
    process: TransferNFT.process,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
  ECDH: {
    name: "ECDH",
    title: "ECDH",
    descriptions: ["ECDH"],
    process: ECDH.process,
    estimate: doNothing,
    needEstimated: false,
    component: lazy(() => import("../components/ComponentA")),
  },
} as unknown as { [key: string]: AuthorizeAction };
