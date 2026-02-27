const express = require("express")
const { z } = require("zod")
const { getPrismaClient } = require("../prismaClient.js")
const { requireAuth, requireRole } = require("../middleware/auth.js")

const router = express.Router()

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

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)

const modifySchema = z.object({
  cid: idSchema,
  pid: idSchema,
  aid: idSchema,
  amount: z.coerce.number().positive().finite(),
})

router.post("/modify", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(modifySchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const [customer, policy, agent] = await Promise.all([
      prisma.customer.findUnique({ where: { cid: payload.cid }, select: { cid: true } }),
      prisma.policy.findUnique({ where: { pid: payload.pid }, select: { pid: true } }),
      prisma.agent.findUnique({ where: { aid: payload.aid }, select: { aid: true } }),
    ])

    if (!customer) {
      sendError(res, 404, "CUSTOMER_NOT_FOUND", "Customer does not exist")
      return
    }

    if (!policy) {
      sendError(res, 404, "POLICY_NOT_FOUND", "Policy does not exist")
      return
    }

    if (!agent) {
      sendError(res, 404, "AGENT_NOT_FOUND", "Agent does not exist")
      return
    }

    const existingCentre = await prisma.centre.findUnique({
      where: {
        cid_pid_aid: {
          cid: payload.cid,
          pid: payload.pid,
          aid: payload.aid,
        },
      },
    })

    const centre = existingCentre
      ? await prisma.centre.update({
          where: {
            cid_pid_aid: {
              cid: payload.cid,
              pid: payload.pid,
              aid: payload.aid,
            },
          },
          data: {
            amount: {
              increment: payload.amount,
            },
          },
        })
      : await prisma.centre.create({
          data: {
            cid: payload.cid,
            pid: payload.pid,
            aid: payload.aid,
            amount: payload.amount,
          },
        })

    sendSuccess(res, existingCentre ? 200 : 201, {
      centre: {
        ...centre,
        amount: Number(centre.amount),
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

module.exports = router
