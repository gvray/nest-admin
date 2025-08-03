import { PrismaClient } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  // 获取已创建的资源
  const systemResource = await prisma.resource.findFirst({
    where: { code: 'system' },
  });
  const userResource = await prisma.resource.findFirst({
    where: { code: 'user' },
  });
  const roleResource = await prisma.resource.findFirst({
    where: { code: 'role' },
  });
  const permissionResource = await prisma.resource.findFirst({
    where: { code: 'permission' },
  });
  const resourceResource = await prisma.resource.findFirst({
    where: { code: 'resource' },
  });
  const departmentResource = await prisma.resource.findFirst({
    where: { code: 'department' },
  });
  const positionResource = await prisma.resource.findFirst({
    where: { code: 'position' },
  });

  if (
    !systemResource ||
    !userResource ||
    !roleResource ||
    !permissionResource ||
    !resourceResource ||
    !departmentResource ||
    !positionResource
  ) {
    console.error('找不到资源：', {
      systemResource,
      userResource,
      roleResource,
      permissionResource,
      resourceResource,
      departmentResource,
      positionResource,
    });
    throw new Error('资源未找到，请先运行资源种子数据');
  }

  // 定义操作类型
  const actions = [
    { action: 'view', name: '查看' },
    { action: 'create', name: '创建' },
    { action: 'update', name: '更新' },
    { action: 'delete', name: '删除' },
    { action: 'export', name: '导出' },
    { action: 'import', name: '导入' },
  ];

  // 为每个资源创建权限
  const resources = [
    { resource: userResource, name: '用户' },
    { resource: roleResource, name: '角色' },
    { resource: permissionResource, name: '权限' },
    { resource: resourceResource, name: '资源' },
    { resource: departmentResource, name: '部门' },
    { resource: positionResource, name: '岗位' },
  ];

  for (const { resource, name } of resources) {
    for (const { action, name: actionName } of actions) {
      const permission = await prisma.permission.upsert({
        where: {
          code: `${resource.code}:${action}`,
        },
        update: {},
        create: {
          name: `${resource.name}${actionName}`,
          code: `${resource.code}:${action}`,
          action,
          resourceId: resource.id,
          description: `${resource.name}的${actionName}权限`,
        },
      });
    }
  }

  console.log('权限初始化完成');
}
