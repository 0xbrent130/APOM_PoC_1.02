const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")

let prisma
let app
let server
let baseUrl

async function request(pathname, method = "GET", payload) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: payload ? { "content-type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  })

  const body = await response.json()
  return { response, body }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-gaming-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "gaming-routes.db")}`

  const { getPrismaClient } = require("../server/prismaClient.js")
  ;({ createApp: app } = require("../server/app.js"))

  prisma = getPrismaClient()

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Game" ("id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "genre" TEXT NOT NULL, "status" TEXT NOT NULL, "rewardRate" TEXT NOT NULL, "activePlayers" INTEGER NOT NULL DEFAULT 0, "updatedAt" DATETIME NOT NULL);'
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Game_slug_key" ON "Game"("slug");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "GameParticipation" ("id" TEXT NOT NULL PRIMARY KEY, "gameId" TEXT NOT NULL, "userId" TEXT, "wallet" TEXT, "action" TEXT NOT NULL, "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadata" TEXT, CONSTRAINT "GameParticipation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE);'
  )

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}/api/gaming`
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
  await prisma.gameParticipation.deleteMany()
  await prisma.game.deleteMany()

  await prisma.game.createMany({
    data: [
      {
        id: "game_live_1",
        slug: "cyberrealm-chronicles",
        title: "CyberRealm Chronicles",
        genre: "RPG",
        status: "LIVE",
        rewardRate: "250 APOM/day",
        activePlayers: 1200,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "game_upcoming_1",
        slug: "metaverse-miners",
        title: "MetaVerse Miners",
        genre: "Simulation",
        status: "UPCOMING",
        rewardRate: "TBA",
        activePlayers: 0,
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })
})

test("overview returns backend games and computed player/reward stats", async () => {
  const { response, body } = await request("/overview")

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.games.length, 2)
  assert.equal(body.data.stats.totalGames, 2)
  assert.equal(body.data.stats.liveGames, 1)
  assert.equal(body.data.stats.totalActivePlayers, 1200)
  assert.equal(body.data.stats.rewardPrograms, 1)

  const liveGame = body.data.games.find((game) => game.slug === "cyberrealm-chronicles")
  assert.equal(liveGame.action.enabled, true)
  assert.equal(liveGame.action.label, "Play Now")

  const upcoming = body.data.games.find((game) => game.slug === "metaverse-miners")
  assert.equal(upcoming.action.enabled, false)
  assert.equal(upcoming.action.disabledReason, "Game not live yet")
})

test("play endpoint records participation for live games", async () => {
  const beforeCount = await prisma.gameParticipation.count()

  const { response, body } = await request("/games/cyberrealm-chronicles/play", "POST", {
    wallet: "0x1111111111111111111111111111111111111111",
  })

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.game.slug, "cyberrealm-chronicles")

  const afterCount = await prisma.gameParticipation.count()
  assert.equal(afterCount, beforeCount + 1)

  const saved = await prisma.gameParticipation.findFirst({
    where: { game: { slug: "cyberrealm-chronicles" } },
    orderBy: { occurredAt: "desc" },
  })
  assert.equal(saved.action, "PLAY_NOW")
  assert.equal(saved.wallet, "0x1111111111111111111111111111111111111111")
})

test("play endpoint blocks coming-soon game without mutation", async () => {
  const beforeCount = await prisma.gameParticipation.count()

  const { response, body } = await request("/games/metaverse-miners/play", "POST", {})

  assert.equal(response.status, 409)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "GAME_NOT_PLAYABLE")
  assert.equal(body.error.message, "Game not live yet")

  const afterCount = await prisma.gameParticipation.count()
  assert.equal(afterCount, beforeCount)
})
