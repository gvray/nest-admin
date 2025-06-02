import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPermissions() {
  const permissions = [
    {
      name: '用户管理',
      code: 'user:manage',
      description: '用户的增删改查权限',
    },
    {
      name: '角色管理',
      code: 'role:manage',
      description: '角色的增删改查权限',
    },
    {
      name: '权限管理',
      code: 'permission:manage',
      description: '权限的增删改查权限',
    },
    {
      name: '查看用户',
      code: 'user:read',
      description: '查看用户信息的权限',
    },
    {
      name: '创建用户',
      code: 'user:create',
      description: '创建用户的权限',
    },
    {
      name: '更新用户',
      code: 'user:update',
      description: '更新用户信息的权限',
    },
    {
      name: '删除用户',
      code: 'user:delete',
      description: '删除用户的权限',
    },
    {
      name: '查看角色',
      code: 'role:read',
      description: '查看角色信息的权限',
    },
    {
      name: '创建角色',
      code: 'role:create',
      description: '创建角色的权限',
    },
    {
      name: '更新角色',
      code: 'role:update',
      description: '更新角色信息的权限',
    },
    {
      name: '删除角色',
      code: 'role:delete',
      description: '删除角色的权限',
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  console.log('权限数据初始化完成');
} 