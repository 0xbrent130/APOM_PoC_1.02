const express = require("express")
const { z } = require("zod")
const { getPrismaClient } = require("../prismaClient.js")

const router = express.Router()

const playSchema = z.object({
  wallet: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
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

function statusToClient(status) {
  if (status === "LIVE") {
    return "live"
  }

  if (status === "UPCOMING") {
    return "coming_soon"
  }

  if (status === "MAINTENANCE") {
    return "maintenance"
  }

  return "archived"
}

function actionStateForStatus(status) {
  if (status === "LIVE") {
    return {
      enabled: true,
      label: "Play Now",
      disabledReason: null,
    }
  }

  if (status === "UPCOMING") {
    return {
      enabled: false,
      label: "Coming Soon",
      disabledReason: "Game not live yet",
    }
  }

  if (status === "MAINTENANCE") {
    return {
      enabled: false,
      label: "Under Maintenance",
      disabledReason: "Temporarily disabled for maintenance",
    }
  }

  return {
    enabled: false,
    label: "Unavailable",
    disabledReason: "Game is no longer available",
  }
}

function normalizeGame(game) {
  const action = actionStateForStatus(game.status)

  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    genre: game.genre,
    status: statusToClient(game.status),
    rewardRate: game.rewardRate,
    activePlayers: game.activePlayers,
    updatedAt: game.updatedAt,
    action,
  }
}

router.get("/overview", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const games = await prisma.game.findMany({
      orderBy: [{ status: "asc" }, { title: "asc" }],
    })

    const stats = {
      totalGames: games.length,
      liveGames: games.filter((game) => game.status === "LIVE").length,
      totalActivePlayers: games.reduce((sum, game) => sum + game.activePlayers, 0),
      rewardPrograms: games.filter((game) => game.rewardRate.trim().toUpperCase() !== "TBA").length,
    }

    sendSuccess(res, 200, {
      games: games.map(normalizeGame),
      stats,
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/games/:slug/play", async (req, res) => {
  const payload = parsePayload(playSchema, req, res)
  if (!payload) {
    return
  }

  const slug = req.params.slug
  if (!slug || !/^[a-z0-9-]{2,64}$/.test(slug)) {
    sendError(res, 400, "INVALID_SLUG", "Invalid game slug")
    return
  }

  try {
    const prisma = getPrismaClient()
    const game = await prisma.game.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
      },
    })

    if (!game) {
      sendError(res, 404, "GAME_NOT_FOUND", "Game not found")
      return
    }

    const action = actionStateForStatus(game.status)
    if (!action.enabled) {
      sendError(res, 409, "GAME_NOT_PLAYABLE", action.disabledReason || "Game not playable")
      return
    }

    const participation = await prisma.gameParticipation.create({
      data: {
        gameId: game.id,
        wallet: payload.wallet ? payload.wallet.toLowerCase() : null,
        action: "PLAY_NOW",
        metadata: {
          source: "gaming_page",
        },
      },
    })

    sendSuccess(res, 201, {
      game: {
        slug: game.slug,
        title: game.title,
      },
      participation: {
        id: participation.id,
        action: participation.action,
        occurredAt: participation.occurredAt,
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

module.exports = router
