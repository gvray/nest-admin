/**
 * 权限层级校验测试
 * 测试权限类型的父子关系约束
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

describe('PermissionsService - Hierarchy Validation', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  const mockDirectoryId = 'test-directory-id';
  const mockMenuId = 'test-menu-id';
  const mockButtonId = 'test-button-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            menuMeta: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('❌ 在目录下添加按钮（应该失败）', () => {
    it('should reject creating BUTTON under DIRECTORY', async () => {
      // First call: check if code exists (should return null)
      // Second call: get parent permission for validation
      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          permissionId: mockDirectoryId,
          name: '系统管理',
          code: 'system',
          type: 'DIRECTORY',
          action: 'access',
          origin: 'SYSTEM',
          parentPermissionId: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdById: null,
          updatedById: null,
        } as any);

      const dto: CreatePermissionDto = {
        name: '创建按钮',
        code: 'system:create',
        type: 'BUTTON' as any,
        parentPermissionId: mockDirectoryId,
        action: 'create' as any,
      };

      await expect(service.create(dto)).rejects.toThrow(
        '目录"系统管理"下只能添加目录或菜单，不能添加按钮',
      );
    });
  });

  describe('❌ 在菜单下添加目录（应该失败）', () => {
    it('should reject creating DIRECTORY under MENU', async () => {
      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 2,
          permissionId: mockMenuId,
          name: '用户管理',
          code: 'system:user',
          type: 'MENU',
          action: 'access',
          origin: 'SYSTEM',
          parentPermissionId: mockDirectoryId,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdById: null,
          updatedById: null,
        } as any);

      const dto: CreatePermissionDto = {
        name: '子目录',
        code: 'system:user:subdir',
        type: 'DIRECTORY' as any,
        parentPermissionId: mockMenuId,
      };

      await expect(service.create(dto)).rejects.toThrow(
        '菜单"用户管理"下只能添加按钮或API，不能添加目录',
      );
    });
  });

  describe('❌ 在按钮下添加子权限（应该失败）', () => {
    it('should reject creating permission under BUTTON', async () => {
      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 3,
          permissionId: mockButtonId,
          name: '创建用户',
          code: 'system:user:create',
          type: 'BUTTON',
          action: 'create',
          origin: 'SYSTEM',
          parentPermissionId: mockMenuId,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdById: null,
          updatedById: null,
        } as any);

      const dto: CreatePermissionDto = {
        name: '子权限',
        code: 'system:user:create:sub',
        type: 'BUTTON' as any,
        parentPermissionId: mockButtonId,
        action: 'view' as any,
      };

      await expect(service.create(dto)).rejects.toThrow(
        '按钮"创建用户"不能添加子权限',
      );
    });
  });

  describe('❌ 手动创建API类型权限（应该失败）', () => {
    it('should reject manually creating API permission', async () => {
      const dto: CreatePermissionDto = {
        name: 'API权限',
        code: 'system:api:test',
        type: 'API' as any,
      };

      await expect(service.create(dto)).rejects.toThrow(
        'API 权限由系统自动生成，不能手动创建',
      );
    });
  });

  describe('❌ 非目录类型作为顶层权限（应该失败）', () => {
    it('should reject creating MENU as root permission', async () => {
      const dto: CreatePermissionDto = {
        name: '顶层菜单',
        code: 'root:menu',
        type: 'MENU' as any,
      };

      await expect(service.create(dto)).rejects.toThrow(
        '顶层权限只能是目录类型',
      );
    });
  });

  describe('❌ 修改权限类型（应该失败）', () => {
    it('should reject changing permission type during update', async () => {
      const existingPermission = {
        id: 1,
        permissionId: mockMenuId,
        name: '用户管理',
        code: 'system:user',
        type: 'MENU',
        action: 'access',
        origin: 'USER',
        parentPermissionId: mockDirectoryId,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdById: null,
        updatedById: null,
      };

      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(existingPermission as any);

      await expect(
        service.update(mockMenuId, {
          type: 'DIRECTORY' as any,
        }),
      ).rejects.toThrow('权限类型创建后不可修改');
    });
  });

  describe('✅ 合法操作（应该成功）', () => {
    it('should allow creating DIRECTORY as root', async () => {
      jest.spyOn(prisma.permission, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prisma.permission, 'create').mockResolvedValueOnce({
        id: 1,
        permissionId: 'new-directory-id',
        name: '新目录',
        code: 'new:directory',
        type: 'DIRECTORY',
        action: 'access',
        origin: 'USER',
        parentPermissionId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdById: null,
        updatedById: null,
      } as any);

      const dto: CreatePermissionDto = {
        name: '新目录',
        code: 'new:directory',
        type: 'DIRECTORY' as any,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.type).toBe('DIRECTORY');
    });

    it('should allow creating MENU under DIRECTORY', async () => {
      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          permissionId: mockDirectoryId,
          name: '系统管理',
          code: 'system',
          type: 'DIRECTORY',
          action: 'access',
          origin: 'SYSTEM',
          parentPermissionId: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdById: null,
          updatedById: null,
        } as any);

      jest.spyOn(prisma.permission, 'create').mockResolvedValueOnce({
        id: 2,
        permissionId: mockMenuId,
        name: '用户管理',
        code: 'system:user',
        type: 'MENU',
        action: 'access',
        origin: 'USER',
        parentPermissionId: mockDirectoryId,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdById: null,
        updatedById: null,
      } as any);

      jest.spyOn(prisma.menuMeta, 'upsert').mockResolvedValueOnce({} as any);

      const dto: CreatePermissionDto = {
        name: '用户管理',
        code: 'system:user',
        type: 'MENU' as any,
        parentPermissionId: mockDirectoryId,
        menuMeta: {
          path: '/system/users',
          icon: 'UserOutlined',
          sort: 1,
        },
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('用户管理');
    });

    it('should allow creating BUTTON under MENU', async () => {
      jest
        .spyOn(prisma.permission, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 2,
          permissionId: mockMenuId,
          name: '用户管理',
          code: 'system:user',
          type: 'MENU',
          action: 'access',
          origin: 'SYSTEM',
          parentPermissionId: mockDirectoryId,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdById: null,
          updatedById: null,
        } as any);

      jest.spyOn(prisma.permission, 'create').mockResolvedValueOnce({
        id: 3,
        permissionId: mockButtonId,
        name: '创建用户',
        code: 'system:user:create',
        type: 'BUTTON',
        action: 'create',
        origin: 'USER',
        parentPermissionId: mockMenuId,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdById: null,
        updatedById: null,
      } as any);

      const dto: CreatePermissionDto = {
        name: '创建用户',
        code: 'system:user:create',
        type: 'BUTTON' as any,
        parentPermissionId: mockMenuId,
        action: 'create' as any,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('创建用户');
    });
  });
});
