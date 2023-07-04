import { ApiHandler } from "sst/node/api";
import { getTypeOrmClient } from "../services/db";
import { CoinInfo } from "../services/db/models";
import {
  getCoinGeckoTokenBySymbol,
  getCoinGeckoTokenPrice,
} from "../services/coingecko";

export const handler = ApiHandler(async (_evt) => {
  const client = await getTypeOrmClient();
  const allCoinInfo = await client.getRepository(CoinInfo).find();

  for (const coinInfo of allCoinInfo) {
    const coinGeckoSymbol = await getCoinGeckoTokenBySymbol(coinInfo.symbol);
    if (coinGeckoSymbol) {
      const result = await getCoinGeckoTokenPrice(coinGeckoSymbol.id);
      if (result) {
        coinInfo.currentPrice = result;
        await client.getRepository(CoinInfo).save(coinInfo);
      }
    }
  }

  try {
    return {
      body: "success on daily coin info update,",
    };
  } catch (err) {
    console.log("got error from process");
    console.log(err);
    return {
      body: "failed",
    };
  }
});
