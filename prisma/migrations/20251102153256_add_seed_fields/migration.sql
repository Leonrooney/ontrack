-- AlterTable
ALTER TABLE "faqs" ADD COLUMN "tags" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activity_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "category" TEXT,
    "tags" TEXT,
    "steps" INTEGER,
    "distanceKm" REAL,
    "calories" INTEGER,
    "heartRateAvg" INTEGER,
    "workouts" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activity_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_activity_entries" ("category", "createdAt", "date", "description", "duration", "id", "tags", "title", "updatedAt", "userId") SELECT "category", "createdAt", "date", "description", "duration", "id", "tags", "title", "updatedAt", "userId" FROM "activity_entries";
DROP TABLE "activity_entries";
ALTER TABLE "new_activity_entries" RENAME TO "activity_entries";
CREATE TABLE "new_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "targetDate" DATETIME,
    "targetValue" REAL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "category" TEXT,
    "type" TEXT,
    "targetInt" INTEGER,
    "targetDec" REAL,
    "period" TEXT,
    "startDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_goals" ("category", "createdAt", "currentValue", "description", "id", "status", "targetDate", "targetValue", "title", "unit", "updatedAt", "userId") SELECT "category", "createdAt", "currentValue", "description", "id", "status", "targetDate", "targetValue", "title", "unit", "updatedAt", "userId" FROM "goals";
DROP TABLE "goals";
ALTER TABLE "new_goals" RENAME TO "goals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
