import {
  KriyaPool,
  ParsedKriyaPoolCreation,
  ParsedKriyaLiquidityAdded,
  KriyaLiquidityAdded,
  KriyaLiquidityRemoved,
  ParsedKriyaLiquidityRemoved,
  ParsedKriyaSwapEvent,
  KriyaSwap,
} from "src/indexing/types/kriya";
import { buildPoolInfo, getKriyaSwap } from "./utils";
import {
  convertTimestampToDate,
  generateInsertionQuery,
} from "src/indexing/services/utils";
import { getClient } from "src/indexing/services/db";
import { Result } from "src/indexing/types";
import { getPriceAtDate } from "src/indexing/services/coingecko";
import { getLiquidityExists, getPool, getPoolExists } from "../dex";
import { coinLookup, coinLookupById } from "src/indexing/services/sui";
import { convertAmount } from "src/indexing/services/utils";

export const insertPool = async (result: Result) => {
  try {
    const txDigest = result.id.txDigest;
    const timestampMs = result.timestampMs ?? "";
    const parsedJson = result.parsedJson as ParsedKriyaPoolCreation;

    const client = await getClient();
    const poolExists = await getPoolExists(parsedJson.pool_id, "kriyaPool");
    if (poolExists) return Promise.resolve();

    const [coinTypeA, coinTypeB] = await buildPoolInfo(parsedJson.pool_id);

    if (coinTypeA && coinTypeB) {
      const kriyaPool: KriyaPool = {
        txDigest,
        poolId: parsedJson.pool_id,
        coinTypeA: coinTypeA?.id,
        coinTypeB: coinTypeB?.id,
        creator: parsedJson.creator,
        isStable: parsedJson.is_stable,
        lpFeePercent: parsedJson.lp_fee_percent,
        protocolFeePercent: parsedJson.protocol_fee_percent,
        scaleA: parsedJson.scaleX,
        scaleB: parsedJson.scaleY,
        timestampMs: new Date(parseInt(timestampMs)),
      };

      const insertionQuery = generateInsertionQuery("kriyaPool", kriyaPool);

      return client.query(insertionQuery);
    }
  } catch (err) {
    console.log(`failed at: Kriya insertPool `);
    throw err;
  }
};

export const addLiquidity = async (result: Result) => {
  try {
    const client = await getClient();
    const liquidityExists = await getLiquidityExists(
      result.id.txDigest,
      "kriyaLiquidity"
    );
    if (liquidityExists) return Promise.resolve();
    const txDigest = result.id.txDigest;
    const timestampMs = result.timestampMs ?? "";
    const parsedJson = result.parsedJson as ParsedKriyaLiquidityAdded;
    const pool = await getPool(parsedJson.pool_id, "kriyaPool");

    const coinA = await coinLookupById(pool.coinTypeA);
    const coinB = await coinLookupById(pool.coinTypeB);

    const convertedAmountA = convertAmount(parsedJson.amount_x, coinA.decimals);
    const convertedAmountB = convertAmount(parsedJson.amount_y, coinB.decimals);

    const tokenPriceA = (await getPriceAtDate(coinA.symbol, timestampMs)) ?? 0;
    const tokenPriceB = (await getPriceAtDate(coinB.symbol, timestampMs)) ?? 0;
    const amountAUsd = convertedAmountA * tokenPriceA;
    const amountBUsd = convertedAmountB * tokenPriceB;

    const kriyaLiquidity: KriyaLiquidityAdded = {
      txDigest,
      pool: parsedJson.pool_id,
      liquidityProviderAddress: parsedJson.liquidity_provider,
      lspMinted: parsedJson.lsp_minted,
      amountA: parsedJson.amount_x,
      amountB: parsedJson.amount_y,
      convertedAmountA,
      convertedAmountB,
      amountAUsd,
      amountBUsd,
      timestampMs: convertTimestampToDate(timestampMs),
    };

    const query = generateInsertionQuery("kriyaLiquidity", kriyaLiquidity);

    return client.query(query);
  } catch (err) {
    console.log(result.parsedJson);

    console.log(`failed at: Kriya addLiquidity `);
    throw err;
  }
};

export const removeLiquidity = async (result: Result) => {
  try {
    const client = await getClient();
    const liquidityExists = await getLiquidityExists(
      result.id.txDigest,
      "kriyaLiquidity"
    );
    if (liquidityExists) return Promise.resolve();

    const txDigest = result.id.txDigest;
    const timestampMs = result.timestampMs ?? "";
    const parsedJson = result.parsedJson as ParsedKriyaLiquidityRemoved;
    const pool = await getPool(parsedJson.pool_id, "kriyaPool");
    const coinA = await coinLookupById(pool.coinTypeA);
    const coinB = await coinLookupById(pool.coinTypeB);
    const convertedAmountA = convertAmount(parsedJson.amount_x, coinA.decimals);
    const convertedAmountB = convertAmount(parsedJson.amount_y, coinB.decimals);
    const tokenPriceA = (await getPriceAtDate(coinA.symbol, timestampMs)) ?? 0;
    const tokenPriceB = (await getPriceAtDate(coinB.symbol, timestampMs)) ?? 0;
    const amountAUsd = convertedAmountA * tokenPriceA;
    const amountBUsd = convertedAmountB * tokenPriceB;

    const kriyaLiquidity: KriyaLiquidityRemoved = {
      txDigest,
      pool: parsedJson.pool_id,
      liquidityProviderAddress: parsedJson.liquidity_provider,
      lspBurned: parsedJson.lsp_burned,
      amountA: parsedJson.amount_x,
      amountB: parsedJson.amount_y,
      convertedAmountA,
      convertedAmountB,
      amountAUsd,
      amountBUsd,
      timestampMs: convertTimestampToDate(timestampMs),
    };

    const query = generateInsertionQuery("kriyaLiquidity", kriyaLiquidity);
    return client.query(query);
  } catch (err) {
    console.log("start");
    console.log(result.id.txDigest);
    console.log(result.parsedJson);

    console.log(`failed at: Kriya removedLiquidity `);
    throw err;
  }
};

export const processKriyaSwap = (coinInAddress: string): Function => {
  return async (result: Result) => {
    const client = await getClient();

    const parsedJson = result.parsedJson as ParsedKriyaSwapEvent;
    const txDigest = result.id.txDigest;
    const pool = await getPool(parsedJson.pool_id, "kriyaPool");
    const coinInLookup = await coinLookup(coinInAddress);

    if (coinInLookup && pool) {
      const coinOutLookup =
        pool.coinAInfo.id === coinInLookup.id ? pool.coinBInfo : pool.coinAInfo;

      const convertedAmountIn = convertAmount(
        parsedJson.amount_in,
        coinInLookup.decimals
      );
      const convertedAmountOut = convertAmount(
        parsedJson.amount_out,
        coinOutLookup.decimals
      );

      const coinInGecko =
        (await getPriceAtDate(coinInLookup.symbol, result.timestampMs)) ?? 0;
      const coinOutGecko =
        (await getPriceAtDate(coinOutLookup.symbol, result.timestampMs)) ?? 0;

      const amountInUsd = convertedAmountIn * coinInGecko;
      const amountOutUsd = convertedAmountOut * coinOutGecko;

      const kriyaSwap: KriyaSwap = {
        txDigest,
        poolId: parsedJson.pool_id,
        swapperAddress: parsedJson.user,
        amountIn: convertedAmountIn,
        amountOut: convertedAmountOut,
        amountInUsd,
        amountOutUsd,
        timestampMs: convertTimestampToDate(result.timestampMs ?? ""),
        reserveA: parsedJson.reserve_x,
        reserveB: parsedJson.reserve_y,
        coinIn: coinInLookup.id,
        coinOut: coinOutLookup.id,
        volumeUsd: amountInUsd + amountOutUsd,
      };

      const swapExists = await getKriyaSwap(kriyaSwap);

      if (swapExists) return Promise.resolve();

      const query = generateInsertionQuery("kriyaSwap", kriyaSwap);
      await client.query(query);
    }
  };
};
