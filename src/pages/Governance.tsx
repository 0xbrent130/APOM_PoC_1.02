import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Vote,
  FileText,
  CheckCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuthState } from "@/state/auth-state";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGovernanceOverview,
  submitProposalDiscussion,
  submitProposalVote,
} from "@/lib/governance-api";
import type {
  GovernanceProposalSummary,
  SubmitDiscussionResponse,
  SubmitVoteResponse,
} from "@/contracts";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatStatus(status: GovernanceProposalSummary["status"]) {
  if (status === "active") {
    return "Active";
  }

  if (status === "pending") {
    return "Pending";
  }

  if (status === "passed") {
    return "Passed";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Executed";
}

function statusClass(status: GovernanceProposalSummary["status"]) {
  if (status === "active") {
    return "bg-accent/20 text-accent";
  }

  if (status === "pending") {
    return "bg-primary/20 text-primary";
  }

  if (status === "passed") {
    return "bg-accent/20 text-accent";
  }

  if (status === "rejected") {
    return "bg-destructive/20 text-destructive";
  }

  return "bg-muted/40 text-muted-foreground";
}

interface VoteVariables {
  proposalId: string;
  support: boolean;
}

interface DiscussionVariables {
  proposalId: string;
  message: string;
}

const Governance = () => {
  const queryClient = useQueryClient();
  const { session, openLoginPrompt } = useAuthState();
  const [voteState, setVoteState] = useState<{
    type: "success" | "failure";
    message: string;
    proposalId?: string;
  } | null>(null);
  const [discussionState, setDiscussionState] = useState<{
    type: "success" | "failure";
    message: string;
    proposalId?: string;
  } | null>(null);

  const overviewQuery = useApiQuery({
    queryKey: ["governance", "overview"],
    request: getGovernanceOverview,
  });

  const voteMutation = useApiMutation<SubmitVoteResponse, VoteVariables>({
    mutationFn: ({ proposalId, support }) => submitProposalVote(proposalId, { support }),
    onSuccess: async (result) => {
      setVoteState({
        type: "success",
        message: result.message,
        proposalId: result.proposal.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["governance", "overview"] });
    },
    onError: (error, variables) => {
      setVoteState({
        type: "failure",
        message: error.safeMessage,
        proposalId: variables.proposalId,
      });
      void queryClient.invalidateQueries({ queryKey: ["governance", "overview"] });
    },
  });

  const discussMutation = useApiMutation<SubmitDiscussionResponse, DiscussionVariables>({
    mutationFn: ({ proposalId, message }) => submitProposalDiscussion(proposalId, { message }),
    onSuccess: (result) => {
      setDiscussionState({
        type: "success",
        message: result.message,
        proposalId: result.proposal.id,
      });
    },
    onError: (error, variables) => {
      setDiscussionState({
        type: "failure",
        message: error.safeMessage,
        proposalId: variables.proposalId,
      });
      void queryClient.invalidateQueries({ queryKey: ["governance", "overview"] });
    },
  });

  const submitVote = (proposal: GovernanceProposalSummary, support: boolean) => {
    setVoteState(null);

    if (!session) {
      setVoteState({
        type: "failure",
        message: "Authentication required before voting.",
        proposalId: proposal.id,
      });
      openLoginPrompt("Sign in to vote on governance proposals.");
      return;
    }

    if (!proposal.actions.vote.enabled) {
      setVoteState({
        type: "failure",
        message: proposal.actions.vote.disabledReason || "Voting is unavailable for this proposal.",
        proposalId: proposal.id,
      });
      return;
    }

    voteMutation.mutate({
      proposalId: proposal.id,
      support,
    });
  };

  const submitDiscussion = (proposal: GovernanceProposalSummary) => {
    setDiscussionState(null);

    if (!session) {
      setDiscussionState({
        type: "failure",
        message: "Authentication required before discussion actions.",
        proposalId: proposal.id,
      });
      openLoginPrompt("Sign in to discuss governance proposals.");
      return;
    }

    if (!proposal.actions.discuss.enabled) {
      setDiscussionState({
        type: "failure",
        message: proposal.actions.discuss.disabledReason || "Discussion is unavailable for this proposal.",
        proposalId: proposal.id,
      });
      return;
    }

    discussMutation.mutate({
      proposalId: proposal.id,
      message: "Open governance discussion",
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
                <span className="gradient-accent bg-clip-text text-transparent">DAO Governance</span>
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

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {voteState ? (
              <Card className={`mb-6 ${voteState.type === "success" ? "border-accent/50" : "border-destructive/50"}`}>
                <CardHeader>
                  <CardTitle>{voteState.type === "success" ? "Vote recorded" : "Vote failed"}</CardTitle>
                  <CardDescription>{voteState.message}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {discussionState ? (
              <Card
                className={`mb-8 ${
                  discussionState.type === "success" ? "border-accent/50" : "border-destructive/50"
                }`}
              >
                <CardHeader>
                  <CardTitle>{discussionState.type === "success" ? "Discussion submitted" : "Discussion failed"}</CardTitle>
                  <CardDescription>{discussionState.message}</CardDescription>
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
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="gradient-card border-border/50">
                      <CardHeader>
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
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
                  <CardTitle>Unable to load governance proposals</CardTitle>
                  <CardDescription>Could not fetch governance data from the backend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overviewQuery.data && overviewQuery.data.proposals.length === 0 ? (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>No proposals available</CardTitle>
                  <CardDescription>New proposals will appear once governance submissions are published.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-accent bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalVotingPower ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Voting Power</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalProposals ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Proposals</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.activeProposals ?? 0)}
                      </CardTitle>
                      <CardDescription>Active Proposals</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalQuorum ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Quorum</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <h2 className="text-3xl font-bold text-center mb-12">Governance Proposals</h2>
                <div className="space-y-6">
                  {overviewQuery.data?.proposals.map((proposal) => {
                    const totalVotes = proposal.totalVotes;
                    const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
                    const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
                    const votePending = voteMutation.isPending && voteMutation.variables?.proposalId === proposal.id;
                    const discussPending =
                      discussMutation.isPending && discussMutation.variables?.proposalId === proposal.id;
                    const voteDisabled = votePending || !proposal.actions.vote.enabled;
                    const discussDisabled = discussPending || !proposal.actions.discuss.enabled;

                    return (
                      <Card key={proposal.id} className="gradient-card border-border/50 hover:shadow-primary transition-smooth">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                <CardTitle className="text-xl">{proposal.title}</CardTitle>
                                <span className={`px-2 py-1 rounded-full text-xs ${statusClass(proposal.status)}`}>
                                  {formatStatus(proposal.status)}
                                </span>
                              </div>
                              <CardDescription className="text-muted-foreground">{proposal.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>For: {formatCompact(proposal.votesFor)} APOM</span>
                                <span>Against: {formatCompact(proposal.votesAgainst)} APOM</span>
                              </div>
                              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                                <div className="bg-accent h-2" style={{ width: `${forPercent}%` }} />
                                <div className="bg-destructive h-2 -mt-2 ml-auto" style={{ width: `${againstPercent}%` }} />
                              </div>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Quorum: {formatCompact(proposal.quorum)} APOM</span>
                                <span>{proposal.timeline}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Button
                                variant={proposal.actions.vote.enabled ? "hero" : "secondary"}
                                disabled={voteDisabled}
                                onClick={() => submitVote(proposal, true)}
                              >
                                {votePending && voteMutation.variables?.support ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Voting For...
                                  </>
                                ) : (
                                  <>
                                    <Vote className="w-4 h-4" />
                                    Vote For
                                  </>
                                )}
                              </Button>
                              <Button
                                variant={proposal.actions.vote.enabled ? "outline" : "secondary"}
                                disabled={voteDisabled}
                                onClick={() => submitVote(proposal, false)}
                              >
                                {votePending && voteMutation.variables && !voteMutation.variables.support ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Voting Against...
                                  </>
                                ) : (
                                  <>
                                    <Vote className="w-4 h-4" />
                                    Vote Against
                                  </>
                                )}
                              </Button>
                              <Button
                                variant={proposal.actions.discuss.enabled ? "outline" : "secondary"}
                                disabled={discussDisabled}
                                onClick={() => submitDiscussion(proposal)}
                              >
                                {discussPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="w-4 h-4" />
                                    {proposal.actions.discuss.label}
                                  </>
                                )}
                              </Button>
                            </div>

                            {!proposal.actions.vote.enabled && proposal.actions.vote.disabledReason ? (
                              <p className="text-xs text-muted-foreground">{proposal.actions.vote.disabledReason}</p>
                            ) : null}
                          </div>
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
            <h2 className="text-3xl font-bold text-center mb-12">How Governance Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Propose</h3>
                <p className="text-muted-foreground">Token holders submit proposals for platform improvements</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Discuss</h3>
                <p className="text-muted-foreground">Community debates and refines proposals before voting</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Vote className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Vote</h3>
                <p className="text-muted-foreground">Token holders vote with their APOM tokens as voting power</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">4. Execute</h3>
                <p className="text-muted-foreground">Approved proposals are implemented after voting closes</p>
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
