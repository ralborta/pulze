-- CreateTable
CREATE TABLE "StandardPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StandardPlan_category_idx" ON "StandardPlan"("category");

-- CreateIndex
CREATE INDEX "StandardPlan_difficulty_idx" ON "StandardPlan"("difficulty");

-- CreateIndex
CREATE INDEX "StandardPlan_isActive_idx" ON "StandardPlan"("isActive");
