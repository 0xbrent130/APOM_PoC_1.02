import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowUpDown, Droplets, PiggyBank, Target, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
  getDefiOverview,
  submitAddLiquidityIntent,
  submitStakeIntent,
} from "@/lib/defi-api";
import type { DefiActionState, DefiIntentResponse } from "@/contracts/defi";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/state/auth-state";

type DefiAction = "add_liquidity" | "stake";

interface DefiMutationVariables {
  poolId: string;
  amount: number;
  action: DefiAction;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatPoolType(type: string) {
  if (type === "gaming") {
    return "Gaming Pool";
  }

  if (type === "stable") {
    return "Stable Pool";
  }

  if (type === "rwa") {
    return "RWA Pool";
  }

  return "Yield Pool";
}

const DeFi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, wallet, openLoginPrompt } = useAuthState();
  const [amountByPool, setAmountByPool] = useState<Record<string, string>>({});
  const [mutationFeedback, setMutationFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const overviewQuery = useApiQuery({
    queryKey: ["defi", "overview"],
    request: getDefiOverview,
  });

  const intentMutation = useApiMutation<DefiIntentResponse, DefiMutationVariables>({
    mutationFn: ({ poolId, amount, action }) =>
      action === "add_liquidity"
        ? submitAddLiquidityIntent(poolId, { amount })
        : submitStakeIntent(poolId, { amount }),
    onSuccess: (result) => {
      setMutationFeedback({
        type: "success",
        message: `${result.message} for ${result.pool.pair}.`,
      });
      toast({
        title: "Intent submitted",
        description: `${result.pool.pair}: ${result.intent.action} confirmed.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["defi", "overview"] });
    },
    onError: (error) => {
      setMutationFeedback({
        type: "error",
        message: error.safeMessage,
      });
    },
  });

  const activeUsers = useMemo(() => {
    if (!overviewQuery.data) {
      return 0;
    }

    const derived = overviewQuery.data.stats.totalPools * 320;
    return Math.max(derived, 0);
  }, [overviewQuery.data]);

  const submitIntent = (poolId: string, action: DefiAction, actionState: DefiActionState) => {
    setMutationFeedback(null);

    if (!session) {
      setMutationFeedback({
        type: "error",
        message: "Authentication required before submitting DeFi intents.",
      });
      openLoginPrompt("Sign in and connect your wallet to submit DeFi intents.");
      return;
    }

    if (!wallet) {
      setMutationFeedback({
        type: "error",
        message: "Wallet connection is required before submitting DeFi intents.",
      });
      openLoginPrompt("Connect your wallet to submit DeFi intents.");
      return;
    }

    if (!actionState.enabled) {
      setMutationFeedback({
        type: "error",
        message: actionState.disabledReason || "This action is unavailable for the selected pool.",
      });
      return;
    }

    const rawAmount = amountByPool[poolId] ?? "";
    const amount = Number(rawAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMutationFeedback({
        type: "error",
        message: "Enter a valid amount greater than 0.",
      });
      return;
    }

    intentMutation.mutate({ poolId, amount, action });
  };

  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-defi bg-clip-text text-transparent">DeFi Exchange</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Trade, stake, and earn with advanced DeFi protocols designed for the gaming ecosystem
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="defi" size="xl">
                  <ArrowUpDown className="w-5 h-5" />
                  Start Trading
                </Button>
                <Button variant="outline" size="xl">
                  <Droplets className="w-5 h-5" />
                  Add Liquidity
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {mutationFeedback ? (
              <Card
                className={`mb-8 ${
                  mutationFeedback.type === "success" ? "border-accent/50" : "border-destructive/50"
                }`}
              >
                <CardHeader>
                  <CardTitle>
                    {mutationFeedback.type === "success" ? "Mutation successful" : "Mutation failed"}
                  </CardTitle>
                  <CardDescription>{mutationFeedback.message}</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="gradient-card border-border/50">
                      <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : overviewQuery.isError ? (
              <Card className="gradient-card border-destructive/50">
                <CardHeader>
                  <CardTitle>Unable to load DeFi pools</CardTitle>
                  <CardDescription>Could not fetch DeFi data from the backend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overviewQuery.data && overviewQuery.data.pools.length === 0 ? (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>No pools available</CardTitle>
                  <CardDescription>
                    Liquidity pools will appear here once they are created by the backend.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                        {formatCurrency(overviewQuery.data?.stats.totalTvl ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Value Locked</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                        {formatCurrency(overviewQuery.data?.stats.totalVolume24h ?? 0)}
                      </CardTitle>
                      <CardDescription>24h Volume</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-accent bg-clip-text text-transparent">
                        {formatPercent(overviewQuery.data?.stats.averageApy ?? 0)}
                      </CardTitle>
                      <CardDescription>Average APY</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                        {formatCompactNumber(activeUsers)}
                      </CardTitle>
                      <CardDescription>Active Users (Derived)</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <h2 className="text-3xl font-bold text-center mb-12">Top Liquidity Pools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {overviewQuery.data?.pools.map((pool) => {
                    const isLiquidityPending =
                      intentMutation.isPending &&
                      intentMutation.variables?.poolId === pool.id &&
                      intentMutation.variables?.action === "add_liquidity";
                    const isStakePending =
                      intentMutation.isPending &&
                      intentMutation.variables?.poolId === pool.id &&
                      intentMutation.variables?.action === "stake";

                    return (
                      <Card
                        key={pool.id}
                        className="gradient-card border-border/50 hover:shadow-defi transition-smooth"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">{pool.pair}</CardTitle>
                              <CardDescription className="text-defi">{formatPoolType(pool.type)}</CardDescription>
                            </div>
                            <span className="text-2xl font-bold gradient-defi bg-clip-text text-transparent">
                              {formatPercent(pool.apy)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">TVL:</span>
                              <span className="font-semibold">{formatCurrency(pool.tvl)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">24h Volume:</span>
                              <span className="font-semibold">{formatCurrency(pool.volume24h)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-semibold capitalize">{pool.status}</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={amountByPool[pool.id] ?? ""}
                              onChange={(event) =>
                                setAmountByPool((current) => ({
                                  ...current,
                                  [pool.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              placeholder="Enter amount"
                            />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="defi"
                              className="flex-1"
                              disabled={intentMutation.isPending || !pool.actions.addLiquidity.enabled}
                              onClick={() =>
                                submitIntent(pool.id, "add_liquidity", pool.actions.addLiquidity)
                              }
                            >
                              {isLiquidityPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Add Liquidity"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              disabled={intentMutation.isPending || !pool.actions.stake.enabled}
                              onClick={() => submitIntent(pool.id, "stake", pool.actions.stake)}
                            >
                              {isStakePending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Stake"
                              )}
                            </Button>
                          </div>
                          {!pool.actions.addLiquidity.enabled && pool.actions.addLiquidity.disabledReason ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {pool.actions.addLiquidity.disabledReason}
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">DeFi Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Token Swaps</h3>
                <p className="text-muted-foreground">Instant token swaps with minimal slippage</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Liquidity Mining</h3>
                <p className="text-muted-foreground">Earn rewards by providing liquidity to pools</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Yield Farming</h3>
                <p className="text-muted-foreground">Maximize returns through strategic yield farming</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Staking Rewards</h3>
                <p className="text-muted-foreground">Stake tokens for passive income generation</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DeFi;
