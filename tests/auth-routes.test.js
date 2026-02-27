const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")
const { SiweMessage } = require("siwe")
const { privateKeyToAccount } = require("viem/accounts")

let prisma
let app
let server
let baseUrl

const signingAccount = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945388cf8f2bbf7f624cc6f7491c43f4f3e8f3")
const chainId = 1

async function request(pathname, payload, method = "POST", extraHeaders = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  const body = await response.json()
  return { response, body }
}

async function createSiweSignature(nonce, address = signingAccount.address, uri = "http://localhost") {
  const message = new SiweMessage({
    domain: "localhost",
    address,
    statement: "Sign in to APOM",
    uri,
    version: "1",
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  })
  const preparedMessage = message.prepareMessage()
  const signature = await signingAccount.signMessage({ message: preparedMessage })
  return { preparedMessage, signature }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-auth-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "auth-routes.db")}`

  const { getPrismaClient } = require("../server/prismaClient.js")
  ;({ createApp: app } = require("../server/app.js"))

  prisma = getPrismaClient()

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "displayName" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL);'
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");')
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "WalletAccount" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "address" TEXT NOT NULL, "chainId" INTEGER NOT NULL, "isPrimary" BOOLEAN NOT NULL DEFAULT false, "linkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WalletAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);'
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "WalletAccount_address_chainId_key" ON "WalletAccount"("address", "chainId");'
  )
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, "revokedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);'
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");')

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
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
  await prisma.session.deleteMany()
  await prisma.walletAccount.deleteMany()
  await prisma.user.deleteMany()
})

test("wallet SIWE verify creates linked wallet session", async () => {
  const nonceResult = await request("/api/auth/wallet/nonce", {
    address: signingAccount.address,
    chainId,
  })

  assert.equal(nonceResult.response.status, 200)
  const { nonce, nonceToken } = nonceResult.body.data
  assert.ok(nonce)
  assert.ok(nonceToken)

  const { preparedMessage, signature } = await createSiweSignature(nonce)
  const verifyResult = await request("/api/auth/wallet/verify", {
    message: preparedMessage,
    signature,
    nonceToken,
  })

  assert.equal(verifyResult.response.status, 200)
  assert.equal(verifyResult.body.success, true)
  assert.equal(verifyResult.body.data.wallet.address, signingAccount.address.toLowerCase())
  assert.ok(verifyResult.response.headers.get("set-cookie"))

  const sessionCount = await prisma.session.count({ where: { revokedAt: null } })
  assert.equal(sessionCount, 1)
})

test("invalid SIWE signature returns 401 and no wallet link", async () => {
  const nonceResult = await request("/api/auth/wallet/nonce", {
    address: signingAccount.address,
    chainId,
  })

  const { nonce, nonceToken } = nonceResult.body.data
  const { preparedMessage } = await createSiweSignature(nonce)
  const invalidSignature = "0x" + "00".repeat(65)

  const verifyResult = await request("/api/auth/wallet/verify", {
    message: preparedMessage,
    signature: invalidSignature,
    nonceToken,
  })

  assert.equal(verifyResult.response.status, 401)
  assert.equal(verifyResult.body.success, false)
  assert.equal(verifyResult.body.error.code, "INVALID_SIGNATURE")

  const walletCount = await prisma.walletAccount.count()
  assert.equal(walletCount, 0)
})

test("reused wallet nonce returns 401 and no extra link created", async () => {
  const nonceResult = await request("/api/auth/wallet/nonce", {
    address: signingAccount.address,
    chainId,
  })

  const { nonce, nonceToken } = nonceResult.body.data
  const { preparedMessage, signature } = await createSiweSignature(nonce)

  const firstVerify = await request("/api/auth/wallet/verify", {
    message: preparedMessage,
    signature,
    nonceToken,
  })
  assert.equal(firstVerify.response.status, 200)

  const secondVerify = await request("/api/auth/wallet/verify", {
    message: preparedMessage,
    signature,
    nonceToken,
  })
  assert.equal(secondVerify.response.status, 401)
  assert.equal(secondVerify.body.success, false)
  assert.equal(secondVerify.body.error.code, "INVALID_NONCE")

  const walletCount = await prisma.walletAccount.count()
  assert.equal(walletCount, 1)
})

test("link wallet links SIWE identity to existing email user", async () => {
  const registerResult = await request("/api/auth/register", {
    email: "linker@example.com",
    password: "StrongPass1!",
    displayName: "Link User",
  })
  assert.equal(registerResult.response.status, 201)
  const authCookie = registerResult.response.headers.get("set-cookie")
  assert.ok(authCookie)

  const nonceResult = await request("/api/auth/wallet/nonce", {
    address: signingAccount.address,
    chainId,
  })

  const { nonce, nonceToken } = nonceResult.body.data
  const { preparedMessage, signature } = await createSiweSignature(nonce)

  const linkResult = await request(
    "/api/auth/link/wallet",
    {
      message: preparedMessage,
      signature,
      nonceToken,
    },
    "POST",
    { cookie: authCookie }
  )

  assert.equal(linkResult.response.status, 200)
  assert.equal(linkResult.body.success, true)
  assert.equal(linkResult.body.data.wallet.address, signingAccount.address.toLowerCase())

  const user = await prisma.user.findUnique({
    where: { email: "linker@example.com" },
    include: { walletAccounts: true },
  })
  assert.equal(user.walletAccounts.length, 1)
})
