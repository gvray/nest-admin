import { PrismaClient } from '@prisma/client';

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('开始创建角色权限关联...');
  
  // 获取所有角色
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });
  
  const userRole = await prisma.role.findUnique({
    where: { name: 'user' },
  });
  
  const managerRole = await prisma.role.findUnique({
    where: { name: 'manager' },
  });

  // 获取所有权限
  const permissions = await prisma.permission.findMany();

  if (!adminRole || !userRole || !managerRole) {
    console.log('角色不存在，跳过角色权限关联创建');
    return;
  }

  // 为管理员角色分配所有权限
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: adminRole.roleId,
        permissionId: permission.permissionId,
      })),
      skipDuplicates: true,
    });
  }

  // 为普通用户角色分配基础权限
  const basicPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: ['user:view', 'resource:view'],
      },
    },
  });

  if (basicPermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: basicPermissions.map((permission) => ({
        roleId: userRole.roleId,
        permissionId: permission.permissionId,
      })),
      skipDuplicates: true,
    });
  }

  // 为部门经理角色分配管理权限
  const managerPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'user:view', 'user:create', 'user:update',
          'department:view', 'department:create', 'department:update',
          'resource:view', 'resource:create', 'resource:update',
        ],
      },
    },
  });

  if (managerPermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: managerPermissions.map((permission) => ({
        roleId: managerRole.roleId,
        permissionId: permission.permissionId,
      })),
      skipDuplicates: true,
    });
  }

  console.log('角色权限关联创建完成');
} 