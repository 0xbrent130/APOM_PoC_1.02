import { apiClient } from "@/lib/api-client";
import type { DefiIntentRequest, DefiIntentResponse, DefiOverview } from "@/contracts";

export function getDefiOverview() {
  return apiClient.get<DefiOverview>("/defi/overview");
}

export function submitAddLiquidityIntent(poolId: string, payload: DefiIntentRequest) {
  return apiClient.post<DefiIntentResponse, DefiIntentRequest>(`/defi/pools/${poolId}/liquidity`, payload);
}

export function submitStakeIntent(poolId: string, payload: DefiIntentRequest) {
  return apiClient.post<DefiIntentResponse, DefiIntentRequest>(`/defi/pools/${poolId}/stake`, payload);
}
