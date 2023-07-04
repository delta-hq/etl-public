import { ApiHandler } from "sst/node/api";

// inflow and outfloat
//

export const get = ApiHandler(async (_evt) => {
  console.log(_evt);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "hello world" }),
  };
});
