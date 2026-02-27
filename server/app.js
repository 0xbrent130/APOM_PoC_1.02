require("dotenv").config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const cookieParser = require("cookie-parser")
const { bootstrapPrisma } = require("./prismaBootstrap.js")
const { getRuntimeConfig, getSecurityRuntimeConfig } = require("./config.js")
const { getPrismaClient } = require("./prismaClient.js")
const authRouter = require("./routes/auth.js")
const customerRouter = require("./routes/customer.js")
const agentRouter = require("./routes/agent.js")
const policyRouter = require("./routes/policy.js")
const statementsRouter = require("./routes/statements.js")
const centreRouter = require("./routes/centre.js")
const gamingRouter = require("./routes/gaming.js")
const defiRouter = require("./routes/defi.js")
const nftMarketplaceRouter = require("./routes/nftMarketplace.js")
const launchpadRouter = require("./routes/launchpad.js")
const governanceRouter = require("./routes/governance.js")

const REDACTED_VALUE = "[REDACTED]"
const SENSITIVE_KEYS = new Set(["password", "token", "secret", "authorization", "cookie"])

async function defaultReadinessCheck() {
    await getPrismaClient().$queryRawUnsafe("SELECT 1")
}

function parseCorsAllowlist(rawOrigins) {
    return new Set(
        (rawOrigins || "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
    )
}

function hasSensitiveKey(key) {
    return SENSITIVE_KEYS.has(String(key).toLowerCase())
}

function redactSensitiveData(value) {
    if (!value || typeof value !== "object") {
        return value
    }

    if (Array.isArray(value)) {
        return value.map(redactSensitiveData)
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
            key,
            hasSensitiveKey(key) ? REDACTED_VALUE : redactSensitiveData(nestedValue),
        ])
    )
}

function createApp(options = {}) {
    const serverApp = express()
    const readinessCheck = options.readinessCheck || defaultReadinessCheck
    const config = getSecurityRuntimeConfig(options.env || process.env)
    const allowlist = parseCorsAllowlist(config.CORS_ORIGINS)
    if (allowlist.size === 0 && config.NODE_ENV !== "production") {
        allowlist.add("http://localhost:3000")
        allowlist.add("http://localhost:5173")
        allowlist.add("http://localhost:8080")
        allowlist.add("http://127.0.0.1:3000")
        allowlist.add("http://127.0.0.1:5173")
        allowlist.add("http://127.0.0.1:8080")
    }

    serverApp.use(helmet())
    serverApp.use(express.urlencoded({ extended: true, limit: config.REQUEST_BODY_LIMIT }))
    serverApp.use(express.json({ limit: config.REQUEST_BODY_LIMIT }))
    serverApp.use(cookieParser())

    // Reject cross-origin requests that are not explicitly allowed.
    serverApp.use((req, res, next) => {
        const origin = req.get("origin")
        if (!origin) {
            next()
            return
        }

        if (allowlist.has(origin)) {
            next()
            return
        }

        res.status(403).json({
            code: "CORS_ORIGIN_BLOCKED",
            message: "Origin is not allowed",
        })
    })

    serverApp.use(cors({
        origin(origin, callback) {
            if (!origin || allowlist.has(origin)) {
                callback(null, true)
                return
            }
            callback(null, false)
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }))

    serverApp.use(
        "/api",
        rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW_MS,
            max: config.RATE_LIMIT_MAX,
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                code: "RATE_LIMITED",
                message: "Too many requests, please try again later",
            },
        })
    )

    serverApp.use("/api/auth",authRouter)
    serverApp.use("/api/customer",customerRouter)
    serverApp.use("/api/agent",agentRouter)
    serverApp.use("/api/policy",policyRouter)
    serverApp.use("/api/statements",statementsRouter)
    serverApp.use("/api/centre",centreRouter)
    serverApp.use("/api/gaming",gamingRouter)
    serverApp.use("/api/defi",defiRouter)
    serverApp.use("/api/nft-marketplace",nftMarketplaceRouter)
    serverApp.use("/api/launchpad",launchpadRouter)
    serverApp.use("/api/governance",governanceRouter)

    serverApp.get("/",(req,res)=>{
        res.send("Hello")
    })

    serverApp.get("/health/live",(_req,res)=>{
        res.status(200).json({status:"live"})
    })

    serverApp.get("/health/ready", async (_req, res) => {
        try {
            await readinessCheck()
            res.status(200).json({status:"ready"})
        } catch (_error) {
            res.status(503).json({status:"not_ready"})
        }
    })

    // *contact us API
    serverApp.post("/api/contact",(req,res)=>{
        let body = req.body
        console.log(JSON.stringify({
            level: "info",
            event: "contact_submission",
            body: redactSensitiveData(body),
        }))
        res.json(body)
    })

    return serverApp
}

const app = createApp()

async function startServer(options = {}) {
    const bootstrap = options.bootstrap || bootstrapPrisma
    const serverApp = options.app || app
    const port = options.port ?? getRuntimeConfig().PORT

    getRuntimeConfig()
    await bootstrap()

    return new Promise((resolve) => {
        const server = serverApp.listen(port, () => {
            console.log(`Server Started on port ${port}`);
            resolve(server)
        })
    })
}

async function main() {
    try {
        await startServer()
    } catch (error) {
        console.error(
            JSON.stringify({
                level:"error",
                event:"startup_failure",
                error:{
                    code:error.code || "STARTUP_ERROR",
                    message:error.message,
                    details:error.details || []
                }
            })
        )
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

module.exports = { app, createApp, startServer, main, defaultReadinessCheck }
