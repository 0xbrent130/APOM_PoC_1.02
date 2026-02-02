import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Image, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Crown,
  Palette,
  Gamepad2,
  Star
} from "lucide-react";

const nftCollections = [
  {
    id: 1,
    name: "CyberWarriors",
    floorPrice: "2.5 ETH",
    volume: "156 ETH",
    items: "10,000",
    image: "⚔️",
    category: "Gaming"
  },
  {
    id: 2,
    name: "Digital Artifacts",
    floorPrice: "0.8 ETH", 
    volume: "89 ETH",
    items: "5,000",
    image: "🏺",
    category: "Art"
  },
  {
    id: 3,
    name: "Quantum Vehicles",
    floorPrice: "1.2 ETH",
    volume: "234 ETH", 
    items: "3,000",
    image: "🚗",
    category: "Gaming"
  },
  {
    id: 4,
    name: "MetaLands",
    floorPrice: "4.1 ETH",
    volume: "445 ETH",
    items: "1,000", 
    image: "🏝️",
    category: "Virtual Real Estate"
  }
];

const featuredNFTs = [
  {
    id: 1,
    name: "Legendary Sword #001",
    price: "12.5 ETH",
    seller: "CryptoWarrior",
    image: "⚔️",
    rarity: "Legendary"
  },
  {
    id: 2,
    name: "Cyberpunk Avatar #456",
    price: "3.2 ETH", 
    seller: "DigitalArtist",
    image: "🤖",
    rarity: "Epic"
  },
  {
    id: 3,
    name: "Racing Beast #789",
    price: "5.8 ETH",
    seller: "SpeedDemon", 
    image: "🏎️",
    rarity: "Rare"
  }
];

const NFTMarketplace = () => {
  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-nft bg-clip-text text-transparent">
                  NFT Marketplace
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover, collect, and trade unique digital assets from gaming and art communities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="nft" size="xl">
                  <ShoppingCart className="w-5 h-5" />
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

        {/* Marketplace Stats */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-nft bg-clip-text text-transparent">
                    45.2K
                  </CardTitle>
                  <CardDescription>Total NFTs</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                    1,234 ETH
                  </CardTitle>
                  <CardDescription>Total Volume</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                    8.9K
                  </CardTitle>
                  <CardDescription>Active Traders</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                    156
                  </CardTitle>
                  <CardDescription>Collections</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Featured NFTs */}
            <h2 className="text-3xl font-bold text-center mb-12">Featured NFTs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {featuredNFTs.map((nft) => (
                <Card key={nft.id} className="gradient-card border-border/50 hover:shadow-nft transition-smooth">
                  <CardHeader>
                    <div className="text-6xl text-center mb-4">{nft.image}</div>
                    <CardTitle className="text-center">{nft.name}</CardTitle>
                    <CardDescription className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        nft.rarity === 'Legendary' ? 'bg-nft/20 text-nft' :
                        nft.rarity === 'Epic' ? 'bg-primary/20 text-primary' :
                        'bg-accent/20 text-accent'
                      }`}>
                        {nft.rarity}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-nft">{nft.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seller:</span>
                        <span className="font-semibold">{nft.seller}</span>
                      </div>
                    </div>
                    <Button variant="nft" className="w-full mt-4">
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Collections */}
            <h2 className="text-3xl font-bold text-center mb-12">Top Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nftCollections.map((collection) => (
                <Card key={collection.id} className="gradient-card border-border/50 hover:shadow-nft transition-smooth">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{collection.image}</div>
                      <div>
                        <CardTitle className="text-xl">{collection.name}</CardTitle>
                        <CardDescription>{collection.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Floor Price</div>
                        <div className="font-bold text-nft">{collection.floorPrice}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volume</div>
                        <div className="font-bold">{collection.volume}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Items</div>
                        <div className="font-bold">{collection.items}</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View Collection
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* NFT Features */}
        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Marketplace Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Royalty System</h3>
                <p className="text-muted-foreground">
                  Creators earn royalties on every secondary sale
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gaming Integration</h3>
                <p className="text-muted-foreground">
                  Use NFTs directly in supported games
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Price Analytics</h3>
                <p className="text-muted-foreground">
                  Track price history and market trends
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-nft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">
                  Connect with artists and collectors
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

export default NFTMarketplace;