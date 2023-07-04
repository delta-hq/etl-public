import { getClient } from "src/indexing/services/db";

export const getLiquidityExists = async (
  txDigest: string,
  tableName: string = "turbosLiquidity"
): Promise<boolean> => {
  try {
    const client = await getClient();
    const query = `
              SELECT EXISTS (
                SELECT 1
                FROM "${tableName}"
                WHERE "txDigest" = $1
              )
            `;
    const values = [txDigest];

    const exists = await client.query(query, values);

    return exists.rows[0].exists;
  } catch (err) {
    console.log("failed in: getLiquidityExists");
    console.log(txDigest);
    throw err;
  }
};

const poolCache: { [key: string]: any } = {};

export const getPool = async (
  poolId: string,
  tableName: string = "turbosPool"
): Promise<any> => {
  try {
    if (poolCache[poolId]) return Promise.resolve(poolCache[poolId]);

    const client = await getClient();
    const query = `
                  SELECT *
                  FROM "${tableName}"
                  WHERE "poolId" = $1
              `;
    const values = [poolId];
    const result = await client.query(query, values);

    const coinQuery = `select * from "coinInfo" where "id" = $1`;
    const poolInfo = result.rows[0];

    if (poolInfo) {
      const coinAInfo = await client.query(coinQuery, [poolInfo.coinTypeA]);
      const coinBInfo = await client.query(coinQuery, [poolInfo.coinTypeB]);
      poolInfo.coinAInfo = coinAInfo.rows[0];
      poolInfo.coinBInfo = coinBInfo.rows[0];
      poolCache[poolId] = poolInfo;
    }

    return poolCache[poolId];
  } catch (err) {
    console.log("failed in: getPoolExists");
    console.log(poolId);
    console.log(err);
    throw err;
  }
};

const poolExists: { [key: string]: boolean } = {};

export const getPoolExists = async (
  poolId: string,
  tableName: string = "turbosPool"
): Promise<boolean> => {
  try {
    if (poolExists[poolId]) return Promise.resolve(poolExists[poolId]);

    const client = await getClient();
    const query = `
              SELECT EXISTS (
                SELECT *
                FROM "${tableName}"
                WHERE "poolId" = $1
              )
            `;
    const values = [poolId];
    const exists = await client.query(query, values);

    poolExists[poolId] = exists.rows[0].exists;

    return exists.rows[0].exists;
  } catch (err) {
    console.log("failed in: getPoolExists");
    console.log(poolId);
    console.log(err);
    throw err;
  }
};
