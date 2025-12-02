-- AlterTable
ALTER TABLE "users" ADD COLUMN     "themePreference" TEXT DEFAULT 'system',
ADD COLUMN     "unitPreference" TEXT DEFAULT 'metric';
