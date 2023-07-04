// Turbos address
const TURBOS_BASE_ADDRESS =
  "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1";

export const turboPoolCreatedEvent = `${TURBOS_BASE_ADDRESS}::pool_factory::PoolCreatedEvent`;
export const turboMintEvent = `${TURBOS_BASE_ADDRESS}::pool::MintEvent`;

// events wormhole
export const eventTransferOut =
  "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a::publish_message::WormholeMessage";

export const eventTransferIn =
  "0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d::complete_transfer::TransferRedeemed";

// events cetus
const BASE_CETUS_ADDRESS =
  "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb";

export const createPoolEvent = `${BASE_CETUS_ADDRESS}::factory::CreatePoolEvent`;
export const addLiquidityEvent = `${BASE_CETUS_ADDRESS}::pool::AddLiquidityEvent`;
export const removeLiquidityEvent = `${BASE_CETUS_ADDRESS}::pool::RemoveLiquidityEvent`;
export const swapEvent = `${BASE_CETUS_ADDRESS}::pool::SwapEvent`;

// Kriya work
const BASE_KRIYA_ADDRESS =
  "0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66";
export const kriyaPoolCreated = `${BASE_KRIYA_ADDRESS}::spot_dex::PoolCreatedEvent`;
export const kriyaLiquidityAdded = `${BASE_KRIYA_ADDRESS}::spot_dex::LiquidityAddedEvent`;
export const kriyaLiquidityRemoved = `${BASE_KRIYA_ADDRESS}::spot_dex::LiquidityRemovedEvent`;
export const kriyaSwap = `0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66::spot_dex::SwapEvent`;
