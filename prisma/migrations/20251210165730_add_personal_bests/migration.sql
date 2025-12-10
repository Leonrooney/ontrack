-- CreateTable
CREATE TABLE "personal_bests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "customId" TEXT,
    "type" TEXT NOT NULL,
    "weightKg" DECIMAL(6,2),
    "reps" INTEGER,
    "value" DECIMAL(6,2) NOT NULL,
    "setId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_bests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personal_bests_userId_exerciseId_customId_type_idx" ON "personal_bests"("userId", "exerciseId", "customId", "type");

-- CreateIndex
CREATE INDEX "personal_bests_setId_idx" ON "personal_bests"("setId");

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_customId_fkey" FOREIGN KEY ("customId") REFERENCES "custom_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_setId_fkey" FOREIGN KEY ("setId") REFERENCES "workout_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
