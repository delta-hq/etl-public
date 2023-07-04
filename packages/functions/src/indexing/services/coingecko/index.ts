import { getTypeOrmClient } from "../db";
import fetch from "node-fetch";
import { USD_STABLE_MAP } from "../constants";
import { CoinGeckoToken, CoinGeckoPriceAtDate } from "../db/models";

const BASE_URL = "https://pro-api.coingecko.com/api/v3";
const coingecko = "CG-ACXZfzogrHxtcc2wTQFXffPr";
const WITH_KEY = `x_cg_pro_api_key=${coingecko}`;

export const getCoinGeckoTokenBySymbol = async (
  symbol: string
): Promise<CoinGeckoToken | null> => {
  const client = await getTypeOrmClient();
  const coingeckoClient = await client.getRepository(CoinGeckoToken);

  if (symbol.toLowerCase() === "sui") {
    return coingeckoClient.findOne({ where: { id: "sui" } });
  }

  try {
    return coingeckoClient
      .createQueryBuilder("coinGeckoToken")
      .where("LOWER(coinGeckoToken.symbol) = LOWER(:symbol)", { symbol })
      .getOne();
  } catch (error) {
    console.error("Error retrieving CoinGecko token:", error);
    throw error;
  }
};

const insertCoinGeckoToken = async (tokenData: any) => {
  const client = await getTypeOrmClient();
  const coinGeckoClient = await client.getRepository(CoinGeckoToken);
  const { id, symbol, name, platforms } = tokenData;

  try {
    const exists = await coinGeckoClient.findOne({ where: { id, symbol } });

    if (exists) return;

    return coinGeckoClient.insert({
      id,
      symbol,
      name,
      platforms: platforms,
    });
  } catch (error) {
    console.error("Error inserting CoinGecko token:", error);
  }
};

export const loadAllCoinGeckoTokens = async () => {
  const query = `https://pro-api.coingecko.com/api/v3/coins/list?include_platform=true&x_cg_pro_api_key=CG-ACXZfzogrHxtcc2wTQFXffPr`;

  // @ts-ignore
  const response = await fetch(query).then((res) => res.json());

  if (Array.isArray(response) && response.length > 0) {
    for (const tokenData of response.reverse()) {
      await insertCoinGeckoToken(tokenData);
    }
  } else {
    console.log("failed to get coingecko response data");
  }
};

export const getPriceAtDateFromDb = async (
  coinGeckoTokenId: string,
  date: Date
): Promise<number | null> => {
  const client = await getTypeOrmClient();
  const coingeckoClientData = await client.getRepository(CoinGeckoPriceAtDate);

  try {
    const result = await coingeckoClientData.findOne({
      where: { date, coinGeckoTokenId },
    });

    return result?.price ? result.price : null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

// Function to insert data into coinGeckoPriceAtDate table
export async function insertCoinGeckoPrice(
  price: number,
  date: Date,
  coinGeckoTokenId: string
): Promise<void> {
  try {
    const client = await getTypeOrmClient();
    const coinGeckoClient = client.getRepository(CoinGeckoPriceAtDate);

    await coinGeckoClient.insert({ price, date, coinGeckoTokenId });
  } catch (error) {
    console.error(
      "Error inserting data into coinGeckoPriceAtDate table:",
      error
    );
  }
}

interface Cache {
  [key: string]: boolean;
}

const cache: Cache = {};

export const getPriceAtDate = async (
  symbol: string,
  timestampMs: string | undefined
): Promise<number | undefined> => {
  // if it's a stable, just return 1
  if (USD_STABLE_MAP[symbol.toLowerCase()]) return 1;
  if (timestampMs === undefined) return undefined;
  const coinGeckoToken = await getCoinGeckoTokenBySymbol(symbol);

  const date = new Date(parseInt(timestampMs));

  console.log(date);

  if (coinGeckoToken?.id === undefined) {
    console.log("undefined token");
    return undefined;
  }
  //   https://api.coingecko.com/api/v3/coins/ethereum/history?date=30-12-2022

  const day = date.getDate().toString();
  const month = (date.getMonth() + 1).toString();
  const year = date.getFullYear().toString();
  const formattedDate = `${day}-${month}-${year}`;

  console.log(coinGeckoToken.id);

  const priceAtDate = await getPriceAtDateFromDb(coinGeckoToken.id, date);

  if (priceAtDate) return priceAtDate;

  if (cache[coinGeckoToken.id]) return undefined;

  cache[coinGeckoToken.id] = true;
  console.log("making coingecko query");

  const URL = `${BASE_URL}/coins/${coinGeckoToken.id}/history?date=${formattedDate}&localization=false&${WITH_KEY}`;
  console.log(URL);
  const response = await fetch(URL).then((res) => res.json());

  // @ts-ignore
  if (!response?.market_data?.current_price?.usd) return undefined;

  // @ts-ignore
  const usdValue = response.market_data.current_price.usd;

  await insertCoinGeckoPrice(usdValue, date, coinGeckoToken.id);

  return usdValue;
};

export const getCoinGeckoTokenPrice = async (
  symbol: string
): Promise<number | null> => {
  // https://api.coingecko.com/api/v3/coins/sui
  const URL = `${BASE_URL}/coins/${symbol}?${WITH_KEY}`;
  const response = await fetch(URL).then((res) => res.json());

  // @ts-ignore
  return response?.market_data?.current_price?.usd ?? null;
};
