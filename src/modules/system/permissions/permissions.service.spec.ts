import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PermissionsService - Scan Managed Permissions', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  const mockPermission = {
    id: 1,
    permissionId: 'permission-id',
    name: '用户管理',
    code: 'system:user',
    type: 'MENU',
    action: 'access',
    origin: 'SYSTEM',
    parentPermissionId: 'root-id',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdById: null,
    updatedById: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              findUnique: jest.fn(),
              update: jest.fn(),
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

  it('rejects manual permission creation', async () => {
    await expect(
      service.create({
        name: '手动权限',
        code: 'system:manual',
        type: 'MENU' as any,
      }),
    ).rejects.toThrow('权限必须由扫描同步生成，不允许手动创建');
  });

  it('rejects permission code changes', async () => {
    jest
      .spyOn(prisma.permission, 'findUnique')
      .mockResolvedValueOnce(mockPermission as any);

    await expect(
      service.update('permission-id', {
        code: 'system:user:new',
      }),
    ).rejects.toThrow('权限代码不可修改');
  });

  it('rejects updates for non-scan permissions', async () => {
    jest.spyOn(prisma.permission, 'findUnique').mockResolvedValueOnce({
      ...mockPermission,
      origin: 'USER',
    } as any);

    await expect(
      service.update('permission-id', {
        name: '新名称',
      }),
    ).rejects.toThrow('权限必须由扫描同步生成，不允许手动修改');
  });

  it('allows updating metadata for scan-managed menu permissions', async () => {
    jest
      .spyOn(prisma.permission, 'findUnique')
      .mockResolvedValueOnce(mockPermission as any);
    jest.spyOn(prisma.permission, 'update').mockResolvedValueOnce({
      ...mockPermission,
      name: '用户管理菜单',
    } as any);
    jest.spyOn(prisma.menuMeta, 'upsert').mockResolvedValueOnce({} as any);

    const result = await service.update(
      'permission-id',
      {
        name: '用户管理菜单',
        menuMeta: {
          path: '/system/users',
          icon: 'UserOutlined',
          sort: 1,
        },
      },
      'operator-id',
    );

    expect(result).toBeDefined();
    expect(prisma.permission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '用户管理菜单',
          updatedById: 'operator-id',
        }),
      }),
    );
  });
});
