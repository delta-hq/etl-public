import { ApiHandler } from "sst/node/api";
import { processSwapEvents } from "src/indexing/process/cetus";

export const handler = ApiHandler(async (_evt) => {
  try {
    await processSwapEvents();

    return {
      body: "success cetus swap event",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
