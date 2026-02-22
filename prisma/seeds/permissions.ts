import { PrismaClient, PermissionType } from '@prisma/client';
const ROOT_PARENT_ID = '00000000-0000-0000-0000-000000000000';

interface MenuNode {
  type: 'DIRECTORY' | 'MENU' | 'BUTTON' | 'API';
  name: string;
  code: string;
  path?: string;
  icon?: string;
  sort?: number;
  description?: string;
  action?: string;
  method?: string; // HTTP method for API type
  children?: MenuNode[];
}

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 开始创建权限数据...');

  const menuTree: MenuNode[] = [
    {
      type: 'DIRECTORY',
      name: '系统管理',
      code: 'menu:system',
      path: '/system',
      icon: 'SettingOutlined',
      sort: 0,
      description: '系统管理目录',
      children: [
        {
          type: 'MENU',
          name: '用户管理',
          code: 'menu:system:user',
          path: '/system/user',
          icon: 'UserOutlined',
          sort: 1,
          description: '用户管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看用户',
              code: 'system:user:view',
              action: 'view',
              description: '查看用户列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建用户',
              code: 'system:user:create',
              action: 'create',
              description: '创建新用户',
            },
            {
              type: 'BUTTON',
              name: '更新用户',
              code: 'system:user:update',
              action: 'update',
              description: '更新用户信息',
            },
            {
              type: 'BUTTON',
              name: '删除用户',
              code: 'system:user:delete',
              action: 'delete',
              description: '删除用户',
            },
            {
              type: 'BUTTON',
              name: '维护用户',
              code: 'system:user:manage',
              action: 'manage',
              description: '用户角色分配等管理操作',
            },
            {
              type: 'BUTTON',
              name: '导入用户',
              code: 'system:user:import',
              action: 'import',
              description: '导入用户数据',
            },
            {
              type: 'BUTTON',
              name: '导出用户',
              code: 'system:user:export',
              action: 'export',
              description: '导出用户数据',
            },
            // API 权限
            {
              type: 'API',
              name: '获取用户列表',
              code: 'api:system:user:list',
              method: 'GET',
              path: '/system/users',
              description: 'GET /system/users - 获取用户列表',
            },
            {
              type: 'API',
              name: '获取用户详情',
              code: 'api:system:user:detail',
              method: 'GET',
              path: '/system/users/:id',
              description: 'GET /system/users/:id - 获取用户详情',
            },
            {
              type: 'API',
              name: '创建用户接口',
              code: 'api:system:user:create',
              method: 'POST',
              path: '/system/users',
              description: 'POST /system/users - 创建用户',
            },
            {
              type: 'API',
              name: '更新用户接口',
              code: 'api:system:user:update',
              method: 'PATCH',
              path: '/system/users/:id',
              description: 'PATCH /system/users/:id - 更新用户',
            },
            {
              type: 'API',
              name: '删除用户接口',
              code: 'api:system:user:delete',
              method: 'DELETE',
              path: '/system/users/:id',
              description: 'DELETE /system/users/:id - 删除用户',
            },
            {
              type: 'API',
              name: '批量删除用户接口',
              code: 'api:system:user:batch-delete',
              method: 'DELETE',
              path: '/system/users/batch',
              description: 'DELETE /system/users/batch - 批量删除用户',
            },
            {
              type: 'API',
              name: '分配角色接口',
              code: 'api:system:user:assign-roles',
              method: 'POST',
              path: '/system/users/:id/roles',
              description: 'POST /system/users/:id/roles - 分配用户角色',
            },
            {
              type: 'API',
              name: '移除角色接口',
              code: 'api:system:user:remove-roles',
              method: 'DELETE',
              path: '/system/users/:id/roles',
              description: 'DELETE /system/users/:id/roles - 移除用户角色',
            },
          ],
        },
        {
          type: 'MENU',
          name: '角色管理',
          code: 'menu:system:role',
          path: '/system/role',
          icon: 'TeamOutlined',
          sort: 2,
          description: '角色管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看角色',
              code: 'system:role:view',
              action: 'view',
              description: '查看角色列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建角色',
              code: 'system:role:create',
              action: 'create',
              description: '创建新角色',
            },
            {
              type: 'BUTTON',
              name: '更新角色',
              code: 'system:role:update',
              action: 'update',
              description: '更新角色信息',
            },
            {
              type: 'BUTTON',
              name: '删除角色',
              code: 'system:role:delete',
              action: 'delete',
              description: '删除角色',
            },
            {
              type: 'BUTTON',
              name: '导入角色',
              code: 'system:role:import',
              action: 'import',
              description: '导入角色数据',
            },
            {
              type: 'BUTTON',
              name: '导出角色',
              code: 'system:role:export',
              action: 'export',
              description: '导出角色数据',
            },
            // API 权限
            {
              type: 'API',
              name: '获取角色列表',
              code: 'api:system:role:list',
              method: 'GET',
              path: '/system/roles',
              description: 'GET /system/roles - 获取角色列表',
            },
            {
              type: 'API',
              name: '获取角色详情',
              code: 'api:system:role:detail',
              method: 'GET',
              path: '/system/roles/:id',
              description: 'GET /system/roles/:id - 获取角色详情',
            },
            {
              type: 'API',
              name: '创建角色接口',
              code: 'api:system:role:create',
              method: 'POST',
              path: '/system/roles',
              description: 'POST /system/roles - 创建角色',
            },
            {
              type: 'API',
              name: '更新角色接口',
              code: 'api:system:role:update',
              method: 'PATCH',
              path: '/system/roles/:id',
              description: 'PATCH /system/roles/:id - 更新角色',
            },
            {
              type: 'API',
              name: '删除角色接口',
              code: 'api:system:role:delete',
              method: 'DELETE',
              path: '/system/roles/:id',
              description: 'DELETE /system/roles/:id - 删除角色',
            },
            {
              type: 'API',
              name: '分配权限接口',
              code: 'api:system:role:assign-permissions',
              method: 'POST',
              path: '/system/roles/:id/permissions',
              description: 'POST /system/roles/:id/permissions - 分配角色权限',
            },
          ],
        },
        {
          type: 'MENU',
          name: '权限管理',
          code: 'menu:system:permission',
          path: '/system/permission',
          icon: 'SafetyCertificateOutlined',
          sort: 3,
          description: '权限管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看权限',
              code: 'system:permission:view',
              action: 'view',
              description: '查看权限列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建权限',
              code: 'system:permission:create',
              action: 'create',
              description: '创建新权限',
            },
            {
              type: 'BUTTON',
              name: '更新权限',
              code: 'system:permission:update',
              action: 'update',
              description: '更新权限信息',
            },
            {
              type: 'BUTTON',
              name: '删除权限',
              code: 'system:permission:delete',
              action: 'delete',
              description: '删除权限',
            },
            {
              type: 'BUTTON',
              name: '导入权限',
              code: 'system:permission:import',
              action: 'import',
              description: '导入权限数据',
            },
            {
              type: 'BUTTON',
              name: '导出权限',
              code: 'system:permission:export',
              action: 'export',
              description: '导出权限数据',
            },
            // API 权限
            {
              type: 'API',
              name: '获取权限列表',
              code: 'api:system:permission:list',
              method: 'GET',
              path: '/system/permissions',
              description: 'GET /system/permissions - 获取权限列表',
            },
            {
              type: 'API',
              name: '获取权限详情',
              code: 'api:system:permission:detail',
              method: 'GET',
              path: '/system/permissions/:id',
              description: 'GET /system/permissions/:id - 获取权限详情',
            },
            {
              type: 'API',
              name: '创建权限接口',
              code: 'api:system:permission:create',
              method: 'POST',
              path: '/system/permissions',
              description: 'POST /system/permissions - 创建权限',
            },
            {
              type: 'API',
              name: '更新权限接口',
              code: 'api:system:permission:update',
              method: 'PATCH',
              path: '/system/permissions/:id',
              description: 'PATCH /system/permissions/:id - 更新权限',
            },
            {
              type: 'API',
              name: '删除权限接口',
              code: 'api:system:permission:delete',
              method: 'DELETE',
              path: '/system/permissions/:id',
              description: 'DELETE /system/permissions/:id - 删除权限',
            },
          ],
        },
        {
          type: 'MENU',
          name: '部门管理',
          code: 'menu:system:department',
          path: '/system/department',
          icon: 'ApartmentOutlined',
          sort: 5,
          description: '部门管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看部门',
              code: 'system:department:view',
              action: 'view',
              description: '查看部门列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建部门',
              code: 'system:department:create',
              action: 'create',
              description: '创建新部门',
            },
            {
              type: 'BUTTON',
              name: '更新部门',
              code: 'system:department:update',
              action: 'update',
              description: '更新部门信息',
            },
            {
              type: 'BUTTON',
              name: '删除部门',
              code: 'system:department:delete',
              action: 'delete',
              description: '删除部门',
            },
            {
              type: 'BUTTON',
              name: '导入部门',
              code: 'system:department:import',
              action: 'import',
              description: '导入部门数据',
            },
            {
              type: 'BUTTON',
              name: '导出部门',
              code: 'system:department:export',
              action: 'export',
              description: '导出部门数据',
            },
            // API 权限
            {
              type: 'API',
              name: '获取部门列表',
              code: 'api:system:department:list',
              method: 'GET',
              path: '/system/departments',
              description: 'GET /system/departments - 获取部门列表',
            },
            {
              type: 'API',
              name: '获取部门详情',
              code: 'api:system:department:detail',
              method: 'GET',
              path: '/system/departments/:id',
              description: 'GET /system/departments/:id - 获取部门详情',
            },
            {
              type: 'API',
              name: '创建部门接口',
              code: 'api:system:department:create',
              method: 'POST',
              path: '/system/departments',
              description: 'POST /system/departments - 创建部门',
            },
            {
              type: 'API',
              name: '更新部门接口',
              code: 'api:system:department:update',
              method: 'PATCH',
              path: '/system/departments/:id',
              description: 'PATCH /system/departments/:id - 更新部门',
            },
            {
              type: 'API',
              name: '删除部门接口',
              code: 'api:system:department:delete',
              method: 'DELETE',
              path: '/system/departments/:id',
              description: 'DELETE /system/departments/:id - 删除部门',
            },
          ],
        },
        {
          type: 'MENU',
          name: '岗位管理',
          code: 'menu:system:position',
          path: '/system/position',
          icon: 'IdcardOutlined',
          sort: 6,
          description: '岗位管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看岗位',
              code: 'system:position:view',
              action: 'view',
              description: '查看岗位列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建岗位',
              code: 'system:position:create',
              action: 'create',
              description: '创建新岗位',
            },
            {
              type: 'BUTTON',
              name: '更新岗位',
              code: 'system:position:update',
              action: 'update',
              description: '更新岗位信息',
            },
            {
              type: 'BUTTON',
              name: '删除岗位',
              code: 'system:position:delete',
              action: 'delete',
              description: '删除岗位',
            },
            {
              type: 'BUTTON',
              name: '导入岗位',
              code: 'system:position:import',
              action: 'import',
              description: '导入岗位数据',
            },
            {
              type: 'BUTTON',
              name: '导出岗位',
              code: 'system:position:export',
              action: 'export',
              description: '导出岗位数据',
            },
            // API 权限
            {
              type: 'API',
              name: '获取岗位列表',
              code: 'api:system:position:list',
              method: 'GET',
              path: '/system/positions',
              description: 'GET /system/positions - 获取岗位列表',
            },
            {
              type: 'API',
              name: '获取岗位详情',
              code: 'api:system:position:detail',
              method: 'GET',
              path: '/system/positions/:id',
              description: 'GET /system/positions/:id - 获取岗位详情',
            },
            {
              type: 'API',
              name: '创建岗位接口',
              code: 'api:system:position:create',
              method: 'POST',
              path: '/system/positions',
              description: 'POST /system/positions - 创建岗位',
            },
            {
              type: 'API',
              name: '更新岗位接口',
              code: 'api:system:position:update',
              method: 'PATCH',
              path: '/system/positions/:id',
              description: 'PATCH /system/positions/:id - 更新岗位',
            },
            {
              type: 'API',
              name: '删除岗位接口',
              code: 'api:system:position:delete',
              method: 'DELETE',
              path: '/system/positions/:id',
              description: 'DELETE /system/positions/:id - 删除岗位',
            },
          ],
        },
        {
          type: 'MENU',
          name: '字典管理',
          code: 'menu:system:dictionary',
          path: '/system/dictionary',
          icon: 'BookOutlined',
          sort: 7,
          description: '字典管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看字典',
              code: 'system:dictionary:view',
              action: 'view',
              description: '查看字典列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建字典',
              code: 'system:dictionary:create',
              action: 'create',
              description: '创建新字典',
            },
            {
              type: 'BUTTON',
              name: '更新字典',
              code: 'system:dictionary:update',
              action: 'update',
              description: '更新字典信息',
            },
            {
              type: 'BUTTON',
              name: '删除字典',
              code: 'system:dictionary:delete',
              action: 'delete',
              description: '删除字典',
            },
            {
              type: 'BUTTON',
              name: '导入字典',
              code: 'system:dictionary:import',
              action: 'import',
              description: '导入字典数据',
            },
            {
              type: 'BUTTON',
              name: '导出字典',
              code: 'system:dictionary:export',
              action: 'export',
              description: '导出字典数据',
            },
          ],
        },
        {
          type: 'MENU',
          name: '配置管理',
          code: 'menu:system:config',
          path: '/system/config',
          icon: 'ToolOutlined',
          sort: 8,
          description: '配置管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '查看配置',
              code: 'system:config:view',
              action: 'view',
              description: '查看配置列表和详情',
            },
            {
              type: 'BUTTON',
              name: '创建配置',
              code: 'system:config:create',
              action: 'create',
              description: '创建新配置',
            },
            {
              type: 'BUTTON',
              name: '更新配置',
              code: 'system:config:update',
              action: 'update',
              description: '更新配置信息',
            },
            {
              type: 'BUTTON',
              name: '删除配置',
              code: 'system:config:delete',
              action: 'delete',
              description: '删除配置',
            },
            {
              type: 'BUTTON',
              name: '导入配置',
              code: 'system:config:import',
              action: 'import',
              description: '导入配置数据',
            },
            {
              type: 'BUTTON',
              name: '导出配置',
              code: 'system:config:export',
              action: 'export',
              description: '导出配置数据',
            },
          ],
        },
        {
          type: 'DIRECTORY',
          name: '日志管理',
          code: 'menu:system:log',
          path: '/system/log',
          icon: 'FileTextOutlined',
          sort: 9,
          description: '日志管理目录',
          children: [
            {
              type: 'MENU',
              name: '操作日志',
              code: 'menu:system:log:operation',
              path: '/system/log/operation',
              icon: 'AuditOutlined',
              sort: 1,
              description: '操作日志菜单',
              children: [
                {
                  type: 'BUTTON',
                  name: '查看操作日志',
                  code: 'system:log:operation:view',
                  action: 'view',
                  description: '查看操作日志',
                },
              ],
            },
            {
              type: 'MENU',
              name: '登录日志',
              code: 'menu:system:log:login',
              path: '/system/log/login',
              icon: 'LoginOutlined',
              sort: 2,
              description: '登录日志菜单',
              children: [
                {
                  type: 'BUTTON',
                  name: '查看登录日志',
                  code: 'system:log:login:view',
                  action: 'view',
                  description: '查看登录日志',
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  const menuMap: Record<string, string> = {};

  // 递归创建菜单和按钮权限
  async function createMenuNode(node: MenuNode, parentId?: string) {
    let perm;
    if (node.type === 'BUTTON') {
      const parentPermissionId = parentId || ROOT_PARENT_ID;
      perm = await prisma.permission.upsert({
        where: { code: node.code },
        update: {},
        create: {
          name: node.name,
          code: node.code,
          type: PermissionType.BUTTON,
          origin: 'USER',
          action: node.action!,
          description: node.description,
          parentPermissionId,
        },
      });
    } else if (node.type === 'API') {
      const parentPermissionId = parentId || ROOT_PARENT_ID;
      perm = await prisma.permission.upsert({
        where: { code: node.code },
        update: {},
        create: {
          name: node.name,
          code: node.code,
          type: PermissionType.API,
          origin: 'USER',
          action: node.method || 'GET',
          description: node.description,
          parentPermissionId,
        },
      });
    } else {
      perm = await prisma.permission.upsert({
        where: { code: node.code },
        update: {},
        create: {
          name: node.name,
          code: node.code,
          type:
            node.type === 'DIRECTORY'
              ? PermissionType.DIRECTORY
              : PermissionType.MENU,
          origin: 'USER',
          action: 'access',
          description: node.description,
          parentPermissionId: parentId || ROOT_PARENT_ID,
        },
      });

      // DIRECTORY 和 MENU 都需要 menuMeta（存储 path/icon/sort 等）
      await prisma.menuMeta.upsert({
        where: { permissionId: perm.permissionId },
        update: {
          path: node.path,
          icon: node.icon,
          hidden: false,
          component: node.type === 'MENU' ? node.code : undefined,
          sort: node.sort ?? 0,
        },
        create: {
          permissionId: perm.permissionId,
          path: node.path,
          icon: node.icon,
          hidden: false,
          component: node.type === 'MENU' ? node.code : undefined,
          sort: node.sort ?? 0,
        },
      });
    }

    menuMap[node.code] = perm.permissionId;

    if (node.children) {
      for (const child of node.children) {
        await createMenuNode(child, perm.permissionId);
      }
    }
  }

  for (const root of menuTree) {
    await createMenuNode(root);
  }

  console.log('✅ 权限数据创建完成');
}
