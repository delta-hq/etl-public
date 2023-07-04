export interface ParsedPool {
  coin_type_a: string;
  coin_type_b: string;
  pool_id: string;
  tick_spacing: number;
}

export interface ParsedCetusLiquidity {
  after_liquidity: string;
  amount_a: string;
  amount_b: string;
  liquidity: string;
  pool: string;
  position: string;
  tick_lower: { bits: number };
  tick_upper: { bits: number };
}

export interface ParsedSwapEvent {
  after_sqrt_price: string;
  amount_in: string;
  amount_out: string;
  atob: boolean;
  before_sqrt_price: string;
  fee_amount: string;
  partner: string;
  pool: string;
  ref_amount: string;
  steps: string;
  vault_a_amount: string;
  vault_b_amount: string;
}
