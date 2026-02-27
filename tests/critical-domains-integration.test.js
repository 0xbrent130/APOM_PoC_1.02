const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")
const request = require("supertest")
const { SiweMessage } = require("siwe")
const { privateKeyToAccount } = require("viem/accounts")

let prisma
let app

const signingAccount = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945388cf8f2bbf7f624cc6f7491c43f4f3e8f3",
)

async function createSchema() {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "displayName" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "WalletAccount" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "address" TEXT NOT NULL, "chainId" INTEGER NOT NULL, "isPrimary" BOOLEAN NOT NULL DEFAULT false, "linkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WalletAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "WalletAccount_address_chainId_key" ON "WalletAccount"("address", "chainId");',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, "revokedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "customer" ("cid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "dob" TEXT NOT NULL, "gender" TEXT NOT NULL, "address" TEXT NOT NULL, "pincode" TEXT NOT NULL, "contact" TEXT NOT NULL, "mname" TEXT NOT NULL, "fname" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customer_email_key" ON "customer"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "agent" ("aid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "gender" TEXT NOT NULL, "contact" TEXT NOT NULL, "address" TEXT NOT NULL, "pincode" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "agent_email_key" ON "agent"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "policy" ("pid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "duration" INTEGER NOT NULL, "description" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "ramount" DECIMAL NOT NULL);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "centre" ("cid" TEXT NOT NULL, "pid" TEXT NOT NULL, "aid" TEXT NOT NULL, "amount" DECIMAL NOT NULL, PRIMARY KEY ("cid", "pid", "aid"), CONSTRAINT "centre_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer"("cid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "centre_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy"("pid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "centre_aid_fkey" FOREIGN KEY ("aid") REFERENCES "agent"("aid") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "statements" ("tid" TEXT NOT NULL PRIMARY KEY, "cid" TEXT NOT NULL, "pid" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "status" TEXT NOT NULL, "duedate" TEXT NOT NULL, "paydate" TEXT NOT NULL, "time" TEXT NOT NULL, CONSTRAINT "statements_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer"("cid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "statements_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy"("pid") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "GovernanceProposal" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "status" TEXT NOT NULL, "votesFor" BIGINT NOT NULL DEFAULT 0, "votesAgainst" BIGINT NOT NULL DEFAULT 0, "quorum" BIGINT NOT NULL, "endsAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "GovernanceVote" ("id" TEXT NOT NULL PRIMARY KEY, "proposalId" TEXT NOT NULL, "userId" TEXT NOT NULL, "voteWeight" BIGINT NOT NULL, "support" BOOLEAN NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GovernanceVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "GovernanceProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "GovernanceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "GovernanceVote_proposalId_userId_key" ON "GovernanceVote"("proposalId", "userId");',
  )
}

async function seedDeterministicData() {
  await prisma.customer.create({
    data: {
      cid: "cust_seed_001",
      name: "Seed Customer",
      dob: "1990-01-01",
      gender: "nonbinary",
      address: "100 Seed Way",
      pincode: "10001",
      contact: "5550000000",
      mname: "Parent One",
      fname: "Parent Two",
      email: "seed.customer@example.com",
      password: "seed-password-hash",
    },
  })

  await prisma.agent.create({
    data: {
      aid: "agent_seed_001",
      name: "Seed Agent",
      gender: "female",
      contact: "5551112222",
      address: "200 Seed Way",
      pincode: "10002",
      email: "seed.agent@example.com",
      password: "seed-password-hash",
    },
  })

  await prisma.policy.create({
    data: {
      pid: "policy_seed_001",
      name: "Seed Policy",
      duration: 12,
      description: "Deterministic seed policy",
      amount: 100,
      ramount: 120,
    },
  })

  await prisma.governanceProposal.create({
    data: {
      id: "gov_active_seed",
      title: "Seed governance proposal",
      description: "Deterministic active proposal",
      status: "ACTIVE",
      votesFor: 10,
      votesAgainst: 3,
      quorum: 30,
      endsAt: new Date("2099-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  })
}

async function registerAuthenticatedAgent(email) {
  const agent = request.agent(app)

  const registerResponse = await agent.post("/api/auth/register").send({
    email,
    password: "StrongPass1!",
    displayName: "Integration User",
  })

  assert.equal(registerResponse.status, 201)
  return agent
}

async function createSiweSignature(nonce, address = signingAccount.address) {
  const message = new SiweMessage({
    domain: "localhost",
    address,
    statement: "Sign in to APOM",
    uri: "http://localhost",
    version: "1",
    chainId: 1,
    nonce,
    issuedAt: new Date().toISOString(),
  })

  const preparedMessage = message.prepareMessage()
  const signature = await signingAccount.signMessage({ message: preparedMessage })

  return { preparedMessage, signature }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-critical-domains-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "critical-domains.db")}`
  process.env.AUTH_JWT_SECRET = "test-critical-domains-secret"

  const { getPrismaClient } = require("../server/prismaClient.js")
  ;({ createApp: app } = require("../server/app.js"))

  prisma = getPrismaClient()
  app = app()

  await createSchema()
})

test.after(async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
})

test.beforeEach(async () => {
  await prisma.governanceVote.deleteMany()
  await prisma.governanceProposal.deleteMany()
  await prisma.session.deleteMany()
  await prisma.walletAccount.deleteMany()
  await prisma.user.deleteMany()
  await prisma.statement.deleteMany()
  await prisma.centre.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.customer.deleteMany()

  await seedDeterministicData()
})

test("valid auth + protected policy mutation returns 2xx and persists", async () => {
  const authed = await registerAuthenticatedAgent("policy.integration@example.com")

  const response = await authed.post("/api/policy/create").send({
    name: "Growth Cover",
    duration: 24,
    description: "Covers annualized growth risk",
    amount: 500,
    ramount: 650,
  })

  assert.equal(response.status, 201)
  assert.equal(response.body.success, true)
  assert.equal(response.body.data.policy.name, "Growth Cover")

  const created = await prisma.policy.findMany({ where: { name: "Growth Cover" } })
  assert.equal(created.length, 1)
  assert.equal(Number(created[0].amount), 500)
})

test("invalid wallet signature returns 401 and wallet state unchanged", async () => {
  const nonceResponse = await request(app).post("/api/auth/wallet/nonce").send({
    address: signingAccount.address,
    chainId: 1,
  })

  assert.equal(nonceResponse.status, 200)

  const beforeWalletCount = await prisma.walletAccount.count()
  const { nonce, nonceToken } = nonceResponse.body.data
  const { preparedMessage } = await createSiweSignature(nonce)

  const verifyResponse = await request(app).post("/api/auth/wallet/verify").send({
    message: preparedMessage,
    signature: `0x${"00".repeat(65)}`,
    nonceToken,
  })

  assert.equal(verifyResponse.status, 401)
  assert.equal(verifyResponse.body.error.code, "INVALID_SIGNATURE")

  const afterWalletCount = await prisma.walletAccount.count()
  assert.equal(afterWalletCount, beforeWalletCount)
})

test("customer invalid payload returns 4xx and state unchanged", async () => {
  const beforeCount = await prisma.customer.count()

  const response = await request(app).post("/api/customer/login").send({
    email: "seed.customer@example.com",
    password: "' OR 1=1 --",
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.success, false)
  assert.equal(response.body.error.code, "INVALID_INPUT")

  const afterCount = await prisma.customer.count()
  assert.equal(afterCount, beforeCount)
})

test("statements mutation path returns 2xx and transitions status", async () => {
  const authed = await registerAuthenticatedAgent("statements.integration@example.com")

  const createResponse = await authed.post("/api/statements/transaction").send({
    cid: "cust_seed_001",
    pid: "policy_seed_001",
    amount: 100,
    status: "pending",
    duedate: "2026-03-01",
    paydate: "2026-03-01",
    time: "10:00",
  })

  assert.equal(createResponse.status, 201)
  const tid = createResponse.body.data.transaction.tid

  const statusResponse = await authed.post("/api/statements/changeStatus").send({
    tid,
    newStatus: "paid",
  })

  assert.equal(statusResponse.status, 200)
  assert.equal(statusResponse.body.data.statement.status, "paid")

  const updated = await prisma.statement.findUnique({ where: { tid } })
  assert.equal(updated.status, "paid")
})

test("governance vote mutation updates state for authenticated user", async () => {
  const authed = await registerAuthenticatedAgent("governance.integration@example.com")

  const voteResponse = await authed.post("/api/governance/proposals/gov_active_seed/vote").send({
    support: true,
    voteWeight: 4,
  })

  assert.equal(voteResponse.status, 201)
  assert.equal(voteResponse.body.success, true)

  const proposal = await prisma.governanceProposal.findUnique({
    where: { id: "gov_active_seed" },
  })
  assert.equal(Number(proposal.votesFor), 14)

  const voteCount = await prisma.governanceVote.count({
    where: { proposalId: "gov_active_seed" },
  })
  assert.equal(voteCount, 1)
})

test("governance invalid payload returns 4xx and vote state unchanged", async () => {
  const authed = await registerAuthenticatedAgent("gov-invalid.integration@example.com")
  const beforeVoteCount = await prisma.governanceVote.count({
    where: { proposalId: "gov_active_seed" },
  })

  const voteResponse = await authed.post("/api/governance/proposals/gov_active_seed/vote").send({
    support: "true",
  })

  assert.equal(voteResponse.status, 400)
  assert.equal(voteResponse.body.error.code, "INVALID_INPUT")

  const afterVoteCount = await prisma.governanceVote.count({
    where: { proposalId: "gov_active_seed" },
  })
  assert.equal(afterVoteCount, beforeVoteCount)
})
