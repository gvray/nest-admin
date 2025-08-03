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
    update: {},
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
    update: {},
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
    update: {},
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
    update: {},
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
    update: {},
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
    update: {},
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

  // 创建用户管理相关按钮
  const userButtons = [
    {
      name: '用户-新增',
      code: 'user_create',
      description: '创建新用户',
    },
    {
      name: '用户-编辑',
      code: 'user_update',
      description: '编辑用户信息',
    },
    {
      name: '用户-删除',
      code: 'user_delete',
      description: '删除用户',
    },
    {
      name: '用户-重置密码',
      code: 'user_reset_password',
      description: '重置用户密码',
    },
    {
      name: '用户-分配角色',
      code: 'user_assign_role',
      description: '为用户分配角色',
    },
  ];

  for (const button of userButtons) {
    await prisma.resource.upsert({
      where: { code: button.code },
      update: {},
      create: {
        name: button.name,
        code: button.code,
        type: 'BUTTON' as ResourceType,
        parentId: userManagement.resourceId,
        description: button.description,
      },
    });
  }

  // 创建用户管理相关API
  const userApis = [
    {
      name: '用户API-列表',
      code: 'user_list_api',
      path: '/api/users',
      method: 'GET',
    },
    {
      name: '用户API-详情',
      code: 'user_detail_api',
      path: '/api/users/:id',
      method: 'GET',
    },
    {
      name: '用户API-创建',
      code: 'user_create_api',
      path: '/api/users',
      method: 'POST',
    },
    {
      name: '用户API-更新',
      code: 'user_update_api',
      path: '/api/users/:id',
      method: 'PATCH',
    },
    {
      name: '用户API-删除',
      code: 'user_delete_api',
      path: '/api/users/:id',
      method: 'DELETE',
    },
  ];

  for (const api of userApis) {
    await prisma.resource.upsert({
      where: { code: api.code },
      update: {},
      create: {
        name: api.name,
        code: api.code,
        type: 'API' as ResourceType,
        path: api.path,
        method: api.method,
        parentId: userManagement.resourceId,
      },
    });
  }

  // 创建角色管理相关按钮
  const roleButtons = [
    {
      name: '角色-新增',
      code: 'role_create',
      description: '创建新角色',
    },
    {
      name: '角色-编辑',
      code: 'role_update',
      description: '编辑角色信息',
    },
    {
      name: '角色-删除',
      code: 'role_delete',
      description: '删除角色',
    },
    {
      name: '角色-分配权限',
      code: 'role_assign_permission',
      description: '为角色分配权限',
    },
  ];

  for (const button of roleButtons) {
    await prisma.resource.upsert({
      where: { code: button.code },
      update: {},
      create: {
        name: button.name,
        code: button.code,
        type: 'BUTTON' as ResourceType,
        parentId: roleManagement.resourceId,
        description: button.description,
      },
    });
  }

  // 创建角色管理相关API
  const roleApis = [
    {
      name: '角色API-列表',
      code: 'role_list_api',
      path: '/api/roles',
      method: 'GET',
    },
    {
      name: '角色API-详情',
      code: 'role_detail_api',
      path: '/api/roles/:id',
      method: 'GET',
    },
    {
      name: '角色API-创建',
      code: 'role_create_api',
      path: '/api/roles',
      method: 'POST',
    },
    {
      name: '角色API-更新',
      code: 'role_update_api',
      path: '/api/roles/:id',
      method: 'PATCH',
    },
    {
      name: '角色API-删除',
      code: 'role_delete_api',
      path: '/api/roles/:id',
      method: 'DELETE',
    },
  ];

  for (const api of roleApis) {
    await prisma.resource.upsert({
      where: { code: api.code },
      update: {},
      create: {
        name: api.name,
        code: api.code,
        type: 'API' as ResourceType,
        path: api.path,
        method: api.method,
        parentId: roleManagement.resourceId,
      },
    });
  }

  // 创建权限管理相关按钮
  const permissionButtons = [
    {
      name: '权限-新增',
      code: 'permission_create',
      description: '创建新权限',
    },
    {
      name: '权限-编辑',
      code: 'permission_update',
      description: '编辑权限信息',
    },
    {
      name: '权限-删除',
      code: 'permission_delete',
      description: '删除权限',
    },
  ];

  for (const button of permissionButtons) {
    await prisma.resource.upsert({
      where: { code: button.code },
      update: {},
      create: {
        name: button.name,
        code: button.code,
        type: 'BUTTON' as ResourceType,
        parentId: permissionManagement.resourceId,
        description: button.description,
      },
    });
  }

  // 创建部门管理相关按钮
  const departmentButtons = [
    {
      name: '部门-新增',
      code: 'department_create',
      description: '创建新部门',
    },
    {
      name: '部门-编辑',
      code: 'department_update',
      description: '编辑部门信息',
    },
    {
      name: '部门-删除',
      code: 'department_delete',
      description: '删除部门',
    },
  ];

  for (const button of departmentButtons) {
    await prisma.resource.upsert({
      where: { code: button.code },
      update: {},
      create: {
        name: button.name,
        code: button.code,
        type: 'BUTTON' as ResourceType,
        parentId: departmentManagement.resourceId,
        description: button.description,
      },
    });
  }

  // 创建岗位管理相关按钮
  const positionButtons = [
    {
      name: '岗位-新增',
      code: 'position_create',
      description: '创建新岗位',
    },
    {
      name: '岗位-编辑',
      code: 'position_update',
      description: '编辑岗位信息',
    },
    {
      name: '岗位-删除',
      code: 'position_delete',
      description: '删除岗位',
    },
  ];

  for (const button of positionButtons) {
    await prisma.resource.upsert({
      where: { code: button.code },
      update: {},
      create: {
        name: button.name,
        code: button.code,
        type: 'BUTTON' as ResourceType,
        parentId: positionManagement.resourceId,
        description: button.description,
      },
    });
  }

  console.log('资源数据创建完成');
}
