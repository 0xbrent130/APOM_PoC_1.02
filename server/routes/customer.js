require("dotenv").config()
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

function normalizeCustomer(customer) {
  return {
    cid: customer.cid,
    name: customer.name,
    dob: customer.dob,
    gender: customer.gender,
    address: customer.address,
    pincode: customer.pincode,
    contact: customer.contact,
    mname: customer.mname,
    fname: customer.fname,
    email: customer.email,
  }
}

function parsePayload(schema, req, res) {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    sendError(res, 400, "INVALID_INPUT", "Invalid request payload")
    return null
  }

  return result.data
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
    dob: z.string().trim().min(1).max(64),
    gender: safeStringSchema,
    address: z.string().trim().min(1).max(500),
    pincode: z.string().trim().min(3).max(20),
    contact: z.string().trim().min(3).max(20),
    mname: safeStringSchema,
    fname: safeStringSchema,
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
  cid: idSchema,
  name: safeStringSchema,
  dob: z.string().trim().min(1).max(64),
  gender: safeStringSchema,
  address: z.string().trim().min(1).max(500),
  pincode: z.string().trim().min(3).max(20),
  contact: z.string().trim().min(3).max(20),
  mname: safeStringSchema,
  fname: safeStringSchema,
  email: z.string().trim().email().max(320),
})

const customerIdSchema = z.object({ cid: idSchema })

const buySchema = z.object({
  cid: idSchema,
  pid: idSchema,
  aid: idSchema,
  amount: z.coerce.number().positive().finite(),
  paydate: z.string().trim().min(1).max(64),
  time: z.string().trim().min(1).max(64),
})

function isPrismaKnownError(error) {
  return Boolean(error && typeof error === "object" && error.code)
}

function handleRouteError(res, error) {
  if (isPrismaKnownError(error) && error.code === "P2002") {
    return sendError(res, 409, "EMAIL_IN_USE", "Email already exists")
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
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: payload.email.toLowerCase() },
      select: { cid: true },
    })

    if (existingCustomer) {
      sendError(res, 409, "EMAIL_IN_USE", "Create account with another email")
      return
    }

    const password = await bcrypt.hash(payload.password, 10)

    const customer = await prisma.customer.create({
      data: {
        cid: createLegacyId(),
        name: payload.name,
        dob: payload.dob,
        gender: payload.gender,
        address: payload.address,
        pincode: payload.pincode,
        contact: payload.contact,
        mname: payload.mname,
        fname: payload.fname,
        email: payload.email.toLowerCase(),
        password,
      },
    })

    sendSuccess(res, 201, {
      message: "User Created",
      user: normalizeCustomer(customer),
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
    const customer = await prisma.customer.findUnique({
      where: { email: payload.email.toLowerCase() },
    })

    if (!customer) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Login with correct credentials")
      return
    }

    const isValid = await bcrypt.compare(payload.password, customer.password)

    if (!isValid) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Login with correct credentials")
      return
    }

    sendSuccess(res, 200, {
      message: "User LoggedIn",
      user: normalizeCustomer(customer),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Update Customer
router.post("/update", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(updateSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const existingCustomer = await prisma.customer.findUnique({
      where: { cid: payload.cid },
      select: { cid: true },
    })

    if (!existingCustomer) {
      sendError(res, 404, "CUSTOMER_NOT_FOUND", "Customer does not exist")
      return
    }

    const updatedCustomer = await prisma.customer.update({
      where: { cid: payload.cid },
      data: {
        name: payload.name,
        dob: payload.dob,
        gender: payload.gender,
        address: payload.address,
        pincode: payload.pincode,
        contact: payload.contact,
        mname: payload.mname,
        fname: payload.fname,
        email: payload.email.toLowerCase(),
      },
    })

    sendSuccess(res, 200, {
      message: "User Updated",
      user: normalizeCustomer(updatedCustomer),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Get user policies
router.post("/policies", async (req, res) => {
  const payload = parsePayload(customerIdSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const centres = await prisma.centre.findMany({
      where: { cid: payload.cid },
      include: {
        policy: {
          select: {
            pid: true,
            name: true,
            duration: true,
            amount: true,
            ramount: true,
          },
        },
        agent: {
          select: {
            aid: true,
            name: true,
          },
        },
      },
      orderBy: [{ pid: "asc" }, { aid: "asc" }],
    })

    const items = centres.map((centre) => ({
      pid: centre.policy.pid,
      pname: centre.policy.name,
      ramount: Number(centre.policy.ramount),
      total: Number(centre.amount),
      amount: Number(centre.policy.amount),
      duration: centre.policy.duration,
      aid: centre.agent.aid,
      aname: centre.agent.name,
    }))

    sendSuccess(res, 200, { items })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Get user agents
router.post("/agents", async (req, res) => {
  const payload = parsePayload(customerIdSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const centres = await prisma.centre.findMany({
      where: { cid: payload.cid },
      include: {
        agent: {
          select: {
            aid: true,
            name: true,
            gender: true,
            contact: true,
            address: true,
            pincode: true,
            email: true,
          },
        },
      },
      orderBy: [{ aid: "asc" }, { pid: "asc" }],
    })

    const items = centres.map((centre) => centre.agent)

    sendSuccess(res, 200, { items })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// All Customers
router.get("/all", async (_req, res) => {
  try {
    const prisma = getPrismaClient()
    const customers = await prisma.customer.findMany({
      orderBy: { email: "asc" },
    })

    sendSuccess(res, 200, {
      items: customers.map(normalizeCustomer),
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// Get Statements
router.post("/statements", async (req, res) => {
  const payload = parsePayload(customerIdSchema, req, res)

  if (!payload) {
    return
  }

  try {
    const prisma = getPrismaClient()
    const statements = await prisma.statement.findMany({
      where: { cid: payload.cid },
      select: {
        tid: true,
        pid: true,
        amount: true,
        status: true,
        duedate: true,
        paydate: true,
        time: true,
      },
      orderBy: { duedate: "asc" },
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

// Buy Policy
router.post("/buy", requireAuth, requireRole("user", "admin"), async (req, res) => {
  const payload = parsePayload(buySchema, req, res)

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

    if (existingCentre) {
      sendError(res, 409, "POLICY_ALREADY_OWNED", "Already present in your current policies")
      return
    }

    const tid = createLegacyId()
    const amount = payload.amount

    const [centre, transaction] = await prisma.$transaction([
      prisma.centre.create({
        data: {
          cid: payload.cid,
          pid: payload.pid,
          aid: payload.aid,
          amount,
        },
      }),
      prisma.statement.create({
        data: {
          tid,
          cid: payload.cid,
          pid: payload.pid,
          amount,
          status: "paid",
          duedate: payload.paydate,
          paydate: payload.paydate,
          time: payload.time,
        },
      }),
    ])

    sendSuccess(res, 200, {
      centre: {
        ...centre,
        amount: Number(centre.amount),
      },
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

module.exports = router
