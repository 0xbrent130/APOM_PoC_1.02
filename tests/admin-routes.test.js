const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")

let prisma
let app
let server
let baseUrl

async function request(pathname, payload, method = "POST") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  const body = await response.json()
  return { response, body }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-admin-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "admin-routes.db")}`

  const { getPrismaClient } = require("../server/prismaClient.js")
  ;({ createApp: app } = require("../server/app.js"))

  prisma = getPrismaClient()

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "customer" ("cid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "dob" TEXT NOT NULL, "gender" TEXT NOT NULL, "address" TEXT NOT NULL, "pincode" TEXT NOT NULL, "contact" TEXT NOT NULL, "mname" TEXT NOT NULL, "fname" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL);'
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customer_email_key" ON "customer"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "agent" ("aid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "gender" TEXT NOT NULL, "contact" TEXT NOT NULL, "address" TEXT NOT NULL, "pincode" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL);'
  )
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "agent_email_key" ON "agent"("email");')

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "policy" ("pid" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "duration" INTEGER NOT NULL, "description" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "ramount" DECIMAL NOT NULL);'
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "centre" ("cid" TEXT NOT NULL, "pid" TEXT NOT NULL, "aid" TEXT NOT NULL, "amount" DECIMAL NOT NULL, PRIMARY KEY ("cid", "pid", "aid"), CONSTRAINT "centre_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer"("cid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "centre_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy"("pid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "centre_aid_fkey" FOREIGN KEY ("aid") REFERENCES "agent"("aid") ON DELETE CASCADE ON UPDATE CASCADE);'
  )

  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "statements" ("tid" TEXT NOT NULL PRIMARY KEY, "cid" TEXT NOT NULL, "pid" TEXT NOT NULL, "amount" DECIMAL NOT NULL, "status" TEXT NOT NULL, "duedate" TEXT NOT NULL, "paydate" TEXT NOT NULL, "time" TEXT NOT NULL, CONSTRAINT "statements_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer"("cid") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "statements_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy"("pid") ON DELETE CASCADE ON UPDATE CASCADE);'
  )

  server = app().listen(0)
  await new Promise((resolve) => server.once("listening", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  if (prisma) {
    await prisma.$disconnect()
  }
})

test.beforeEach(async () => {
  await prisma.statement.deleteMany()
  await prisma.centre.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.customer.deleteMany()

  await prisma.customer.create({
    data: {
      cid: "cust100001",
      name: "Alex",
      dob: "1990-01-01",
      gender: "nonbinary",
      address: "1 Main St",
      pincode: "10001",
      contact: "5550000000",
      mname: "Parent A",
      fname: "Parent B",
      email: "alex@example.com",
      password: "secret",
    },
  })

  await prisma.agent.create({
    data: {
      aid: "agent10001",
      name: "Sam",
      gender: "male",
      contact: "5551112222",
      address: "2 Main St",
      pincode: "10002",
      email: "sam@example.com",
      password: "hash",
    },
  })

  await prisma.policy.create({
    data: {
      pid: "policy1001",
      name: "Starter",
      duration: 12,
      description: "Starter policy",
      amount: 100,
      ramount: 120,
    },
  })
})

test("changeStatus updates statement and returns updated state", async () => {
  const createResult = await request("/api/statements/transaction", {
    cid: "cust100001",
    pid: "policy1001",
    amount: 100,
    status: "pending",
    duedate: "2026-03-01",
    paydate: "2026-03-01",
    time: "10:00",
  })

  assert.equal(createResult.response.status, 201)
  const tid = createResult.body.data.transaction.tid

  const { response, body } = await request("/api/statements/changeStatus", {
    tid,
    newStatus: "paid",
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.data.statement.tid, tid)
  assert.equal(body.data.statement.status, "paid")

  const updated = await prisma.statement.findUnique({ where: { tid } })
  assert.equal(updated.status, "paid")
})

test("changeStatus for missing statement returns 404 and no phantom data", async () => {
  const beforeCount = await prisma.statement.count()

  const { response, body } = await request("/api/statements/changeStatus", {
    tid: "missing-tid",
    newStatus: "paid",
  })

  assert.equal(response.status, 404)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "STATEMENT_NOT_FOUND")

  const afterCount = await prisma.statement.count()
  assert.equal(afterCount, beforeCount)
})

test("agent update for missing record returns 404 and creates nothing", async () => {
  const beforeCount = await prisma.agent.count()

  const { response, body } = await request("/api/agent/update", {
    aid: "missing-agent",
    name: "Name",
    gender: "female",
    address: "10 Main St",
    pincode: "10003",
    contact: "5551234567",
    email: "missing@example.com",
  })

  assert.equal(response.status, 404)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "AGENT_NOT_FOUND")

  const afterCount = await prisma.agent.count()
  assert.equal(afterCount, beforeCount)
})

test("centre modify increments existing centre amount", async () => {
  const first = await request("/api/centre/modify", {
    cid: "cust100001",
    pid: "policy1001",
    aid: "agent10001",
    amount: 150,
  })

  assert.equal(first.response.status, 201)
  assert.equal(first.body.success, true)
  assert.equal(first.body.data.centre.amount, 150)

  const second = await request("/api/centre/modify", {
    cid: "cust100001",
    pid: "policy1001",
    aid: "agent10001",
    amount: 50,
  })

  assert.equal(second.response.status, 200)
  assert.equal(second.body.success, true)
  assert.equal(second.body.data.centre.amount, 200)

  const centre = await prisma.centre.findUnique({
    where: {
      cid_pid_aid: {
        cid: "cust100001",
        pid: "policy1001",
        aid: "agent10001",
      },
    },
  })

  assert.equal(Number(centre.amount), 200)
})
