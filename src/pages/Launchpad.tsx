import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Rocket, Target, Users, DollarSign, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
  contributeToProject,
  getLaunchpadOverview,
  getLaunchpadProjectDetails,
} from "@/lib/launchpad-api";
import type { ContributeToProjectResponse, LaunchpadProjectSummary } from "@/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useProtectedAction } from "@/hooks/use-protected-action";

function formatCompact(value: number) {
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

function formatStatus(status: LaunchpadProjectSummary["status"]) {
  if (status === "live") {
    return "Live";
  }

  if (status === "upcoming") {
    return "Upcoming";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Cancelled";
}

const Launchpad = () => {
  const queryClient = useQueryClient();
  const { ensureAccess } = useProtectedAction();
  const [amountByProject, setAmountByProject] = useState<Record<string, string>>({});
  const [contributionState, setContributionState] = useState<{
    type: "success" | "failure";
    message: string;
  } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const overviewQuery = useApiQuery({
    queryKey: ["launchpad", "overview"],
    request: getLaunchpadOverview,
  });

  const detailsMutation = useApiMutation({
    mutationFn: (projectId: string) => getLaunchpadProjectDetails(projectId),
    showErrorToast: false,
    onError: (error) => {
      setContributionState({
        type: "failure",
        message: error.safeMessage,
      });
    },
  });

  const contributionMutation = useApiMutation<ContributeToProjectResponse, { projectId: string; amount: number }>({
    mutationFn: ({ projectId, amount }) => contributeToProject(projectId, { amount }),
    onSuccess: (result) => {
      setContributionState({
        type: "success",
        message: result.message,
      });
      void queryClient.invalidateQueries({ queryKey: ["launchpad", "overview"] });
      setAmountByProject((current) => ({
        ...current,
        [result.project.id]: "",
      }));
    },
    onError: (error) => {
      setContributionState({
        type: "failure",
        message: error.safeMessage,
      });
    },
  });

  const submitContribution = (project: LaunchpadProjectSummary) => {
    if (
      !ensureAccess({
        authMessage: "Sign in and connect your wallet to contribute to launchpad projects.",
        walletMessage: "Connect your linked wallet to contribute to launchpad projects.",
        walletRequired: true,
      })
    ) {
      return;
    }

    setContributionState(null);

    if (!project.contributionAction.enabled) {
      setContributionState({
        type: "failure",
        message: project.contributionAction.disabledReason || "Contributions are not available for this project.",
      });
      return;
    }

    const rawAmount = amountByProject[project.id] ?? "";
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setContributionState({
        type: "failure",
        message: "Enter a valid contribution amount greater than 0.",
      });
      return;
    }

    contributionMutation.mutate({
      projectId: project.id,
      amount,
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
                <span className="gradient-primary bg-clip-text text-transparent">Project Launchpad</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover and invest in the next generation of gaming and DeFi projects before they launch
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="hero" size="xl">
                  <a href="#active-projects">
                    <Rocket className="w-5 h-5" />
                    Explore Projects
                  </a>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <a href="#launchpad-process">
                    <Target className="w-5 h-5" />
                    Submit Project
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {contributionState ? (
              <Card className={`mb-8 ${contributionState.type === "success" ? "border-accent/50" : "border-destructive/50"}`}>
                <CardHeader>
                  <CardTitle>
                    {contributionState.type === "success" ? "Contribution success" : "Contribution failure"}
                  </CardTitle>
                  <CardDescription>{contributionState.message}</CardDescription>
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
                        <Skeleton className="h-6 w-2/3" />
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
                  <CardTitle>Unable to load launchpad projects</CardTitle>
                  <CardDescription>We could not load launchpad projects right now.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : overviewQuery.data && overviewQuery.data.projects.length === 0 ? (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>No projects available</CardTitle>
                  <CardDescription>Projects will appear here when they are available.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
                        {formatCurrency(overviewQuery.data?.stats.totalRaised ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Raised</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-gaming bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalProjects ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Projects</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-defi bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.liveProjects ?? 0)}
                      </CardTitle>
                      <CardDescription>Live Projects</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="gradient-card text-center">
                    <CardHeader>
                      <CardTitle className="text-2xl gradient-nft bg-clip-text text-transparent">
                        {formatCompact(overviewQuery.data?.stats.totalParticipants ?? 0)}
                      </CardTitle>
                      <CardDescription>Total Participants</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <h2 id="active-projects" className="text-3xl font-bold text-center mb-12 scroll-mt-24">
                  Active & Upcoming Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {overviewQuery.data?.projects.map((project) => {
                    const isContributing =
                      contributionMutation.isPending &&
                      contributionMutation.variables &&
                      contributionMutation.variables.projectId === project.id;
                    const isLoadingDetails =
                      detailsMutation.isPending && detailsMutation.variables === project.id;
                    const details =
                      selectedProjectId === project.id ? detailsMutation.data : null;

                    return (
                      <Card
                        key={project.id}
                        className="gradient-card border-border/50 hover:shadow-primary transition-smooth"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <CardDescription className="flex items-center space-x-2">
                                <span>{project.type}</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    project.status === "live"
                                      ? "bg-accent/20 text-accent"
                                      : project.status === "upcoming"
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted/20 text-muted-foreground"
                                  }`}
                                >
                                  {formatStatus(project.status)}
                                </span>
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Progress</div>
                              <div className="text-lg font-bold">{project.progressPercentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="w-full bg-secondary/50 rounded-full h-2 mb-4">
                            <div
                              className="gradient-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(project.progressPercentage, 100)}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <div className="text-muted-foreground">Raised</div>
                              <div className="font-bold text-primary">{formatCurrency(project.raised)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Target</div>
                              <div className="font-bold">{formatCurrency(project.target)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Participants</div>
                              <div className="font-bold">{formatCompact(project.participants)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Timeline</div>
                              <div className="font-bold">{project.timeline}</div>
                            </div>
                          </div>

                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={amountByProject[project.id] ?? ""}
                            onChange={(event) =>
                              setAmountByProject((current) => ({
                                ...current,
                                [project.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-4"
                            placeholder="Contribution amount (USD)"
                          />

                          <div className="flex gap-2">
                            <Button
                              variant={project.contributionAction.enabled ? "hero" : "secondary"}
                              className="flex-1"
                              disabled={contributionMutation.isPending || !project.contributionAction.enabled}
                              onClick={() => submitContribution(project)}
                            >
                              {isContributing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Contributing...
                                </>
                              ) : (
                                project.contributionAction.label
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              disabled={detailsMutation.isPending}
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                detailsMutation.mutate(project.id);
                              }}
                            >
                              {isLoadingDetails ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "View Details"
                              )}
                            </Button>
                          </div>

                          {!project.contributionAction.enabled && project.contributionAction.disabledReason ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {project.contributionAction.disabledReason}
                            </p>
                          ) : null}

                          {details && details.project.id === project.id ? (
                            <div className="mt-4 rounded-md border border-border/60 p-3">
                              <p className="text-sm font-semibold">Recent contributions</p>
                              {details.recentContributions.length === 0 ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  No contributions yet for this project.
                                </p>
                              ) : (
                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {details.recentContributions.slice(0, 3).map((entry) => (
                                    <li key={entry.id}>
                                      {entry.userId}: {formatCurrency(entry.amount)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
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

        <section id="launchpad-process" className="py-16 px-4 bg-secondary/20 scroll-mt-24">
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
