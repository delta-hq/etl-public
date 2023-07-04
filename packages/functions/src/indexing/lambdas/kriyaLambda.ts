import { ApiHandler } from "sst/node/api";
import defaultProcess from "src/indexing/process/kriya";

export const handler = ApiHandler(async (_evt) => {
  try {
    await defaultProcess();

    return {
      body: "successfully ran kriya lambda",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
