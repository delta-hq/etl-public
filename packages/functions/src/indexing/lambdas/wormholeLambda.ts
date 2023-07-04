import { ApiHandler } from "sst/node/api";
import {
  processInflows,
  processOutflows,
} from "../process/wormhole/processWormhole";

export const handler = ApiHandler(async (_evt) => {
  try {
    // process all wormhole inflows
    await processInflows();

    // process all wormhole outflows
    await processOutflows();
    return {
      body: "success on inflow and outflow lambda",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
