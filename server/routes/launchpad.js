const express = require("express")
const { z } = require("zod")
const { requireAuth } = require("../middleware/auth.js")
const { getPrismaClient } = require("../prismaClient.js")

const router = express.Router()

const contributeSchema = z.object({
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

function isValidProjectId(projectId) {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(projectId)
}

function normalizeAmount(value) {
  return Number(value)
}

function statusToClient(status) {
  if (status === "UPCOMING") {
    return "upcoming"
  }

  if (status === "LIVE") {
    return "live"
  }

  if (status === "COMPLETED") {
    return "completed"
  }

  return "cancelled"
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

function toTimeline(project, now) {
  if (project.status === "COMPLETED") {
    return "Funding completed"
  }

  if (project.status === "CANCELLED") {
    return "Project cancelled"
  }

  const deadlineTime = project.deadline.getTime()
  if (deadlineTime <= now) {
    return "Funding ended"
  }

  return formatDuration(deadlineTime - now)
}

function contributionBlockReason(project, now) {
  if (project.status === "UPCOMING") {
    return "Project is not live yet. Contributions open when status is Live."
  }

  if (project.status === "COMPLETED") {
    return "Project funding has ended. Contributions are closed."
  }

  if (project.status === "CANCELLED") {
    return "Project has been cancelled. Contributions are closed."
  }

  if (project.deadline.getTime() <= now) {
    return "Project funding has ended. Contributions are closed."
  }

  return null
}

function contributionAction(project, now) {
  const disabledReason = contributionBlockReason(project, now)

  if (!disabledReason) {
    return {
      enabled: true,
      label: "Contribute",
      disabledReason: null,
    }
  }

  if (project.status === "UPCOMING") {
    return {
      enabled: false,
      label: "Coming Soon",
      disabledReason,
    }
  }

  if (project.status === "COMPLETED") {
    return {
      enabled: false,
      label: "Completed",
      disabledReason,
    }
  }

  if (project.status === "CANCELLED") {
    return {
      enabled: false,
      label: "Cancelled",
      disabledReason,
    }
  }

  return {
    enabled: false,
    label: "Ended",
    disabledReason,
  }
}

function normalizeProject(project, now) {
  const raised = normalizeAmount(project.raised)
  const target = normalizeAmount(project.target)
  const progress = target > 0 ? (raised / target) * 100 : 0

  return {
    id: project.id,
    name: project.name,
    type: project.projectType,
    status: statusToClient(project.status),
    raised,
    target,
    participants: project.participants,
    deadline: project.deadline,
    timeline: toTimeline(project, now),
    progressPercentage: Number(progress.toFixed(2)),
    updatedAt: project.updatedAt,
    contributionAction: contributionAction(project, now),
  }
}

router.get("/overview", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const projects = await prisma.launchProject.findMany({
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    })

    const now = Date.now()
    const normalizedProjects = projects.map((project) => normalizeProject(project, now))

    sendSuccess(res, 200, {
      projects: normalizedProjects,
      stats: {
        totalProjects: projects.length,
        liveProjects: projects.filter((project) => project.status === "LIVE").length,
        totalRaised: normalizedProjects.reduce((sum, project) => sum + project.raised, 0),
        totalParticipants: normalizedProjects.reduce((sum, project) => sum + project.participants, 0),
      },
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.get("/projects/:projectId", async (req, res) => {
  const { projectId } = req.params

  if (!isValidProjectId(projectId)) {
    sendError(res, 400, "INVALID_PROJECT_ID", "Invalid project id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const project = await prisma.launchProject.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      sendError(res, 404, "PROJECT_NOT_FOUND", "Project not found")
      return
    }

    const contributions = await prisma.launchContribution.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        userId: true,
        amount: true,
        createdAt: true,
      },
    })

    const now = Date.now()
    sendSuccess(res, 200, {
      project: normalizeProject(project, now),
      recentContributions: contributions.map((item) => ({
        id: item.id,
        userId: item.userId,
        amount: normalizeAmount(item.amount),
        createdAt: item.createdAt,
      })),
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

router.post("/projects/:projectId/contribute", requireAuth, async (req, res) => {
  const payload = parsePayload(contributeSchema, req, res)
  if (!payload) {
    return
  }

  const { projectId } = req.params
  if (!isValidProjectId(projectId)) {
    sendError(res, 400, "INVALID_PROJECT_ID", "Invalid project id")
    return
  }

  try {
    const prisma = getPrismaClient()
    const now = Date.now()

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.launchProject.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          status: true,
          raised: true,
          target: true,
          participants: true,
          deadline: true,
          projectType: true,
          updatedAt: true,
        },
      })

      if (!project) {
        return { kind: "not_found" }
      }

      const blockedReason = contributionBlockReason(project, now)
      if (blockedReason) {
        return { kind: "blocked", message: blockedReason }
      }

      const existingUserContribution = await tx.launchContribution.findFirst({
        where: {
          projectId,
          userId: req.auth.userId,
        },
        select: {
          id: true,
        },
      })

      const contribution = await tx.launchContribution.create({
        data: {
          projectId,
          userId: req.auth.userId,
          amount: payload.amount,
        },
      })

      const participantsIncrement = existingUserContribution ? 0 : 1
      const updatedProject = await tx.launchProject.update({
        where: {
          id: projectId,
        },
        data: {
          raised: {
            increment: payload.amount,
          },
          participants: {
            increment: participantsIncrement,
          },
        },
      })

      return {
        kind: "success",
        contribution,
        project: updatedProject,
      }
    })

    if (result.kind === "not_found") {
      sendError(res, 404, "PROJECT_NOT_FOUND", "Project not found")
      return
    }

    if (result.kind === "blocked") {
      sendError(res, 409, "PROJECT_CONTRIBUTION_BLOCKED", result.message)
      return
    }

    sendSuccess(res, 201, {
      project: normalizeProject(result.project, now),
      contribution: {
        id: result.contribution.id,
        projectId: result.contribution.projectId,
        amount: normalizeAmount(result.contribution.amount),
        createdAt: result.contribution.createdAt,
      },
      message: "Contribution recorded successfully.",
    })
  } catch (error) {
    console.error(error)
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
})

module.exports = router
