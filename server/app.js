require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { bootstrapPrisma } = require("./prismaBootstrap.js")
const { getRuntimeConfig } = require("./config.js")
const { getPrismaClient } = require("./prismaClient.js")
const customerRouter = require("./routes/customer.js")
const agentRouter = require("./routes/agent.js")
const policyRouter = require("./routes/policy.js")
const statementsRouter = require("./routes/statements.js")
const centreRouter = require("./routes/centre.js")

async function defaultReadinessCheck() {
    await getPrismaClient().$queryRawUnsafe("SELECT 1")
}

function createApp(options = {}) {
    const serverApp = express()
    const readinessCheck = options.readinessCheck || defaultReadinessCheck

    serverApp.use(express.urlencoded({extended:true}))
    serverApp.use(express.json())

    serverApp.use(cors({
        origin:"*",
        methods:["POST","GET","PUT","DELETE"]
    }))

    serverApp.use("/api/customer",customerRouter)
    serverApp.use("/api/agent",agentRouter)
    serverApp.use("/api/policy",policyRouter)
    serverApp.use("/api/statements",statementsRouter)
    serverApp.use("/api/centre",centreRouter)

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
        console.log(body);
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
