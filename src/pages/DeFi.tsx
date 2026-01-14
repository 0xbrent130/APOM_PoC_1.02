import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  TrendingUp, 
  ArrowUpDown, 
  Droplets, 
  PiggyBank,
  BarChart3,
  Coins,
  Wallet,
  Target
} from "lucide-react";

const defiPools = [
  {
    pair: "APOM/ETH",
    tvl: "$2.4M",
    apy: "145.2%",
    volume24h: "$524K",
    type: "Gaming Pool"
  },
  {
    pair: "USDC/APOM", 
    tvl: "$1.8M",
    apy: "89.5%",
    volume24h: "$312K",
    type: "Stable Pool"
  },
  {
    pair: "BTC/ETH",
    tvl: "$5.2M", 
    apy: "32.1%",
    volume24h: "$1.2M",
    type: "Blue Chip"
  },
  {
    pair: "GAME/APOM",
    tvl: "$890K",
    apy: "234.7%",
    volume24h: "$156K", 
    type: "New Launch"
  }
];

const DeFi = () => {
  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-defi bg-clip-text text-transparent">
                  DeFi Exchange
                </span>
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

        {/* DeFi Stats */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                    $24.5M
                  </CardTitle>
                  <CardDescription>Total Value Locked</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                    $2.1M
                  </CardTitle>
                  <CardDescription>24h Volume</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-accent bg-clip-text text-transparent">
                    156%
                  </CardTitle>
                  <CardDescription>Avg APY</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                    12.5K
                  </CardTitle>
                  <CardDescription>Active Users</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Liquidity Pools */}
            <h2 className="text-3xl font-bold text-center mb-12">Top Liquidity Pools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {defiPools.map((pool, index) => (
                <Card key={index} className="gradient-card border-border/50 hover:shadow-defi transition-smooth">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{pool.pair}</CardTitle>
                        <CardDescription className="text-defi">{pool.type}</CardDescription>
                      </div>
                      <span className="text-2xl font-bold gradient-defi bg-clip-text text-transparent">
                        {pool.apy}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TVL:</span>
                        <span className="font-semibold">{pool.tvl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Volume:</span>
                        <span className="font-semibold">{pool.volume24h}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="defi" className="flex-1">
                        Add Liquidity
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Stake
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* DeFi Features */}
        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">DeFi Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Token Swaps</h3>
                <p className="text-muted-foreground">
                  Instant token swaps with minimal slippage
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Liquidity Mining</h3>
                <p className="text-muted-foreground">
                  Earn rewards by providing liquidity to pools
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Yield Farming</h3>
                <p className="text-muted-foreground">
                  Maximize returns through strategic yield farming
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-defi rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Staking Rewards</h3>
                <p className="text-muted-foreground">
                  Stake tokens for passive income generation
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

export default DeFi;