export interface ParsedKriyaPoolCreation {
  creator: string;
  is_stable: boolean;
  lp_fee_percent: string;
  pool_id: string;
  protocol_fee_percent: string;
  scaleX: string;
  scaleY: string;
}

export interface KriyaPool {
  txDigest: string;
  poolId: string;
  coinTypeA: number;
  coinTypeB: number;
  creator: string;
  isStable: boolean;
  lpFeePercent: string;
  protocolFeePercent: string;
  scaleA: string;
  scaleB: string;
  timestampMs: Date;
}
export interface ParsedKriyaLiquidityAdded {
  amount_x: string;
  amount_y: string;
  liquidity_provider: string;
  lsp_minted: string;
  pool_id: string;
}

export interface ParsedKriyaLiquidityRemoved {
  amount_x: string;
  amount_y: string;
  liquidity_provider: string;
  lsp_burned: string;
  pool_id: string;
}

export interface KriyaLiquidity {
  txDigest: string;
  liquidityProviderAddress: string;
  amountA: string;
  amountB: string;
  convertedAmountA: number;
  convertedAmountB: number;
  amountAUsd: number;
  amountBUsd: number;
  pool: string;
  timestampMs: Date;
}

export interface KriyaLiquidityAdded extends KriyaLiquidity {
  lspMinted: string;
}

export interface KriyaLiquidityRemoved extends KriyaLiquidity {
  lspBurned: string;
}

export interface ParsedKriyaSwapEvent {
  amount_in: string;
  amount_out: string;
  pool_id: string;
  reserve_x: string;
  reserve_y: string;
  user: string;
}

export interface KriyaSwap {
  txDigest: string;
  poolId: string;
  volumeUsd: number;
  coinIn: number;
  coinOut: number;
  amountIn: number;
  amountOut: number;
  amountInUsd: number;
  amountOutUsd: number;
  reserveA: string;
  reserveB: string;
  timestampMs: Date;
  swapperAddress: string;
}
