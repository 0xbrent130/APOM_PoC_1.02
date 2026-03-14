import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Gamepad2 } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import { Link, useLocation } from "react-router-dom";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden animated-bg"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            The Future of{" "}
            <span className="gradient-gaming bg-clip-text text-transparent">
              Gaming
            </span>{" "}
            &{" "}
            <span className="gradient-defi bg-clip-text text-transparent">
              DeFi
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience seamless on-chain gaming, decentralized finance, and NFT
            trading all in one revolutionary platform powered by multiple
            blockchains.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/gaming">
              <Button variant="hero" size="xl" className="text-lg">
                <Play className="w-5 h-5" />
                Start Gaming
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/defi">
              <Button variant="defi" size="xl" className="text-lg">
                <TrendingUp className="w-5 h-5" />
                Explore DeFi
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                $2.5M+
              </div>
              <div className="text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-gaming bg-clip-text text-transparent">
                15K+
              </div>
              <div className="text-muted-foreground">Active Gamers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-nft bg-clip-text text-transparent">
                6K+
              </div>
              <div className="text-muted-foreground">NFTs Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-defi bg-clip-text text-transparent">
                5+
              </div>
              <div className="text-muted-foreground">Blockchains</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 gradient-gaming rounded-full opacity-20 glow-animation" />
      <div
        className="absolute top-40 right-20 w-16 h-16 gradient-defi rounded-full opacity-20 glow-animation"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-12 h-12 gradient-nft rounded-full opacity-20 glow-animation"
        style={{ animationDelay: "2s" }}
      />
    </section>
  );
};

export default HeroSection;
