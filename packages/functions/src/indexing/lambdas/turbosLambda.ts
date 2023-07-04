import { ApiHandler } from "sst/node/api";
import {
  processTurbosPoolCreation,
  processAddLiquidity,
} from "src/indexing/process/turbos";

export const handler = ApiHandler(async (_evt) => {
  try {
    // process all the pool creation events
    await processTurbosPoolCreation();

    // process all turbos liquidity
    await processAddLiquidity();

    return {
      body: "successfully ran turbo lambda",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
