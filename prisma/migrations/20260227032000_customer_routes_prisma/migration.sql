-- CreateTable
CREATE TABLE "customer" (
    "cid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "mname" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "agent" (
    "aid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "policy" (
    "pid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "ramount" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "centre" (
    "cid" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "aid" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,

    PRIMARY KEY ("cid", "pid", "aid"),
    CONSTRAINT "centre_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer" ("cid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "centre_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy" ("pid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "centre_aid_fkey" FOREIGN KEY ("aid") REFERENCES "agent" ("aid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "statements" (
    "tid" TEXT NOT NULL PRIMARY KEY,
    "cid" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "duedate" TEXT NOT NULL,
    "paydate" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    CONSTRAINT "statements_cid_fkey" FOREIGN KEY ("cid") REFERENCES "customer" ("cid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "statements_pid_fkey" FOREIGN KEY ("pid") REFERENCES "policy" ("pid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agent_email_key" ON "agent"("email");

-- CreateIndex
CREATE INDEX "centre_cid_idx" ON "centre"("cid");

-- CreateIndex
CREATE INDEX "centre_pid_idx" ON "centre"("pid");

-- CreateIndex
CREATE INDEX "centre_aid_idx" ON "centre"("aid");

-- CreateIndex
CREATE INDEX "statements_cid_pid_idx" ON "statements"("cid", "pid");
