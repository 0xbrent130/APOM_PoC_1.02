import { apiClient } from "@/lib/api-client";
import type {
  BuyNftRequest,
  BuyNftResponse,
  ListNftRequest,
  ListNftResponse,
  NftMarketplaceOverview,
} from "@/contracts";

export function getNftMarketplaceOverview() {
  return apiClient.get<NftMarketplaceOverview>("/nft-marketplace/overview");
}

export function buyNft(assetId: string, payload: BuyNftRequest = {}) {
  return apiClient.post<BuyNftResponse, BuyNftRequest>(`/nft-marketplace/assets/${assetId}/buy`, payload);
}

export function listNft(assetId: string, payload: ListNftRequest) {
  return apiClient.post<ListNftResponse, ListNftRequest>(`/nft-marketplace/assets/${assetId}/list`, payload);
}
