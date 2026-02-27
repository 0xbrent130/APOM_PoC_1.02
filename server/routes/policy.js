const express = require("express")
const crypto = require("node:crypto")
const { z } = require("zod")
const { getPrismaClient } = require("../prismaClient.js")
const { requireAuth, requireRole } = require("../middleware/auth.js")

const router = express.Router()

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

function handleRouteError(res, error) {
  console.error(error)
  return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
}

const createPolicySchema = z.object({
  name: z.string().trim().min(1).max(255),
  duration: z.coerce.number().int().positive(),
  description: z.string().trim().min(1).max(1000),
  amount: z.coerce.number().positive().finite(),
  ramount: z.coerce.number().nonnegative().finite(),
})

router.post("/create", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(createPolicySchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const policy = await prisma.policy.create({
      data: {
        pid: createLegacyId(),
        name: payload.name,
        duration: payload.duration,
        description: payload.description,
        amount: payload.amount,
        ramount: payload.ramount,
      },
    })

    sendSuccess(res, 201, {
      policy: {
        ...policy,
        amount: Number(policy.amount),
        ramount: Number(policy.ramount),
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

router.get("/fetch", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const policies = await prisma.policy.findMany({
      orderBy: { name: "asc" },
    })

    sendSuccess(res, 200, {
      items: policies.map((policy) => ({
        ...policy,
        amount: Number(policy.amount),
        ramount: Number(policy.ramount),
      })),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

module.exports = router
