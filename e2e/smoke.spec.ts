import { expect, test, type Page } from "@playwright/test";

const WALLET_ADDRESS = "0x1111111111111111111111111111111111111111";

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const headers = {
      "content-type": "application/json",
      "access-control-allow-origin": "http://127.0.0.1:4173",
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    };

    if (method === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers,
      });
    }

    const ok = (data: unknown) =>
      route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ success: true, data }),
      });

    if (path.endsWith("/auth/wallet/nonce") && method === "POST") {
      return ok({
        address: WALLET_ADDRESS.toLowerCase(),
        chainId: 1,
        nonce: "nonce-1",
        nonceToken: "nonce-token-1",
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      });
    }

    if (path.endsWith("/auth/wallet/verify") && method === "POST") {
      return ok({
        user: {
          id: "user-1",
          email: "e2e@example.com",
          displayName: "E2E User",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: "session-1",
          role: "user",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        wallet: {
          id: "wallet-1",
          userId: "user-1",
          address: WALLET_ADDRESS,
          chainId: 1,
          isPrimary: true,
          linkedAt: new Date().toISOString(),
        },
      });
    }

    if (path.endsWith("/auth/login") && method === "POST") {
      return ok({
        user: {
          id: "user-1",
          email: "e2e@example.com",
          displayName: "E2E User",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: "session-1",
          role: "user",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      });
    }

    if (path.endsWith("/api/gaming/overview") && method === "GET") {
      return ok({
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
      });
    }

    if (path.endsWith("/api/defi/overview") && method === "GET") {
      return ok({
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
      });
    }

    if (path.endsWith("/api/nft-marketplace/overview") && method === "GET") {
      return ok({
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
            sellerWallet: WALLET_ADDRESS,
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
      });
    }

    if (path.endsWith("/api/launchpad/overview") && method === "GET") {
      return ok({
        projects: [
          {
            id: "project-1",
            name: "Arcadia",
            type: "GameFi",
            status: "live",
            raised: 100000,
            target: 200000,
            participants: 500,
            deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
            timeline: "3 days left",
            progressPercentage: 50,
            updatedAt: new Date().toISOString(),
            contributionAction: { enabled: true, label: "Contribute", disabledReason: null },
          },
        ],
        stats: { totalProjects: 1, liveProjects: 1, totalRaised: 100000, totalParticipants: 500 },
      });
    }

    if (path.endsWith("/api/governance/overview") && method === "GET") {
      return ok({
        proposals: [
          {
            id: "proposal-1",
            title: "Increase rewards",
            description: "Increase APOM rewards by 10%",
            status: "active",
            votesFor: 100,
            votesAgainst: 20,
            totalVotes: 120,
            quorum: 150,
            endsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
            timeline: "Ends in 2 days",
            updatedAt: new Date().toISOString(),
            actions: {
              vote: { enabled: true, label: "Vote", disabledReason: null },
              discuss: { enabled: true, label: "Discuss", disabledReason: null },
            },
          },
        ],
        stats: { totalProposals: 1, activeProposals: 1, totalVotingPower: 120, totalQuorum: 150 },
      });
    }

    if (path.includes("/api/gaming/games/") && path.endsWith("/play") && method === "POST") {
      return ok({
        game: { slug: "cyber-realm", title: "Cyber Realm" },
        participation: {
          id: "participation-1",
          action: "PLAY",
          occurredAt: new Date().toISOString(),
        },
      });
    }

    if (path.endsWith("/api/defi/pools/pool-1/liquidity") && method === "POST") {
      return ok({
        pool: { id: "pool-1", pair: "APOM/ETH" },
        intent: {
          id: "intent-1",
          action: "ADD_LIQUIDITY",
          amount: 12.5,
          createdAt: new Date().toISOString(),
        },
        message: "Add liquidity intent submitted",
      });
    }

    if (path.endsWith("/api/nft-marketplace/assets/asset-1/buy") && method === "POST") {
      return ok({
        asset: {
          id: "asset-1",
          name: "Blade #1",
          tokenId: "1",
          rarity: "Legendary",
          sellerWallet: WALLET_ADDRESS,
          status: "sold",
          price: 1.25,
          updatedAt: new Date().toISOString(),
          collection: { id: "collection-1", name: "Legends", category: "Gaming" },
          actions: {
            buy: { enabled: false, label: "Sold", disabledReason: "Already sold" },
            list: { enabled: true, label: "List NFT", disabledReason: null },
          },
        },
        purchase: {
          id: "purchase-1",
          price: 1.25,
          status: "sold",
          purchasedAt: new Date().toISOString(),
        },
        message: "Purchase complete",
      });
    }

    if (path.endsWith("/api/launchpad/projects/project-1/contribute") && method === "POST") {
      return ok({
        project: {
          id: "project-1",
          name: "Arcadia",
          type: "GameFi",
          status: "live",
          raised: 100500,
          target: 200000,
          participants: 501,
          deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
          timeline: "3 days left",
          progressPercentage: 50.25,
          updatedAt: new Date().toISOString(),
          contributionAction: { enabled: true, label: "Contribute", disabledReason: null },
        },
        contribution: {
          id: "contrib-1",
          projectId: "project-1",
          amount: 500,
          createdAt: new Date().toISOString(),
        },
        message: "Contribution submitted successfully",
      });
    }

    if (path.endsWith("/api/governance/proposals/proposal-1/vote") && method === "POST") {
      return route.fulfill({
        status: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        }),
      });
    }

    return route.fulfill({
      status: 404,
      headers,
      body: JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: `Unhandled route: ${path}` } }),
    });
  });
}

async function signInWithEmail(page: Page) {
  await page.getByRole("button", { name: "Sign In" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Authenticate to continue" });
  await dialog.getByPlaceholder("Email").fill("e2e@example.com");
  await dialog.getByPlaceholder("Password").fill("password123");
  await dialog.locator("button[type='submit']").click();
  await expect(page.getByText("Auth: Signed in as E2E User")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("home route wallet login flow works", async ({ page }) => {
  await page.goto("/");
  await signInWithEmail(page);
});

test("gaming route allows authenticated play action", async ({ page }) => {
  await page.goto("/");
  await signInWithEmail(page);
  await page.getByRole("link", { name: "Gaming" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Gaming Hub" })).toBeVisible();

  const playRequest = page.waitForRequest("**/api/gaming/games/cyber-realm/play");
  await page.getByRole("button", { name: "Play Now" }).click();
  await playRequest;
});

test("defi route allows valid authenticated add-liquidity flow", async ({ page }) => {
  await page.goto("/");
  await signInWithEmail(page);
  await page.getByRole("link", { name: "DeFi" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "DeFi Exchange" })).toBeVisible();

  await page.getByPlaceholder("Enter amount").fill("12.5");
  await page.getByRole("button", { name: "Add Liquidity" }).nth(1).click();
  await expect(page.getByText("Mutation successful")).toBeVisible();
  await expect(page.getByText("Add liquidity intent submitted for APOM/ETH.")).toBeVisible();
});

test("nft route allows authenticated buy action", async ({ page }) => {
  await page.goto("/");
  await signInWithEmail(page);
  await page.getByRole("link", { name: "NFT Marketplace" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "NFT Marketplace" })).toBeVisible();

  await page.getByRole("button", { name: "Buy Now" }).click();
  await expect(page.getByRole("heading", { name: "Purchase complete" })).toBeVisible();
});

test("launchpad route allows authenticated contribution", async ({ page }) => {
  await page.goto("/");
  await signInWithEmail(page);
  await page.getByRole("link", { name: "Launchpad" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Project Launchpad" })).toBeVisible();

  await page.getByPlaceholder("Contribution amount (USD)").fill("500");
  await page.getByRole("button", { name: "Contribute" }).click();
  await expect(page.getByText("Contribution success")).toBeVisible();
});

test("governance vote is blocked when unauthorized", async ({ page }) => {
  await page.goto("/governance");
  await expect(page.getByText("DAO Governance")).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "Authenticate to continue" });
  await dialog.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("button", { name: "Vote For" }).first().click();
  await expect(page.getByText("Sign in and connect your wallet to vote on governance proposals.")).toBeVisible();
  await expect(dialog).toBeVisible();
});
