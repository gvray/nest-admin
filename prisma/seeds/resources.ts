import { PrismaClient } from '@prisma/client';
import type { ResourceType } from '@prisma/client';

export async function seedResources(prisma: PrismaClient) {
  console.log('开始创建资源数据...');

  // 创建系统管理目录
  const systemManagement = await prisma.resource.upsert({
    where: {
      code: 'system',
    },
    update: {},
    create: {
      name: '系统管理',
      code: 'system',
      type: 'DIRECTORY' as ResourceType,
      path: '/system',
      icon: 'system',
      sort: 1,
    },
  });

  // 创建用户管理菜单
  const userManagement = await prisma.resource.upsert({
    where: {
      code: 'user',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '用户管理',
      code: 'user',
      type: 'MENU' as ResourceType,
      path: '/system/user',
      icon: 'user',
      parentId: systemManagement.resourceId,
      sort: 1,
    },
  });

  // 创建资源管理菜单
  const resourceManagement = await prisma.resource.upsert({
    where: {
      code: 'resource',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '资源管理',
      code: 'resource',
      type: 'MENU' as ResourceType,
      path: '/system/resource',
      icon: 'resource',
      parentId: systemManagement.resourceId,
      sort: 2,
    },
  });

  // 创建角色管理菜单
  const roleManagement = await prisma.resource.upsert({
    where: {
      code: 'role',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '角色管理',
      code: 'role',
      type: 'MENU' as ResourceType,
      path: '/system/role',
      icon: 'role',
      parentId: systemManagement.resourceId,
      sort: 3,
    },
  });

  // 创建权限管理菜单
  const permissionManagement = await prisma.resource.upsert({
    where: {
      code: 'permission',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '权限管理',
      code: 'permission',
      type: 'MENU' as ResourceType,
      path: '/system/permission',
      icon: 'permission',
      parentId: systemManagement.resourceId,
      sort: 4,
    },
  });

  // 创建部门管理菜单
  const departmentManagement = await prisma.resource.upsert({
    where: {
      code: 'department',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '部门管理',
      code: 'department',
      type: 'MENU' as ResourceType,
      path: '/system/department',
      icon: 'department',
      parentId: systemManagement.resourceId,
      sort: 5,
    },
  });

  // 创建岗位管理菜单
  const positionManagement = await prisma.resource.upsert({
    where: {
      code: 'position',
    },
    update: {
      parentId: systemManagement.resourceId,
    },
    create: {
      name: '岗位管理',
      code: 'position',
      type: 'MENU' as ResourceType,
      path: '/system/position',
      icon: 'position',
      parentId: systemManagement.resourceId,
      sort: 6,
    },
  });





  console.log('资源数据创建完成');
}
