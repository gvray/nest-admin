/*
  Warnings:

  - Made the column `nickname` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL nickname values with a default value
UPDATE `users` SET `nickname` = `username` WHERE `nickname` IS NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `email` VARCHAR(191) NULL,
    MODIFY `nickname` VARCHAR(191) NOT NULL;
