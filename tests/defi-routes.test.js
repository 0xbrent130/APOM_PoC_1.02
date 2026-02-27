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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-defi-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "defi-routes.db")}`
  process.env.AUTH_JWT_SECRET = "test-defi-secret"

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
    'CREATE TABLE IF NOT EXISTS "DefiPool" ("id" TEXT NOT NULL PRIMARY KEY, "pair" TEXT NOT NULL, "type" TEXT NOT NULL, "tvl" DECIMAL NOT NULL, "apy" DECIMAL NOT NULL, "volume24h" DECIMAL NOT NULL, "status" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL);',
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "DefiPool_pair_key" ON "DefiPool"("pair");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "DefiPosition" ("id" TEXT NOT NULL PRIMARY KEY, "poolId" TEXT NOT NULL, "userId" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "action" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "DefiPosition_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "DefiPool"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "DefiPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.user.create({
    data: {
      id: "user_defi_1",
      email: "defi@example.com",
      passwordHash: "hash",
      displayName: "Defi User",
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  })

  const session = await createSessionToken({
    userId: "user_defi_1",
    role: "user",
  })
  authToken = session.token

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}/api/defi`
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
  await prisma.defiPosition.deleteMany()
  await prisma.defiPool.deleteMany()

  await prisma.defiPool.createMany({
    data: [
      {
        id: "pool_active_1",
        pair: "APOM/ETH",
        type: "GAMING",
        tvl: 2400000,
        apy: 145.2,
        volume24h: 524000,
        status: "ACTIVE",
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "pool_paused_1",
        pair: "USDC/APOM",
        type: "STABLE",
        tvl: 1800000,
        apy: 89.5,
        volume24h: 312000,
        status: "PAUSED",
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })
})

test("overview returns API pools and derived stats", async () => {
  const { response, body } = await request("/overview")

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.pools.length, 2)
  assert.equal(body.data.stats.totalPools, 2)
  assert.equal(body.data.stats.activePools, 1)
  assert.equal(body.data.stats.totalTvl, 4200000)
  assert.equal(body.data.stats.totalVolume24h, 836000)
  assert.equal(Number(body.data.stats.averageApy.toFixed(2)), 117.35)

  const activePool = body.data.pools.find((pool) => pool.id === "pool_active_1")
  assert.equal(activePool.actions.addLiquidity.enabled, true)

  const pausedPool = body.data.pools.find((pool) => pool.id === "pool_paused_1")
  assert.equal(pausedPool.actions.stake.enabled, false)
  assert.equal(pausedPool.actions.stake.disabledReason, "Pool is temporarily paused")
})

test("authenticated add liquidity submits intent", async () => {
  const beforeCount = await prisma.defiPosition.count()

  const { response, body } = await request(
    "/pools/pool_active_1/liquidity",
    "POST",
    { amount: 250.5 },
    authToken,
  )

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.intent.action, "ADD_LIQUIDITY")
  assert.equal(body.data.intent.amount, 250.5)

  const afterCount = await prisma.defiPosition.count()
  assert.equal(afterCount, beforeCount + 1)
})

test("unauthenticated mutation is blocked", async () => {
  const { response, body } = await request("/pools/pool_active_1/stake", "POST", { amount: 10 })

  assert.equal(response.status, 401)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "UNAUTHORIZED")
})

test("mutation validation blocks invalid amount and paused pools", async () => {
  const invalid = await request("/pools/pool_active_1/stake", "POST", { amount: 0 }, authToken)
  assert.equal(invalid.response.status, 400)
  assert.equal(invalid.body.error.code, "INVALID_INPUT")

  const paused = await request("/pools/pool_paused_1/stake", "POST", { amount: 15 }, authToken)
  assert.equal(paused.response.status, 409)
  assert.equal(paused.body.error.code, "POOL_ACTION_BLOCKED")
  assert.equal(paused.body.error.message, "Pool is temporarily paused")

  const count = await prisma.defiPosition.count()
  assert.equal(count, 0)
})
