-- AlterTable
ALTER TABLE "workout_items" ADD COLUMN     "customId" TEXT,
ALTER COLUMN "exerciseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "custom_exercises" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyPart" TEXT,
    "equipment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_exercises_userId_name_idx" ON "custom_exercises"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "custom_exercises_userId_name_key" ON "custom_exercises"("userId", "name");

-- CreateIndex
CREATE INDEX "workout_items_workoutId_orderIndex_idx" ON "workout_items"("workoutId", "orderIndex");

-- AddForeignKey
ALTER TABLE "custom_exercises" ADD CONSTRAINT "custom_exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_items" ADD CONSTRAINT "workout_items_customId_fkey" FOREIGN KEY ("customId") REFERENCES "custom_exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
