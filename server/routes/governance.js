const express = require("express")
const { z } = require("zod")
const { requireAuth } = require("../middleware/auth.js")
const { getPrismaClient } = require("../prismaClient.js")

const router = express.Router()

const voteSchema = z.object({
  support: z.boolean(),
  voteWeight: z.coerce.number().int().positive().max(1000000000).optional(),
})

const discussSchema = z.object({
  message: z.string().trim().min(1).max(500),
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

function isValidProposalId(proposalId) {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(proposalId)
}

function normalizeAmount(value) {
  return Number(value)
}

function statusToClient(status) {
  if (status === "DRAFT") {
    return "pending"
  }

  if (status === "ACTIVE") {
    return "active"
  }

  if (status === "PASSED") {
    return "passed"
  }

  if (status === "REJECTED") {
    return "rejected"
  }

  return "executed"
}

function formatDuration(ms) {
  const dayMs = 24 * 60 * 60 * 1000
  const hourMs = 60 * 60 * 1000
  const minuteMs = 60 * 1000

  if (ms >= dayMs) {
    const days = Math.ceil(ms / dayMs)
    return `${days} day${days === 1 ? "" : "s"} left`
  }

  if (ms >= hourMs) {
    const hours = Math.ceil(ms / hourMs)
    return `${hours} hour${hours === 1 ? "" : "s"} left`
  }

  const minutes = Math.max(1, Math.ceil(ms / minuteMs))
  return `${minutes} minute${minutes === 1 ? "" : "s"} left`
}

function timelineForProposal(proposal, now) {
  if (proposal.status === "DRAFT") {
    return "Voting has not started"
  }

  if (proposal.status !== "ACTIVE") {
    return "Ended"
  }

  const endsAt = proposal.endsAt.getTime()
  if (endsAt <= now) {
    return "Ended"
  }

  return formatDuration(endsAt - now)
}

function voteBlockReason(proposal, now) {
  if (proposal.status === "DRAFT") {
    return "Voting has not started for this proposal yet."
  }

  if (proposal.status !== "ACTIVE") {
    return "Proposal voting has ended and is immutable."
  }

  if (proposal.endsAt.getTime() <= now) {
    return "Proposal voting has ended and is immutable."
  }

  return null
}

function voteActionForProposal(proposal, now) {
  const blockedReason = voteBlockReason(proposal, now)

  if (!blockedReason) {
    return {
      enabled: true,
      label: "Vote",
      disabledReason: null,
    }
  }

  if (proposal.status === "DRAFT") {
    return {
      enabled: false,
      label: "Not Started",
      disabledReason: blockedReason,
    }
  }

  return {
    enabled: false,
    label: "Ended",
    disabledReason: blockedReason,
  }
}

function discussActionForProposal(proposal, now) {
  const blockedReason = voteBlockReason(proposal, now)

  if (blockedReason && proposal.status !== "DRAFT") {
    return {
      enabled: false,
      label: "Discussion Closed",
      disabledReason: "Proposal is immutable and discussion is locked.",
    }
  }

  return {
    enabled: true,
    label: "Discuss",
    disabledReason: null,
  }
}

function normalizeProposal(proposal, now) {
  const votesFor = normalizeAmount(proposal.votesFor)
  const votesAgainst = normalizeAmount(proposal.votesAgainst)

  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    status: statusToClient(proposal.status),
    votesFor,
    votesAgainst,
    totalVotes: votesFor + votesAgainst,
    quorum: normalizeAmount(proposal.quorum),
    endsAt: proposal.endsAt,
    timeline: timelineForProposal(proposal, now),
    updatedAt: proposal.updatedAt,
    actions: {
      vote: voteActionForProposal(proposal, now),
      discuss: discussActionForProposal(proposal, now),
    },
  }
}

router.get("/overview", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const proposals = await prisma.governanceProposal.findMany({
      orderBy: [{ status: "asc" }, { endsAt: "asc" }],
    })

    const now = Date.now()
    const normalized = proposals.map((proposal) => normalizeProposal(proposal, now))

    sendSuccess(res, 200, {
      proposals: normalized,
      stats: {
        totalProposals: normalized.length,
        activeProposals: normalized.filter((proposal) => proposal.status === "active").length,
        totalVotingPower: normalized.reduce((sum, proposal) => sum + proposal.totalVotes, 0),
        totalQuorum: normalized.reduce((sum, proposal) => sum + proposal.quorum, 0),
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/proposals/:proposalId/vote", requireAuth, async (req, res) => {
  const payload = parsePayload(voteSchema, req, res)
  if (!payload) {
    return
  }

  const { proposalId } = req.params
  if (!isValidProposalId(proposalId)) {
    sendError(res, 400, "INVALID_PROPOSAL_ID", "Invalid proposal id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const now = Date.now()

    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.governanceProposal.findUnique({
        where: { id: proposalId },
        select: {
          id: true,
          title: true,
          status: true,
          votesFor: true,
          votesAgainst: true,
          quorum: true,
          endsAt: true,
          updatedAt: true,
          description: true,
        },
      })

      if (!proposal) {
        return { kind: "not_found" }
      }

      const blockedReason = voteBlockReason(proposal, now)
      if (blockedReason) {
        return {
          kind: "blocked",
          message: blockedReason,
          proposal,
        }
      }

      const existingVote = await tx.governanceVote.findUnique({
        where: {
          proposalId_userId: {
            proposalId,
            userId: req.auth.userId,
          },
        },
      })

      if (existingVote) {
        return {
          kind: "already_voted",
          proposal,
        }
      }

      const voteWeight = payload.voteWeight || 1
      const vote = await tx.governanceVote.create({
        data: {
          proposalId,
          userId: req.auth.userId,
          support: payload.support,
          voteWeight,
        },
      })

      const increment = BigInt(voteWeight)
      const updatedProposal = await tx.governanceProposal.update({
        where: { id: proposalId },
        data: payload.support
          ? {
              votesFor: {
                increment,
              },
            }
          : {
              votesAgainst: {
                increment,
              },
            },
      })

      return {
        kind: "voted",
        vote,
        proposal: updatedProposal,
      }
    })

    if (result.kind === "not_found") {
      sendError(res, 404, "PROPOSAL_NOT_FOUND", "Proposal not found")
      return
    }

    if (result.kind === "already_voted") {
      sendError(res, 409, "VOTE_ALREADY_CAST", "You have already voted on this proposal")
      return
    }

    if (result.kind === "blocked") {
      sendError(res, 409, "PROPOSAL_IMMUTABLE", result.message)
      return
    }

    sendSuccess(res, 201, {
      proposal: normalizeProposal(result.proposal, now),
      vote: {
        id: result.vote.id,
        support: result.vote.support,
        voteWeight: normalizeAmount(result.vote.voteWeight),
        createdAt: result.vote.createdAt,
      },
      message: "Vote recorded successfully",
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/proposals/:proposalId/discuss", requireAuth, async (req, res) => {
  const payload = parsePayload(discussSchema, req, res)
  if (!payload) {
    return
  }

  const { proposalId } = req.params
  if (!isValidProposalId(proposalId)) {
    sendError(res, 400, "INVALID_PROPOSAL_ID", "Invalid proposal id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const proposal = await prisma.governanceProposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        title: true,
        status: true,
        votesFor: true,
        votesAgainst: true,
        quorum: true,
        endsAt: true,
        updatedAt: true,
        description: true,
      },
    })

    if (!proposal) {
      sendError(res, 404, "PROPOSAL_NOT_FOUND", "Proposal not found")
      return
    }

    const now = Date.now()
    const action = discussActionForProposal(proposal, now)
    if (!action.enabled) {
      sendError(res, 409, "DISCUSSION_LOCKED", action.disabledReason || "Discussion is not available")
      return
    }

    sendSuccess(res, 201, {
      proposal: normalizeProposal(proposal, now),
      discussion: {
        proposalId,
        message: payload.message,
        submittedAt: new Date().toISOString(),
      },
      message: "Discussion intent submitted",
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

module.exports = router
