-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WalletAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rewardRate" TEXT NOT NULL,
    "activePlayers" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GameParticipation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "userId" TEXT,
    "wallet" TEXT,
    "action" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "GameParticipation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DefiPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pair" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tvl" DECIMAL NOT NULL,
    "apy" DECIMAL NOT NULL,
    "volume24h" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DefiPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DefiPosition_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DefiPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DefiPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NftCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "floorPrice" DECIMAL NOT NULL,
    "volume" DECIMAL NOT NULL,
    "items" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NftAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "sellerWallet" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NftAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "NftCollection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NftListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "buyerWallet" TEXT,
    "sellerWallet" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasedAt" DATETIME,
    CONSTRAINT "NftListing_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "NftAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaunchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "raised" DECIMAL NOT NULL,
    "target" DECIMAL NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LaunchContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LaunchContribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LaunchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LaunchContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovernanceProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "votesFor" BIGINT NOT NULL DEFAULT 0,
    "votesAgainst" BIGINT NOT NULL DEFAULT 0,
    "quorum" BIGINT NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GovernanceVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteWeight" BIGINT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GovernanceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "WalletAccount_userId_idx" ON "WalletAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAccount_address_chainId_key" ON "WalletAccount"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "GameParticipation_gameId_occurredAt_idx" ON "GameParticipation"("gameId", "occurredAt");

-- CreateIndex
CREATE INDEX "GameParticipation_userId_occurredAt_idx" ON "GameParticipation"("userId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "DefiPool_pair_key" ON "DefiPool"("pair");

-- CreateIndex
CREATE INDEX "DefiPosition_poolId_createdAt_idx" ON "DefiPosition"("poolId", "createdAt");

-- CreateIndex
CREATE INDEX "DefiPosition_userId_createdAt_idx" ON "DefiPosition"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NftCollection_name_category_key" ON "NftCollection"("name", "category");

-- CreateIndex
CREATE INDEX "NftAsset_status_updatedAt_idx" ON "NftAsset"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NftAsset_collectionId_tokenId_key" ON "NftAsset"("collectionId", "tokenId");

-- CreateIndex
CREATE INDEX "NftListing_assetId_listedAt_idx" ON "NftListing"("assetId", "listedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchProject_name_deadline_key" ON "LaunchProject"("name", "deadline");

-- CreateIndex
CREATE INDEX "LaunchContribution_projectId_createdAt_idx" ON "LaunchContribution"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "LaunchContribution_userId_createdAt_idx" ON "LaunchContribution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GovernanceVote_proposalId_createdAt_idx" ON "GovernanceVote"("proposalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceVote_proposalId_userId_key" ON "GovernanceVote"("proposalId", "userId");
