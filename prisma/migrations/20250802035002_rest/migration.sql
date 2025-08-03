-- DropForeignKey
ALTER TABLE `resources` DROP FOREIGN KEY `resources_parentId_fkey`;

-- DropIndex
DROP INDEX `resources_parentId_fkey` ON `resources`;

-- AlterTable
ALTER TABLE `resources` MODIFY `parentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `resources`(`resourceId`) ON DELETE SET NULL ON UPDATE CASCADE;
