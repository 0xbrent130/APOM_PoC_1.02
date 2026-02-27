const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("node:crypto")
const { z } = require("zod")
const { getPrismaClient } = require("../prismaClient.js")
const { requireAuth, requireRole } = require("../middleware/auth.js")

const router = express.Router()

const sqlMetaPattern = /('|--|\/\*|\*\/|;|\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i

function hasSqlInjectionRisk(value) {
  return sqlMetaPattern.test(value)
}

function createLegacyId() {
  return crypto.randomBytes(8).toString("hex").slice(0, 10)
}

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

function normalizeAgent(agent) {
  return {
    aid: agent.aid,
    name: agent.name,
    gender: agent.gender,
    contact: agent.contact,
    address: agent.address,
    pincode: agent.pincode,
    email: agent.email,
  }
}

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)

const safeStringSchema = z.string().trim().min(1).max(255)

const signupSchema = z
  .object({
    name: safeStringSchema,
    gender: safeStringSchema,
    address: z.string().trim().min(1).max(500),
    pincode: z.string().trim().min(3).max(20),
    contact: z.string().trim().min(3).max(20),
    email: z.string().trim().email().max(320),
    password: z.string().min(8).max(72),
  })
  .superRefine((input, ctx) => {
    if (hasSqlInjectionRisk(input.email) || hasSqlInjectionRisk(input.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid credentials" })
    }
  })

const loginSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(1).max(72),
  })
  .superRefine((input, ctx) => {
    if (hasSqlInjectionRisk(input.email) || hasSqlInjectionRisk(input.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid credentials" })
    }
  })

const updateSchema = z.object({
  aid: idSchema,
  name: safeStringSchema,
  gender: safeStringSchema,
  address: z.string().trim().min(1).max(500),
  pincode: z.string().trim().min(3).max(20),
  contact: z.string().trim().min(3).max(20),
  email: z.string().trim().email().max(320),
})

function isPrismaKnownError(error) {
  return Boolean(error && typeof error === "object" && error.code)
}

function handleRouteError(res, error) {
  if (isPrismaKnownError(error) && error.code === "P2002") {
    return sendError(res, 409, "EMAIL_IN_USE", "Create account with another email")
  }

  console.error(error)
  return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
}

// Create Account
router.post("/signup", async (req, res) => {
  const payload = parsePayload(signupSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const existingAgent = await prisma.agent.findUnique({
      where: { email: payload.email.toLowerCase() },
      select: { aid: true },
    })

    if (existingAgent) {
      sendError(res, 409, "EMAIL_IN_USE", "Create account with another email")
      return
    }

    const password = await bcrypt.hash(payload.password, 10)

    const agent = await prisma.agent.create({
      data: {
        aid: createLegacyId(),
        name: payload.name,
        gender: payload.gender,
        address: payload.address,
        pincode: payload.pincode,
        contact: payload.contact,
        email: payload.email.toLowerCase(),
        password,
      },
    })

    sendSuccess(res, 201, {
      message: "Agent Created",
      agent: normalizeAgent(agent),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Login
router.post("/login", async (req, res) => {
  const payload = parsePayload(loginSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const agent = await prisma.agent.findUnique({
      where: { email: payload.email.toLowerCase() },
    })

    if (!agent) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Login with correct credentials")
      return
    }

    const isValid = await bcrypt.compare(payload.password, agent.password)

    if (!isValid) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Login with correct credentials")
      return
    }

    sendSuccess(res, 200, {
      message: "Agent LoggedIn",
      agent: normalizeAgent(agent),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Update Data of Agent
router.post("/update", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(updateSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const existingAgent = await prisma.agent.findUnique({
      where: { aid: payload.aid },
      select: { aid: true },
    })

    if (!existingAgent) {
      sendError(res, 404, "AGENT_NOT_FOUND", "Agent does not exist")
      return
    }

    const updatedAgent = await prisma.agent.update({
      where: { aid: payload.aid },
      data: {
        name: payload.name,
        gender: payload.gender,
        address: payload.address,
        pincode: payload.pincode,
        contact: payload.contact,
        email: payload.email.toLowerCase(),
      },
    })

    sendSuccess(res, 200, {
      message: "Agent Updated",
      agent: normalizeAgent(updatedAgent),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

router.get("/fetch", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const agents = await prisma.agent.findMany({
      select: {
        aid: true,
        name: true,
        contact: true,
      },
      orderBy: { name: "asc" },
    })

    sendSuccess(res, 200, {
      items: agents,
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

module.exports = router
