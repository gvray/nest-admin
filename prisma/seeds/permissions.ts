import { PrismaClient } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 开始创建权限数据...');

  const permissions = [
    // 用户管理权限
    {
      name: '用户管理查看',
      code: 'system:user:view',
      action: 'view',
      resourceId: null, // 将在创建时设置
      description: '查看用户列表和详情',
    },
    {
      name: '用户管理创建',
      code: 'system:user:create',
      action: 'create',
      resourceId: null,
      description: '创建新用户',
    },
    {
      name: '用户管理更新',
      code: 'system:user:update',
      action: 'update',
      resourceId: null,
      description: '更新用户信息',
    },
    {
      name: '用户管理删除',
      code: 'system:user:delete',
      action: 'delete',
      resourceId: null,
      description: '删除用户',
    },
    {
      name: '用户管理',
      code: 'system:user:manage',
      action: 'manage',
      resourceId: null,
      description: '用户角色分配等管理操作',
    },
    {
      name: '用户管理导入',
      code: 'system:user:import',
      action: 'import',
      resourceId: null,
      description: '导入用户数据',
    },
    {
      name: '用户管理导出',
      code: 'system:user:export',
      action: 'export',
      resourceId: null,
      description: '导出用户数据',
    },

    // 角色管理权限
    {
      name: '角色管理查看',
      code: 'system:role:view',
      action: 'view',
      resourceId: null,
      description: '查看角色列表和详情',
    },
    {
      name: '角色管理创建',
      code: 'system:role:create',
      action: 'create',
      resourceId: null,
      description: '创建新角色',
    },
    {
      name: '角色管理更新',
      code: 'system:role:update',
      action: 'update',
      resourceId: null,
      description: '更新角色信息',
    },
    {
      name: '角色管理删除',
      code: 'system:role:delete',
      action: 'delete',
      resourceId: null,
      description: '删除角色',
    },
    {
      name: '角色管理导入',
      code: 'system:role:import',
      action: 'import',
      resourceId: null,
      description: '导入角色数据',
    },
    {
      name: '角色管理导出',
      code: 'system:role:export',
      action: 'export',
      resourceId: null,
      description: '导出角色数据',
    },

    // 权限管理权限
    {
      name: '权限管理查看',
      code: 'system:permission:view',
      action: 'view',
      resourceId: null,
      description: '查看权限列表和详情',
    },
    {
      name: '权限管理创建',
      code: 'system:permission:create',
      action: 'create',
      resourceId: null,
      description: '创建新权限',
    },
    {
      name: '权限管理更新',
      code: 'system:permission:update',
      action: 'update',
      resourceId: null,
      description: '更新权限信息',
    },
    {
      name: '权限管理删除',
      code: 'system:permission:delete',
      action: 'delete',
      resourceId: null,
      description: '删除权限',
    },
    {
      name: '权限管理导入',
      code: 'system:permission:import',
      action: 'import',
      resourceId: null,
      description: '导入权限数据',
    },
    {
      name: '权限管理导出',
      code: 'system:permission:export',
      action: 'export',
      resourceId: null,
      description: '导出权限数据',
    },

    // 资源管理权限
    {
      name: '资源管理查看',
      code: 'system:resource:view',
      action: 'view',
      resourceId: null,
      description: '查看资源列表和详情',
    },
    {
      name: '资源管理创建',
      code: 'system:resource:create',
      action: 'create',
      resourceId: null,
      description: '创建新资源',
    },
    {
      name: '资源管理更新',
      code: 'system:resource:update',
      action: 'update',
      resourceId: null,
      description: '更新资源信息',
    },
    {
      name: '资源管理删除',
      code: 'system:resource:delete',
      action: 'delete',
      resourceId: null,
      description: '删除资源',
    },
    {
      name: '资源管理导入',
      code: 'system:resource:import',
      action: 'import',
      resourceId: null,
      description: '导入资源数据',
    },
    {
      name: '资源管理导出',
      code: 'system:resource:export',
      action: 'export',
      resourceId: null,
      description: '导出资源数据',
    },

    // 部门管理权限
    {
      name: '部门管理查看',
      code: 'system:department:view',
      action: 'view',
      resourceId: null,
      description: '查看部门列表和详情',
    },
    {
      name: '部门管理创建',
      code: 'system:department:create',
      action: 'create',
      resourceId: null,
      description: '创建新部门',
    },
    {
      name: '部门管理更新',
      code: 'system:department:update',
      action: 'update',
      resourceId: null,
      description: '更新部门信息',
    },
    {
      name: '部门管理删除',
      code: 'system:department:delete',
      action: 'delete',
      resourceId: null,
      description: '删除部门',
    },
    {
      name: '部门管理导入',
      code: 'system:department:import',
      action: 'import',
      resourceId: null,
      description: '导入部门数据',
    },
    {
      name: '部门管理导出',
      code: 'system:department:export',
      action: 'export',
      resourceId: null,
      description: '导出部门数据',
    },

    // 岗位管理权限
    {
      name: '岗位管理查看',
      code: 'system:position:view',
      action: 'view',
      resourceId: null,
      description: '查看岗位列表和详情',
    },
    {
      name: '岗位管理创建',
      code: 'system:position:create',
      action: 'create',
      resourceId: null,
      description: '创建新岗位',
    },
    {
      name: '岗位管理更新',
      code: 'system:position:update',
      action: 'update',
      resourceId: null,
      description: '更新岗位信息',
    },
    {
      name: '岗位管理删除',
      code: 'system:position:delete',
      action: 'delete',
      resourceId: null,
      description: '删除岗位',
    },
    {
      name: '岗位管理导入',
      code: 'system:position:import',
      action: 'import',
      resourceId: null,
      description: '导入岗位数据',
    },
    {
      name: '岗位管理导出',
      code: 'system:position:export',
      action: 'export',
      resourceId: null,
      description: '导出岗位数据',
    },

    // 字典管理权限
    {
      name: '字典管理查看',
      code: 'system:dictionary:view',
      action: 'view',
      resourceId: null,
      description: '查看字典列表和详情',
    },
    {
      name: '字典管理创建',
      code: 'system:dictionary:create',
      action: 'create',
      resourceId: null,
      description: '创建新字典',
    },
    {
      name: '字典管理更新',
      code: 'system:dictionary:update',
      action: 'update',
      resourceId: null,
      description: '更新字典信息',
    },
    {
      name: '字典管理删除',
      code: 'system:dictionary:delete',
      action: 'delete',
      resourceId: null,
      description: '删除字典',
    },
    {
      name: '字典管理导入',
      code: 'system:dictionary:import',
      action: 'import',
      resourceId: null,
      description: '导入字典数据',
    },
    {
      name: '字典管理导出',
      code: 'system:dictionary:export',
      action: 'export',
      resourceId: null,
      description: '导出字典数据',
    },

    // 配置管理权限
    {
      name: '配置管理查看',
      code: 'system:config:view',
      action: 'view',
      resourceId: null,
      description: '查看配置列表和详情',
    },
    {
      name: '配置管理创建',
      code: 'system:config:create',
      action: 'create',
      resourceId: null,
      description: '创建新配置',
    },
    {
      name: '配置管理更新',
      code: 'system:config:update',
      action: 'update',
      resourceId: null,
      description: '更新配置信息',
    },
    {
      name: '配置管理删除',
      code: 'system:config:delete',
      action: 'delete',
      resourceId: null,
      description: '删除配置',
    },
    {
      name: '配置管理导入',
      code: 'system:config:import',
      action: 'import',
      resourceId: null,
      description: '导入配置数据',
    },
    {
      name: '配置管理导出',
      code: 'system:config:export',
      action: 'export',
      resourceId: null,
      description: '导出配置数据',
    },
  ];

  // 获取资源ID映射
  const resources = await prisma.resource.findMany();
  const resourceMap = {};
  resources.forEach((resource) => {
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
