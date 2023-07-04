import { getClient } from "src/indexing/services/db";
import { coinLookup, getSuiKit } from "src/indexing/services/sui";
import { generateExistsQuery } from "src/indexing/services/utils";
import { KriyaSwap } from "src/indexing/types/kriya";

export const getCoinFromType = (type: string) => {
  const regex = /(?:0x([a-fA-F0-9]+)::coin::COIN|0x([a-fA-F0-9]+)::sui::SUI)/g;
  const matches = type.match(regex);

  if (matches?.length !== 1)
    throw new Error("regex failing in: getCoinFromType");

  return matches[0];
};

export const getCoinFullAddress = (type: string) => {
  const regex = /(?:0x([a-fA-F0-9]+)::coin::COIN|0x([a-fA-F0-9]+)::sui::SUI)/g;
  const matches = type.match(regex);

  if (matches?.length !== 2)
    throw new Error("regex failing in: getCoinFullAddress");

  return matches;
};

export const buildPoolInfo = async (pool: string) => {
  const suiKit = getSuiKit();

  const poolObj = await suiKit.rpcProvider.provider.getObject({
    id: pool,
    options: { showType: true, showContent: true },
  });

  // @ts-ignore
  const type = poolObj.data.type as string;
  const [coinAFullAddress, coinBFullAddress] = getCoinFullAddress(type);

  const coinA = await coinLookup(coinAFullAddress);
  const coinB = await coinLookup(coinBFullAddress);

  return [coinA, coinB];
};

export const getPoolType = async (pool: string) => {
  const suiKit = getSuiKit();

  const poolObj = await suiKit.rpcProvider.provider.getObject({
    id: pool,
    options: { showType: true, showContent: true },
  });

  // @ts-ignore
  const type = poolObj.data.type as string;

  return type;
};

export const buildCoinAddress = (address: string) => {
  if (
    address ===
    "0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3"
  )
    return "0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3::sui::SUI";

  return `${address}::coin::COIN`;
};

export const getKriyaSwap = async (kriyaSwap: KriyaSwap): Promise<boolean> => {
  const client = await getClient();
  const query = generateExistsQuery("kriyaSwap", kriyaSwap);
  const result = await client.query(query);
  const { exists } = result.rows[0];

  return exists;
};
