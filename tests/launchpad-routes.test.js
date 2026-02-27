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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-launchpad-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "launchpad-routes.db")}`
  process.env.AUTH_JWT_SECRET = "test-launchpad-secret"

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
    'CREATE TABLE IF NOT EXISTS "LaunchProject" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "projectType" TEXT NOT NULL, "status" TEXT NOT NULL, "raised" DECIMAL NOT NULL, "target" DECIMAL NOT NULL, "participants" INTEGER NOT NULL DEFAULT 0, "deadline" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL);',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "LaunchProject_name_deadline_key" ON "LaunchProject"("name", "deadline");',
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "LaunchContribution" ("id" TEXT NOT NULL PRIMARY KEY, "projectId" TEXT NOT NULL, "userId" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LaunchContribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "LaunchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "LaunchContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);',
  )

  await prisma.user.create({
    data: {
      id: "user_launchpad_1",
      email: "launchpad@example.com",
      passwordHash: "hash",
      displayName: "Launchpad User",
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    },
  })

  const session = await createSessionToken({
    userId: "user_launchpad_1",
    role: "user",
  })
  authToken = session.token

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}/api/launchpad`
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
  await prisma.launchContribution.deleteMany()
  await prisma.launchProject.deleteMany()

  await prisma.launchProject.createMany({
    data: [
      {
        id: "launch_live_1",
        name: "AstroQuest",
        projectType: "Gaming",
        status: "LIVE",
        raised: 450000,
        target: 500000,
        participants: 1250,
        deadline: new Date("2099-01-10T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "launch_upcoming_1",
        name: "DeFiVault Pro",
        projectType: "DeFi",
        status: "UPCOMING",
        raised: 0,
        target: 1200000,
        participants: 0,
        deadline: new Date("2099-02-10T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "launch_completed_1",
        name: "PixelRealm",
        projectType: "Gaming",
        status: "COMPLETED",
        raised: 2100000,
        target: 2000000,
        participants: 3450,
        deadline: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ],
  })
})

test("overview returns API projects and computed progress/timeline", async () => {
  const { response, body } = await request("/overview")

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.projects.length, 3)
  assert.equal(body.data.stats.totalProjects, 3)
  assert.equal(body.data.stats.liveProjects, 1)
  assert.equal(body.data.stats.totalRaised, 2550000)
  assert.equal(body.data.stats.totalParticipants, 4700)

  const liveProject = body.data.projects.find((project) => project.id === "launch_live_1")
  assert.equal(liveProject.progressPercentage, 90)
  assert.equal(liveProject.contributionAction.enabled, true)

  const upcomingProject = body.data.projects.find((project) => project.id === "launch_upcoming_1")
  assert.equal(upcomingProject.contributionAction.enabled, false)
  assert.equal(
    upcomingProject.contributionAction.disabledReason,
    "Project is not live yet. Contributions open when status is Live.",
  )
})

test("view details returns project and recent contributions", async () => {
  await prisma.launchContribution.create({
    data: {
      projectId: "launch_live_1",
      userId: "user_launchpad_1",
      amount: 150,
      createdAt: new Date("2026-02-03T12:00:00.000Z"),
    },
  })

  const { response, body } = await request("/projects/launch_live_1")
  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.project.id, "launch_live_1")
  assert.equal(body.data.recentContributions.length, 1)
  assert.equal(body.data.recentContributions[0].amount, 150)
})

test("live project accepts contribution and raised increments after refresh", async () => {
  const contribute = await request(
    "/projects/launch_live_1/contribute",
    "POST",
    { amount: 500 },
    authToken,
  )
  assert.equal(contribute.response.status, 201)
  assert.equal(contribute.body.success, true)
  assert.equal(contribute.body.data.contribution.amount, 500)

  const refreshed = await request("/overview")
  const refreshedLive = refreshed.body.data.projects.find((project) => project.id === "launch_live_1")
  assert.equal(refreshedLive.raised, 450500)
})

test("upcoming and completed projects block contribution with deterministic messages", async () => {
  const upcoming = await request(
    "/projects/launch_upcoming_1/contribute",
    "POST",
    { amount: 25 },
    authToken,
  )
  assert.equal(upcoming.response.status, 409)
  assert.equal(upcoming.body.success, false)
  assert.equal(upcoming.body.error.code, "PROJECT_CONTRIBUTION_BLOCKED")
  assert.equal(
    upcoming.body.error.message,
    "Project is not live yet. Contributions open when status is Live.",
  )

  const completed = await request(
    "/projects/launch_completed_1/contribute",
    "POST",
    { amount: 10 },
    authToken,
  )
  assert.equal(completed.response.status, 409)
  assert.equal(completed.body.success, false)
  assert.equal(completed.body.error.code, "PROJECT_CONTRIBUTION_BLOCKED")
  assert.equal(completed.body.error.message, "Project funding has ended. Contributions are closed.")
})
