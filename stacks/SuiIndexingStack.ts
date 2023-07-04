import { StackContext } from "sst/constructs";
import { Cron } from "sst/constructs";

export function SuiIndexer({ stack }: StackContext) {
  if (process.env.SEED_STAGE_NAME === "prod") {
    stack.setDefaultFunctionProps({
      timeout: "14 minutes",
      runtime: "nodejs18.x",
      environment: {
        isDev: `${process.env.SEED_STAGE_NAME !== "prod"}`,
      },
    });
    const RATE = "rate(365 days)";

    const kriyaLambda = new Cron(stack, "KriyaLambda", {
      schedule: RATE,
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/kriyaLambda.handler",
        },
      },
    });

    const wormholeLambda = new Cron(stack, "wormholeLambda", {
      schedule: RATE,
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/wormholeLambda.handler",
        },
      },
    });

    const dailyCoinInfoUpdate = new Cron(stack, "dailyCoinInfoUpdate", {
      schedule: "rate(24 hours)",
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/coinInfoDailyUpdate.handler",
        },
      },
    });

    const cetusLambda = new Cron(stack, "cetusLambda", {
      schedule: RATE,
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/cetusLambda.handler",
        },
      },
    });

    const SwapEvents = new Cron(stack, "SwapEventsLambda", {
      schedule: "rate(15 minutes)",
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/cetusSwapLambda.handler",
        },
      },
    });

    return;
  } else if (process.env.SEED_STAGE_NAME === undefined) {
    stack.setDefaultFunctionProps({
      timeout: "1 minute",
      runtime: "nodejs18.x",
      environment: {
        isDev: `${process.env.SEED_STAGE_NAME !== "prod"}`,
      },
    });
    // anything developing can be added below.  Simply run yarn run remove when done
    const RATE = "rate(365 days)";

    const turbosLambda = new Cron(stack, "TurbosLambda", {
      schedule: "rate(24 days)",
      job: {
        function: {
          handler:
            "packages/functions/src/indexing/lambdas/turbosLambda.handler",
        },
      },
    });
  }
}
