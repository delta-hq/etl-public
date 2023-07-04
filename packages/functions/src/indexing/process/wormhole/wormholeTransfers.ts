import { getTypeOrmClient } from "../../services/db";
import { WormholeBalanceChange } from "src/indexing/services/db/models";

interface WormholeBalanceChangeToBeInserted {
  convertedAmount: number;
  convertedAmountGasAdjusted: number;
  ownerAddress: string;
  amount: string;
  wormholeTransferId: string;
  coinInfoId: number;
  amountUsd?: number;
}

export const insertWormholeBalanceChange = async (
  wormholeBalanceChange: WormholeBalanceChangeToBeInserted
): Promise<number> => {
  try {
    const typeOrmClient = await getTypeOrmClient();
    const isAmountUsdDefined = wormholeBalanceChange.amountUsd !== undefined;

    const insertion = await typeOrmClient
      .getRepository(WormholeBalanceChange)
      .save({
        ownerAddress: wormholeBalanceChange.ownerAddress,
        amount: wormholeBalanceChange.amount,
        convertedAmount: wormholeBalanceChange.convertedAmount,
        convertedAmountGasAdjusted:
          wormholeBalanceChange.convertedAmountGasAdjusted,
        wormholeTransferId: wormholeBalanceChange.wormholeTransferId,
        coinInfoId: wormholeBalanceChange.coinInfoId,
        amountUsd: isAmountUsdDefined ? wormholeBalanceChange.amountUsd : 0,
      });

    return insertion.id;
  } catch (err) {
    console.log(wormholeBalanceChange);
    console.log("failed: insertWormholeBalanceChange");
    throw err;
  }
};
