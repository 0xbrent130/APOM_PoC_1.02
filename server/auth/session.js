const crypto = require("node:crypto")
const jwt = require("jsonwebtoken")
const { getPrismaClient } = require("../prismaClient.js")

const AUTH_COOKIE_NAME = "apom_session"
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24

function getAuthSecret() {
  return process.env.AUTH_JWT_SECRET || "apom-dev-auth-secret"
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function getExpiryDate(ttlSeconds = DEFAULT_SESSION_TTL_SECONDS) {
  return new Date(Date.now() + ttlSeconds * 1000)
}

function setAuthCookie(res, token, expiresAt) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  })
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
}

function extractTokenFromRequest(req) {
  const cookieToken = req.cookies && req.cookies[AUTH_COOKIE_NAME]
  if (cookieToken) {
    return cookieToken
  }

  const authHeader = req.headers.authorization
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim()
  }

  return null
}

async function createSessionToken({ userId, role = "user", ttlSeconds = DEFAULT_SESSION_TTL_SECONDS, res }) {
  const sessionId = crypto.randomUUID()
  const expiresAt = getExpiryDate(ttlSeconds)
  const token = jwt.sign({ sid: sessionId, sub: userId, role }, getAuthSecret(), {
    expiresIn: ttlSeconds,
  })

  const prisma = getPrismaClient()
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      revokedAt: null,
    },
  })

  if (res) {
    setAuthCookie(res, token, expiresAt)
  }

  return {
    token,
    sessionId,
    userId,
    role,
    expiresAt,
  }
}

async function getSessionFromToken(token) {
  if (!token) {
    return null
  }

  let decoded
  try {
    decoded = jwt.verify(token, getAuthSecret())
  } catch (_error) {
    return null
  }

  const tokenHash = hashToken(token)
  const prisma = getPrismaClient()
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  })

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    role: decoded.role || "user",
    user: session.user,
    expiresAt: session.expiresAt,
  }
}

async function revokeSessionToken(token) {
  if (!token) {
    return
  }

  const prisma = getPrismaClient()
  await prisma.session.updateMany({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

module.exports = {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  createSessionToken,
  extractTokenFromRequest,
  getAuthSecret,
  getSessionFromToken,
  revokeSessionToken,
}
