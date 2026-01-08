import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Rocket, 
  Clock, 
  Target, 
  Users,
  Star,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";

const projects = [
  {
    id: 1,
    name: "AstroQuest",
    type: "Gaming",
    status: "Live",
    raised: "$450K",
    target: "$500K",
    participants: "1,250",
    timeLeft: "2 days",
    progress: 90,
    image: "🚀"
  },
  {
    id: 2,
    name: "DeFiVault Pro",
    type: "DeFi",
    status: "Upcoming",
    raised: "$0",
    target: "$1.2M", 
    participants: "0",
    timeLeft: "5 days",
    progress: 0,
    image: "🏛️"
  },
  {
    id: 3,
    name: "PixelRealm",
    type: "Gaming",
    status: "Completed",
    raised: "$2.1M",
    target: "$2M",
    participants: "3,450",
    timeLeft: "Ended",
    progress: 105,
    image: "🎮"
  },
  {
    id: 4,
    name: "MetaNFT Studio",
    type: "NFT",
    status: "Upcoming",
    raised: "$0",
    target: "$800K",
    participants: "0", 
    timeLeft: "12 days",
    progress: 0,
    image: "🎨"
  }
];

const Launchpad = () => {
  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-primary bg-clip-text text-transparent">
                  Project Launchpad
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover and invest in the next generation of gaming and DeFi projects before they launch
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl">
                  <Rocket className="w-5 h-5" />
                  Explore Projects
                </Button>
                <Button variant="outline" size="xl">
                  <Target className="w-5 h-5" />
                  Submit Project
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Launchpad Stats */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                    $12.5M
                  </CardTitle>
                  <CardDescription>Total Raised</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                    45
                  </CardTitle>
                  <CardDescription>Projects Launched</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                    8.9K
                  </CardTitle>
                  <CardDescription>Total Participants</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-nft bg-clip-text text-transparent">
                    95%
                  </CardTitle>
                  <CardDescription>Success Rate</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Featured Projects */}
            <h2 className="text-3xl font-bold text-center mb-12">Active & Upcoming Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="gradient-card border-border/50 hover:shadow-primary transition-smooth">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{project.image}</div>
                        <div>
                          <CardTitle className="text-xl">{project.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <span>{project.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              project.status === 'Live' ? 'bg-accent/20 text-accent' :
                              project.status === 'Upcoming' ? 'bg-primary/20 text-primary' :
                              'bg-muted/20 text-muted-foreground'
                            }`}>
                              {project.status}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="text-lg font-bold">{project.progress}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="w-full bg-secondary/50 rounded-full h-2 mb-4">
                      <div 
                        className="gradient-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(project.progress, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Raised</div>
                        <div className="font-bold text-primary">{project.raised}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Target</div>
                        <div className="font-bold">{project.target}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Participants</div>
                        <div className="font-bold">{project.participants}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time Left</div>
                        <div className="font-bold">{project.timeLeft}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant={project.status === 'Live' ? 'hero' : 'secondary'} 
                        className="flex-1"
                        disabled={project.status !== 'Live'}
                      >
                        {project.status === 'Live' ? 'Invest Now' : 
                         project.status === 'Upcoming' ? 'Coming Soon' : 'View Results'}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Project Vetting</h3>
                <p className="text-muted-foreground">
                  All projects undergo rigorous due diligence and community review
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Community Vote</h3>
                <p className="text-muted-foreground">
                  Token holders vote on which projects get featured
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Investment</h3>
                <p className="text-muted-foreground">
                  Participate in IDOs with guaranteed allocations
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">4. Launch</h3>
                <p className="text-muted-foreground">
                  Projects launch with full community support
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

export default Launchpad;