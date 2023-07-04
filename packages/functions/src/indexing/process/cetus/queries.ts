import {
  ParsedCetusLiquidity,
  ParsedPool,
  ParsedSwapEvent,
} from "../../types/cetus";
import { getPriceAtDate } from "../../services/coingecko";
import { getTypeOrmClient } from "../../services/db";
import {
  coinLookup,
  coinLookupById,
  getSuiKit,
  getTransactionBlock,
} from "src/indexing/services/sui";
import { convertAmount } from "src/indexing/services/utils";
import { calculateSwapVolUSD, getPool } from "./utils";
import {
  CetusLiquidity,
  CetusPool,
  CetusSwap,
} from "src/indexing/services/db/models/cetus";

export const insertSwapEvent = async (result: any) => {
  const txDigest = result.id.txDigest;
  const tx = await getTransactionBlock(txDigest, {});
  const timestampMs = tx.timestampMs ?? "0";

  const parsedSwapEvent = result.parsedJson as ParsedSwapEvent;
  const swapperAddress = result.sender;
  const client = await getTypeOrmClient();
  const cetusClient = await client.getRepository(CetusSwap);

  const {
    after_sqrt_price,
    before_sqrt_price,
    fee_amount,
    pool: poolId,
    atob: aToB,
    ref_amount,
    steps,
    amount_in,
    amount_out,
  } = parsedSwapEvent;
  const pool = await getPool(parsedSwapEvent.pool);

  if (!pool) {
    console.log(parsedSwapEvent);
    throw new Error("Does not exist, need to account for this");
  }

  const coinA = pool.coinTypeA;
  const coinB = pool.coinTypeB;

  const [coinIn, coinOut] = aToB ? [coinA, coinB] : [coinB, coinA];

  if (coinA && coinB) {
    const amountIn = convertAmount(amount_in, coinIn.decimals);
    const amountOut = convertAmount(amount_out, coinOut.decimals);

    const swapExists = await cetusClient.findOne({
      where: {
        txDigest,
        amountIn,
        amountOut,
        coinIn: coinIn.id,
        coinOut: coinOut.id,
        timestampMs: new Date(parseInt(timestampMs)),
      },
    });

    if (swapExists !== null) return;

    const coinInPrice = (await getPriceAtDate(coinIn.symbol, timestampMs)) ?? 0;
    const coinOutPrice =
      (await getPriceAtDate(coinOut.symbol, timestampMs)) ?? 0;

    const volume = await calculateSwapVolUSD(
      amountIn,
      amountOut,
      coinA,
      coinB,
      aToB,
      timestampMs
    );

    try {
      return cetusClient.insert({
        txDigest,
        afterSqrtPrice: convertAmount(after_sqrt_price, 18),
        aToB,
        beforeSqrtPrice: convertAmount(before_sqrt_price, 18),
        feeAmount: fee_amount,
        poolId,
        refAmount: ref_amount,
        steps: parseInt(steps),
        volumeUsd: volume,
        coinIn: coinIn.id,
        coinOut: coinOut.id,
        amountIn,
        amountOut,
        amountInUsd: amountIn * coinInPrice,
        amountOutUsd: amountOut * coinOutPrice,
        swapperAddress,
        timestampMs: new Date(parseInt(timestampMs)),
      });
    } catch (err) {
      console.log(txDigest);
      console.log(parsedSwapEvent);
      throw err;
    }
  }

  return Promise.resolve();
};

export const insertLiquidityEvent = async (result: any) => {
  const txDigest = result.id.txDigest;
  const timestampMs = result.timestampMs ?? "0";
  const liquidityProviderAddress = result.sender;
  const liquidity = result.parsedJson as ParsedCetusLiquidity;

  try {
    const poolId = liquidity.pool;
    const pool = await getPool(poolId);
    if (!pool) {
      console.log(liquidity);
      throw new Error("Does not exist, need to account for this");
    }
    const coinA = await coinLookupById(pool.coinTypeA.id);
    const coinB = await coinLookupById(pool.coinTypeB.id);
    const convertedAmountA = convertAmount(liquidity.amount_a, coinA.decimals);
    const convertedAmountB = convertAmount(liquidity.amount_b, coinB.decimals);

    const client = await getTypeOrmClient();
    const liquidityClient = await client.getRepository(CetusLiquidity);

    const liquidityExists = await liquidityClient.findOne({
      where: {
        txDigest: txDigest,
        liquidityProviderAddress,
        afterLiquidity: liquidity.after_liquidity,
        amountA: liquidity.amount_a,
        amountB: liquidity.amount_b,
        convertedAmountA,
        convertedAmountB,
      },
    });

    if (liquidityExists !== null) {
      return Promise.resolve();
    }

    const tokenPriceA = (await getPriceAtDate(coinA.symbol, timestampMs)) ?? 0;
    const tokenPriceB = (await getPriceAtDate(coinB.symbol, timestampMs)) ?? 0;

    const amountAUsd = convertedAmountA * tokenPriceA;
    const amountBUsd = convertedAmountB * tokenPriceB;

    return liquidityClient.insert({
      txDigest: txDigest,
      liquidityProviderAddress,
      afterLiquidity: liquidity.after_liquidity,
      amountA: liquidity.amount_a,
      amountB: liquidity.amount_b,
      convertedAmountA,
      convertedAmountB,
      amountAUsd,
      amountBUsd,
      liquidity: liquidity.liquidity,
      pool: liquidity.pool,
      position: liquidity.position,
      tickLowerBits: `${liquidity.tick_lower.bits}`,
      tickUpperBits: `${liquidity.tick_upper.bits}`,
      timestampMs: new Date(parseInt(timestampMs)),
    });
  } catch (err) {
    console.log(liquidity);
    console.log("failed to insert liquidity event");
    throw err;
  }
};

export const insertPool = async (result: any) => {
  const txDigest = result.id.txDigest;
  const timestampMs = result.timestampMs ?? "0";
  const pool = result.parsedJson as ParsedPool;
  const client = await getTypeOrmClient();
  const poolClient = await client.getRepository(CetusPool);

  try {
    const exists = await poolClient.findOne({
      where: { poolId: pool.pool_id },
    });

    if (exists) return Promise.resolve();

    const coinA = await coinLookup(`0x${pool.coin_type_a}`);
    const coinB = await coinLookup(`0x${pool.coin_type_b}`);

    return poolClient.insert({
      txDigest,
      timestampMs: new Date(parseInt(timestampMs)),
      poolId: pool.pool_id,
      // @ts-ignore
      coinTypeA: coinA.id,
      // @ts-ignore
      coinTypeB: coinB.id,
      tickSpacing: pool.tick_spacing,
    });
  } catch (err) {
    console.log("failed to insert pool");
    console.log(err);
  }
};
