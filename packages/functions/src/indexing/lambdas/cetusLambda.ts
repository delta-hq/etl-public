import { ApiHandler } from "sst/node/api";
import {
  processPoolCreationEvents,
  processAddLiquidityEvents,
  processRemoveLiquidityEvents,
} from "src/indexing/process/cetus";

export const handler = ApiHandler(async (_evt) => {
  try {
    // process all the pool creation events
    // await processPoolCreationEvents();
    // await processAddLiquidityEvents();
    await processRemoveLiquidityEvents();

    return {
      body: "success cetus added liquidity",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
