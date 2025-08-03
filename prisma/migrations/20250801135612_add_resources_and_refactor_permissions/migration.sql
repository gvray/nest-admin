/*
  Warnings:

  - A unique constraint covering the columns `[departmentId]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[permissionId]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[positionId]` on the table `positions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - The required column `departmentId` was added to the `departments` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `action` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - The required column `permissionId` was added to the `permissions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `resourceId` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - The required column `positionId` was added to the `positions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `roleId` was added to the `roles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `departments` ADD COLUMN `departmentId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `action` VARCHAR(191) NOT NULL,
    ADD COLUMN `permissionId` VARCHAR(191) NOT NULL,
    ADD COLUMN `resourceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `positions` ADD COLUMN `positionId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `roleId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `remark` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'menu',
    `path` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `parentId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resources_resourceId_key`(`resourceId`),
    UNIQUE INDEX `resources_name_key`(`name`),
    UNIQUE INDEX `resources_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `departments_departmentId_key` ON `departments`(`departmentId`);

-- CreateIndex
CREATE UNIQUE INDEX `permissions_permissionId_key` ON `permissions`(`permissionId`);

-- CreateIndex
CREATE UNIQUE INDEX `positions_positionId_key` ON `positions`(`positionId`);

-- CreateIndex
CREATE UNIQUE INDEX `roles_roleId_key` ON `roles`(`roleId`);

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `resources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
