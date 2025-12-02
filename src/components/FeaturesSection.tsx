import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Gamepad2,
  TrendingUp,
  Image,
  Rocket,
  Vote,
  BarChart3,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const features = [
  {
    id: "gaming",
    icon: Gamepad2,
    title: "On-Chain Gaming",
    description:
      "Experience immersive blockchain games with true asset ownership and play-to-earn mechanics.",
    gradient: "gradient-gaming",
    shadowClass: "shadow-gaming",
    features: [
      "NFT Game Assets",
      "Play-to-Earn",
      "Cross-Game Items",
      "Tournament Rewards",
    ],
  },
  {
    id: "defi",
    icon: TrendingUp,
    title: "DeFi Trading",
    description:
      "Trade tokens, provide liquidity, and earn rewards with advanced DeFi protocols.",
    gradient: "gradient-defi",
    shadowClass: "shadow-defi",
    features: [
      "Token Swaps",
      "Liquidity Pools",
      "Yield Farming",
      "Staking Rewards",
    ],
  },
  {
    id: "nft-marketplace",
    icon: Image,
    title: "NFT Marketplace",
    description:
      "Buy, sell, and trade unique digital assets across multiple gaming ecosystems.",
    gradient: "gradient-nft",
    shadowClass: "shadow-nft",
    features: [
      "Art Collections",
      "Gaming NFTs",
      "Royalty System",
      "Cross-Chain",
    ],
  },
  {
    id: "launchpad",
    icon: Rocket,
    title: "Project Launchpad",
    description:
      "Discover and invest in promising new gaming and DeFi projects before they launch.",
    gradient: "gradient-primary",
    shadowClass: "shadow-primary",
    features: [
      "IDO Platform",
      "Early Access",
      "Vetting Process",
      "Community Voting",
    ],
  },
  {
    id: "governance",
    icon: Vote,
    title: "DAO Governance",
    description:
      "Shape the future of the platform through decentralized governance and voting.",
    gradient: "gradient-primary",
    shadowClass: "shadow-primary",
    features: [
      "Proposal System",
      "Token Voting",
      "Treasury Management",
      "Community Rewards",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track your performance with comprehensive analytics and insights.",
    gradient: "gradient-primary",
    shadowClass: "shadow-primary",
    features: [
      "Portfolio Tracking",
      "P&L Analysis",
      "Market Data",
      "Performance Metrics",
    ],
  },
];

const additionalFeatures = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second transaction processing",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Multi-layer security with audited contracts",
  },
  {
    icon: Globe,
    title: "Multi-Chain",
    description: "Support for 5+ major blockchains",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              Web3 Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for gaming, DeFi, and NFTs in one seamless
            ecosystem
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link to={`/${feature.id}`} key={feature.id}>
                <Card
                  key={feature.id}
                  className={`gradient-card border-border/50 hover:${feature.shadowClass} transition-smooth cursor-pointer group`}
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full mt-4 hover:bg-primary/10"
                    >
                      Explore {feature.title}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {additionalFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
