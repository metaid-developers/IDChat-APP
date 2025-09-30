import { AddressType } from "@metalet/utxo-wallet-service";

export type WalletBean = {
  id: string;
  name: string;
  mnemonic: string;
  mvcTypes: number;
  accountsOptions: AccountsOptions[];

  //dev
  isOpen: boolean;
  addressType: AddressType;
  //钱包助记词是否备份
  isBackUp: boolean;
  //当前钱包选中的account 对应 addressIndex
  isCurrentPathIndex: number;
  seed: string;
  isColdWalletMode?: string;
  coldAddress?: string;
  coldPublicKey?: string;
  // isColdWalletModeTest?: string;


  //MetaID
  metaId?:String;
  avatarUrl?:String;                                                                                            
  userName?:String;
  


};

export type AccountsOptions = {
  id: string;
  name: string;
  addressIndex: number;

  //dev
  isSelect: boolean;
  defaultAvatarColor: string[];
};

// 不管是type 还是interface 都更多的是类型约束 提供属性和必要的方法 让其去实现对应的类型
