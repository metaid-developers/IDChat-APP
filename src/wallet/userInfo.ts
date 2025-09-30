import { TxComposer, mvc } from 'meta-contract';
import { isNil } from 'lodash';
import axios from 'axios';
import { sleep } from '@/lib/helpers';
import { getECDHData, getMvcAddress, getMvcUtxos, payByWallet } from './walletUtils';
import { unlockP2PKHInput } from '@/lib/crypto';
import { isEmpty, isNotEmpty } from '@/utils/StringUtils';
export type Transaction = {
  txComposer: TxComposer;
  message: string;
};

// Add global interface augmentation for window.metaidwallet
// declare global {
//   interface Window {
//     metaidwallet: {
//       getAddress: () => Promise<string>
//       getUtxos: () => Promise<any[]>
//       unlockP2PKHInput: (params: any) => Promise<any>
//       // add other methods/properties as needed
//       btc: {
//         getAddress: () => Promise<string>
//         inscribe({
//           data,
//           options,
//         }: {
//           data: InscriptionRequest
//           options?: { noBroadcast: boolean }
//         }): Promise<any>
//       },
//       common:{
//       ecdh:(params:{externalPubKey:string})=> Promise<{
//       externalPubKey: string
//       sharedSecret:string
//       ecdhPubKey:string
//       creatorPubkey: string
//     }>,
//     }
//     }
//   }
// }

export type Operation = 'init' | 'create' | 'modify' | 'revoke';
export type BtcNetwork = 'mainnet' | 'testnet' | 'regtest';
export type CreatePinResult =
  | {
      transactions: Transaction[];
      txid?: undefined;
      txids?: string[];
    }
  | {
      txid: string;
      transactions?: undefined;
      txids?: string[];
    };
export type MetaidData = {
  operation?: Operation;
  body?: string | Buffer;
  path?: string;
  contentType?: string;
  encryption?: '0' | '1' | '2';
  version?: string;
  encoding?: BufferEncoding;
  revealAddr?: string;
  flag?: 'metaid';
};
export type Encryption = '0' | '1' | '2';

type OpReturnV2 = [
  'metaid', // metaid for Testnet, metaid for Mainnet
  Operation,
  string | undefined, // path example: /protocols/simplebuzz
  Encryption | undefined,
  string | undefined, // version
  string | undefined, // contentType,
  string | Buffer | undefined,
];

export function buildOpReturnV2(
  metaidData: Omit<MetaidData, 'revealAddr'>,
  options?: { network: BtcNetwork },
): OpReturnV2 {
  const res1 = ['metaid', metaidData.operation];
  const res2 = [];
  if (metaidData.operation !== 'init') {
    res2.push(metaidData.path!);
    res2.push(metaidData?.encryption ?? '0');
    res2.push(metaidData?.version ?? '1.0.0');
    res2.push(metaidData?.contentType ?? 'text/plain;utf-8');

    const body = isNil(metaidData.body)
      ? undefined
      : Buffer.isBuffer(metaidData.body)
        ? metaidData.body
        : Buffer.from(metaidData.body, metaidData?.encoding ?? 'utf-8');
    res2.push(body);
    // const maxChunkSize = 520
    // const bodySize = (body as Buffer).length
    // for (let i = 0; i < bodySize; i += maxChunkSize) {
    //   let end = i + maxChunkSize
    //   if (end > bodySize) {
    //     end = bodySize
    //   }
    //   res.push((body as Buffer).slice(i, end))
    // }
  }
  return [...res1, ...res2] as OpReturnV2;
}

export const createPinWithAsset = async (
  metaidData: Omit<MetaidData, 'revealAddr'>,
  options: {
    assistDomain: string;
    signMessage?: string;
    serialAction?: 'combo' | 'finish';
    transactions?: Transaction[];
    network: BtcNetwork;
    service?: {
      address: string;
      satoshis: string;
    };
    outputs?: {
      address: string;
      satoshis: string;
    }[];
    utxo?: {
      txid: string;
      outIndex: number;
      value: number;
      address: string;
    };
  },
): Promise<{
  txid: string;
  utxo?: {
    txid: string;
    outIndex: number;
    value: number;
    address: string;
  };
}> => {
  const address = await getMvcAddress();

  console.log('待支付逻辑');
  let utxo = options?.utxo;
  if (!utxo) {
    const utxos: any[] = await getMvcUtxos();
    utxo = utxos.find((utxo) => utxo.address === address);
    if (!utxo) {
      const url = `${options.assistDomain}/v1/assist/gas/mvc/address-init`;
      const preRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gasChain: 'mvc',
          address,
        }),
      });
      const initUtxo = await preRes.json();
      if (initUtxo.error) {
        throw new Error(initUtxo.error);
      }
      if (!initUtxo.data) {
        await sleep(5000);
        const utxos: any[] = await getMvcUtxos();
        utxo = utxos.find((utxo) => utxo.address === address);
        if (!utxo) {
          throw new Error('No UTXO found for address');
        }
      } else {
        utxo = {
          txid: initUtxo.data.txId,
          outIndex: initUtxo.data.index,
          value: initUtxo.data.amount,
          address: initUtxo.data.address,
        };
      }
    }
  }

  const pinTxComposer = new TxComposer();
  pinTxComposer.appendP2PKHInput({
    address: new mvc.Address(address, options.network),
    satoshis: utxo.value,
    txId: utxo.txid,
    outputIndex: utxo.outIndex,
  });

  pinTxComposer.appendP2PKHOutput({
    address: new mvc.Address(address, options.network),
    satoshis: 1,
  });
  const metaidOpreturn = buildOpReturnV2(metaidData, {
    network: options?.network ?? 'testnet',
  });
  pinTxComposer.appendOpReturnOutput(metaidOpreturn);
  const changeAddress = new mvc.Address(address, options.network);
  pinTxComposer.appendP2PKHOutput({
    address: changeAddress,
    satoshis: utxo.value,
  });
  const url = `${options.assistDomain}/v1/assist/gas/mvc/pre`;
  const preRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      txHex: pinTxComposer.getRawHex(),
      address,
    }),
  });
  const preData = await preRes.json();
  if (preData.error) {
    throw new Error(preData.error);
  }
  const tx = new mvc.Transaction(preData.data.txHex);
  const txObj = tx.toObject();
  const inputs = txObj.inputs;
  console.log('inputs', inputs);
  // 获取所有引用的UTXO信息

  const utxoPromises = txObj.inputs.map(async (input: any) => {
    let utxoRawUrl = `https://mvcapi${
      options.network === 'testnet' ? '-testnet' : ''
    }.cyber3.space/tx/${input.prevTxId}/raw`;
    if (options.network !== 'testnet') {
      utxoRawUrl = `https://api.microvisionchain.com/open-api-mvc/tx/${input.prevTxId}/raw`;
    }

    const utxoRes = await fetch(utxoRawUrl);
    return await utxoRes.json();
  });
  const _utxos = await Promise.all(utxoPromises);
  // 为每个input设置正确的output
  tx.inputs.forEach((input: any, index: number) => {
    const _tx = new mvc.Transaction(_utxos[index].hex);
    const utxo = _tx.outputs[input.outputIndex];
    tx.inputs[index].output = new mvc.Transaction.Output({
      script: utxo.script,
      satoshis: utxo.satoshis,
    });
  });
  interface UnlockP2PKHInputParams {
    transaction: {
      txComposer: string;
      toSignInputs: number[];
    }[];
  }
  const txComposer = new TxComposer(tx);
  const txComposerSerialize = txComposer.serialize();
  const params: UnlockP2PKHInputParams = {
    transaction: [
      {
        txComposer: txComposerSerialize,
        toSignInputs: [0],
      },
    ],
  };

  const [_txComposerSerialize] = await unlockP2PKHInput(params);
  // console.log("params", params);
  const commitUrl = `${options.assistDomain}/v1/assist/gas/mvc/commit`;
  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      txHex: TxComposer.deserialize(_txComposerSerialize).getRawHex(),
      orderId: preData.data.orderId,
    }),
  });
  const commitData = await commitRes.json();
  if (commitData.code == 1 && !commitData.data) {
    throw new Error(
      JSON.stringify({
        state: commitData.code,
        message: commitData.message,
      }),
    );
  }

  return {
    txid: commitData.data.txId,
    utxo: {
      txid: commitData.data.txId,
      outIndex: 2,
      value: utxo.value,
      address: address,
    },
  };
};

export function generateKey(): string {
  return 'key_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// 获取字符串 UTF-8 字节大小
export function getStringSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

// 判断是否超过 1MB
export function isBiggerThan1MB(str: string): boolean {
  return getStringSize(str) > 1024 * 1024;
}

const pay = async ({
  transactions,
  feeb,
}: {
  transactions: Transaction[];
  feeb: number | undefined;
}) => {
  const params = {
    transactions: transactions.map((transaction) => {
      return {
        txComposer: transaction.txComposer.serialize(),
        message: transaction.message,
      };
    }),
    hasMetaid: true,
    feeb,
  };

  //   if (window.metaidwallet.storageChunk && isBiggerThan1MB(JSON.stringify(params))) {
  //     type StorageChunkParams = {
  //       key: string
  //       index: number
  //       total: number
  //       chunk: string
  //     }
  //     const key = generateKey()
  //     const data = JSON.stringify(params)
  //     // TODO: handle big params
  //     // 分片存储（大于 1MB）
  //     const chunkSize = 256 * 1024 // 每片 256KB
  //     const total = Math.ceil(data.length / chunkSize)

  //     for (let i = 0; i < total; i++) {
  //       const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize)
  //       await window.metaidwallet.storageChunk({ chunk, index: i, total, key })
  //     }

  //     const ret = await window.metaidwallet.pay({
  //       useChunk: true,
  //       chunkKey: key,
  //     })

  //     const {
  //       payedTransactions,
  //     }: {
  //       payedTransactions: string[]
  //     } = ret

  //     return payedTransactions.map((txComposerSerialized: string) => {
  //       return TxComposer.deserialize(txComposerSerialized)
  //     })
  //   }

  const ret = await payByWallet(params);

  const {
    payedTransactions,
  }: {
    payedTransactions: string[];
  } = ret;

  return payedTransactions.map((txComposerSerialized: string) => {
    return TxComposer.deserialize(txComposerSerialized);
  });
};

export async function broadcastToApi({
  txHex,
  network,
}: {
  txHex: string;
  network: BtcNetwork;
}): Promise<{ txid: string }> {
  const { data: txid, message } = await axios
    .post('https://www.metalet.space/wallet-api/v3/tx/broadcast', {
      chain: 'mvc',
      net: network,
      rawTx: txHex,
    })
    .then((res) => res.data);
  if (!txid) {
    throw new Error(message);
  }

  return { txid };
}

const broadcast = async ({
  txComposer,
  network,
}: {
  txComposer: TxComposer;
  network: BtcNetwork;
}): Promise<{ txid: string }> => {
  // broadcast locally first
  const txHex = txComposer.getTx().toString();

  const { txid } = await broadcastToApi({ txHex, network });
  console.log('txid', txid);

  return { txid };
};

const batchBroadcast = async ({
  txComposer,
  network,
}: {
  txComposer: TxComposer[];
  network: BtcNetwork;
}): Promise<{ txid: string }[]> => {
  const res: { txid: string }[] = [];
  for (let i = 0; i < txComposer.length; i++) {
    const broadcastRes = await broadcast({
      txComposer: txComposer[i],
      network,
    });
    res.push(broadcastRes);
  }

  return res;
};

const createPin = async (
  metaidData: Omit<MetaidData, 'revealAddr'>,
  options: {
    signMessage?: string;
    serialAction?: 'combo' | 'finish';
    transactions?: Transaction[];
    network: BtcNetwork;
    service?: {
      address: string;
      satoshis: string;
    };
    outputs?: {
      address: string;
      satoshis: string;
    }[];
    feeRate?: number;
  },
): Promise<CreatePinResult> => {
  console.log('正常支付逻辑createPin');
  const transactions: Transaction[] = options?.transactions ?? [];
  const address = await getMvcAddress();
  // if (!(await checkBalance({ address: this.wallet.address, network: options?.network ?? 'testnet' }))) {
  //   throw new Error(errors.NOT_ENOUGH_BALANCE)
  // }

  const pinTxComposer = new TxComposer();

  pinTxComposer.appendP2PKHOutput({
    address: new mvc.Address(address, options.network),
    satoshis: 1,
  });

  const metaidOpreturn = buildOpReturnV2(metaidData, { network: options?.network ?? 'testnet' });

  pinTxComposer.appendOpReturnOutput(metaidOpreturn);

  if (options?.service && options?.service.address && options?.service.satoshis) {
    pinTxComposer.appendP2PKHOutput({
      address: new mvc.Address(options.service.address, options.network),
      satoshis: Number(options.service.satoshis),
    });
  }

  if (options?.outputs) {
    for (const output of options.outputs) {
      pinTxComposer.appendP2PKHOutput({
        address: new mvc.Address(output.address, options.network),
        satoshis: Number(output.satoshis),
      });
    }
  }

  transactions.push({
    txComposer: pinTxComposer,
    message: 'Create Pin',
  });

  if (options?.serialAction === 'combo') {
    return { transactions };
  }

  /// // apply pay
  const payRes = await pay({
    transactions,
    feeb: options?.feeRate,
  });

  // for (const txComposer of payRes) {
  //   await this.connector.broadcast(txComposer)
  // }
  await batchBroadcast({ txComposer: payRes, network: options.network });

  return {
    txid: payRes[payRes.length - 1].getTxId(),
    txids: payRes.map((item) => item.getTxId()),
  };
};

export const createOrUpdateUserInfo = async ({
  userData,
  oldUserData,
  options,
}: {
  userData: {
    name: string;
    bio?: string;
    avatar?: string;
    background?: string;
    chatpubkey?: string;
  };
  oldUserData: {
    name?: string;
    nameId: string;
    bioId?: string;
    avatarId?: string;
    backgroundId?: string;
    chatpubkey?: string;
  };
  options: { feeRate?: number; network?: BtcNetwork; assistDomain?: string };
}): Promise<{
  [key: string]: { txid: string | undefined } | undefined;
}> => {
  const metaDatas: MetaidData[] = [];
  //   const utxoStore = useUtxosStore()
  if (userData.name) {
    metaDatas.push({
      operation: oldUserData.nameId ? 'modify' : 'create',
      body: userData.name,
      path: oldUserData.nameId ? `@{${oldUserData.nameId}}` : '/info/name',
      encoding: 'utf-8',
      contentType: 'text/plain',
      flag: 'metaid',
    });
  }
  if (userData.bio) {
    metaDatas.push({
      operation: oldUserData.bioId ? 'modify' : 'create',
      body: userData.bio,
      path: oldUserData.bioId ? `@{${oldUserData.bioId}}` : '/info/bio',
      encoding: 'utf-8',
      contentType: 'text/plain',
      flag: 'metaid',
    });
  }
  if (userData.avatar) {
    metaDatas.push({
      operation: oldUserData.avatarId ? 'modify' : 'create',
      body: userData.avatar,
      path: oldUserData.avatarId ? `@{${oldUserData.avatarId}}` : '/info/avatar',
      encoding: 'base64',
      contentType: 'image/jpeg;binary',
      flag: 'metaid',
    });
  }
  if (userData.background) {
    metaDatas.push({
      operation: oldUserData.backgroundId ? 'modify' : 'create',
      body: userData.background,
      path: oldUserData.backgroundId ? `@{${oldUserData.backgroundId}}` : '/info/background',
      encoding: 'base64',
      contentType: 'image/jpeg;binary',
      flag: 'metaid',
    });
  }
  console.log('userData.chatpubkey上链：' + userData.chatpubkey);
  console.log('oldUserData.chatpubkey上链：' + oldUserData.chatpubkey);
  if (userData.chatpubkey) {
    // if (!oldUserData.chatpubkey) {
    console.log('create chatpubkey上链：' + userData.chatpubkey);
    metaDatas.push({
      operation: 'create',
      body: userData.chatpubkey,
      path: `${'bc1p20k3x2c4mglfxr5wa5sgtgechwstpld80kru2cg4gmm4urvuaqqsvapxu0'}:/info/chatpubkey`,
      encoding: 'utf-8',
      contentType: 'text/plain',
      flag: 'metaid',
    });
    // }
  }
  if (metaDatas.length === 0) {
    throw new Error('No user data provided to create user info');
  }
  let _transactions: Transaction[] = [];
  let _txids: string[] = [];

  // if (options.assistDomain && !oldUserData.nameId) {
  if (isEmpty(oldUserData.name)) {
    let utxo: {
      txid: string;
      outIndex: number;
      value: number;
      address: string;
    };
    for (let i = 0; i < metaDatas.length; i++) {
      const metaData = metaDatas[i];
      const _options: any = {
        network: options?.network ?? 'testnet',
        signMessage: 'create User Info',
        serialAction: 'finish',
        assistDomain: options.assistDomain as string,
      };
      if (utxo) {
        _options.utxo = utxo;
      }
      const { txid, utxo: _utxo } = await createPinWithAsset(metaData, _options);
      utxo = _utxo;
      //   utxoStore.insert(utxo, utxo.address)

      if (txid) {
        _txids.push(txid);
      }
    }
  } else {
    for (let i = 0; i < metaDatas.length; i++) {
      const metaData = metaDatas[i];
      const { transactions, txid, txids } = await createPin(metaData, {
        network: options?.network ?? 'testnet',
        signMessage: 'create User Info',
        serialAction: i === metaDatas.length - 1 ? 'finish' : 'combo',
        transactions: [..._transactions],
        feeRate: options?.feeRate,
      });
      _transactions = transactions as Transaction[];
      if (txids) {
        _txids = txids;
      }
    }
  }
  const ret: { [key: string]: { txid: string | undefined } | undefined } = {
    nameRes: undefined,
    bioRes: undefined,
    avatarRes: undefined,
    backgroundRes: undefined,
    chatpubkeyRes: undefined,
  };
  type ResKey = 'nameRes' | 'bioRes' | 'avatarRes' | 'backgroundRes' | 'chatpubkeyRes';
  const userInfos: {
    key: string;
    resKey: ResKey;
  }[] = [
    {
      key: 'name',
      resKey: 'nameRes',
    },
    {
      key: 'bio',
      resKey: 'bioRes',
    },
    {
      key: 'avatar',
      resKey: 'avatarRes',
    },
    {
      key: 'background',
      resKey: 'backgroundRes',
    },
    {
      key: 'chatpubkey',
      resKey: 'chatpubkeyRes',
    },
  ];
  for (let i = 0; i < userInfos.length; i++) {
    const { key, resKey } = userInfos[i];
    if (userData[key as keyof typeof userData]) {
      const txid = _txids.shift();
      ret[resKey as ResKey] = {
        txid,
      };
    }
  }

  return ret;
};

export const MAN_PUB_KEY =
  '048add0a6298f10a97785f7dd069eedb83d279a6f03e73deec0549e7d6fcaac4eef2c279cf7608be907a73c89eb44c28db084c27b588f1bd869321a6f104ec642d';
export const getEcdhPublickey = async (
  pubkey?: string,
): Promise<
  | {
      externalPubKey: string;
      sharedSecret: string;
      ecdhPubKey: string;
      creatorPubkey: string;
    }
  | any
> => {
  try {
    const ecdh = await getECDHData({
      externalPubKey: pubkey ?? MAN_PUB_KEY, //''//pubkey
    });
    return ecdh;
  } catch (error) {}
};

// export const createUserPubkey=async ({
//   pubkey,
//   options,
// }: {
//   pubkey:string
//   options: { feeRate?: number; network?: BtcNetwork; assistDomain?: string }
// }): Promise<any> => {
//   const metaDatas: MetaidData[] = []
//   const utxoStore = useUtxosStore()
//   const userStore=useUserStore()
//   const localUtxo= utxoStore.getUtxo(userStore.last.address)
//   const availableUtxo=await getUseableUtxo()

//   try {

//   if (pubkey) {
//     metaDatas.push({
//       operation:'create',
//       body: pubkey,
//       path: `${import.meta.env.VITE_ADDRESS_HOST}:/info/chatpubkey`,
//       encoding: 'utf-8',
//       contentType: 'text/plain',
//       flag: 'metaid',
//     })
//   }else{
//      throw new Error('No Publickey provided to create user info')
//   }

//   if (metaDatas.length === 0) {
//     throw new Error('No user data provided to publickey')
//   }
//   let _transactions: Transaction[] = []
//   let _txids: string[] = []
//   if(options.assistDomain  && availableUtxo.length) {

//     for (let i = 0; i < metaDatas.length; i++) {
//       const metaData = metaDatas[i]
//       const { transactions, txid, txids } = await createPin(metaData, {
//         network: options?.network ?? 'testnet',
//         signMessage: 'create User Info',
//         serialAction: i === metaDatas.length - 1 ? 'finish' : 'combo',
//         transactions: [..._transactions],
//         feeRate: options?.feeRate,
//       })
//       _transactions = transactions as Transaction[]
//       if (txids) {
//         _txids = txids
//       }
//        return _txids[0]
//     }
//   }else if (options.assistDomain  && localUtxo) {

//     let utxo: {
//       txid: string
//       outIndex: number
//       value: number
//       address: string
//     }=localUtxo

//     for (let i = 0; i < metaDatas.length; i++) {
//       const metaData = metaDatas[i]
//       const _options: any = {
//         network: options?.network ?? 'testnet',
//         signMessage: 'create User Info',
//         serialAction: 'finish',
//         assistDomain: options.assistDomain as string,
//       }
//       if (utxo) {
//         _options.utxo = utxo
//       }
//       const { txid, utxo: _utxo } = await createPinWithAsset(metaData, _options)
//       utxo = _utxo
//       utxoStore.insert(utxo, utxo.address)

//       if (txid) {
//         _txids.push(txid)
//       }
//       return _txids[0]
//     }
//   }else{
//    throw new Error('No available UTXO')
//   }

//   } catch (error) {
//     throw new Error(`${(error as any).toString()}`)
//   }
// }

export async function getMVCRewards(
  params: {
    address: string;
    gasChain: 'mvc';
  },
  signature: {
    'X-Signature': string;
    'X-Public-Key': string;
  },
  options?: { [key: string]: unknown },
): Promise<any> {
  const response = await fetch(
    'https://www.metaso.network/assist-open-api/v1/assist/gas/mvc/address-reward',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature['X-Signature'] || '',
        'X-Public-Key': signature['X-Public-Key'] || '',
        ...(typeof options?.headers === 'object' && options?.headers !== null
          ? options.headers
          : {}),
      },
      body: JSON.stringify(params),
      ...options,
    },
  );
  return response.json();
}
