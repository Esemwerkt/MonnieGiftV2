-- AlterTable
ALTER TABLE "gifts" ADD COLUMN "previewAnimationStyle" TEXT;
ALTER TABLE "gifts" ADD COLUMN "previewConfettiType" TEXT;
ALTER TABLE "gifts" ADD COLUMN "previewConfettiVariant" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("createdAt", "data", "id", "isRead", "message", "readAt", "title", "type", "updatedAt", "userId") SELECT "createdAt", "data", "id", "isRead", "message", "readAt", "title", "type", "updatedAt", "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
