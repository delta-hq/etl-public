import { logCurrentRunTime, processor } from "../../services/utils";
import {
  insertTurbosPool,
  insertLiquidityEvent,
} from "src/indexing/process/turbos/queries";
import {
  turboMintEvent,
  turboPoolCreatedEvent,
} from "src/indexing/services/sui";

export const processTurbosPoolCreation = async () =>
  processor(turboPoolCreatedEvent, insertTurbosPool);

export const processAddLiquidity = async () =>
  processor(turboMintEvent, insertLiquidityEvent);
