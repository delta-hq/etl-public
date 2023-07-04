import { StackContext, Api, EventBus } from "sst/constructs";

const LIDO_ROUTES = {
  "POST /lido/data": "packages/functions/src/backend/lido.data",
  "POST /lido/distinct": "packages/functions/src/backend/lido.distinct",
};

const SUI_ROUTES = {
  "GET /sui/wormhole/chainCounts":
    "packages/functions/src/backend/sui/sui.getWormholeChainCounts",
  "GET /sui/wormhole/volume":
    "packages/functions/src/backend/sui/sui.getWormholeVolume",
  "GET /sui/wormhole/topAddresses":
    "packages/functions/src/backend/sui/sui.getTopWormholeAddresses",
  "GET /sui/wormhole/transfers":
    "packages/functions/src/backend/sui/sui.getTopWormholeAddresses",
  "GET /sui/spreadsheet":
    "packages/functions/src/backend/sui/sui.getSpreadsheet",
};

export function BackendAPI({ stack }: StackContext) {
  const api = new Api(stack, "api", {
    defaults: {
      // The steady-state rate of the number of concurrent request for all the routes in the AP
      throttle: {
        rate: 10,
      },
    },
    cors: {
      allowMethods: ["ANY"],
      allowOrigins: ["*"],
    },
    routes: {
      "GET /": "packages/functions/src/backend/main.get",
      ...LIDO_ROUTES,
      ...SUI_ROUTES,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
