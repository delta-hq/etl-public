import {
  insertPool,
  addLiquidity,
  removeLiquidity,
  processKriyaSwap,
} from "src/indexing/process/kriya/queries";
import {
  kriyaPoolCreated,
  kriyaLiquidityAdded,
  kriyaLiquidityRemoved,
  kriyaSwap,
  getSuiKit,
} from "src/indexing/services/sui";
import { processor } from "src/indexing/services/utils";

import { getCoinFullAddress, getPoolType } from "./utils";
import { ParsedKriyaPoolCreation } from "src/indexing/types/kriya";

export const processKriyaPoolCreation = async () =>
  processor(kriyaPoolCreated, insertPool);

export const processKriyaLiquidityAdded = async () =>
  processor(kriyaLiquidityAdded, addLiquidity);

export const processKriyaLiquidityRemoved = async () =>
  processor(kriyaLiquidityRemoved, removeLiquidity);

// given the sway kriya swaps occur, it needed a more custom process logic
export const processKriyaSwapEvent = async () => {
  const suiKit = getSuiKit();

  let hasNextPage = true;

  while (hasNextPage) {
    const results = await suiKit.rpcProvider.provider.queryEvents({
      query: {
        MoveEventType: kriyaPoolCreated,
      },
      limit: 10,
      order: "ascending",
    });

    for (const result of results.data) {
      const parsedJson = result.parsedJson as ParsedKriyaPoolCreation;
      const poolType = await getPoolType(parsedJson.pool_id);
      const addresses = await getCoinFullAddress(poolType);

      const event1 = `${kriyaSwap}<${addresses[0]}>`;
      const event2 = `${kriyaSwap}<${addresses[1]}>`;

      await processor(event1, processKriyaSwap(addresses[0]));
      await processor(event2, processKriyaSwap(addresses[1]));
    }

    hasNextPage = results.hasNextPage;
  }
};

const defaultProcess = async () => {
  await processKriyaPoolCreation();
  await processKriyaLiquidityAdded();
  await processKriyaLiquidityRemoved();
  await processKriyaSwapEvent();
};

export default defaultProcess;
