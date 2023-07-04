import { SSTConfig } from "sst";
import { BackendAPI } from "./stacks/BackendStack";
import { SuiIndexer } from "./stacks/SuiIndexingStack";

export default {
  config(_input) {
    return {
      name: "openblocks-backend",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(SuiIndexer);
    app.stack(BackendAPI);
  },
} satisfies SSTConfig;
