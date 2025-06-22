import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPermissions() {
  const permissions = [
    // 用户管理权限
    {
      name: '用户管理',
      code: 'user:manage',
      description: '用户的增删改查权限',
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
    // 角色管理权限
    {
      name: '角色管理',
      code: 'role:manage',
      description: '角色的增删改查权限',
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
    // 权限管理权限
    {
      name: '权限管理',
      code: 'permission:manage',
      description: '权限的增删改查权限',
    },
    {
      name: '查看权限',
      code: 'permission:read',
      description: '查看权限信息的权限',
    },
    {
      name: '创建权限',
      code: 'permission:create',
      description: '创建权限的权限',
    },
    {
      name: '更新权限',
      code: 'permission:update',
      description: '更新权限信息的权限',
    },
    {
      name: '删除权限',
      code: 'permission:delete',
      description: '删除权限的权限',
    },
    // 部门管理权限
    {
      name: '部门管理',
      code: 'department:manage',
      description: '部门的增删改查权限',
    },
    {
      name: '查看部门',
      code: 'department:read',
      description: '查看部门信息的权限',
    },
    {
      name: '创建部门',
      code: 'department:create',
      description: '创建部门的权限',
    },
    {
      name: '更新部门',
      code: 'department:update',
      description: '更新部门信息的权限',
    },
    {
      name: '删除部门',
      code: 'department:delete',
      description: '删除部门的权限',
    },
    // 岗位管理权限
    {
      name: '岗位管理',
      code: 'position:manage',
      description: '岗位的增删改查权限',
    },
    {
      name: '查看岗位',
      code: 'position:read',
      description: '查看岗位信息的权限',
    },
    {
      name: '创建岗位',
      code: 'position:create',
      description: '创建岗位的权限',
    },
    {
      name: '更新岗位',
      code: 'position:update',
      description: '更新岗位信息的权限',
    },
    {
      name: '删除岗位',
      code: 'position:delete',
      description: '删除岗位的权限',
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