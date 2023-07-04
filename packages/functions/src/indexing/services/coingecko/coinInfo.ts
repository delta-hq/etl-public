import { getTypeOrmClient } from "../../services/db";
import { CoinInfo } from "../../services/db/models";

// Function to find or create a coinInfo row
export const findOrCreateCoinInfo = async (
  coinInfoData: CoinInfo
): Promise<CoinInfo | null> => {
  const client = await getTypeOrmClient();
  const coinInfoClient = client.getRepository(CoinInfo);

  try {
    // Start a transaction
    const coinExists = await coinInfoClient.findOne({
      where: {
        address: coinInfoData.address,
      },
    });

    if (coinExists) return coinExists;

    const insertion = await coinInfoClient.insert({
      address: coinInfoData.address,
      decimals: coinInfoData.decimals,
      name: coinInfoData.name,
      symbol: coinInfoData.symbol,
      description: coinInfoData.description,
      iconUrl: coinInfoData.iconUrl,
      verified: coinInfoData.verified,
    });

    return coinInfoClient.findOne({
      where: {
        address: coinInfoData.address,
      },
    });
  } catch (error) {
    console.log(error);
    // Rollback the transaction if an error occurs

    throw error;
  }
};
