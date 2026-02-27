const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const os = require("node:os")
const fs = require("node:fs/promises")

let prisma
let app
let server
let baseUrl

async function request(pathname, payload) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json()
  return { response, body }
}

test.before(async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "apom-customer-routes-"))
  process.env.DATABASE_URL = `file:${path.join(tempDir, "customer-routes.db")}`

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
  baseUrl = `http://127.0.0.1:${address.port}/api/customer`
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
})

test("signup with unique email returns 201 and normalized user", async () => {
  const { response, body } = await request("/signup", {
    name: "Alice",
    dob: "1991-01-01",
    gender: "female",
    address: "101 Main St",
    pincode: "10001",
    contact: "5551112222",
    mname: "Jane",
    fname: "Bob",
    email: "Alice@example.com",
    password: "StrongPass1!",
  })

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.user.email, "alice@example.com")
  assert.equal(body.data.user.name, "Alice")
  assert.equal(body.data.user.password, undefined)

  const customers = await prisma.customer.findMany()
  assert.equal(customers.length, 1)
  assert.equal(customers[0].email, "alice@example.com")
})

test("sql injection attempt in email/password returns 400 and no db corruption", async () => {
  await request("/signup", {
    name: "Alice",
    dob: "1991-01-01",
    gender: "female",
    address: "101 Main St",
    pincode: "10001",
    contact: "5551112222",
    mname: "Jane",
    fname: "Bob",
    email: "alice@example.com",
    password: "StrongPass1!",
  })

  const { response, body } = await request("/login", {
    email: "alice@example.com",
    password: "' OR 1=1 --",
  })

  assert.equal(response.status, 400)
  assert.equal(body.success, false)
  assert.equal(body.error.code, "INVALID_INPUT")

  const customers = await prisma.customer.findMany()
  assert.equal(customers.length, 1)
  assert.equal(customers[0].email, "alice@example.com")
})
