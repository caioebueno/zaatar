CREATE TYPE "BusinessMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER');
CREATE TYPE "BusinessMembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

CREATE TABLE "BusinessMember" (
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessMemberRole" NOT NULL DEFAULT 'MANAGER',
    "status" "BusinessMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("businessId","userId")
);

CREATE INDEX "BusinessMember_userId_status_createdAt_idx"
ON "BusinessMember"("userId", "status", "createdAt");

CREATE INDEX "BusinessMember_businessId_role_status_createdAt_idx"
ON "BusinessMember"("businessId", "role", "status", "createdAt");

ALTER TABLE "BusinessMember"
ADD CONSTRAINT "BusinessMember_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessMember"
ADD CONSTRAINT "BusinessMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "BusinessMember" (
  "businessId",
  "userId",
  "role",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  bo."businessId",
  bo."userId",
  'OWNER'::"BusinessMemberRole",
  'ACTIVE'::"BusinessMembershipStatus",
  bo."createdAt",
  COALESCE(bo."createdAt", CURRENT_TIMESTAMP)
FROM "BusinessOwner" bo
ON CONFLICT ("businessId", "userId") DO NOTHING;
