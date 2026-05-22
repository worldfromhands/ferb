-- CreateTable
CREATE TABLE "Council" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "takes" TEXT NOT NULL,
    "synthesis" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Council_createdAt_idx" ON "Council"("createdAt");
