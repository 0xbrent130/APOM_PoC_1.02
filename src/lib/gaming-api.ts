import { apiClient } from "@/lib/api-client";
import type { GamingOverview, PlayGameRequest, PlayGameResponse } from "@/contracts";

export function getGamingOverview() {
  return apiClient.get<GamingOverview>("/gaming/overview");
}

export function playGame(slug: string, payload: PlayGameRequest = {}) {
  return apiClient.post<PlayGameResponse, PlayGameRequest>(`/gaming/games/${slug}/play`, payload);
}
