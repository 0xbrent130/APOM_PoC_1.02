const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("node:crypto")
const jwt = require("jsonwebtoken")
const { generateNonce, SiweMessage } = require("siwe")
const { z } = require("zod")
const { getPrismaClient } = require("../prismaClient.js")
const { clearAuthCookie, createSessionToken, getAuthSecret, revokeSessionToken } = require("../auth/session.js")
const { requireAuth } = require("../middleware/auth.js")

const router = express.Router()
const nonceStore = new Map()
const NONCE_TTL_SECONDS = 5 * 60

function sendSuccess(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data,
  })
}

function sendError(res, statusCode, code, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  })
}

function parsePayload(schema, req, res) {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    sendError(res, 400, "INVALID_INPUT", "Invalid request payload")
    return null
  }

  return result.data
}

function makeWalletDisplayName(address) {
  const normalized = address.toLowerCase()
  return `Wallet ${normalized.slice(0, 6)}...${normalized.slice(-4)}`
}

function createWalletFallbackEmail(address, chainId) {
  const suffix = crypto.randomBytes(4).toString("hex")
  return `wallet_${address.toLowerCase()}_${chainId}_${suffix}@wallet.apom.local`
}

function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function normalizeWallet(wallet) {
  return {
    id: wallet.id,
    userId: wallet.userId,
    address: wallet.address,
    chainId: wallet.chainId,
    isPrimary: wallet.isPrimary,
    linkedAt: wallet.linkedAt,
  }
}

function getWalletAddress(address) {
  return address.toLowerCase()
}

function pruneExpiredNonces() {
  const now = Date.now()
  for (const [key, value] of nonceStore.entries()) {
    if (value.expiresAt <= now) {
      nonceStore.delete(key)
    }
  }
}

function createNonceToken(address, chainId, nonce) {
  pruneExpiredNonces()
  const nonceId = crypto.randomUUID()
  const expiresAt = Date.now() + NONCE_TTL_SECONDS * 1000

  nonceStore.set(nonceId, {
    nonce,
    address,
    chainId,
    expiresAt,
    used: false,
  })

  const nonceToken = jwt.sign({ jti: nonceId, address, chainId, nonce }, getAuthSecret(), {
    expiresIn: NONCE_TTL_SECONDS,
  })

  return { nonceToken, expiresAt: new Date(expiresAt).toISOString() }
}

function readNonceRecord(nonceToken) {
  let decoded
  try {
    decoded = jwt.verify(nonceToken, getAuthSecret())
  } catch (_error) {
    return null
  }

  const record = nonceStore.get(decoded.jti)
  if (!record) {
    return null
  }

  if (record.expiresAt <= Date.now()) {
    nonceStore.delete(decoded.jti)
    return null
  }

  return {
    nonceId: decoded.jti,
    nonce: decoded.nonce,
    address: decoded.address,
    chainId: decoded.chainId,
    used: record.used,
  }
}

async function verifySiwePayload({ message, signature, nonceRecord }) {
  let siweMessage
  try {
    siweMessage = new SiweMessage(message)
  } catch (_error) {
    return null
  }

  const verifiedAddress = getWalletAddress(siweMessage.address || "")
  if (verifiedAddress !== nonceRecord.address || Number(siweMessage.chainId) !== nonceRecord.chainId) {
    return null
  }

  try {
    const verification = await siweMessage.verify({ signature, nonce: nonceRecord.nonce })
    if (!verification.success) {
      return null
    }
  } catch (_error) {
    return null
  }

  return siweMessage
}

const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(1).max(255),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(72),
})

const walletNonceSchema = z.object({
  address: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.coerce.number().int().positive(),
})

const walletVerifySchema = z.object({
  message: z.string().trim().min(1),
  signature: z.string().trim().min(1),
  nonceToken: z.string().trim().min(1),
})

router.post("/register", async (req, res) => {
  const payload = parsePayload(registerSchema, req, res)
  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const email = payload.email.toLowerCase()
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      sendError(res, 409, "EMAIL_IN_USE", "Email already exists")
      return
    }

    const passwordHash = await bcrypt.hash(payload.password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: payload.displayName,
      },
    })

    const session = await createSessionToken({ userId: user.id, role: "user", res })
    sendSuccess(res, 201, {
      user: normalizeUser(user),
      session: {
        id: session.sessionId,
        role: session.role,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    if (error && error.code === "P2002") {
      sendError(res, 409, "EMAIL_IN_USE", "Email already exists")
      return
    }

    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/login", async (req, res) => {
  const payload = parsePayload(loginSchema, req, res)
  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    })

    if (!user) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password")
      return
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash)
    if (!isValidPassword) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password")
      return
    }

    const session = await createSessionToken({
      userId: user.id,
      role: "user",
      res,
    })

    sendSuccess(res, 200, {
      user: normalizeUser(user),
      session: {
        id: session.sessionId,
        role: session.role,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/logout", requireAuth, async (req, res) => {
  try {
    await revokeSessionToken(req.auth.token)
    clearAuthCookie(res)
    sendSuccess(res, 200, { message: "Logged out" })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/wallet/nonce", async (req, res) => {
  const payload = parsePayload(walletNonceSchema, req, res)
  if (!payload) {
    return
  }

  const address = getWalletAddress(payload.address)
  const nonce = generateNonce()
  const noncePayload = createNonceToken(address, payload.chainId, nonce)

  sendSuccess(res, 200, {
    address,
    chainId: payload.chainId,
    nonce,
    nonceToken: noncePayload.nonceToken,
    expiresAt: noncePayload.expiresAt,
  })
})

router.post("/wallet/verify", async (req, res) => {
  const payload = parsePayload(walletVerifySchema, req, res)
  if (!payload) {
    return
  }

  const nonceRecord = readNonceRecord(payload.nonceToken)
  if (!nonceRecord || nonceRecord.used) {
    sendError(res, 401, "INVALID_NONCE", "Invalid or expired nonce")
    return
  }

  const siweMessage = await verifySiwePayload({
    message: payload.message,
    signature: payload.signature,
    nonceRecord,
  })

  if (!siweMessage) {
    sendError(res, 401, "INVALID_SIGNATURE", "Invalid SIWE signature")
    return
  }

  try {
    nonceStore.set(nonceRecord.nonceId, {
      ...nonceStore.get(nonceRecord.nonceId),
      used: true,
    })

    const prisma = getPrismaClient()
    const address = getWalletAddress(siweMessage.address)
    const chainId = Number(siweMessage.chainId)

    let wallet = await prisma.walletAccount.findUnique({
      where: {
        address_chainId: {
          address,
          chainId,
        },
      },
      include: {
        user: true,
      },
    })

    if (!wallet) {
      const user = await prisma.user.create({
        data: {
          email: createWalletFallbackEmail(address, chainId),
          passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
          displayName: makeWalletDisplayName(address),
        },
      })

      wallet = await prisma.walletAccount.create({
        data: {
          userId: user.id,
          address,
          chainId,
          isPrimary: true,
        },
        include: {
          user: true,
        },
      })
    }

    const session = await createSessionToken({
      userId: wallet.userId,
      role: "user",
      res,
    })

    sendSuccess(res, 200, {
      user: normalizeUser(wallet.user),
      wallet: normalizeWallet(wallet),
      session: {
        id: session.sessionId,
        role: session.role,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/link/wallet", requireAuth, async (req, res) => {
  const payload = parsePayload(walletVerifySchema, req, res)
  if (!payload) {
    return
  }

  const nonceRecord = readNonceRecord(payload.nonceToken)
  if (!nonceRecord || nonceRecord.used) {
    sendError(res, 401, "INVALID_NONCE", "Invalid or expired nonce")
    return
  }

  const siweMessage = await verifySiwePayload({
    message: payload.message,
    signature: payload.signature,
    nonceRecord,
  })

  if (!siweMessage) {
    sendError(res, 401, "INVALID_SIGNATURE", "Invalid SIWE signature")
    return
  }

  try {
    nonceStore.set(nonceRecord.nonceId, {
      ...nonceStore.get(nonceRecord.nonceId),
      used: true,
    })

    const prisma = getPrismaClient()
    const address = getWalletAddress(siweMessage.address)
    const chainId = Number(siweMessage.chainId)

    const existingWallet = await prisma.walletAccount.findUnique({
      where: {
        address_chainId: {
          address,
          chainId,
        },
      },
    })

    if (existingWallet && existingWallet.userId !== req.auth.userId) {
      sendError(res, 409, "WALLET_ALREADY_LINKED", "Wallet is linked to another account")
      return
    }

    let wallet = existingWallet
    if (!wallet) {
      const existingWalletCount = await prisma.walletAccount.count({
        where: { userId: req.auth.userId },
      })

      wallet = await prisma.walletAccount.create({
        data: {
          userId: req.auth.userId,
          address,
          chainId,
          isPrimary: existingWalletCount === 0,
        },
      })
    }

    sendSuccess(res, 200, {
      wallet: normalizeWallet(wallet),
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

module.exports = router
