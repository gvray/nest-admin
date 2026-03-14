import { PrismaClient, Role } from '@prisma/client';

/**
 * 为游客角色分配权限
 * - 所有菜单权限（MENU 和 DIRECTORY 类型）
 * - 所有按钮权限（BUTTON 类型）
 * - 仅查看类 API 权限（action 为 'view' 或 'access' 的 API 类型）
 */
export async function seedGuestPermissions(
  prisma: PrismaClient,
  guestRole: Role,
) {
  console.log('开始为游客角色分配权限...');

  // 1. 获取所有菜单和目录权限（MENU 和 DIRECTORY 类型）
  const menuPermissions = await prisma.permission.findMany({
    where: {
      type: {
        in: ['MENU', 'DIRECTORY'],
      },
      deletedAt: null,
    },
    select: {
      permissionId: true,
      name: true,
      type: true,
    },
  });

  console.log(`找到 ${menuPermissions.length} 个菜单/目录权限`);

  // 2. 获取所有按钮权限（BUTTON 类型）
  const buttonPermissions = await prisma.permission.findMany({
    where: {
      type: 'BUTTON',
      deletedAt: null,
    },
    select: {
      permissionId: true,
      name: true,
      type: true,
    },
  });

  console.log(`找到 ${buttonPermissions.length} 个按钮权限`);

  // 3. 获取所有查看类 API 权限（action 为 'GET'，即查询类接口）
  const viewApiPermissions = await prisma.permission.findMany({
    where: {
      type: 'API',
      action: 'GET',
      deletedAt: null,
    },
    select: {
      permissionId: true,
      name: true,
      action: true,
    },
  });

  console.log(`找到 ${viewApiPermissions.length} 个查看类 API 权限（GET 方法）`);

  // 4. 合并所有权限
  const allPermissions = [
    ...menuPermissions,
    ...buttonPermissions,
    ...viewApiPermissions,
  ];

  console.log(`总共为游客角色分配 ${allPermissions.length} 个权限`);

  // 5. 批量创建角色-权限关联
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: guestRole.roleId,
          permissionId: permission.permissionId,
        },
      },
      update: {},
      create: {
        roleId: guestRole.roleId,
        permissionId: permission.permissionId,
      },
    });
  }

  console.log('✅ 游客角色权限分配完成');
  console.log('📋 权限统计:');
  console.log(`   - 菜单/目录权限: ${menuPermissions.length} 个`);
  console.log(`   - 按钮权限: ${buttonPermissions.length} 个`);
  console.log(`   - 查看类 API 权限: ${viewApiPermissions.length} 个`);
  console.log(`   - 总计: ${allPermissions.length} 个`);
  console.log('');
  console.log('🔒 权限说明:');
  console.log('   - 游客可以访问所有菜单和查看所有按钮');
  console.log('   - 游客只能执行查看类 API 操作（view/access）');
  console.log('   - 游客无法执行创建、修改、删除、导入、导出等操作');
}
