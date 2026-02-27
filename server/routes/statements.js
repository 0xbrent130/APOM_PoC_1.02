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

function isPrismaKnownError(error) {
  return Boolean(error && typeof error === "object" && error.code)
}

function handleRouteError(res, error) {
  if (isPrismaKnownError(error) && error.code === "P2003") {
    return sendError(res, 404, "REFERENCE_NOT_FOUND", "Customer or policy does not exist")
  }

  console.error(error)
  return sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
}

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/)

const createTransactionSchema = z.object({
  cid: idSchema,
  pid: idSchema,
  amount: z.coerce.number().positive().finite(),
  status: z.string().trim().min(1).max(64),
  duedate: z.string().trim().min(1).max(64),
  paydate: z.string().trim().min(1).max(64),
  time: z.string().trim().min(1).max(64),
})

const changeStatusSchema = z
  .object({
    tid: idSchema.optional(),
    cid: idSchema.optional(),
    pid: idSchema.optional(),
    newStatus: z.string().trim().min(1).max(64),
  })
  .superRefine((payload, ctx) => {
    if (!payload.tid && (!payload.cid || !payload.pid)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide tid or cid/pid",
      })
    }
  })

router.post("/transaction", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(createTransactionSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const transaction = await prisma.statement.create({
      data: {
        tid: createLegacyId(),
        cid: payload.cid,
        pid: payload.pid,
        amount: payload.amount,
        status: payload.status,
        duedate: payload.duedate,
        paydate: payload.paydate,
        time: payload.time,
      },
    })

    sendSuccess(res, 201, {
      message: "Transaction Created",
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

router.get("/fetch", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const statements = await prisma.statement.findMany({
      orderBy: [{ cid: "asc" }, { pid: "asc" }, { duedate: "asc" }],
    })

    sendSuccess(res, 200, {
      items: statements.map((statement) => ({
        ...statement,
        amount: Number(statement.amount),
      })),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

router.post("/changeStatus", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(changeStatusSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()

    const target = payload.tid
      ? await prisma.statement.findUnique({
          where: { tid: payload.tid },
          select: { tid: true },
        })
      : await prisma.statement.findFirst({
          where: {
            cid: payload.cid,
            pid: payload.pid,
          },
          select: { tid: true },
          orderBy: [{ duedate: "desc" }, { paydate: "desc" }, { time: "desc" }],
        })

    if (!target) {
      sendError(res, 404, "STATEMENT_NOT_FOUND", "Statement does not exist")
      return
    }

    const updatedStatement = await prisma.statement.update({
      where: { tid: target.tid },
      data: {
        status: payload.newStatus,
      },
    })

    sendSuccess(res, 200, {
      statement: {
        ...updatedStatement,
        amount: Number(updatedStatement.amount),
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

module.exports = router
