import { createStorage } from "@/utils/AsyncStorageUtil";
// import { payTransactions, smallPayTransactions } from '../crypto'

import {
  AutoPayment24HLimit,
  AutoPaymentAmountKey,
  AutoPaymentHistoryKey,
  AutoPaymentListKey,
  EnabledAutoPaymentKey,
} from "./auto-payment";
import { smallPayTransactions } from "@/lib/crypto";
import { clearChunkData, getChunkData } from "./lib/query/storage-chunk";


export type SigningTransaction = {
  txComposer: string
  message?: string
}

export type PayTransactionsParams = {
  transactions: SigningTransaction[]
  hasMetaid?: boolean
  feeb?: number
}

export type PayParams = {
  transactions?: SigningTransaction[]
  hasMetaid?: boolean
  feeb?: number
  useChunk?: boolean
  chunkKey?: string
}

export async function process(params: any, host: string) {
  // console.log("small-pay params", params);
  // console.log("small-pay host", host);
  // const storage = createStorage();
  // const isEnabled = await storage.get(EnabledAutoPaymentKey, {
  //   defaultValue: true,
  // });
  // if (!isEnabled) {
  //   return {
  //     status: "error",
  //     message: "Auto payment is not enabled",
  //   };
  // }
  // const list: { logo?: string; host: string }[] = await storage.get(
  //   AutoPaymentListKey,
  //   { defaultValue: [] }
  // );
  // const autoPaymentList = list ?? [];
  // if (!autoPaymentList.some((item) => item.host === host)) {
  //   return {
  //     status: "error",
  //     message: "Auto payment not approved for this host",
  //   };
  // }
  // try {
  //   const autoPaymentAmount = await storage.get(AutoPaymentAmountKey, {
  //     defaultValue: 10000,
  //   });
  //   const toPayTransactions = params.transactions;
  //   const payedTransactions = await smallPayTransactions(
  //     toPayTransactions,
  //     params.hasMetaid,
  //     params.feeb,
  //     autoPaymentAmount,
  //     { password: "" }
  //   );

  //   return { payedTransactions };
  // } catch (error) {
  //   return {
  //     status: "error",
  //     message:
  //       error instanceof Error
  //         ? error.message
  //         : "Unknown error occurred during small payment",
  //   };
  // }


  const storage = createStorage()
  const isEnabled = await storage.get(EnabledAutoPaymentKey, { defaultValue: true })
  if (!isEnabled) {
    return {
      status: 'error',
      message: 'Auto payment is not enabled',
    }
  }
  const list: { logo?: string; host: string }[] = await storage.get(AutoPaymentListKey, { defaultValue: [] })
  const autoPaymentList = list ?? []
  if (!autoPaymentList.some((item) => item.host === host)) {
    return {
      status: 'error',
      message: 'Auto payment not approved for this host',
    }
  }
  let autoPaymentHistory: { cost: number; timestamp: number }[] = await storage.get(AutoPaymentHistoryKey, {
    defaultValue: [],
  })
  autoPaymentHistory = autoPaymentHistory.filter((item) => {
    return item.timestamp > Date.now() - 24 * 60 * 60 * 1000 // keep only last 24 hours
  })
  const totalCost = autoPaymentHistory.reduce((acc, item) => acc + item.cost, 0)
  if (totalCost >= AutoPayment24HLimit) {
    return {
      status: 'error',
      message: `Auto payment limit reached for the last 24 hours: ${totalCost} sats`,
    }
  }
  try {
    let autoPaymentAmount = await storage.get(AutoPaymentAmountKey, { defaultValue: 10000 })
    let _params: PayTransactionsParams
    if (params.useChunk && params.chunkKey) {
      const chunkData = await getChunkData(params.chunkKey)
      if (!chunkData) {
        return {
          status: 'error',
          message: 'Chunk data not found',
        }
      }
      _params = JSON.parse(chunkData) as PayTransactionsParams
    } else {
      _params = {
        transactions: params.transactions || [],
        hasMetaid: params.hasMetaid,
        feeb: params.feeb,
      }
    }

    const toPayTransactions = _params.transactions
    const { payedTransactions, cost } = await smallPayTransactions(
      toPayTransactions,
      _params.hasMetaid,
      _params.feeb,
      autoPaymentAmount,
      { password:"" }
    )

    
    if (params.useChunk && params.chunkKey) {
      await clearChunkData()
    }
    await storage.set(AutoPaymentHistoryKey, [...autoPaymentHistory, { cost, timestamp: Date.now() }])
    return { payedTransactions }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred during small payment',
    }
  }
}
