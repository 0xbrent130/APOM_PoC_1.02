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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-nft-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "nft-routes.db")}`
  process.env.AUTH_JWT_SECRET = "test-nft-secret"

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
    'CREATE TABLE IF NOT EXISTS "NftCollection" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "floorPrice" DECIMAL NOT NULL, "volume" DECIMAL NOT NULL, "items" INTEGER NOT NULL, "updatedAt" DATETIME NOT NULL);',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "NftCollection_name_category_key" ON "NftCollection"("name","category");',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "NftAsset" ("id" TEXT NOT NULL PRIMARY KEY, "collectionId" TEXT NOT NULL, "tokenId" TEXT NOT NULL, "name" TEXT NOT NULL, "rarity" TEXT NOT NULL, "sellerWallet" TEXT NOT NULL, "status" TEXT NOT NULL, "price" DECIMAL NOT NULL, "updatedAt" DATETIME NOT NULL, CONSTRAINT "NftAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "NftCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "NftAsset_collectionId_tokenId_key" ON "NftAsset"("collectionId","tokenId");',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "NftListing" ("id" TEXT NOT NULL PRIMARY KEY, "assetId" TEXT NOT NULL, "buyerWallet" TEXT, "sellerWallet" TEXT NOT NULL, "price" DECIMAL NOT NULL, "status" TEXT NOT NULL, "listedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "purchasedAt" DATETIME, CONSTRAINT "NftListing_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "NftAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.user.create({
    data: {
      id: "user_nft_1",
      email: "nft@example.com",
      passwordHash: "hash",
      displayName: "NFT User",
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  })

  const session = await createSessionToken({
    userId: "user_nft_1",
    role: "user",
  })
  authToken = session.token

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}/api/nft-marketplace`
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
  await prisma.nftListing.deleteMany()
  await prisma.nftAsset.deleteMany()
  await prisma.nftCollection.deleteMany()

  await prisma.nftCollection.createMany({
    data: [
      {
        id: "collection_1",
        name: "CyberWarriors",
        category: "Gaming",
        floorPrice: 2.5,
        volume: 156,
        items: 10000,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "collection_2",
        name: "Digital Artifacts",
        category: "Art",
        floorPrice: 0.8,
        volume: 89,
        items: 5000,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })

  await prisma.nftAsset.createMany({
    data: [
      {
        id: "asset_listed_1",
        collectionId: "collection_1",
        tokenId: "1",
        name: "Legendary Sword #001",
        rarity: "Legendary",
        sellerWallet: "0x1111111111111111111111111111111111111111",
        status: "LISTED",
        price: 12.5,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "asset_sold_1",
        collectionId: "collection_2",
        tokenId: "2",
        name: "Artifact #002",
        rarity: "Epic",
        sellerWallet: "0x2222222222222222222222222222222222222222",
        status: "SOLD",
        price: 3.2,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })
})

test("overview returns collections, assets, and stats", async () => {
  const { response, body } = await request("/overview")

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.collections.length, 2)
  assert.equal(body.data.assets.length, 2)
  assert.equal(body.data.stats.totalCollections, 2)
  assert.equal(body.data.stats.listedAssets, 1)
  assert.equal(body.data.stats.soldAssets, 1)
  assert.equal(body.data.stats.totalVolume, 245)

  const listed = body.data.assets.find((asset) => asset.id === "asset_listed_1")
  assert.equal(listed.actions.buy.enabled, true)

  const sold = body.data.assets.find((asset) => asset.id === "asset_sold_1")
  assert.equal(sold.actions.buy.enabled, false)
})

test("authenticated buy updates asset to sold and records listing", async () => {
  const beforeCount = await prisma.nftListing.count()

  const { response, body } = await request(
    "/assets/asset_listed_1/buy",
    "POST",
    {
      buyerWallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    authToken,
  )

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.asset.status, "sold")
  assert.equal(body.data.message, "Purchase complete")

  const afterCount = await prisma.nftListing.count()
  assert.equal(afterCount, beforeCount + 1)

  const storedAsset = await prisma.nftAsset.findUnique({
    where: { id: "asset_listed_1" },
  })
  assert.equal(storedAsset.status, "SOLD")
})

test("buy blocks unavailable asset with conflict and no new listing", async () => {
  const beforeCount = await prisma.nftListing.count()

  const { response, body } = await request("/assets/asset_sold_1/buy", "POST", {}, authToken)

  assert.equal(response.status, 409)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "ASSET_UNAVAILABLE")

  const afterCount = await prisma.nftListing.count()
  assert.equal(afterCount, beforeCount)
})

test("buy and list endpoints require auth and validate payload", async () => {
  const unauthenticated = await request("/assets/asset_listed_1/buy", "POST", {})
  assert.equal(unauthenticated.response.status, 401)
  assert.equal(unauthenticated.body.error.code, "UNAUTHORIZED")

  const invalidList = await request(
    "/assets/asset_sold_1/list",
    "POST",
    {
      price: 0,
      sellerWallet: "bad",
    },
    authToken,
  )
  assert.equal(invalidList.response.status, 400)
  assert.equal(invalidList.body.error.code, "INVALID_INPUT")
})

test("authenticated list relists sold asset and creates listing", async () => {
  const beforeCount = await prisma.nftListing.count()

  const { response, body } = await request(
    "/assets/asset_sold_1/list",
    "POST",
    {
      price: 4.4,
      sellerWallet: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    authToken,
  )

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.asset.status, "listed")
  assert.equal(body.data.asset.price, 4.4)

  const afterCount = await prisma.nftListing.count()
  assert.equal(afterCount, beforeCount + 1)
})
