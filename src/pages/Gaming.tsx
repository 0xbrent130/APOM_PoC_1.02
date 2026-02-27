import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Play, Trophy, Coins, Shield, Zap, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { getGamingOverview, playGame } from "@/lib/gaming-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/state/auth-state";
import { useProtectedAction } from "@/hooks/use-protected-action";

function formatPlayers(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatStatus(status: "live" | "coming_soon" | "maintenance" | "archived") {
  if (status === "live") {
    return "Live";
  }

  if (status === "coming_soon") {
    return "Coming Soon";
  }

  if (status === "maintenance") {
    return "Maintenance";
  }

  return "Archived";
}

const Gaming = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { wallet } = useAuthState();
  const { ensureAccess } = useProtectedAction();
  const overviewQuery = useApiQuery({
    queryKey: ["gaming", "overview"],
    request: getGamingOverview,
  });
  const playMutation = useApiMutation({
    mutationFn: (slug: string) =>
      playGame(slug, {
        wallet: wallet?.address,
      }),
    onSuccess: (result) => {
      toast({
        title: "Participation recorded",
        description: `You joined ${result.game.title}.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["gaming", "overview"] });
    },
  });

  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-gaming bg-clip-text text-transparent">
                  Gaming Hub
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Play to earn, own your assets, and compete in the ultimate blockchain gaming ecosystem
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="gaming" size="xl">
                  <a href="#featured-games">
                    <Play className="w-5 h-5" />
                    Start Playing
                  </a>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <a href="#gaming-features">
                    <Trophy className="w-5 h-5" />
                    Leaderboards
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games */}
        <section id="featured-games" className="py-16 px-4 scroll-mt-24">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Games</h2>
            {overviewQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="gradient-card border-border/50">
                    <CardHeader>
                      <Skeleton className="h-7 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : overviewQuery.isError ? (
              <Card className="gradient-card border-destructive/50">
                <CardHeader>
                  <CardTitle>Unable to load games</CardTitle>
                  <CardDescription>We could not load gaming data right now.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overviewQuery.data && overviewQuery.data.games.length === 0 ? (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>No games available</CardTitle>
                  <CardDescription>New games will appear here when they become available.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-8">
                {overviewQuery.data ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <Card className="gradient-card text-center">
                      <CardHeader>
                        <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                          {overviewQuery.data.stats.totalGames}
                        </CardTitle>
                        <CardDescription>Total Games</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="gradient-card text-center">
                      <CardHeader>
                        <CardTitle className="text-2xl gradient-accent bg-clip-text text-transparent">
                          {overviewQuery.data.stats.liveGames}
                        </CardTitle>
                        <CardDescription>Live Games</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="gradient-card text-center">
                      <CardHeader>
                        <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                          {formatPlayers(overviewQuery.data.stats.totalActivePlayers)}
                        </CardTitle>
                        <CardDescription>Total Players</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="gradient-card text-center">
                      <CardHeader>
                        <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                          {overviewQuery.data.stats.rewardPrograms}
                        </CardTitle>
                        <CardDescription>Reward Programs</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {overviewQuery.data?.games.map((game) => (
                    <Card key={game.id} className="gradient-card border-border/50 hover:shadow-gaming transition-smooth">
                      <CardHeader>
                        <CardTitle className="text-lg">{game.title}</CardTitle>
                        <CardDescription>{game.genre}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Players:</span>
                            <span className="text-gaming">{formatPlayers(game.activePlayers)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rewards:</span>
                            <span className="text-accent">{game.rewardRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={game.status === "live" ? "text-accent" : "text-muted-foreground"}>
                              {formatStatus(game.status)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={game.action.enabled ? "gaming" : "secondary"}
                          className="w-full mt-4"
                          disabled={!game.action.enabled || playMutation.isPending}
                          onClick={() => {
                            if (
                              !ensureAccess({
                                authMessage: "Sign in and connect your wallet to join games.",
                                walletMessage: "Connect your linked wallet to join games.",
                                walletRequired: true,
                              })
                            ) {
                              return;
                            }

                            playMutation.mutate(game.slug);
                          }}
                        >
                          {playMutation.isPending && playMutation.variables === game.slug ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            game.action.label
                          )}
                        </Button>
                        {!game.action.enabled && game.action.disabledReason ? (
                          <p className="mt-2 text-xs text-muted-foreground">{game.action.disabledReason}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Gaming Features */}
        <section id="gaming-features" className="py-16 px-4 bg-secondary/20 scroll-mt-24">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Gaming Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Play-to-Earn</h3>
                <p className="text-muted-foreground">
                  Earn real cryptocurrency rewards while playing your favorite games
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">True Ownership</h3>
                <p className="text-muted-foreground">
                  Own your in-game assets as NFTs that you can trade or use across games
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cross-Game Items</h3>
                <p className="text-muted-foreground">
                  Use your assets across multiple games in our ecosystem
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Gaming;
