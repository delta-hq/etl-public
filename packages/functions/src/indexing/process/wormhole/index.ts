import { getTypeOrmClient } from "../../services/db";
import { insertWormholeBalanceChange } from "./wormholeTransfers";
import { getPriceAtDate } from "../../services/coingecko";
import { WormholeTransfer } from "src/indexing/services/db/models/wormhole";
import { convertAmount } from "src/indexing/services/utils";

const transferExists = async (query: string) => {
  const typeOrmClient = await getTypeOrmClient();

  try {
    const count = await typeOrmClient
      .getRepository(WormholeTransfer)
      .createQueryBuilder("transfer")
      .where("LOWER(transfer.digest) = LOWER(:query)", { query })
      .getCount();

    return count > 0;
  } catch (error) {
    console.error(error);
  }
};

export const getGasUsed = (digest: any): number => {
  const { computationCost, storageCost, storageRebate } =
    digest.effects.gasUsed;

  const gasUsed =
    convertAmount(computationCost, 9) +
    convertAmount(storageCost, 9) -
    convertAmount(storageRebate, 9);

  return gasUsed;
};

interface WormholeTransferToBeInserted {
  digest: string;
  sourceChainId: number;
  timestampMs?: string;
  checkpoint?: string;
  balanceChanges?: any;
  sourceChain?: string;
  destinationChain?: string;
  destinationChainId?: number;
}

export const insertWormholeTransfer = async (
  wormholeTransfer: WormholeTransferToBeInserted,
  digest: any
): Promise<void> => {
  const typeOrmClient = await getTypeOrmClient();

  try {
    const exists = await transferExists(wormholeTransfer.digest);
    const gasUsed = getGasUsed(digest);

    if (exists) return;

    const item = await typeOrmClient.getRepository(WormholeTransfer).save({
      digest: wormholeTransfer.digest,
      sourceChainId: wormholeTransfer.sourceChainId,
      timestampMs: new Date(parseInt(wormholeTransfer.timestampMs ?? "0")),
      checkpoint: wormholeTransfer.checkpoint,
      sourceChain: wormholeTransfer.sourceChain,
      destinationChain: wormholeTransfer.destinationChain,
      destinationChainId: wormholeTransfer.destinationChainId,
    });

    let adjustedGasUsed = false;

    for (const balanceChange of wormholeTransfer.balanceChanges) {
      const ownerAddress = balanceChange.owner.AddressOwner;
      const amount = balanceChange.amount;
      // if sui is being bridged out, the transfer amount is negative and includes the gas amount.  So we need to adjust for this value
      // if sui is being bridged in, it's already a positive amount and as a result the gas is subtracted properly from the amount
      const gasAdjustment =
        balanceChange.coinInfo.symbol === "SUI" &&
        amount < 0 &&
        adjustedGasUsed === false
          ? gasUsed
          : 0;

      balanceChange.coinInfo.symbol === "SUI" &&
      amount < 0 &&
      adjustedGasUsed === false
        ? gasUsed
        : 0;
      const wormholeTransferId = wormholeTransfer.digest;
      const convertedAmount = convertAmount(
        amount,
        balanceChange.coinInfo.decimals
      );

      const convertedAmountGasAdjusted = convertedAmount + gasAdjustment;

      const tokenPrice = await getPriceAtDate(
        balanceChange.coinInfo.symbol,
        wormholeTransfer.timestampMs
      );

      if (gasAdjustment !== 0) adjustedGasUsed = true;

      const amountUsd =
        tokenPrice !== undefined ? convertedAmountGasAdjusted * tokenPrice : 0;

      const final = {
        ownerAddress,
        amount,
        wormholeTransferId,
        coinInfoId: balanceChange.coinInfo.id,
        convertedAmount,
        convertedAmountGasAdjusted,
      };

      try {
        const id = await insertWormholeBalanceChange({ ...final, amountUsd });
      } catch (err) {
        console.log("Failed to insert wormhole balance change");
        console.log(final);
        console.log(amountUsd);
        console.log(err);
        throw err;
      }
    }

    return Promise.resolve();
  } catch (err) {
    console.log("insertion failed");
    console.log(err);

    console.log(wormholeTransfer);

    throw err;
  }
};
