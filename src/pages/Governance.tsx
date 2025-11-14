import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Vote, 
  Users, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  Shield
} from "lucide-react";

const proposals = [
  {
    id: 1,
    title: "Increase Gaming Rewards Pool",
    description: "Proposal to increase the daily gaming rewards pool from 1M to 1.5M APOM tokens",
    status: "Active",
    votesFor: "12.5M",
    votesAgainst: "2.1M", 
    timeLeft: "3 days",
    quorum: "15M",
    type: "Treasury"
  },
  {
    id: 2,
    title: "Add Solana Chain Support",
    description: "Technical proposal to integrate Solana blockchain for faster gaming transactions",
    status: "Pending",
    votesFor: "0",
    votesAgainst: "0",
    timeLeft: "7 days",
    quorum: "10M",
    type: "Technical"
  },
  {
    id: 3,
    title: "New NFT Royalty Structure",
    description: "Proposal to reduce marketplace fees from 2.5% to 2% and increase creator royalties",
    status: "Passed",
    votesFor: "18.2M",
    votesAgainst: "4.8M",
    timeLeft: "Ended",
    quorum: "15M",
    type: "Governance"
  },
  {
    id: 4,
    title: "Launch Gaming Tournament",
    description: "Proposal to fund a $500K gaming tournament across all platform games",
    status: "Active",
    votesFor: "8.9M",
    votesAgainst: "1.2M",
    timeLeft: "5 days", 
    quorum: "12M",
    type: "Community"
  }
];

const Governance = () => {
  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 animated-bg">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-accent bg-clip-text text-transparent">
                  DAO Governance
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Shape the future of APOM Solutions through decentralized governance and community voting
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl">
                  <Vote className="w-5 h-5" />
                  Vote Now
                </Button>
                <Button variant="outline" size="xl">
                  <FileText className="w-5 h-5" />
                  Create Proposal
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Governance Stats */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-accent bg-clip-text text-transparent">
                    45.2M
                  </CardTitle>
                  <CardDescription>Total Voting Power</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                    156
                  </CardTitle>
                  <CardDescription>Active Proposals</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                    2.8K
                  </CardTitle>
                  <CardDescription>Active Voters</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gradient-card text-center">
                <CardHeader>
                  <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                    78%
                  </CardTitle>
                  <CardDescription>Participation Rate</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Active Proposals */}
            <h2 className="text-3xl font-bold text-center mb-12">Active Proposals</h2>
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="gradient-card border-border/50 hover:shadow-primary transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-xl">{proposal.title}</CardTitle>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            proposal.status === 'Active' ? 'bg-accent/20 text-accent' :
                            proposal.status === 'Pending' ? 'bg-primary/20 text-primary' :
                            'bg-muted/20 text-muted-foreground'
                          }`}>
                            {proposal.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary/50 text-secondary-foreground">
                            {proposal.type}
                          </span>
                        </div>
                        <CardDescription className="text-muted-foreground">
                          {proposal.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Voting Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>For: {proposal.votesFor} APOM</span>
                          <span>Against: {proposal.votesAgainst} APOM</span>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-2">
                          {proposal.status !== 'Pending' && (
                            <>
                              <div 
                                className="bg-accent h-2 rounded-l-full" 
                                style={{ 
                                  width: `${(parseFloat(proposal.votesFor.replace('M', '')) / 
                                    (parseFloat(proposal.votesFor.replace('M', '')) + parseFloat(proposal.votesAgainst.replace('M', '')))) * 100}%` 
                                }}
                              />
                              <div 
                                className="bg-destructive h-2 rounded-r-full -mt-2 ml-auto" 
                                style={{ 
                                  width: `${(parseFloat(proposal.votesAgainst.replace('M', '')) / 
                                    (parseFloat(proposal.votesFor.replace('M', '')) + parseFloat(proposal.votesAgainst.replace('M', '')))) * 100}%` 
                                }}
                              />
                            </>
                          )}
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Quorum: {proposal.quorum} APOM</span>
                          <span>Time left: {proposal.timeLeft}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant={proposal.status === 'Active' ? 'hero' : 'secondary'} 
                          className="flex-1"
                          disabled={proposal.status !== 'Active'}
                        >
                          <Vote className="w-4 h-4" />
                          {proposal.status === 'Active' ? 'Vote' : 
                           proposal.status === 'Pending' ? 'Not Started' : 'Ended'}
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <MessageSquare className="w-4 h-4" />
                          Discuss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How Governance Works */}
        <section className="py-16 px-4 bg-secondary/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How Governance Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Propose</h3>
                <p className="text-muted-foreground">
                  Token holders submit proposals for platform improvements
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Discuss</h3>
                <p className="text-muted-foreground">
                  Community debates and refines proposals before voting
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Vote className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Vote</h3>
                <p className="text-muted-foreground">
                  Token holders vote with their APOM tokens as voting power
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">4. Execute</h3>
                <p className="text-muted-foreground">
                  Approved proposals are automatically implemented
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

export default Governance;