export interface ParsedTurbosPoolCreation {
  account: string;
  fee: number;
  fee_protocol: number;
  pool: string;
  sqrt_price: string;
  tick_spacing: number;
}

export interface ParsedTurbosAddLiquidity {
  amount_a: string;
  amount_b: string;
  liquidity_delta: string;
  owner: string;
  pool: string;
  tick_lower_index: { bits: number };
  tick_upper_index: { bits: number };
}
