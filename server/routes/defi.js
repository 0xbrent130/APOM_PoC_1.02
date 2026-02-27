const express = require("express")
const { z } = require("zod")
const { requireAuth } = require("../middleware/auth.js")
const { getPrismaClient } = require("../prismaClient.js")

const router = express.Router()

const mutationSchema = z.object({
  amount: z.coerce.number().finite().positive(),
})

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
  const result = schema.safeParse(req.body || {})

  if (!result.success) {
    sendError(res, 400, "INVALID_INPUT", "Invalid request payload")
    return null
  }

  return result.data
}

function normalizeAmount(value) {
  return Number(value)
}

function normalizePoolType(type) {
  if (type === "GAMING") {
    return "gaming"
  }

  if (type === "STABLE") {
    return "stable"
  }

  if (type === "RWA") {
    return "rwa"
  }

  return "yield"
}

function normalizePoolStatus(status) {
  if (status === "ACTIVE") {
    return "active"
  }

  if (status === "PAUSED") {
    return "paused"
  }

  return "retired"
}

function actionForStatus(status, actionName) {
  if (status === "ACTIVE") {
    return {
      enabled: true,
      disabledReason: null,
      label: actionName,
    }
  }

  if (status === "PAUSED") {
    return {
      enabled: false,
      disabledReason: "Pool is temporarily paused",
      label: "Unavailable",
    }
  }

  return {
    enabled: false,
    disabledReason: "Pool has been retired",
    label: "Unavailable",
  }
}

function normalizePool(pool) {
  return {
    id: pool.id,
    pair: pool.pair,
    type: normalizePoolType(pool.type),
    status: normalizePoolStatus(pool.status),
    tvl: normalizeAmount(pool.tvl),
    apy: normalizeAmount(pool.apy),
    volume24h: normalizeAmount(pool.volume24h),
    updatedAt: pool.updatedAt,
    actions: {
      addLiquidity: actionForStatus(pool.status, "Add Liquidity"),
      stake: actionForStatus(pool.status, "Stake"),
    },
  }
}

async function findPoolById(poolId) {
  const prisma = getPrismaClient()
  return prisma.defiPool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      pair: true,
      status: true,
    },
  })
}

async function createPosition({ poolId, userId, amount, action }) {
  const prisma = getPrismaClient()
  return prisma.defiPosition.create({
    data: {
      poolId,
      userId,
      amount,
      action,
    },
  })
}

async function handleMutation(req, res, action) {
  const payload = parsePayload(mutationSchema, req, res)
  if (!payload) {
    return
  }

  const poolId = req.params.poolId
  if (!poolId || !/^[a-zA-Z0-9_-]{2,64}$/.test(poolId)) {
    sendError(res, 400, "INVALID_POOL_ID", "Invalid pool id")
    return
  }

  try {
    const pool = await findPoolById(poolId)

    if (!pool) {
      sendError(res, 404, "POOL_NOT_FOUND", "Pool not found")
      return
    }

    if (pool.status !== "ACTIVE") {
      const actionState = actionForStatus(pool.status, action)
      sendError(res, 409, "POOL_ACTION_BLOCKED", actionState.disabledReason || "Action unavailable")
      return
    }

    const position = await createPosition({
      poolId: pool.id,
      userId: req.auth.userId,
      amount: payload.amount,
      action,
    })

    sendSuccess(res, 201, {
      pool: {
        id: pool.id,
        pair: pool.pair,
      },
      intent: {
        id: position.id,
        action: position.action,
        amount: normalizeAmount(position.amount),
        createdAt: position.createdAt,
      },
      message: `${action} intent submitted`,
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
}

router.get("/overview", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const pools = await prisma.defiPool.findMany({
      orderBy: [{ status: "asc" }, { tvl: "desc" }],
    })

    const totalTvl = pools.reduce((sum, pool) => sum + normalizeAmount(pool.tvl), 0)
    const totalVolume24h = pools.reduce((sum, pool) => sum + normalizeAmount(pool.volume24h), 0)
    const averageApy = pools.length
      ? pools.reduce((sum, pool) => sum + normalizeAmount(pool.apy), 0) / pools.length
      : 0

    sendSuccess(res, 200, {
      pools: pools.map(normalizePool),
      stats: {
        totalPools: pools.length,
        activePools: pools.filter((pool) => pool.status === "ACTIVE").length,
        totalTvl,
        totalVolume24h,
        averageApy,
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/pools/:poolId/liquidity", requireAuth, async (req, res) => {
  await handleMutation(req, res, "ADD_LIQUIDITY")
})

router.post("/pools/:poolId/stake", requireAuth, async (req, res) => {
  await handleMutation(req, res, "STAKE")
})

module.exports = router
