import { PrismaClient } from '@prisma/client';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('🔗 开始创建角色权限关联...');

  // 超级角色不需要显式分配权限，将在拦截器中直接通过

  // 获取管理员角色
  const adminRole = await prisma.role.findUnique({
    where: { roleKey: 'admin' },
  });

  if (!adminRole) {
    throw new Error('管理员角色不存在');
  }

  // 获取所有权限
  const permissions = await prisma.permission.findMany();

  // 超级角色不需要显式分配权限，将在拦截器中直接通过
  console.log(`✅ 超级角色 (${SUPER_ROLE_KEY}) 将在拦截器中直接通过权限检查`);

  // 为管理员角色分配所有权限
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.roleId,
          permissionId: permission.permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.roleId,
        permissionId: permission.permissionId,
      },
    });
  }

  console.log(`✅ 为管理员角色分配了 ${permissions.length} 个权限`);
  console.log('✅ 角色权限关联创建完成');
}
