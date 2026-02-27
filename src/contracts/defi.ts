export type DefiPoolType = "gaming" | "stable" | "yield" | "rwa";
export type DefiPoolStatus = "active" | "paused" | "retired";

export interface DefiActionState {
  enabled: boolean;
  label: string;
  disabledReason: string | null;
}

export interface DefiPool {
  id: string;
  pair: string;
  type: DefiPoolType;
  status: DefiPoolStatus;
  tvl: number;
  apy: number;
  volume24h: number;
  updatedAt: string;
  actions: {
    addLiquidity: DefiActionState;
    stake: DefiActionState;
  };
}

export interface DefiStats {
  totalPools: number;
  activePools: number;
  totalTvl: number;
  totalVolume24h: number;
  averageApy: number;
}

export interface DefiOverview {
  pools: DefiPool[];
  stats: DefiStats;
}

export interface DefiIntentRequest {
  amount: number;
}

export interface DefiIntentResponse {
  pool: {
    id: string;
    pair: string;
  };
  intent: {
    id: string;
    action: "ADD_LIQUIDITY" | "STAKE";
    amount: number;
    createdAt: string;
  };
  message: string;
}
