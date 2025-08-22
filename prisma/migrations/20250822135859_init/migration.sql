-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `gender` INTEGER NULL,
    `remark` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `departmentId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_userId_key`(`userId`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` VARCHAR(191) NOT NULL,
    `roleKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `dataScope` INTEGER NOT NULL DEFAULT 1,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_roleId_key`(`roleId`),
    UNIQUE INDEX `roles_roleKey_key`(`roleKey`),
    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_departments_roleId_departmentId_key`(`roleId`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resourceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('DIRECTORY', 'MENU') NOT NULL DEFAULT 'MENU',
    `path` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resources_resourceId_key`(`resourceId`),
    UNIQUE INDEX `resources_name_key`(`name`),
    UNIQUE INDEX `resources_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `permissionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_permissionId_key`(`permissionId`),
    UNIQUE INDEX `permissions_name_key`(`name`),
    UNIQUE INDEX `permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `manager` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_departmentId_key`(`departmentId`),
    UNIQUE INDEX `departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `positionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `positions_positionId_key`(`positionId`),
    UNIQUE INDEX `positions_name_key`(`name`),
    UNIQUE INDEX `positions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `positionId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_positions_userId_positionId_key`(`userId`, `positionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dictionary_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `typeId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dictionary_types_typeId_key`(`typeId`),
    UNIQUE INDEX `dictionary_types_code_key`(`code`),
    UNIQUE INDEX `dictionary_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dictionary_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` VARCHAR(191) NOT NULL,
    `typeCode` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dictionary_items_itemId_key`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'string',
    `group` VARCHAR(191) NOT NULL DEFAULT 'system',
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configs_configId_key`(`configId`),
    UNIQUE INDEX `configs_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RoleToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RoleToUser_AB_unique`(`A`, `B`),
    INDEX `_RoleToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PositionToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PositionToUser_AB_unique`(`A`, `B`),
    INDEX `_PositionToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`departmentId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_departments` ADD CONSTRAINT `role_departments_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_departments` ADD CONSTRAINT `role_departments_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`departmentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_departments` ADD CONSTRAINT `role_departments_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_departments` ADD CONSTRAINT `role_departments_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `resources`(`resourceId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`resourceId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `departments`(`departmentId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `positions_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_positions` ADD CONSTRAINT `user_positions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_positions` ADD CONSTRAINT `user_positions_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `positions`(`positionId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_positions` ADD CONSTRAINT `user_positions_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dictionary_types` ADD CONSTRAINT `dictionary_types_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dictionary_types` ADD CONSTRAINT `dictionary_types_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dictionary_items` ADD CONSTRAINT `dictionary_items_typeCode_fkey` FOREIGN KEY (`typeCode`) REFERENCES `dictionary_types`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dictionary_items` ADD CONSTRAINT `dictionary_items_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dictionary_items` ADD CONSTRAINT `dictionary_items_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configs` ADD CONSTRAINT `configs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configs` ADD CONSTRAINT `configs_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RoleToUser` ADD CONSTRAINT `_RoleToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RoleToUser` ADD CONSTRAINT `_RoleToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PositionToUser` ADD CONSTRAINT `_PositionToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `positions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PositionToUser` ADD CONSTRAINT `_PositionToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
