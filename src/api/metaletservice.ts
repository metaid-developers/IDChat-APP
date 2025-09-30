import { Chain } from '@metalet/utxo-wallet-service';
import { RootBtcBalanceObject } from '../bean/BtcBalanceBean';
import { AssertPrice } from '../types/balance';
import { FeedBtcObject } from '../types/btcfeed';
import { UtxoBean } from '../types/utxoBean';
import { get, post } from '../utils/Api';
import { AddressTokenSummary, Brc20DetailData, SpaceBalance } from './type/Balance';
import { BtcFtOneRecordData } from './type/BtcFtOneRecordData';
import { InscribeResultData, PreInscribe, PreInscribeData } from './type/Inscribe';
import { MvcFtData, MvcFtRecordData } from './type/MvcFtData';
import { MvcNftData, MvcNftDetail, MvcNftListObject } from './type/MvcNftData';
import { MvcFtPriceData } from './type/Price';
import { getWalletNetwork } from '@/utils/WalletUtils';
import { UpdateData } from './type/Update';
import { IcoinsData } from './type/IcoinsData';
import { RootMrc20Data } from '@/bean/BtcFtBean';
import { MetaIDPinsData } from './type/MetaIDPinsData';
import { Mrc20RecordData } from './type/Mrc20RecordData';
import { t } from 'i18next';
import { TxIdData } from './type/TxId';
import { MvcActivityRecord } from '@/types/mvcrecord';
import { RootDataObject, RootDataObject2, RootDataObject3 } from './type/RootDataObject';
import { PINsBean } from './type/PINsBean';
import { Mrc721ItemBean } from './type/Mrc721ItemBean';
import { Mrc721SerListBean } from './type/Mrc721SerListBean';
import { DappListBean } from './type/DappListBean';
import { UerMetaIDInfo } from './type/UserMetaIDinfoBean';

// export const BASE_MVC_API_URL = "https://mainnet.mvcapi.com";
export const BASE_MVC_API_URL_TESTNET = 'https://testnet.mvcapi.com';
export const BASE_METALET_URL = 'https://www.metalet.space';
export const BASE_METALET_V4_URL = '/wallet-api/v4/mvc';
export const BASE_METAID_IO_URL = 'https://man.metaid.io';
export const BASE_IDCHAT_IO_URL = 'https://api.idchat.io';

//资产价格
export const BALANCE_PRICE_URL = BASE_METALET_URL + '/wallet-api/v3/coin/price';

//1.匿名函数模式封装
export const fetchAssetsPrice = async (): Promise<AssertPrice> => {
  const data = await get(BALANCE_PRICE_URL);
  return data;
};

//2.获取mvc 交易记录
export async function fetchMvcActivityComfird(address: string, isConfirm: boolean) {
  // const data = await get(
  //   BASE_MVC_API_URL + "/address/" + address + "/tx",
  //   false,
  //   { confirm: isConfirm }
  // );
  // return data;
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject2 = await get(
    BASE_METALET_URL + BASE_METALET_V4_URL + '/address/tx-list',
    false,
    { net: network, address: address },
  );
  console.log('fetchMvcActivityComfird', result);

  const data = result.data.list as MvcActivityRecord[];
  return data;
}

//3.btc record
export async function fetchBtcActivityRecord(address: string) {
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/address/activities', false, {
    address: address,
    chain: 'btc',
  });
  return data;
}

//4.feed
export async function fetchBtcFeed(): Promise<FeedBtcObject> {
  const network = await getWalletNetwork(Chain.BTC);
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/btc/fee/summary', false, {
    net: network,
  });
  return data;
}

//5.btc balance
export async function fetchBtcBalance(address: string): Promise<RootBtcBalanceObject> {
  const network = await getWalletNetwork(Chain.BTC);
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/address/btc-balance', false, {
    address,
    net: network,
  });
  return data;
}

//6.btc utxo
export async function fetchBtcUtxo(address: string): Promise<UtxoBean> {
  const network = await getWalletNetwork(Chain.BTC);

  const data = await get(BASE_METALET_URL + '/wallet-api/v3/address/btc-utxo', false, {
    address,
    net: network,
    unconfirmed: '1',
    order: 'desc',
  });
  return data;
}

// 7.space broadcast
export async function broadcastSpace(hex: string): Promise<{ txid: string; message: string }> {
  const network = await getWalletNetwork();

  // const data = await post(
  //   network == "mainnet"
  //     ? BASE_MVC_API_URL + "/tx/broadcast"
  //     : BASE_MVC_API_URL_TESTNET + "/tx/broadcast",
  //   { hex: hex }
  // );

  const result: RootDataObject = await post(BASE_METALET_URL + '/wallet-api/v4/mvc/tx/broadcast', {
    net: network == 'mainnet' ? 'livenet' : 'testnet',
    rawTx: hex,
  });
  // console.log("result",result);
  let data = { txid: (result.data as TxIdData).TxId, message: result.message };
  return data;
}

// 8.MVC ft data
export async function fetchMvcFtBalance(address: string): Promise<MvcFtData[]> {
  // const network = await getWalletNetwork();
  // const url =
  //   network == "testnet" ? BASE_MVC_API_URL_TESTNET : BASE_MVC_API_URL;
  // const data = await get(
  //   url + "/contract/ft/address/" + address + "/balance",
  //   true
  // );
  // return data;
  try {
    const network = await getWalletNetwork(Chain.BTC);
    const result: RootDataObject2 = await get(
      BASE_METALET_URL + BASE_METALET_V4_URL + '/address/contract/ft/balance-list',
      false,
      { net: network, address: address },
    );
    const data = result.data.list as MvcFtData[];
    return data;
  } catch (error) {
    console.log('error fetchMvcFtBalance', error);
    return null;
  }
}

// 9. MVC nft data
export async function fetchMvcNftBalance(
  address: string,
  cursor?: number,
): Promise<MvcNftListObject[]> {
  // const network = await getWalletNetwork(Chain.BTC);
  // const url =
  //   network == "testnet" ? BASE_MVC_API_URL_TESTNET : BASE_MVC_API_URL;
  // const data = await get(
  //   url + "/wallet-api/v3/address/contract/nft/utxo",
  //   false,
  //   { net: "livenet", address: address }
  // );
  // return data;
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject2 = await get(
    BASE_METALET_URL + BASE_METALET_V4_URL + '/address/contract/nft/summary-list',
    false,
    // { net: network, address: address, detailCount: 3 }
    { net: network, address: address, detailCount: 3, size: 5, cursor: cursor || 0 },
  );

  // console.log("fetchMvcNftBalance----", JSON.stringify(result));

  const data = result.data.list as MvcNftListObject[];
  return data;

  // MvcNftListObject
}

// 10.btc broadcast
export async function broadcastBtc(hex: string): Promise<{
  code: number;
  message: string;
  processingTime: number;
  data: string;
}> {
  // const network = await getWalletNetwork(Chain.BTC);
  const network = await getWalletNetwork();
  console.log('network', network);

  const data = await post(BASE_METALET_URL + '/wallet-api/v3/tx/broadcast', {
    chain: 'btc',
    net: network,
    rawTx: hex,
  });
  console.log('broadcastBtc----', data);

  return data;
  // return { code: 1,message: "string", processingTime: 1,data: "string"};
}

// 11.mvc ft price
export async function fetchMvcFtPrice(): Promise<MvcFtPriceData> {
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/coin/contract/ft/price', true);
  return data;
}

// balance
//12.space balance
export async function fetchSpaceBalance(address: string): Promise<SpaceBalance> {
  const network = await getWalletNetwork();
  // const dataMvcBalance: SpaceBalance = await get(
  //   network == "mainnet"
  //     ? BASE_MVC_API_URL + "/address/" + address + "/balance"
  //     : BASE_MVC_API_URL_TESTNET + "/address/" + address + "/balance"
  // );
  const data: RootDataObject = await get(
    BASE_METALET_URL + BASE_METALET_V4_URL + '/address/balance-info',
    false,
    { net: network, address: address },
  );

  const dataMvcBalance: SpaceBalance = data.data as SpaceBalance;

  return dataMvcBalance;
}

// 13.mvc ft record
export async function fetchMvcFtRecord(
  address: string,
  genesis: string,
  codeHash: string,
): Promise<MvcFtRecordData[]> {
  // const dataMvcBalance: MvcFtRecordData[] = await get(
  //   BASE_MVC_API_URL +
  //     "/contract/ft/address/" +
  //     address +
  //     "/" +
  //     codeHash +
  //     "/" +
  //     genesis +
  //     "/tx"
  // );
  // return dataMvcBalance;

  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject2 = await get(
    BASE_METALET_URL + BASE_METALET_V4_URL + '/address/contract/ft/tx-list',
    false,
    { net: network, address: address, codeHash: codeHash, genesis: genesis },
  );
  const data = result.data.list as MvcFtRecordData[];
  return data;
}

// 14. ft btc price
export async function fetchBtcFtPrice(): Promise<MvcFtPriceData> {
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/coin/brc20/price', true);
  return data;
}

//15. brc20 one balance
export async function fetchOneBrc20(
  address: string,
  net: string,
  ticker: string,
): Promise<Brc20DetailData> {
  const data: Brc20DetailData = await get(
    BASE_METALET_URL + '/wallet-api/v3/brc20/token-summary',
    false,
    { net: net, ticker: ticker, address: address },
  );
  return data;
}

//16. brc20 one record
export async function fetchBrc20Record(
  address: string,
  chain: string,
  ticker: string,
): Promise<BtcFtOneRecordData> {
  const data: BtcFtOneRecordData = await get(
    BASE_METALET_URL + '/wallet-api/v3/address/brc20/activities',
    false,
    { chain: chain, tick: ticker, address: address },
  );
  return data;
}

//17.brc20 inscribe pre
export async function fetchBrc20InscribePre(
  receiveAddress: string,
  feeRate: number,
  net: string,
  filename: string,
): Promise<PreInscribeData> {
  const requestData = {
    feeRate,
    files: [
      {
        filename,
        dataURL: Buffer.from(filename).toString('base64'),
      },
    ],
    net,
    inscriptionOutValue: 546,
    receiveAddress,
  };
  console.log('fetchBrc20InscribePre 请求参数： ', requestData);

  const data: PreInscribeData = await post(
    // BASE_METALET_URL + "/wallet-api/v3/inscribe/pre",
    BASE_METALET_URL + '/wallet-api/v4/btc/ordinal/inscribe/pre',
    requestData,
  );
  console.log('fetchBrc20InscribePre 铭刻预览数据： ', data);

  return data;
}

//18.brc20 inscribe commit
export async function fetchBrc20InscribeCommit(
  version: number,
  orderId: string,
  feeAddress: string,
  net: string,
  rawTx: string,
): Promise<InscribeResultData> {
  console.log('fetchBrc20InscribeCommit 请求参数： ', orderId);
  console.log('fetchBrc20InscribeCommit rawTx: ', rawTx);
  console.log('fetchBrc20InscribeCommit net: ', net);

  const data: InscribeResultData = await post(
    // BASE_METALET_URL + "/wallet-api/v3/inscribe/commit",
    BASE_METALET_URL + '/wallet-api/v4/btc/ordinal/inscribe/commit',
    {
      version,
      orderId,
      feeAddress,
      net,
      rawTx,
      // addressType:1
    },
  );
  console.log('fetchBrc20InscribeCommit 铭刻提交数据： ', data);

  return data;
}

// 19.check upgrade
export async function fetchCheckUpgrade(platform: string): Promise<UpdateData> {
  const data: UpdateData = await post(BASE_METALET_URL + '/app-base/v1/app/upgrade/info', {
    app_name: 'Metalet-v3',
    platform: platform,
  });
  return data;
}

//20. icons
export async function fetchIcons(): Promise<IcoinsData> {
  const data: IcoinsData = await get(BASE_METALET_URL + '/wallet-api/v3/coin/icons', true);
  return data;
}

//21.mrc20
export async function fetchMrc20List(net: string, address: string): Promise<RootMrc20Data> {
  const data: RootMrc20Data = await get(
    BASE_METALET_URL + '/wallet-api/v3/mrc20/address/balance-list',
    false,
    { net, address, cursor: 0, size: 100000 },
  );
  return data;
}

// 22. pins
export async function fetchMetaIDPinsList(net: string, address: string): Promise<MetaIDPinsData> {
  const data: MetaIDPinsData = await get(BASE_METALET_URL + '/wallet-api/v3/address/pins', false, {
    net,
    address,
    cursor: 0,
    size: 1000,
  });
  return data;
}

// 23. mrc20 record
export async function fetchMrc20RecordList(
  net: string,
  address: string,
  tickId: string,
): Promise<Mrc20RecordData> {
  const data: Mrc20RecordData = await get(
    BASE_METALET_URL + '/wallet-api/v3/mrc20/address/activities',
    false,
    { net, address, tickId },
  );
  return data;
}

//24.mrc20 Price
export async function fetchMrc20Price(): Promise<MvcFtPriceData> {
  const network = await getWalletNetwork(Chain.BTC);
  const data: MvcFtPriceData = await get(
    BASE_METALET_URL + '/wallet-api/v3/coin/mrc20/price',
    false,
    { net: network },
  );
  return data;
}

// 24.mvc nft Ser List
// 9. MVC nft data
export async function fetchMvcNftSerList(
  address: string,
  codeHash: string,
  genesis: string,
): Promise<MvcNftDetail[]> {
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject2 = await get(
    BASE_METALET_URL + BASE_METALET_V4_URL + '/address/contract/nft/utxo-list',
    false,
    { net: network, address: address, codehash: codeHash, genesis: genesis },
  );
  const data = result.data.list as MvcNftDetail[];
  return data;
}

export async function checkHasNetWork() {
  const check: UpdateData = await fetchCheckUpgrade('android');
  console.log(JSON.stringify(check));
  return false;
}

// 25.mvc nft Ser List
export async function fetchPINsList(address: string): Promise<PINsBean[]> {
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject3 = await get(
    BASE_METALET_URL + '/wallet-api/v3/address/pins',
    false,
    { net: network, address: address, cnt: true, cursor: 0, size: 1000 },
  );
  const data: PINsBean[] = result.data.list;
  // console.log("长度："+data.length);

  return data;
}

// 26.mvc nft Ser List2
export async function fetchMRC721sList(address: string): Promise<Mrc721SerListBean[]> {
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject3 = await get(
    BASE_METALET_URL + '/wallet-api/v4/man/mrc721/address/collection-list',
    false,
    { net: network, address: address, cursor: 0, size: 1000 },
  );

  const data: Mrc721SerListBean[] = result.data.list;
  // console.log("长度："+data.length);

  return data;
}

// 26.mvc nft Ser List2
export async function fetchMRC721ItemList(
  address: string,
  pinId: string,
  size: number,
): Promise<Mrc721ItemBean[]> {
  const network = await getWalletNetwork(Chain.BTC);
  const result: RootDataObject3 = await get(
    BASE_METALET_URL + '/wallet-api/v4/man/mrc721/address/collection/item-list',
    false,
    { net: network, address: address, pinId: pinId, cursor: 0, size: size },
  );

  const data: Mrc721ItemBean[] = result.data.list;
  // console.log("长度："+data.length);
  return data;
}

//27.mvc feeb
export async function fetchMvcFeed(): Promise<FeedBtcObject> {
  const network = await getWalletNetwork(Chain.BTC);
  const data = await get(BASE_METALET_URL + '/wallet-api/v4/mvc/fee/summary', false, {
    net: network,
  });
  return data;
}

//28.dapps
export async function fetchDappList(): Promise<DappListBean> {
  const network = await getWalletNetwork(Chain.BTC);
  console.log('fetchDappList: ', network);
  const data = await get(BASE_METALET_URL + '/wallet-api/v3/dapp/list', false, { net: network });
  return data;
}

//29.metaID  info
export async function fetchUserMetaIDInfo(address: string): Promise<UerMetaIDInfo> {
  const network = await getWalletNetwork();

  const data: RootDataObject = await get(BASE_METAID_IO_URL + '/api/info/address/'+address, true, {
    net: network,
    address: address,
  });
  const dataUserInfo: UerMetaIDInfo = data.data as UerMetaIDInfo;

  return dataUserInfo;
}

///////////////////////////////////////////////idChat///////////////
// 19.check upgrade
export async function fetchCheckIDChatUpgrade(platform: string): Promise<UpdateData> {
  const data: UpdateData = await post(BASE_IDCHAT_IO_URL + '/app-base/v1/app/upgrade/info', {
    app_name: 'IDChat-v3',
    platform: platform,
  });
  return data;
}
