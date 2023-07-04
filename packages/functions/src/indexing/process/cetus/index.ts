import { insertPool, insertLiquidityEvent, insertSwapEvent } from "./queries";
import {
  addLiquidityEvent,
  removeLiquidityEvent,
  createPoolEvent,
  swapEvent,
} from "../../services/sui";
import { convertToNegative, processor } from "../../services/utils";

export const processSwapEvents = async () =>
  processor(swapEvent, insertSwapEvent);

export const processAddLiquidityEvents = async () =>
  processor(addLiquidityEvent, insertLiquidityEvent);

const insertRemoveLiquidityWrapper = async (result: any) => {
  if (result?.parsedJson?.amount_a)
    result.parsedJson.amount_a = convertToNegative(result.parsedJson.amount_a);
  if (result?.parsedJson?.amount_b)
    result.parsedJson.amount_b = convertToNegative(result.parsedJson.amount_b);

  await insertLiquidityEvent(result);
};

export const processRemoveLiquidityEvents = async () =>
  processor(removeLiquidityEvent, insertRemoveLiquidityWrapper);

export const processPoolCreationEvents = async () =>
  processor(createPoolEvent, insertPool);
