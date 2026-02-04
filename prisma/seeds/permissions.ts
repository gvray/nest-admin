import { PrismaClient, PermissionType } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 开始创建权限数据...');

  const menuDefs = [
    {
      type: 'DIRECTORY',
      name: '系统管理',
      code: 'system',
      path: '/system',
      icon: 'SettingOutlined',
      sort: 0,
      status: 1,
      description: '系统管理目录',
    },
    {
      type: 'MENU',
      name: '用户管理',
      code: 'user',
      path: '/system/user',
      icon: 'UserOutlined',
      sort: 1,
      status: 1,
      description: '用户管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '角色管理',
      code: 'role',
      path: '/system/role',
      icon: 'TeamOutlined',
      sort: 2,
      status: 1,
      description: '角色管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '权限管理',
      code: 'permission',
      path: '/system/permission',
      icon: 'SafetyCertificateOutlined',
      sort: 3,
      status: 1,
      description: '权限管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '资源管理',
      code: 'resource',
      path: '/system/resource',
      icon: 'AppstoreOutlined',
      sort: 4,
      status: 1,
      description: '资源管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '部门管理',
      code: 'department',
      path: '/system/department',
      icon: 'ApartmentOutlined',
      sort: 5,
      status: 1,
      description: '部门管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '岗位管理',
      code: 'position',
      path: '/system/position',
      icon: 'IdcardOutlined',
      sort: 6,
      status: 1,
      description: '岗位管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '字典管理',
      code: 'dictionary',
      path: '/system/dictionary',
      icon: 'BookOutlined',
      sort: 7,
      status: 1,
      description: '字典管理菜单',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '配置管理',
      code: 'config',
      path: '/system/config',
      icon: 'ToolOutlined',
      sort: 8,
      status: 1,
      description: '配置管理菜单',
      parentCode: 'system',
    },
    {
      type: 'DIRECTORY',
      name: '日志管理',
      code: 'log',
      path: '/system/log',
      icon: 'FileTextOutlined',
      sort: 9,
      status: 1,
      description: '日志管理目录',
      parentCode: 'system',
    },
    {
      type: 'MENU',
      name: '操作日志',
      code: 'operation-log',
      path: '/system/log/operation',
      icon: 'AuditOutlined',
      sort: 1,
      status: 1,
      description: '操作日志菜单',
      parentCode: 'log',
    },
    {
      type: 'MENU',
      name: '登录日志',
      code: 'login-log',
      path: '/system/log/login',
      icon: 'LoginOutlined',
      sort: 2,
      status: 1,
      description: '登录日志菜单',
      parentCode: 'log',
    },
  ];

  const menuMap: Record<string, string> = {};
  for (const r of menuDefs) {
    const code = `menu:${r.code}`;
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        name: `${r.name}菜单`,
        code,
        type: PermissionType.MENU,
        action: 'access',
        description: r.description,
      },
    });
    menuMap[r.code] = perm.permissionId;
    await prisma.menuMeta.upsert({
      where: { permissionId: perm.permissionId },
      update: {
        path: r.path ?? undefined,
        icon: r.icon ?? undefined,
        hidden: false,
        component: r.code,
        sort: r.sort ?? 0,
      },
      create: {
        permissionId: perm.permissionId,
        path: r.path ?? undefined,
        icon: r.icon ?? undefined,
        hidden: false,
        component: r.code,
        sort: r.sort ?? 0,
      },
    });
  }
  // 设置菜单层级
  for (const r of menuDefs) {
    const permId = menuMap[r.code];
    const parentPermId = r.parentCode ? menuMap[r.parentCode] : null;
    await prisma.permission.update({
      where: { permissionId: permId },
      data: { parentPermissionId: parentPermId ?? undefined },
    });
  }

  // 创建 API 权限（每个菜单一个 API 入口）
  for (const r of menuDefs) {
    if (r.type !== 'MENU') continue;
    const apiCode = `api:${r.code}`;
    const parentPermissionId = menuMap[r.code];
    await prisma.permission.upsert({
      where: { code: apiCode },
      update: {},
      create: {
        name: `${r.name}API`,
        code: apiCode,
        type: PermissionType.API,
        action: 'access',
        description: `${r.name}接口`,
        parentPermissionId,
      },
    });
  }

  const permissions = [
    // 用户管理权限
    {
      name: '用户管理查看',
      code: 'system:user:view',
      action: 'view',
      parentMenuCode: 'user',
      description: '查看用户列表和详情',
    },
    {
      name: '用户管理创建',
      code: 'system:user:create',
      action: 'create',
      parentMenuCode: 'user',
      description: '创建新用户',
    },
    {
      name: '用户管理更新',
      code: 'system:user:update',
      action: 'update',
      parentMenuCode: 'user',
      description: '更新用户信息',
    },
    {
      name: '用户管理删除',
      code: 'system:user:delete',
      action: 'delete',
      parentMenuCode: 'user',
      description: '删除用户',
    },
    {
      name: '用户管理',
      code: 'system:user:manage',
      action: 'manage',
      parentMenuCode: 'user',
      description: '用户角色分配等管理操作',
    },
    {
      name: '用户管理导入',
      code: 'system:user:import',
      action: 'import',
      parentMenuCode: 'user',
      description: '导入用户数据',
    },
    {
      name: '用户管理导出',
      code: 'system:user:export',
      action: 'export',
      parentMenuCode: 'user',
      description: '导出用户数据',
    },

    // 角色管理权限
    {
      name: '角色管理查看',
      code: 'system:role:view',
      action: 'view',
      parentMenuCode: 'role',
      description: '查看角色列表和详情',
    },
    {
      name: '角色管理创建',
      code: 'system:role:create',
      action: 'create',
      parentMenuCode: 'role',
      description: '创建新角色',
    },
    {
      name: '角色管理更新',
      code: 'system:role:update',
      action: 'update',
      parentMenuCode: 'role',
      description: '更新角色信息',
    },
    {
      name: '角色管理删除',
      code: 'system:role:delete',
      action: 'delete',
      parentMenuCode: 'role',
      description: '删除角色',
    },
    {
      name: '角色管理导入',
      code: 'system:role:import',
      action: 'import',
      parentMenuCode: 'role',
      description: '导入角色数据',
    },
    {
      name: '角色管理导出',
      code: 'system:role:export',
      action: 'export',
      parentMenuCode: 'role',
      description: '导出角色数据',
    },

    // 权限管理权限
    {
      name: '权限管理查看',
      code: 'system:permission:view',
      action: 'view',
      parentMenuCode: 'permission',
      description: '查看权限列表和详情',
    },
    {
      name: '权限管理创建',
      code: 'system:permission:create',
      action: 'create',
      parentMenuCode: 'permission',
      description: '创建新权限',
    },
    {
      name: '权限管理更新',
      code: 'system:permission:update',
      action: 'update',
      parentMenuCode: 'permission',
      description: '更新权限信息',
    },
    {
      name: '权限管理删除',
      code: 'system:permission:delete',
      action: 'delete',
      parentMenuCode: 'permission',
      description: '删除权限',
    },
    {
      name: '权限管理导入',
      code: 'system:permission:import',
      action: 'import',
      parentMenuCode: 'permission',
      description: '导入权限数据',
    },
    {
      name: '权限管理导出',
      code: 'system:permission:export',
      action: 'export',
      parentMenuCode: 'permission',
      description: '导出权限数据',
    },

    // 资源管理权限
    {
      name: '资源管理查看',
      code: 'system:resource:view',
      action: 'view',
      parentMenuCode: 'resource',
      description: '查看资源列表和详情',
    },
    {
      name: '资源管理创建',
      code: 'system:resource:create',
      action: 'create',
      parentMenuCode: 'resource',
      description: '创建新资源',
    },
    {
      name: '资源管理更新',
      code: 'system:resource:update',
      action: 'update',
      parentMenuCode: 'resource',
      description: '更新资源信息',
    },
    {
      name: '资源管理删除',
      code: 'system:resource:delete',
      action: 'delete',
      parentMenuCode: 'resource',
      description: '删除资源',
    },
    {
      name: '资源管理导入',
      code: 'system:resource:import',
      action: 'import',
      parentMenuCode: 'resource',
      description: '导入资源数据',
    },
    {
      name: '资源管理导出',
      code: 'system:resource:export',
      action: 'export',
      parentMenuCode: 'resource',
      description: '导出资源数据',
    },

    // 部门管理权限
    {
      name: '部门管理查看',
      code: 'system:department:view',
      action: 'view',
      parentMenuCode: 'department',
      description: '查看部门列表和详情',
    },
    {
      name: '部门管理创建',
      code: 'system:department:create',
      action: 'create',
      parentMenuCode: 'department',
      description: '创建新部门',
    },
    {
      name: '部门管理更新',
      code: 'system:department:update',
      action: 'update',
      parentMenuCode: 'department',
      description: '更新部门信息',
    },
    {
      name: '部门管理删除',
      code: 'system:department:delete',
      action: 'delete',
      parentMenuCode: 'department',
      description: '删除部门',
    },
    {
      name: '部门管理导入',
      code: 'system:department:import',
      action: 'import',
      parentMenuCode: 'department',
      description: '导入部门数据',
    },
    {
      name: '部门管理导出',
      code: 'system:department:export',
      action: 'export',
      parentMenuCode: 'department',
      description: '导出部门数据',
    },

    // 岗位管理权限
    {
      name: '岗位管理查看',
      code: 'system:position:view',
      action: 'view',
      parentMenuCode: 'position',
      description: '查看岗位列表和详情',
    },
    {
      name: '岗位管理创建',
      code: 'system:position:create',
      action: 'create',
      parentMenuCode: 'position',
      description: '创建新岗位',
    },
    {
      name: '岗位管理更新',
      code: 'system:position:update',
      action: 'update',
      parentMenuCode: 'position',
      description: '更新岗位信息',
    },
    {
      name: '岗位管理删除',
      code: 'system:position:delete',
      action: 'delete',
      parentMenuCode: 'position',
      description: '删除岗位',
    },
    {
      name: '岗位管理导入',
      code: 'system:position:import',
      action: 'import',
      parentMenuCode: 'position',
      description: '导入岗位数据',
    },
    {
      name: '岗位管理导出',
      code: 'system:position:export',
      action: 'export',
      parentMenuCode: 'position',
      description: '导出岗位数据',
    },

    // 字典管理权限
    {
      name: '字典管理查看',
      code: 'system:dictionary:view',
      action: 'view',
      parentMenuCode: 'dictionary',
      description: '查看字典列表和详情',
    },
    {
      name: '字典管理创建',
      code: 'system:dictionary:create',
      action: 'create',
      parentMenuCode: 'dictionary',
      description: '创建新字典',
    },
    {
      name: '字典管理更新',
      code: 'system:dictionary:update',
      action: 'update',
      parentMenuCode: 'dictionary',
      description: '更新字典信息',
    },
    {
      name: '字典管理删除',
      code: 'system:dictionary:delete',
      action: 'delete',
      parentMenuCode: 'dictionary',
      description: '删除字典',
    },
    {
      name: '字典管理导入',
      code: 'system:dictionary:import',
      action: 'import',
      parentMenuCode: 'dictionary',
      description: '导入字典数据',
    },
    {
      name: '字典管理导出',
      code: 'system:dictionary:export',
      action: 'export',
      parentMenuCode: 'dictionary',
      description: '导出字典数据',
    },

    // 配置管理权限
    {
      name: '配置管理查看',
      code: 'system:config:view',
      action: 'view',
      parentMenuCode: 'config',
      description: '查看配置列表和详情',
    },
    {
      name: '配置管理创建',
      code: 'system:config:create',
      action: 'create',
      parentMenuCode: 'config',
      description: '创建新配置',
    },
    {
      name: '配置管理更新',
      code: 'system:config:update',
      action: 'update',
      parentMenuCode: 'config',
      description: '更新配置信息',
    },
    {
      name: '配置管理删除',
      code: 'system:config:delete',
      action: 'delete',
      parentMenuCode: 'config',
      description: '删除配置',
    },
    {
      name: '配置管理导入',
      code: 'system:config:import',
      action: 'import',
      parentMenuCode: 'config',
      description: '导入配置数据',
    },
    {
      name: '配置管理导出',
      code: 'system:config:export',
      action: 'export',
      parentMenuCode: 'config',
      description: '导出配置数据',
    },
  ];

  // 使用上面的 menuMap

  // 创建权限
  for (const permissionData of permissions) {
    const parentMenuCode = permissionData.parentMenuCode;
    const parentPermissionId = parentMenuCode
      ? menuMap[parentMenuCode]
      : undefined;
    await prisma.permission.upsert({
      where: { code: permissionData.code },
      update: {},
      create: {
        name: permissionData.name,
        code: permissionData.code,
        action: permissionData.action,
        description: permissionData.description,
        type: PermissionType.BUTTON,
        parentPermissionId,
      },
    });
    console.log(`✅ 创建权限: ${permissionData.name}`);
  }

  console.log('✅ 权限数据创建完成');
}
