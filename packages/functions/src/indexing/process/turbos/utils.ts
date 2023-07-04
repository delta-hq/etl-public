import { coinLookup, getSuiKit } from "src/indexing/services/sui";

//get full coin address with suffix
const getCoinFullAddress = (type: string) => {
  const matches_a = type.match(/<[^,]+,/g);
  const matches_b = type.match(/, [^\s>]+,/g);

  const coin_a_address = matches_a ? matches_a[0].slice(1, -1) : "";
  const coin_b_address = matches_b ? matches_b[0].slice(2, -1) : "";

  return [coin_a_address, coin_b_address];
};

export const buildPoolInfo = async (pool: string) => {
  const suiKit = getSuiKit();

  try {
    const poolObj = await suiKit.rpcProvider.provider.getObject({
      id: pool,
      options: { showType: true, showContent: true },
    });

    // @ts-ignore
    const type = poolObj.data.type;

    const [coinAFullAddress, coinBFullAddress] = type
      ? getCoinFullAddress(type)
      : ["", ""];

    const coinA = await coinLookup(coinAFullAddress);
    const coinB = await coinLookup(coinBFullAddress);

    return [coinA, coinB];
  } catch (e) {
    console.log("Failed in: buildPoolInfo");
    console.log(pool);

    throw e;
  }
};
