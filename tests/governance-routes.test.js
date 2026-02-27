const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")

let prisma
let app
let server
let baseUrl
let authToken

async function request(pathname, method = "GET", payload, token) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(payload ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  const body = await response.json()
  return { response, body }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-governance-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "governance-routes.db")}`
  process.env.AUTH_JWT_SECRET = "test-governance-secret"

  const { getPrismaClient } = require("../server/prismaClient.js")
  const { createSessionToken } = require("../server/auth/session.js")
  ;({ createApp: app } = require("../server/app.js"))

  prisma = getPrismaClient()

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "displayName" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, "revokedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "GovernanceProposal" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "status" TEXT NOT NULL, "votesFor" BIGINT NOT NULL DEFAULT 0, "votesAgainst" BIGINT NOT NULL DEFAULT 0, "quorum" BIGINT NOT NULL, "endsAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "GovernanceVote" ("id" TEXT NOT NULL PRIMARY KEY, "proposalId" TEXT NOT NULL, "userId" TEXT NOT NULL, "voteWeight" BIGINT NOT NULL, "support" BOOLEAN NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "GovernanceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "GovernanceVote_proposalId_userId_key" ON "GovernanceVote"("proposalId", "userId");',
  )

  await prisma.user.create({
    data: {
      id: "user_gov_1",
      email: "gov@example.com",
      passwordHash: "hash",
      displayName: "Governance User",
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  })

  const session = await createSessionToken({
    userId: "user_gov_1",
    role: "user",
  })
  authToken = session.token

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}/api/governance`
})

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  if (prisma) {
    await prisma.$disconnect()
  }
})

test.beforeEach(async () => {
  await prisma.governanceVote.deleteMany()
  await prisma.governanceProposal.deleteMany()

  await prisma.governanceProposal.createMany({
    data: [
      {
        id: "gov_active_1",
        title: "Increase rewards pool",
        description: "Adjust rewards pool by 10% for next quarter",
        status: "ACTIVE",
        votesFor: 120,
        votesAgainst: 35,
        quorum: 200,
        endsAt: new Date("2099-01-10T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "gov_pending_1",
        title: "Treasury policy draft",
        description: "Draft policy awaiting vote window",
        status: "DRAFT",
        votesFor: 0,
        votesAgainst: 0,
        quorum: 100,
        endsAt: new Date("2099-01-12T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "gov_ended_1",
        title: "Completed policy",
        description: "Voting finished and immutable",
        status: "PASSED",
        votesFor: 260,
        votesAgainst: 40,
        quorum: 200,
        endsAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })
})

test("overview returns proposals, quorum, vote counts, and status", async () => {
  const { response, body } = await request("/overview")

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.proposals.length, 3)
  assert.equal(body.data.stats.totalProposals, 3)
  assert.equal(body.data.stats.activeProposals, 1)

  const active = body.data.proposals.find((proposal) => proposal.id === "gov_active_1")
  assert.equal(active.status, "active")
  assert.equal(active.votesFor, 120)
  assert.equal(active.votesAgainst, 35)
  assert.equal(active.quorum, 200)
  assert.equal(active.actions.vote.enabled, true)

  const pending = body.data.proposals.find((proposal) => proposal.id === "gov_pending_1")
  assert.equal(pending.status, "pending")
  assert.equal(pending.actions.vote.enabled, false)
})

test("active proposal accepts vote and updates vote totals", async () => {
  const voted = await request(
    "/proposals/gov_active_1/vote",
    "POST",
    { support: true, voteWeight: 5 },
    authToken,
  )

  assert.equal(voted.response.status, 201)
  assert.equal(voted.body.success, true)
  assert.equal(voted.body.data.vote.voteWeight, 5)

  const refreshed = await request("/overview")
  const active = refreshed.body.data.proposals.find((proposal) => proposal.id === "gov_active_1")
  assert.equal(active.votesFor, 125)
  assert.equal(active.totalVotes, 160)
})

test("vote on ended proposal returns 409 and immutable state", async () => {
  const ended = await request(
    "/proposals/gov_ended_1/vote",
    "POST",
    { support: false, voteWeight: 2 },
    authToken,
  )

  assert.equal(ended.response.status, 409)
  assert.equal(ended.body.success, false)
  assert.equal(ended.body.error.code, "PROPOSAL_IMMUTABLE")
  assert.equal(ended.body.error.message, "Proposal voting has ended and is immutable.")

  const voteCount = await prisma.governanceVote.count({
    where: { proposalId: "gov_ended_1" },
  })
  assert.equal(voteCount, 0)
})

test("vote and discuss endpoints require authentication", async () => {
  const unauthVote = await request(
    "/proposals/gov_active_1/vote",
    "POST",
    { support: true },
  )
  assert.equal(unauthVote.response.status, 401)
  assert.equal(unauthVote.body.error.code, "UNAUTHORIZED")

  const unauthDiscuss = await request(
    "/proposals/gov_active_1/discuss",
    "POST",
    { message: "Discuss this proposal" },
  )
  assert.equal(unauthDiscuss.response.status, 401)
  assert.equal(unauthDiscuss.body.error.code, "UNAUTHORIZED")
})

test("active proposal accepts discuss action", async () => {
  const discussion = await request(
    "/proposals/gov_active_1/discuss",
    "POST",
    { message: "Opening thread for proposal review" },
    authToken,
  )

  assert.equal(discussion.response.status, 201)
  assert.equal(discussion.body.success, true)
  assert.equal(discussion.body.data.discussion.proposalId, "gov_active_1")
  assert.equal(discussion.body.data.message, "Discussion intent submitted")
})
