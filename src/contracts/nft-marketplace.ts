export type NftAssetStatus = "listed" | "sold" | "delisted";

export interface NftActionState {
  enabled: boolean;
  label: string;
  disabledReason: string | null;
}

export interface NftCollectionSummary {
  id: string;
  name: string;
  category: string;
  floorPrice: number;
  volume: number;
  items: number;
  updatedAt: string;
}

export interface NftAssetSummary {
  id: string;
  name: string;
  tokenId: string;
  rarity: string;
  sellerWallet: string;
  status: NftAssetStatus;
  price: number;
  updatedAt: string;
  collection: {
    id: string;
    name: string;
    category: string;
  };
  actions: {
    buy: NftActionState;
    list: NftActionState;
  };
}

export interface NftMarketplaceStats {
  totalCollections: number;
  totalAssets: number;
  listedAssets: number;
  soldAssets: number;
  totalVolume: number;
}

export interface NftMarketplaceOverview {
  collections: NftCollectionSummary[];
  assets: NftAssetSummary[];
  stats: NftMarketplaceStats;
}

export interface BuyNftRequest {
  buyerWallet?: string;
}

export interface ListNftRequest {
  price: number;
  sellerWallet: string;
}

export interface BuyNftResponse {
  asset: NftAssetSummary;
  purchase: {
    id: string;
    price: number;
    status: NftAssetStatus;
    purchasedAt: string;
  };
  message: string;
}

export interface ListNftResponse {
  asset: NftAssetSummary;
  listing: {
    id: string;
    price: number;
    status: NftAssetStatus;
    listedAt: string;
  };
  message: string;
}
