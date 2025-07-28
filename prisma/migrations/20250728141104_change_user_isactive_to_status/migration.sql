/*
  Warnings:

  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `isActive`,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;
