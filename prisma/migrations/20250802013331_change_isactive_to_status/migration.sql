/*
  Warnings:

  - You are about to drop the column `isActive` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `resources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `departments` DROP COLUMN `isActive`,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `positions` DROP COLUMN `isActive`,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `resources` DROP COLUMN `isActive`,
    ADD COLUMN `status` INTEGER NOT NULL DEFAULT 1;
