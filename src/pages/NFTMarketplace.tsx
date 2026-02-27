import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrendingUp, Users, Crown, Gamepad2, Palette, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { buyNft, getNftMarketplaceOverview, listNft } from "@/lib/nft-marketplace-api";
import type { NftAssetSummary } from "@/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "@/state/auth-state";

function formatEth(value: number) {
  return `${value.toFixed(2)} ETH`;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function rarityClass(rarity: string) {
  const normalized = rarity.trim().toLowerCase();
  if (normalized === "legendary") {
    return "bg-nft/20 text-nft";
  }

  if (normalized === "epic") {
    return "bg-primary/20 text-primary";
  }

  return "bg-accent/20 text-accent";
}

function statusLabel(asset: NftAssetSummary, owned: boolean) {
  if (owned) {
    return "Owned";
  }

  if (asset.status === "listed") {
    return "Listed";
  }

  if (asset.status === "sold") {
    return "Sold";
  }

  return "Delisted";
}

interface BuyMutationVariables {
  assetId: string;
  buyerWallet?: string;
}

interface ListMutationVariables {
  assetId: string;
  price: number;
  sellerWallet: string;
}

interface ListDraft {
  price: string;
  sellerWallet: string;
}

function recalculateStats(assets: NftAssetSummary[], totalCollections: number, totalVolume: number) {
  return {
    totalCollections,
    totalAssets: assets.length,
    listedAssets: assets.filter((asset) => asset.status === "listed").length,
    soldAssets: assets.filter((asset) => asset.status === "sold").length,
    totalVolume,
  };
}

const NFTMarketplace = () => {
  const queryClient = useQueryClient();
  const { wallet } = useAuthState();
  const [purchaseState, setPurchaseState] = useState<"idle" | "pending" | "failed" | "complete">("idle");
  const [purchaseMessage, setPurchaseMessage] = useState<string>("");
  const [purchasedAssetId, setPurchasedAssetId] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string>("");
  const [listDraftByAsset, setListDraftByAsset] = useState<Record<string, ListDraft>>({});

  const overviewQuery = useApiQuery({
    queryKey: ["nft-marketplace", "overview"],
    request: getNftMarketplaceOverview,
  });

  const buyMutation = useApiMutation({
    mutationFn: ({ assetId, buyerWallet }: BuyMutationVariables) => buyNft(assetId, { buyerWallet }),
    onMutate: ({ assetId }) => {
      setPurchasedAssetId(assetId);
      setPurchaseState("pending");
      setPurchaseMessage("Purchase pending. Waiting for marketplace confirmation.");
    },
    onSuccess: (result) => {
      setPurchaseState("complete");
      setPurchaseMessage(result.message);
      setListMessage("");
      queryClient.setQueryData(["nft-marketplace", "overview"], (current: typeof overviewQuery.data) => {
        if (!current) {
          return current;
        }

        const nextAssets = current.assets.map((asset) => (asset.id === result.asset.id ? result.asset : asset));

        return {
          ...current,
          assets: nextAssets,
          stats: recalculateStats(nextAssets, current.stats.totalCollections, current.stats.totalVolume),
        };
      });
    },
    onError: (error) => {
      setPurchaseState("failed");
      setPurchaseMessage(error.safeMessage);
    },
  });

  const listMutation = useApiMutation({
    mutationFn: ({ assetId, price, sellerWallet }: ListMutationVariables) => listNft(assetId, { price, sellerWallet }),
    onSuccess: (result) => {
      setListMessage(result.message);
      setPurchaseState("idle");
      setPurchaseMessage("");
      queryClient.setQueryData(["nft-marketplace", "overview"], (current: typeof overviewQuery.data) => {
        if (!current) {
          return current;
        }

        const nextAssets = current.assets.map((asset) => (asset.id === result.asset.id ? result.asset : asset));

        return {
          ...current,
          assets: nextAssets,
          stats: recalculateStats(nextAssets, current.stats.totalCollections, current.stats.totalVolume),
        };
      });
    },
    onError: (error) => {
      setListMessage(error.safeMessage);
    },
  });

  const submitBuy = (assetId: string) => {
    buyMutation.mutate({
      assetId,
      buyerWallet: wallet?.address,
    });
  };

  const submitList = (asset: NftAssetSummary) => {
    const draft = listDraftByAsset[asset.id] ?? {
      price: "",
      sellerWallet: wallet?.address ?? asset.sellerWallet,
    };

    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      setListMessage("Enter a valid listing price greater than 0.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(draft.sellerWallet)) {
      setListMessage("Enter a valid EVM wallet address for listing.");
      return;
    }

    listMutation.mutate({
      assetId: asset.id,
      price,
      sellerWallet: draft.sellerWallet,
    });
  };

  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-nft bg-clip-text text-transparent">NFT Marketplace</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover, collect, and trade digital assets from gaming and art communities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="nft" size="xl">
                  Browse NFTs
                </Button>
                <Button variant="outline" size="xl">
                  <Palette className="w-5 h-5" />
                  Create NFT
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {purchaseState === "pending" ? (
              <Card className="mb-8 border-primary/50">
                <CardHeader>
                  <CardTitle>Purchase pending</CardTitle>
                  <CardDescription>{purchaseMessage}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {purchaseState === "failed" ? (
              <Card className="mb-8 border-destructive/50">
                <CardHeader>
                  <CardTitle>Purchase failed</CardTitle>
                  <CardDescription>{purchaseMessage}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {purchaseState === "complete" ? (
              <Card className="mb-8 border-accent/50">
                <CardHeader>
                  <CardTitle>Purchase complete</CardTitle>
                  <CardDescription>{purchaseMessage}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {listMessage ? (
              <Card className="mb-8 border-border/50">
                <CardHeader>
                  <CardTitle>Listing update</CardTitle>
                  <CardDescription>{listMessage}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {overviewQuery.isLoading ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="gradient-card text-center">
                      <CardHeader>
                        <Skeleton className="h-8 w-24 mx-auto" />
                        <Skeleton className="h-4 w-28 mx-auto" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="gradient-card border-border/50">
                      <CardHeader>
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : overviewQuery.isError ? (
              <Card className="gradient-card border-destructive/50">
                <CardHeader>
                  <CardTitle>Unable to load marketplace data</CardTitle>
                  <CardDescription>Could not fetch NFT collections and inventory from the backend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overviewQuery.data && overviewQuery.data.assets.length === 0 ? (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Empty inventory</CardTitle>
                  <CardDescription>No NFTs are available right now. Check back after new listings are published.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-nft bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalAssets ?? 0)}
                      </CardTitle>
                      <CardDescription>Total NFTs</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                        {formatEth(overviewQuery.data?.stats.totalVolume ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Volume</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.listedAssets ?? 0)}
                      </CardTitle>
                      <CardDescription>Listed Assets</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalCollections ?? 0)}
                      </CardTitle>
                      <CardDescription>Collections</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <h2 className="text-3xl font-bold text-center mb-12">Featured NFTs</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                  {overviewQuery.data?.assets.map((asset) => {
                    const isOwned = purchasedAssetId === asset.id && purchaseState === "complete";
                    const isBuyingThisAsset =
                      buyMutation.isPending && buyMutation.variables && buyMutation.variables.assetId === asset.id;
                    const isListingThisAsset =
                      listMutation.isPending && listMutation.variables && listMutation.variables.assetId === asset.id;
                    const draft = listDraftByAsset[asset.id] ?? {
                      price: "",
                      sellerWallet: wallet?.address ?? asset.sellerWallet,
                    };

                    return (
                      <Card key={asset.id} className="gradient-card border-border/50 hover:shadow-nft transition-smooth">
                        <CardHeader>
                          <CardTitle className="text-center">{asset.name}</CardTitle>
                          <CardDescription className="text-center">{asset.collection.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rarity:</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${rarityClass(asset.rarity)}`}>
                                {asset.rarity}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-bold text-nft">{formatEth(asset.price)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-semibold">{statusLabel(asset, isOwned)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Seller:</span>
                              <span className="font-semibold">{`${asset.sellerWallet.slice(0, 6)}...${asset.sellerWallet.slice(-4)}`}</span>
                            </div>
                          </div>

                          <Button
                            variant={asset.actions.buy.enabled ? "nft" : "secondary"}
                            className="w-full mt-4"
                            disabled={!asset.actions.buy.enabled || buyMutation.isPending}
                            onClick={() => submitBuy(asset.id)}
                          >
                            {isBuyingThisAsset ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Purchasing...
                              </>
                            ) : (
                              asset.actions.buy.label
                            )}
                          </Button>
                          {!asset.actions.buy.enabled && asset.actions.buy.disabledReason ? (
                            <p className="mt-2 text-xs text-muted-foreground">{asset.actions.buy.disabledReason}</p>
                          ) : null}

                          <div className="mt-4 space-y-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={draft.price}
                              onChange={(event) =>
                                setListDraftByAsset((current) => ({
                                  ...current,
                                  [asset.id]: {
                                    ...draft,
                                    price: event.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              placeholder="Listing price (ETH)"
                            />
                            <input
                              type="text"
                              value={draft.sellerWallet}
                              onChange={(event) =>
                                setListDraftByAsset((current) => ({
                                  ...current,
                                  [asset.id]: {
                                    ...draft,
                                    sellerWallet: event.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              placeholder="Seller wallet (0x...)"
                            />
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={!asset.actions.list.enabled || listMutation.isPending}
                              onClick={() => submitList(asset)}
                            >
                              {isListingThisAsset ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Listing...
                                </>
                              ) : (
                                asset.actions.list.label
                              )}
                            </Button>
                            {!asset.actions.list.enabled && asset.actions.list.disabledReason ? (
                              <p className="text-xs text-muted-foreground">{asset.actions.list.disabledReason}</p>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <h2 className="text-3xl font-bold text-center mb-12">Top Collections</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {overviewQuery.data?.collections.map((collection) => (
                    <Card key={collection.id} className="gradient-card border-border/50 hover:shadow-nft transition-smooth">
                      <CardHeader>
                        <CardTitle className="text-xl">{collection.name}</CardTitle>
                        <CardDescription>{collection.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Floor Price</div>
                            <div className="font-bold text-nft">{formatEth(collection.floorPrice)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Volume</div>
                            <div className="font-bold">{formatEth(collection.volume)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Items</div>
                            <div className="font-bold">{formatCompact(collection.items)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Marketplace Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Royalty System</h3>
                <p className="text-muted-foreground">Creators earn royalties on every secondary sale</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gaming Integration</h3>
                <p className="text-muted-foreground">Use NFTs directly in supported games</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Price Analytics</h3>
                <p className="text-muted-foreground">Track price history and market trends</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">Connect with artists and collectors</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NFTMarketplace;
