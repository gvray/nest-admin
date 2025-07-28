/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - The required column `userId` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable: Add userId as optional first
ALTER TABLE `users` ADD COLUMN `userId` VARCHAR(191);

-- Update existing records with UUID values
UPDATE `users` SET `userId` = UUID() WHERE `userId` IS NULL;

-- Make userId required
ALTER TABLE `users` MODIFY COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_userId_key` ON `users`(`userId`);
