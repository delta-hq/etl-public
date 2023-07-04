import { getTypeOrmClient } from "../../services/db";
import { CetusPool, CoinInfo } from "src/indexing/services/db/models";
import { getPriceAtDate } from "../../services/coingecko";
import { UNISWAP_V3_DECIMALS } from "../../services/constants";

interface PoolCache {
  [key: string]: CetusPool;
}

const poolCache: PoolCache = {};

export const getPool = async (poolId: string): Promise<any> => {
  try {
    if (poolCache[poolId]) return Promise.resolve(poolCache[poolId]);
    const client = await getTypeOrmClient();
    const poolClient = await client.getRepository(CetusPool);
    const poolInfo = await poolClient.findOne({
      where: { poolId },
      relations: ["coinTypeA", "coinTypeB"],
    });

    if (poolInfo) {
      poolCache[poolId] = poolInfo;
      return poolInfo;
    }

    return poolCache[poolId];
  } catch (err) {
    console.log("failed in: getPoolExists");
    console.log(poolId);
    console.log(err);
    throw err;
  }
};

export const convertToUniswapAmount = (amount: string): number =>
  parseFloat(amount) / Math.pow(10, UNISWAP_V3_DECIMALS);

export const calculateSwapVolUSD = async (
  amountIn: number,
  amountOut: number,
  coinIn: CoinInfo,
  coinOut: CoinInfo,
  aToB: boolean,
  timestampMs: string
) => {
  const priceA = await getPriceAtDate(coinIn.symbol, timestampMs);
  const priceB = await getPriceAtDate(coinOut.symbol, timestampMs);
  let total = 0;

  if (priceA) {
    total += (aToB ? amountIn : amountOut) * priceA;
  }

  if (priceB) {
    total += (aToB ? amountOut : amountIn) * priceB;
  }

  return total;
};
