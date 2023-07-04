import { SuiKit } from "@scallop-dao/sui-kit";
import fetch from "node-fetch";

import { SuiCoinCoinMap, Input, Options } from "../../types";
import { SUI_OFFICIAL_COINS } from "../constants";
import { CoinInfo } from "src/indexing/services/db/models";
import { findOrCreateCoinInfo } from "../../services/coingecko/coinInfo";
import { getTypeOrmClient } from "../db";

// @ts-ignore
globalThis.fetch = fetch; // suikit uses fetch from node version 18. Sometimes lambdas don't have node 18 and this fixes it

// return the suikit
export const getSuiKit = () => {
  return new SuiKit({
    networkType: "mainnet",
    fullnodeUrl: "https://fullnode.mainnet.sui.io",
  });
};

export const getTransactionBlock = async (
  txDigest: string,
  options: Options
) => {
  const suiKit = getSuiKit();

  // this gets the difference coin transfers from the request
  return suiKit.rpcProvider.provider.getTransactionBlock({
    digest: txDigest,
    options,
  });
};

const suiCoinMap: SuiCoinCoinMap = {};

export const coinLookup = async (address: string): Promise<CoinInfo | null> => {
  if (suiCoinMap[address] !== undefined) return suiCoinMap[address];
  const suiAddress = address.split("::")[0];

  const suiKit = getSuiKit();

  const coinInfo = await suiKit.rpcProvider.provider.getCoinMetadata({
    coinType: address,
  });

  if (coinInfo == null) return null;

  const verified = SUI_OFFICIAL_COINS[suiAddress] !== undefined;
  const final = { ...coinInfo, verified };

  const findOrCreateFinal = { ...final, address: final.id };

  // @ts-ignore
  if (findOrCreateFinal.id) delete findOrCreateFinal.id;

  // @ts-ignore
  const coinInfodb = await findOrCreateCoinInfo(findOrCreateFinal);

  if (coinInfodb === null) return null;
  suiCoinMap[address] = coinInfodb;

  return suiCoinMap[address];
};

interface CoinMapDB {
  [key: string]: CoinInfo;
}

const coinMapIdCache: CoinMapDB = {};

export const coinLookupById = async (id: string): Promise<CoinInfo> => {
  if (coinMapIdCache[id] !== undefined) return coinMapIdCache[id];

  const client = await getTypeOrmClient();
  const result = await client.getRepository(CoinInfo).findOne({
    where: {
      id: parseInt(id),
    },
  });

  // @ts-ignore
  coinMapIdCache[id] = result;

  return coinMapIdCache[id];
};

// get the chain id from the digest
export const getChainId = (digest: any): number | undefined => {
  const inputs: Array<Input> = digest.transaction?.data.transaction.inputs;
  let count = 0;
  let chainId;

  for (const { type, valueType, value } of inputs) {
    if (type === "pure" && valueType === "u16" && value !== undefined) {
      count++;
      chainId = value;
    }
  }

  if (count > 1) {
    console.log("oH SHIT");
  }

  return chainId;
};

// verify is publish_message is an attesting transaction and can be ignored
export const getIsAttesting = (digest: any): boolean => {
  for (const transaction of digest.transaction?.data.transaction.transactions) {
    if (transaction?.MoveCall?.module === "attest_token") return true;
  }

  return false;
};

export * from "./events";
