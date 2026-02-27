import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DefiOverview,
  GamingOverview,
  GovernanceOverview,
  LaunchpadOverview,
  NftMarketplaceOverview,
} from "@/contracts";
import DeFi from "@/pages/DeFi";
import Gaming from "@/pages/Gaming";
import Governance from "@/pages/Governance";
import Launchpad from "@/pages/Launchpad";
import NFTMarketplace from "@/pages/NFTMarketplace";

const mockUseApiQuery = vi.fn();
const mockUseApiMutation = vi.fn();
const mockEnsureAccess = vi.fn(() => true);
const mockUseAuthState = vi.fn(() => ({
  wallet: {
    id: "wallet-1",
    userId: "user-1",
    address: "0x1111111111111111111111111111111111111111",
    chainId: 1,
    isPrimary: true,
    linkedAt: new Date().toISOString(),
  },
}));

vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (...args: unknown[]) => mockUseApiQuery(...args),
}));

vi.mock("@/hooks/use-api-mutation", () => ({
  useApiMutation: (...args: unknown[]) => mockUseApiMutation(...args),
}));

vi.mock("@/hooks/use-protected-action", () => ({
  useProtectedAction: () => ({ ensureAccess: mockEnsureAccess }),
}));

vi.mock("@/state/auth-state", () => ({
  useAuthState: () => mockUseAuthState(),
}));

function renderRoute(component: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockQueryState(options: Partial<Record<string, unknown>> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...options,
  };
}

function mockMutationState(options: Partial<Record<string, unknown>> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
    ...options,
  };
}

function mockMutationSequence(states: Array<Record<string, unknown>>) {
  let callIndex = 0;
  mockUseApiMutation.mockImplementation(() => {
    const selected = states[Math.min(callIndex, states.length - 1)];
    callIndex += 1;
    return selected;
  });
}

beforeEach(() => {
  mockUseApiQuery.mockReset();
  mockUseApiMutation.mockReset();
  mockEnsureAccess.mockReset();
  mockEnsureAccess.mockReturnValue(true);
  mockUseAuthState.mockReset();
  mockUseAuthState.mockReturnValue({
    wallet: {
      id: "wallet-1",
      userId: "user-1",
      address: "0x1111111111111111111111111111111111111111",
      chainId: 1,
      isPrimary: true,
      linkedAt: new Date().toISOString(),
    },
  });
});

describe("Gaming route", () => {
  it("renders loading state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isLoading: true }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<Gaming />);

    expect(screen.getByText("Featured Games")).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  it("renders error state and retry affordance", async () => {
    const refetch = vi.fn();
    mockUseApiQuery.mockReturnValue(mockQueryState({ isError: true, refetch }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<Gaming />);

    expect(screen.getByText("Unable to load games")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("renders empty state", () => {
    const overview: GamingOverview = {
      games: [],
      stats: { totalGames: 0, liveGames: 0, totalActivePlayers: 0, rewardPrograms: 0 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<Gaming />);

    expect(screen.getByText("No games available")).toBeTruthy();
  });

  it("renders success state and executes play action", async () => {
    const mutate = vi.fn();
    const overview: GamingOverview = {
      games: [
        {
          id: "game-1",
          slug: "cyber-realm",
          title: "Cyber Realm",
          genre: "RPG",
          status: "live",
          rewardRate: "250 APOM/day",
          activePlayers: 1200,
          updatedAt: new Date().toISOString(),
          action: { enabled: true, label: "Play Now", disabledReason: null },
        },
      ],
      stats: { totalGames: 1, liveGames: 1, totalActivePlayers: 1200, rewardPrograms: 1 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockUseApiMutation.mockReturnValue(mockMutationState({ mutate }));

    renderRoute(<Gaming />);

    expect(screen.getByText("Cyber Realm")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Play Now" }));
    expect(mutate).toHaveBeenCalledWith("cyber-realm");
  });
});

describe("DeFi route", () => {
  it("renders loading state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isLoading: true }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<DeFi />);

    expect(screen.getByText("DeFi Exchange")).toBeTruthy();
    expect(screen.getByText("DeFi Features")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isError: true }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<DeFi />);

    expect(screen.getByText("Unable to load DeFi pools")).toBeTruthy();
  });

  it("renders empty state", () => {
    const overview: DefiOverview = {
      pools: [],
      stats: { totalPools: 0, activePools: 0, totalTvl: 0, totalVolume24h: 0, averageApy: 0 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockUseApiMutation.mockReturnValue(mockMutationState());

    renderRoute(<DeFi />);

    expect(screen.getByText("No pools available")).toBeTruthy();
  });

  it("renders success state and submits Add Liquidity", async () => {
    const mutate = vi.fn();
    const overview: DefiOverview = {
      pools: [
        {
          id: "pool-1",
          pair: "APOM/ETH",
          type: "gaming",
          status: "active",
          tvl: 2000000,
          apy: 15.2,
          volume24h: 450000,
          updatedAt: new Date().toISOString(),
          actions: {
            addLiquidity: { enabled: true, label: "Add Liquidity", disabledReason: null },
            stake: { enabled: true, label: "Stake", disabledReason: null },
          },
        },
      ],
      stats: { totalPools: 1, activePools: 1, totalTvl: 2000000, totalVolume24h: 450000, averageApy: 15.2 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockUseApiMutation.mockReturnValue(mockMutationState({ mutate }));

    renderRoute(<DeFi />);

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "12.5");
    const addLiquidityButtons = screen.getAllByRole("button", { name: "Add Liquidity" });
    await userEvent.click(addLiquidityButtons[addLiquidityButtons.length - 1]);

    expect(mutate).toHaveBeenCalledWith({ poolId: "pool-1", amount: 12.5, action: "add_liquidity" });
  });
});

describe("NFT marketplace route", () => {
  it("renders loading state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isLoading: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<NFTMarketplace />);

    expect(screen.getByText("NFT Marketplace")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isError: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<NFTMarketplace />);

    expect(screen.getByText("Unable to load marketplace data")).toBeTruthy();
  });

  it("renders empty state", () => {
    const overview: NftMarketplaceOverview = {
      collections: [],
      assets: [],
      stats: { totalCollections: 0, totalAssets: 0, listedAssets: 0, soldAssets: 0, totalVolume: 0 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<NFTMarketplace />);

    expect(screen.getByText("Empty inventory")).toBeTruthy();
  });

  it("renders success state and triggers buy action", async () => {
    const buyMutate = vi.fn();
    const listMutate = vi.fn();
    const overview: NftMarketplaceOverview = {
      collections: [
        {
          id: "collection-1",
          name: "Legends",
          category: "Gaming",
          floorPrice: 1.1,
          volume: 45,
          items: 120,
          updatedAt: new Date().toISOString(),
        },
      ],
      assets: [
        {
          id: "asset-1",
          name: "Blade #1",
          tokenId: "1",
          rarity: "Legendary",
          sellerWallet: "0x1111111111111111111111111111111111111111",
          status: "listed",
          price: 1.25,
          updatedAt: new Date().toISOString(),
          collection: { id: "collection-1", name: "Legends", category: "Gaming" },
          actions: {
            buy: { enabled: true, label: "Buy Now", disabledReason: null },
            list: { enabled: true, label: "List NFT", disabledReason: null },
          },
        },
      ],
      stats: { totalCollections: 1, totalAssets: 1, listedAssets: 1, soldAssets: 0, totalVolume: 45 },
    };

    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([
      mockMutationState({ mutate: buyMutate }),
      mockMutationState({ mutate: listMutate }),
    ]);

    renderRoute(<NFTMarketplace />);

    await userEvent.click(screen.getByRole("button", { name: "Buy Now" }));

    expect(buyMutate).toHaveBeenCalledWith({
      assetId: "asset-1",
      buyerWallet: "0x1111111111111111111111111111111111111111",
    });
  });
});

describe("Launchpad route", () => {
  it("renders loading state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isLoading: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Launchpad />);

    expect(screen.getByText("Project Launchpad")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isError: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Launchpad />);

    expect(screen.getByText("Unable to load launchpad projects")).toBeTruthy();
  });

  it("renders empty state", () => {
    const overview: LaunchpadOverview = {
      projects: [],
      stats: { totalProjects: 0, liveProjects: 0, totalRaised: 0, totalParticipants: 0 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Launchpad />);

    expect(screen.getByText("No projects available")).toBeTruthy();
  });

  it("renders success state and submits contribution", async () => {
    const detailsMutate = vi.fn();
    const contributionMutate = vi.fn();
    const overview: LaunchpadOverview = {
      projects: [
        {
          id: "project-1",
          name: "Arcadia",
          type: "GameFi",
          status: "live",
          raised: 100000,
          target: 200000,
          participants: 500,
          deadline: new Date().toISOString(),
          timeline: "3 days left",
          progressPercentage: 50,
          updatedAt: new Date().toISOString(),
          contributionAction: { enabled: true, label: "Contribute", disabledReason: null },
        },
      ],
      stats: { totalProjects: 1, liveProjects: 1, totalRaised: 100000, totalParticipants: 500 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([
      mockMutationState({ mutate: detailsMutate }),
      mockMutationState({ mutate: contributionMutate }),
    ]);

    renderRoute(<Launchpad />);

    await userEvent.type(screen.getByPlaceholderText("Contribution amount (USD)"), "20");
    await userEvent.click(screen.getByRole("button", { name: "Contribute" }));

    expect(contributionMutate).toHaveBeenCalledWith({ projectId: "project-1", amount: 20 });
  });
});

describe("Governance route", () => {
  it("renders loading state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isLoading: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Governance />);

    expect(screen.getByText("DAO Governance")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseApiQuery.mockReturnValue(mockQueryState({ isError: true }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Governance />);

    expect(screen.getByText("Unable to load governance proposals")).toBeTruthy();
  });

  it("renders empty state", () => {
    const overview: GovernanceOverview = {
      proposals: [],
      stats: { totalProposals: 0, activeProposals: 0, totalVotingPower: 0, totalQuorum: 0 },
    };
    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([mockMutationState(), mockMutationState()]);

    renderRoute(<Governance />);

    expect(screen.getByText("No proposals available")).toBeTruthy();
  });

  it("renders success state and submits vote", async () => {
    const voteMutate = vi.fn();
    const discussMutate = vi.fn();
    const overview: GovernanceOverview = {
      proposals: [
        {
          id: "proposal-1",
          title: "Increase Rewards",
          description: "Increase pool rewards by 10%",
          status: "active",
          votesFor: 100,
          votesAgainst: 20,
          totalVotes: 120,
          quorum: 150,
          endsAt: new Date().toISOString(),
          timeline: "Ends in 2 days",
          updatedAt: new Date().toISOString(),
          actions: {
            vote: { enabled: true, label: "Vote", disabledReason: null },
            discuss: { enabled: true, label: "Discuss", disabledReason: null },
          },
        },
      ],
      stats: { totalProposals: 1, activeProposals: 1, totalVotingPower: 120, totalQuorum: 150 },
    };

    mockUseApiQuery.mockReturnValue(mockQueryState({ data: overview }));
    mockMutationSequence([
      mockMutationState({ mutate: voteMutate }),
      mockMutationState({ mutate: discussMutate }),
    ]);

    renderRoute(<Governance />);

    await userEvent.click(screen.getByRole("button", { name: "Vote For" }));

    expect(voteMutate).toHaveBeenCalledWith({ proposalId: "proposal-1", support: true });
  });
});
