import { insertWormholeTransfer } from ".";

import {
  eventTransferOut,
  getChainId,
  eventTransferIn,
  getIsAttesting,
  getTransactionBlock,
  coinLookup,
} from "../../services/sui";

import { WH_CHAIN_MAP } from "../../services/constants";
import { processor } from "src/indexing/services/utils";
import { Result } from "src/indexing/types";

const processItemInflow = async (item: any) => {
  const { txDigest } = item.id;

  const digest = await getTransactionBlock(txDigest, {
    showBalanceChanges: true,
    showEffects: true,
  });

  if (digest.balanceChanges === undefined) {
    console.log(digest);
    return;
  }
  const { balanceChanges } = digest;

  // this function gets relevant coininfo for each transfer
  for (const balanceChange of balanceChanges) {
    const coinInfo = await coinLookup(balanceChange.coinType);

    // @ts-ignore
    balanceChange.coinInfo = coinInfo ? coinInfo : {};
  }

  const final = {
    sourceChainId: item.parsedJson.emitter_chain,
    sourceChain: WH_CHAIN_MAP[item.parsedJson.emitter_chain] ?? "Unknown",
    destinationChain: "Sui",
    destinationChainId: 21,
    ...digest,
  };

  // insert the data into the table
  await insertWormholeTransfer(final, digest);

  return Promise.resolve(final);
};

const processItemOutflow = async (result: Result) => {
  const digest = await getTransactionBlock(result.id.txDigest, {
    showInput: true,
    showBalanceChanges: true,
    showEffects: true,
  });

  if (digest.balanceChanges === undefined) return;

  const chainId = getChainId(digest);

  if (chainId === undefined) {
    const isAttesting = getIsAttesting(digest);

    if (isAttesting === false) {
      console.log(`NO CHAIN ID AND IS NOT ATTESTING: ${result.id.txDigest}`);
    } else {
      console.log("chain undefined");
      console.log(result.id.txDigest);
    }

    return;
  }

  // this function gets relevant coininfo for each transfer
  for (const balanceChange of digest.balanceChanges) {
    const coinInfo = await coinLookup(balanceChange.coinType);

    // @ts-ignore
    balanceChange.coinInfo = coinInfo ? coinInfo : {};
  }

  const final = {
    sourceChainId: 21,
    sourceChain: "Sui",
    destinationChainId: chainId,
    destinationChain: WH_CHAIN_MAP[chainId],
    ...digest,
  };

  // insert the data into the table
  await insertWormholeTransfer(final, digest);
};

export const processInflows = async (): Promise<void> =>
  processor(eventTransferIn, processItemInflow);

export const processOutflows = async (): Promise<void> =>
  processor(eventTransferOut, processItemOutflow);
