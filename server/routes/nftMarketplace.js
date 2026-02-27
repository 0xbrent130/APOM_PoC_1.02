const express = require("express")
const { z } = require("zod")
const { requireAuth } = require("../middleware/auth.js")
const { getPrismaClient } = require("../prismaClient.js")

const router = express.Router()

const walletAddressSchema = z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/)

const buySchema = z.object({
  buyerWallet: walletAddressSchema.optional(),
})

const listSchema = z.object({
  price: z.coerce.number().finite().positive(),
  sellerWallet: walletAddressSchema,
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

function isValidAssetId(assetId) {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(assetId)
}

function normalizeAmount(value) {
  return Number(value)
}

function normalizeStatus(status) {
  if (status === "LISTED") {
    return "listed"
  }

  if (status === "SOLD") {
    return "sold"
  }

  return "delisted"
}

function actionForBuy(status) {
  if (status === "LISTED") {
    return {
      enabled: true,
      label: "Buy Now",
      disabledReason: null,
    }
  }

  return {
    enabled: false,
    label: "Unavailable",
    disabledReason: "Asset is not available for purchase",
  }
}

function actionForList(status) {
  if (status === "LISTED") {
    return {
      enabled: false,
      label: "Already Listed",
      disabledReason: "Asset is already listed for sale",
    }
  }

  return {
    enabled: true,
    label: "List for Sale",
    disabledReason: null,
  }
}

function normalizeAsset(asset) {
  return {
    id: asset.id,
    name: asset.name,
    tokenId: asset.tokenId,
    rarity: asset.rarity,
    sellerWallet: asset.sellerWallet,
    status: normalizeStatus(asset.status),
    price: normalizeAmount(asset.price),
    updatedAt: asset.updatedAt,
    collection: {
      id: asset.collection.id,
      name: asset.collection.name,
      category: asset.collection.category,
    },
    actions: {
      buy: actionForBuy(asset.status),
      list: actionForList(asset.status),
    },
  }
}

function normalizeCollection(collection) {
  return {
    id: collection.id,
    name: collection.name,
    category: collection.category,
    floorPrice: normalizeAmount(collection.floorPrice),
    volume: normalizeAmount(collection.volume),
    items: collection.items,
    updatedAt: collection.updatedAt,
  }
}

async function getAssetWithCollection(assetId) {
  const prisma = getPrismaClient()
  return prisma.nftAsset.findUnique({
    where: { id: assetId },
    include: {
      collection: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  })
}

router.get("/overview", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const [collections, assets] = await Promise.all([
      prisma.nftCollection.findMany({
        orderBy: [{ volume: "desc" }, { floorPrice: "desc" }],
      }),
      prisma.nftAsset.findMany({
        include: {
          collection: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      }),
    ])

    const totalVolume = collections.reduce((sum, collection) => sum + normalizeAmount(collection.volume), 0)

    sendSuccess(res, 200, {
      collections: collections.map(normalizeCollection),
      assets: assets.map(normalizeAsset),
      stats: {
        totalCollections: collections.length,
        totalAssets: assets.length,
        listedAssets: assets.filter((asset) => asset.status === "LISTED").length,
        soldAssets: assets.filter((asset) => asset.status === "SOLD").length,
        totalVolume,
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/assets/:assetId/buy", requireAuth, async (req, res) => {
  const payload = parsePayload(buySchema, req, res)
  if (!payload) {
    return
  }

  const assetId = req.params.assetId
  if (!isValidAssetId(assetId)) {
    sendError(res, 400, "INVALID_ASSET_ID", "Invalid asset id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const buyerWallet = payload.buyerWallet ? payload.buyerWallet.toLowerCase() : null

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.nftAsset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          status: true,
          sellerWallet: true,
          price: true,
          name: true,
        },
      })

      if (!existing) {
        return { kind: "not_found" }
      }

      const updated = await tx.nftAsset.updateMany({
        where: {
          id: assetId,
          status: "LISTED",
        },
        data: {
          status: "SOLD",
        },
      })

      if (updated.count !== 1) {
        return { kind: "unavailable", status: existing.status }
      }

      const listing = await tx.nftListing.create({
        data: {
          assetId,
          sellerWallet: existing.sellerWallet.toLowerCase(),
          buyerWallet,
          price: existing.price,
          status: "SOLD",
          purchasedAt: new Date(),
        },
      })

      return {
        kind: "purchased",
        listing,
      }
    })

    if (result.kind === "not_found") {
      sendError(res, 404, "ASSET_NOT_FOUND", "Asset not found")
      return
    }

    if (result.kind === "unavailable") {
      sendError(res, 409, "ASSET_UNAVAILABLE", "Asset is no longer available for purchase")
      return
    }

    const freshAsset = await getAssetWithCollection(assetId)
    sendSuccess(res, 201, {
      asset: normalizeAsset(freshAsset),
      purchase: {
        id: result.listing.id,
        price: normalizeAmount(result.listing.price),
        status: normalizeStatus(result.listing.status),
        purchasedAt: result.listing.purchasedAt,
      },
      message: "Purchase complete",
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/assets/:assetId/list", requireAuth, async (req, res) => {
  const payload = parsePayload(listSchema, req, res)
  if (!payload) {
    return
  }

  const assetId = req.params.assetId
  if (!isValidAssetId(assetId)) {
    sendError(res, 400, "INVALID_ASSET_ID", "Invalid asset id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const sellerWallet = payload.sellerWallet.toLowerCase()

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.nftAsset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          status: true,
        },
      })

      if (!existing) {
        return { kind: "not_found" }
      }

      const updated = await tx.nftAsset.updateMany({
        where: {
          id: assetId,
          NOT: { status: "LISTED" },
        },
        data: {
          status: "LISTED",
          price: payload.price,
          sellerWallet,
        },
      })

      if (updated.count !== 1) {
        return { kind: "already_listed" }
      }

      const listing = await tx.nftListing.create({
        data: {
          assetId,
          sellerWallet,
          price: payload.price,
          status: "LISTED",
        },
      })

      return {
        kind: "listed",
        listing,
      }
    })

    if (result.kind === "not_found") {
      sendError(res, 404, "ASSET_NOT_FOUND", "Asset not found")
      return
    }

    if (result.kind === "already_listed") {
      sendError(res, 409, "ASSET_ALREADY_LISTED", "Asset is already listed")
      return
    }

    const freshAsset = await getAssetWithCollection(assetId)
    sendSuccess(res, 201, {
      asset: normalizeAsset(freshAsset),
      listing: {
        id: result.listing.id,
        price: normalizeAmount(result.listing.price),
        status: normalizeStatus(result.listing.status),
        listedAt: result.listing.listedAt,
      },
      message: "Listing created",
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

module.exports = router
