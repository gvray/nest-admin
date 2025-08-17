import { PrismaClient } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 开始创建权限数据...');

  const permissions = [
    // 用户管理权限
    {
      name: '用户管理查看',
      code: 'user:view',
      action: 'view',
      resourceId: null, // 将在创建时设置
      description: '查看用户列表和详情',
    },
    {
      name: '用户管理创建',
      code: 'user:create',
      action: 'create',
      resourceId: null,
      description: '创建新用户',
    },
    {
      name: '用户管理更新',
      code: 'user:update',
      action: 'update',
      resourceId: null,
      description: '更新用户信息',
    },
    {
      name: '用户管理删除',
      code: 'user:delete',
      action: 'delete',
      resourceId: null,
      description: '删除用户',
    },
    {
      name: '用户管理',
      code: 'user:manage',
      action: 'manage',
      resourceId: null,
      description: '用户角色分配等管理操作',
    },
    {
      name: '用户管理导入',
      code: 'user:import',
      action: 'import',
      resourceId: null,
      description: '导入用户数据',
    },
    {
      name: '用户管理导出',
      code: 'user:export',
      action: 'export',
      resourceId: null,
      description: '导出用户数据',
    },

    // 角色管理权限
    {
      name: '角色管理查看',
      code: 'role:view',
      action: 'view',
      resourceId: null,
      description: '查看角色列表和详情',
    },
    {
      name: '角色管理创建',
      code: 'role:create',
      action: 'create',
      resourceId: null,
      description: '创建新角色',
    },
    {
      name: '角色管理更新',
      code: 'role:update',
      action: 'update',
      resourceId: null,
      description: '更新角色信息',
    },
    {
      name: '角色管理删除',
      code: 'role:delete',
      action: 'delete',
      resourceId: null,
      description: '删除角色',
    },
    {
      name: '角色管理导入',
      code: 'role:import',
      action: 'import',
      resourceId: null,
      description: '导入角色数据',
    },
    {
      name: '角色管理导出',
      code: 'role:export',
      action: 'export',
      resourceId: null,
      description: '导出角色数据',
    },

    // 权限管理权限
    {
      name: '权限管理查看',
      code: 'permission:view',
      action: 'view',
      resourceId: null,
      description: '查看权限列表和详情',
    },
    {
      name: '权限管理创建',
      code: 'permission:create',
      action: 'create',
      resourceId: null,
      description: '创建新权限',
    },
    {
      name: '权限管理更新',
      code: 'permission:update',
      action: 'update',
      resourceId: null,
      description: '更新权限信息',
    },
    {
      name: '权限管理删除',
      code: 'permission:delete',
      action: 'delete',
      resourceId: null,
      description: '删除权限',
    },
    {
      name: '权限管理导入',
      code: 'permission:import',
      action: 'import',
      resourceId: null,
      description: '导入权限数据',
    },
    {
      name: '权限管理导出',
      code: 'permission:export',
      action: 'export',
      resourceId: null,
      description: '导出权限数据',
    },

    // 资源管理权限
    {
      name: '资源管理查看',
      code: 'resource:view',
      action: 'view',
      resourceId: null,
      description: '查看资源列表和详情',
    },
    {
      name: '资源管理创建',
      code: 'resource:create',
      action: 'create',
      resourceId: null,
      description: '创建新资源',
    },
    {
      name: '资源管理更新',
      code: 'resource:update',
      action: 'update',
      resourceId: null,
      description: '更新资源信息',
    },
    {
      name: '资源管理删除',
      code: 'resource:delete',
      action: 'delete',
      resourceId: null,
      description: '删除资源',
    },
    {
      name: '资源管理导入',
      code: 'resource:import',
      action: 'import',
      resourceId: null,
      description: '导入资源数据',
    },
    {
      name: '资源管理导出',
      code: 'resource:export',
      action: 'export',
      resourceId: null,
      description: '导出资源数据',
    },

    // 部门管理权限
    {
      name: '部门管理查看',
      code: 'department:view',
      action: 'view',
      resourceId: null,
      description: '查看部门列表和详情',
    },
    {
      name: '部门管理创建',
      code: 'department:create',
      action: 'create',
      resourceId: null,
      description: '创建新部门',
    },
    {
      name: '部门管理更新',
      code: 'department:update',
      action: 'update',
      resourceId: null,
      description: '更新部门信息',
    },
    {
      name: '部门管理删除',
      code: 'department:delete',
      action: 'delete',
      resourceId: null,
      description: '删除部门',
    },
    {
      name: '部门管理导入',
      code: 'department:import',
      action: 'import',
      resourceId: null,
      description: '导入部门数据',
    },
    {
      name: '部门管理导出',
      code: 'department:export',
      action: 'export',
      resourceId: null,
      description: '导出部门数据',
    },

    // 岗位管理权限
    {
      name: '岗位管理查看',
      code: 'position:view',
      action: 'view',
      resourceId: null,
      description: '查看岗位列表和详情',
    },
    {
      name: '岗位管理创建',
      code: 'position:create',
      action: 'create',
      resourceId: null,
      description: '创建新岗位',
    },
    {
      name: '岗位管理更新',
      code: 'position:update',
      action: 'update',
      resourceId: null,
      description: '更新岗位信息',
    },
    {
      name: '岗位管理删除',
      code: 'position:delete',
      action: 'delete',
      resourceId: null,
      description: '删除岗位',
    },
    {
      name: '岗位管理导入',
      code: 'position:import',
      action: 'import',
      resourceId: null,
      description: '导入岗位数据',
    },
    {
      name: '岗位管理导出',
      code: 'position:export',
      action: 'export',
      resourceId: null,
      description: '导出岗位数据',
    },

    // 字典管理权限
    {
      name: '字典管理查看',
      code: 'dictionary:view',
      action: 'view',
      resourceId: null,
      description: '查看字典列表和详情',
    },
    {
      name: '字典管理创建',
      code: 'dictionary:create',
      action: 'create',
      resourceId: null,
      description: '创建新字典',
    },
    {
      name: '字典管理更新',
      code: 'dictionary:update',
      action: 'update',
      resourceId: null,
      description: '更新字典信息',
    },
    {
      name: '字典管理删除',
      code: 'dictionary:delete',
      action: 'delete',
      resourceId: null,
      description: '删除字典',
    },
    {
      name: '字典管理导入',
      code: 'dictionary:import',
      action: 'import',
      resourceId: null,
      description: '导入字典数据',
    },
    {
      name: '字典管理导出',
      code: 'dictionary:export',
      action: 'export',
      resourceId: null,
      description: '导出字典数据',
    },

    // 配置管理权限
    {
      name: '配置管理查看',
      code: 'config:view',
      action: 'view',
      resourceId: null,
      description: '查看配置列表和详情',
    },
    {
      name: '配置管理创建',
      code: 'config:create',
      action: 'create',
      resourceId: null,
      description: '创建新配置',
    },
    {
      name: '配置管理更新',
      code: 'config:update',
      action: 'update',
      resourceId: null,
      description: '更新配置信息',
    },
    {
      name: '配置管理删除',
      code: 'config:delete',
      action: 'delete',
      resourceId: null,
      description: '删除配置',
    },
    {
      name: '配置管理导入',
      code: 'config:import',
      action: 'import',
      resourceId: null,
      description: '导入配置数据',
    },
    {
      name: '配置管理导出',
      code: 'config:export',
      action: 'export',
      resourceId: null,
      description: '导出配置数据',
    },
  ];

  // 获取资源ID映射
  const resources = await prisma.resource.findMany();
  const resourceMap = {};
  resources.forEach(resource => {
    resourceMap[resource.code] = resource.resourceId;
  });

  // 创建权限
  for (const permissionData of permissions) {
    const resourceCode = permissionData.code.split(':')[0];
    const resourceId = resourceMap[resourceCode];

    await prisma.permission.upsert({
      where: { code: permissionData.code },
      update: {},
      create: {
        ...permissionData,
        resourceId,
      },
    });
    console.log(`✅ 创建权限: ${permissionData.name}`);
  }

  console.log('✅ 权限数据创建完成');
}
