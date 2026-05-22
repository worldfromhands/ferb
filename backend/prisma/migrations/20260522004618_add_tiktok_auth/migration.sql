-- CreateTable
CREATE TABLE "TikTokAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "refreshExpiresAt" DATETIME,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TikTokAuth_openId_key" ON "TikTokAuth"("openId");
