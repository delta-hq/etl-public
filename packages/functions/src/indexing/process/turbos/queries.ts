import {
  ParsedTurbosAddLiquidity,
  ParsedTurbosPoolCreation,
  Result,
} from "src/indexing/types";
import { getTypeOrmClient } from "src/indexing/services/db";
import {
  TurbosLiquidity,
  TurbosPool,
} from "src/indexing/services/db/models/turbos";
import { buildPoolInfo } from "./utils";
import { getPool } from "../dex";

import { coinLookupById, getTransactionBlock } from "src/indexing/services/sui";
import { convertAmount } from "../../services/utils";
import { getPriceAtDate } from "src/indexing/services/coingecko";

export const insertTurbosPool = async (result: Result) => {
  try {
    const txDigest = result.id.txDigest;
    const tx = await getTransactionBlock(txDigest, {});
    const timestampMs = tx.timestampMs ?? "0";
    const parsedJson = result.parsedJson as ParsedTurbosPoolCreation;

    const typeOrmClient = await getTypeOrmClient();

    const pool = await typeOrmClient.getRepository(TurbosPool).findOne({
      where: { poolId: parsedJson.pool },
    });

    console.log(pool);

    if (!pool) return pool;
    const [coinA, coinB] = await buildPoolInfo(parsedJson.pool);

    return typeOrmClient.getRepository(TurbosPool).save({
      txDigest,
      poolId: parsedJson.pool,
      coinTypeA: coinA?.id,
      coinTypeB: coinB?.id,
      tickSpacing: parsedJson.tick_spacing,
      account: parsedJson.account,
      fee: parsedJson.fee,
      feeProtocol: parsedJson.fee_protocol,
      sqrtPrice: parsedJson.sqrt_price,
      timestampMs: new Date(parseInt(timestampMs)),
    });
  } catch (err) {
    console.log("failed: insertTurbosPool");

    throw err;
  }
};

export const insertLiquidityEvent = async (result: Result) => {
  const typeOrmClient = await getTypeOrmClient();
  const poolRepo = await typeOrmClient.getRepository(TurbosLiquidity);

  const txDigest = result.id.txDigest;
  const tx = await getTransactionBlock(txDigest, {});
  const timestampMs = tx.timestampMs ?? "0";
  const liquidity = result.parsedJson as ParsedTurbosAddLiquidity;

  try {
    const poolId = liquidity.pool;
    const liquidityExists = await poolRepo.findOne({
      where: { txDigest },
    });

    if (liquidityExists) return Promise.resolve();
    const pool = await getPool(poolId);
    if (!pool) {
      console.log(liquidity);
      throw new Error("Does not exist, need to account for this");
    }

    const coinA = await coinLookupById(pool.coinTypeA);
    const coinB = await coinLookupById(pool.coinTypeB);

    const convertedAmountA = convertAmount(liquidity.amount_a, coinA.decimals);
    const convertedAmountB = convertAmount(liquidity.amount_b, coinB.decimals);

    const tokenPriceA = (await getPriceAtDate(coinA.symbol, timestampMs)) ?? 0;
    const tokenPriceB = (await getPriceAtDate(coinB.symbol, timestampMs)) ?? 0;
    const amountAUsd = convertedAmountA * tokenPriceA;
    const amountBUsd = convertedAmountB * tokenPriceB;

    return poolRepo.save({
      txDigest,
      amountA: liquidity.amount_a,
      amountB: liquidity.amount_b,
      convertedAmountA,
      convertedAmountB,
      amountAUsd,
      amountBUsd,
      liquidityDelta: liquidity.liquidity_delta,
      pool: liquidity.pool,
      tickLowerBits: liquidity.tick_lower_index.bits,
      tickUpperBits: liquidity.tick_upper_index.bits,
      timestampMs: new Date(parseInt(timestampMs)),
    });
  } catch (err) {
    console.log(liquidity);
    console.log("failed to insert liquidity event");
    throw err;
  }
};
