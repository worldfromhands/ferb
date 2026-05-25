-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "spotifyMonthlyListeners" INTEGER,
    "spotifyStreams" INTEGER,
    "spotifyPlaylistAdds" INTEGER,
    "spotifySaves" INTEGER,
    "spotifyFollowers" INTEGER,
    "spotifySuperListeners" INTEGER,
    "spotifyPopularity" INTEGER,
    "youtubeSubscribers" INTEGER,
    "youtubeViews" INTEGER,
    "instagramFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "tiktokLikes" INTEGER,
    "deezerFans" INTEGER,
    "lastfmListeners" INTEGER,
    "lastfmPlaycount" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'api',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BaselineSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT '7d_avg',
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DetectedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "currentValue" REAL NOT NULL,
    "baselineValue" REAL NOT NULL,
    "changePct" REAL NOT NULL,
    "contextData" TEXT DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'detected',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AutoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "trigger" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullAnalysis" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "contextUsed" TEXT NOT NULL DEFAULT '{}',
    "modelUsed" TEXT NOT NULL DEFAULT 'claude-opus-4-5',
    "tokensUsed" INTEGER,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "humanReview" TEXT,
    "humanNotes" TEXT,
    "reviewedAt" DATETIME,
    CONSTRAINT "AutoAnalysis_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DetectedEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_key" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "DailyMetric_date_idx" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "BaselineSnapshot_metric_type_idx" ON "BaselineSnapshot"("metric", "type");

-- CreateIndex
CREATE INDEX "DetectedEvent_detectedAt_idx" ON "DetectedEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "DetectedEvent_status_idx" ON "DetectedEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AutoAnalysis_eventId_key" ON "AutoAnalysis"("eventId");

-- CreateIndex
CREATE INDEX "AutoAnalysis_generatedAt_idx" ON "AutoAnalysis"("generatedAt");
