import { PrismaClient } from '@prisma/client';
import {
  SYSTEM_DIRECTORY,
  USER_PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_PERMISSIONS,
  DEPARTMENT_PERMISSIONS,
  POSITION_PERMISSIONS,
  DICTIONARY_PERMISSIONS,
  CONFIG_PERMISSIONS,
  LOG_PERMISSIONS,
  LOGIN_LOG_PERMISSIONS,
  OPERATION_LOG_PERMISSIONS,
} from '../../src/shared/constants/permissions.constant';

const ROOT_PARENT_ID = '00000000-0000-0000-0000-000000000000';

interface MenuNode {
  type: 'DIRECTORY' | 'MENU' | 'BUTTON';
  name: string;
  code: string;
  path?: string;
  icon?: string;
  sort?: number;
  description?: string;
  children?: MenuNode[];
}

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 开始创建权限数据...');
  console.log('📝 注意：API 权限通过扫描自动生成，seed 只创建菜单和按钮权限');

  const menuTree: MenuNode[] = [
    {
      type: 'DIRECTORY',
      name: '系统管理',
      code: SYSTEM_DIRECTORY,
      path: '/system',
      icon: 'SettingOutlined',
      sort: 0,
      description: '系统管理目录',
      children: [
        // ==================== 用户管理 ====================
        {
          type: 'MENU',
          name: '用户管理',
          code: USER_PERMISSIONS.MENU,
          path: '/system/user',
          icon: 'UserOutlined',
          sort: 1,
          description: '用户管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '用户列表',
              code: USER_PERMISSIONS.LIST,
              description: '查看用户列表',
            },
            {
              type: 'BUTTON',
              name: '查看用户',
              code: USER_PERMISSIONS.VIEW,
              description: '查看用户详情',
            },
            {
              type: 'BUTTON',
              name: '创建用户',
              code: USER_PERMISSIONS.CREATE,
              description: '创建新用户',
            },
            {
              type: 'BUTTON',
              name: '更新用户',
              code: USER_PERMISSIONS.UPDATE,
              description: '更新用户信息',
            },
            {
              type: 'BUTTON',
              name: '删除用户',
              code: USER_PERMISSIONS.DELETE,
              description: '删除用户',
            },
            {
              type: 'BUTTON',
              name: '导入用户',
              code: USER_PERMISSIONS.IMPORT,
              description: '批量导入用户',
            },
            {
              type: 'BUTTON',
              name: '导出用户',
              code: USER_PERMISSIONS.EXPORT,
              description: '导出用户数据',
            },
            {
              type: 'BUTTON',
              name: '管理角色',
              code: USER_PERMISSIONS.UPDATE_ROLES,
              description: '为用户分配或移除角色',
            },
            {
              type: 'BUTTON',
              name: '重置密码',
              code: USER_PERMISSIONS.RESET_PASSWORD,
              description: '重置用户密码',
            },
          ],
        },

        // ==================== 角色管理 ====================
        {
          type: 'MENU',
          name: '角色管理',
          code: ROLE_PERMISSIONS.MENU,
          path: '/system/role',
          icon: 'TeamOutlined',
          sort: 2,
          description: '角色管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '角色列表',
              code: ROLE_PERMISSIONS.LIST,
              description: '查看角色列表',
            },
            {
              type: 'BUTTON',
              name: '查看角色',
              code: ROLE_PERMISSIONS.VIEW,
              description: '查看角色详情',
            },
            {
              type: 'BUTTON',
              name: '创建角色',
              code: ROLE_PERMISSIONS.CREATE,
              description: '创建新角色',
            },
            {
              type: 'BUTTON',
              name: '更新角色',
              code: ROLE_PERMISSIONS.UPDATE,
              description: '更新角色信息',
            },
            {
              type: 'BUTTON',
              name: '删除角色',
              code: ROLE_PERMISSIONS.DELETE,
              description: '删除角色',
            },
            {
              type: 'BUTTON',
              name: '管理权限',
              code: ROLE_PERMISSIONS.UPDATE_PERMISSIONS,
              description: '为角色分配或移除权限',
            },
            {
              type: 'BUTTON',
              name: '管理用户',
              code: ROLE_PERMISSIONS.UPDATE_USERS,
              description: '为角色分配或移除用户',
            },
            {
              type: 'BUTTON',
              name: '管理数据权限',
              code: ROLE_PERMISSIONS.UPDATE_DATA_SCOPE,
              description: '设置角色数据权限范围',
            },
          ],
        },

        // ==================== 权限管理 ====================
        {
          type: 'MENU',
          name: '权限管理',
          code: PERMISSION_PERMISSIONS.MENU,
          path: '/system/permission',
          icon: 'SafetyCertificateOutlined',
          sort: 3,
          description: '权限管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '权限列表',
              code: PERMISSION_PERMISSIONS.LIST,
              description: '查看权限列表',
            },
            {
              type: 'BUTTON',
              name: '查看权限',
              code: PERMISSION_PERMISSIONS.VIEW,
              description: '查看权限详情',
            },
            {
              type: 'BUTTON',
              name: '创建权限',
              code: PERMISSION_PERMISSIONS.CREATE,
              description: '创建新权限',
            },
            {
              type: 'BUTTON',
              name: '更新权限',
              code: PERMISSION_PERMISSIONS.UPDATE,
              description: '更新权限信息',
            },
            {
              type: 'BUTTON',
              name: '删除权限',
              code: PERMISSION_PERMISSIONS.DELETE,
              description: '删除权限',
            },
            {
              type: 'BUTTON',
              name: '扫描权限',
              code: PERMISSION_PERMISSIONS.SCAN,
              description: '扫描控制器生成API权限',
            },
          ],
        },

        // ==================== 部门管理 ====================
        {
          type: 'MENU',
          name: '部门管理',
          code: DEPARTMENT_PERMISSIONS.MENU,
          path: '/system/department',
          icon: 'ApartmentOutlined',
          sort: 4,
          description: '部门管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '部门列表',
              code: DEPARTMENT_PERMISSIONS.LIST,
              description: '查看部门列表',
            },
            {
              type: 'BUTTON',
              name: '查看部门',
              code: DEPARTMENT_PERMISSIONS.VIEW,
              description: '查看部门详情',
            },
            {
              type: 'BUTTON',
              name: '创建部门',
              code: DEPARTMENT_PERMISSIONS.CREATE,
              description: '创建新部门',
            },
            {
              type: 'BUTTON',
              name: '更新部门',
              code: DEPARTMENT_PERMISSIONS.UPDATE,
              description: '更新部门信息',
            },
            {
              type: 'BUTTON',
              name: '删除部门',
              code: DEPARTMENT_PERMISSIONS.DELETE,
              description: '删除部门',
            },
          ],
        },

        // ==================== 岗位管理 ====================
        {
          type: 'MENU',
          name: '岗位管理',
          code: POSITION_PERMISSIONS.MENU,
          path: '/system/position',
          icon: 'IdcardOutlined',
          sort: 5,
          description: '岗位管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '岗位列表',
              code: POSITION_PERMISSIONS.LIST,
              description: '查看岗位列表',
            },
            {
              type: 'BUTTON',
              name: '查看岗位',
              code: POSITION_PERMISSIONS.VIEW,
              description: '查看岗位详情',
            },
            {
              type: 'BUTTON',
              name: '创建岗位',
              code: POSITION_PERMISSIONS.CREATE,
              description: '创建新岗位',
            },
            {
              type: 'BUTTON',
              name: '更新岗位',
              code: POSITION_PERMISSIONS.UPDATE,
              description: '更新岗位信息',
            },
            {
              type: 'BUTTON',
              name: '删除岗位',
              code: POSITION_PERMISSIONS.DELETE,
              description: '删除岗位',
            },
          ],
        },

        // ==================== 字典管理 ====================
        {
          type: 'MENU',
          name: '字典管理',
          code: DICTIONARY_PERMISSIONS.MENU,
          path: '/system/dictionary',
          icon: 'BookOutlined',
          sort: 6,
          description: '字典管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '字典列表',
              code: DICTIONARY_PERMISSIONS.LIST,
              description: '查看字典列表',
            },
            {
              type: 'BUTTON',
              name: '查看字典',
              code: DICTIONARY_PERMISSIONS.VIEW,
              description: '查看字典详情',
            },
            {
              type: 'BUTTON',
              name: '创建字典',
              code: DICTIONARY_PERMISSIONS.CREATE,
              description: '创建新字典',
            },
            {
              type: 'BUTTON',
              name: '更新字典',
              code: DICTIONARY_PERMISSIONS.UPDATE,
              description: '更新字典信息',
            },
            {
              type: 'BUTTON',
              name: '删除字典',
              code: DICTIONARY_PERMISSIONS.DELETE,
              description: '删除字典',
            },
          ],
        },

        // ==================== 配置管理 ====================
        {
          type: 'MENU',
          name: '配置管理',
          code: CONFIG_PERMISSIONS.MENU,
          path: '/system/config',
          icon: 'ToolOutlined',
          sort: 7,
          description: '配置管理菜单',
          children: [
            {
              type: 'BUTTON',
              name: '配置列表',
              code: CONFIG_PERMISSIONS.LIST,
              description: '查看配置列表',
            },
            {
              type: 'BUTTON',
              name: '查看配置',
              code: CONFIG_PERMISSIONS.VIEW,
              description: '查看配置详情',
            },
            {
              type: 'BUTTON',
              name: '创建配置',
              code: CONFIG_PERMISSIONS.CREATE,
              description: '创建新配置',
            },
            {
              type: 'BUTTON',
              name: '更新配置',
              code: CONFIG_PERMISSIONS.UPDATE,
              description: '更新配置信息',
            },
            {
              type: 'BUTTON',
              name: '删除配置',
              code: CONFIG_PERMISSIONS.DELETE,
              description: '删除配置',
            },
          ],
        },

        // ==================== 日志管理 ====================
        {
          type: 'MENU',
          name: '日志管理',
          code: LOG_PERMISSIONS.MENU,
          path: '/system/log',
          icon: 'FileTextOutlined',
          sort: 8,
          description: '日志管理菜单',
          children: [
            {
              type: 'MENU',
              name: '登录日志',
              code: LOGIN_LOG_PERMISSIONS.MENU,
              path: '/system/log/login',
              icon: 'LoginOutlined',
              sort: 1,
              description: '登录日志菜单',
              children: [
                {
                  type: 'BUTTON',
                  name: '日志列表',
                  code: LOGIN_LOG_PERMISSIONS.LIST,
                  description: '查看登录日志列表',
                },
                {
                  type: 'BUTTON',
                  name: '查看日志',
                  code: LOGIN_LOG_PERMISSIONS.VIEW,
                  description: '查看登录日志详情',
                },
                {
                  type: 'BUTTON',
                  name: '删除日志',
                  code: LOGIN_LOG_PERMISSIONS.DELETE,
                  description: '删除登录日志',
                },
                {
                  type: 'BUTTON',
                  name: '清理历史',
                  code: LOGIN_LOG_PERMISSIONS.CLEAN,
                  description: '清理指定天数前的登录日志',
                },
                {
                  type: 'BUTTON',
                  name: '清空全部',
                  code: LOGIN_LOG_PERMISSIONS.CLEAR,
                  description: '清空所有登录日志（危险）',
                },
              ],
            },
            {
              type: 'MENU',
              name: '操作日志',
              code: OPERATION_LOG_PERMISSIONS.MENU,
              path: '/system/log/operation',
              icon: 'AuditOutlined',
              sort: 2,
              description: '操作日志菜单',
              children: [
                {
                  type: 'BUTTON',
                  name: '日志列表',
                  code: OPERATION_LOG_PERMISSIONS.LIST,
                  description: '查看操作日志列表',
                },
                {
                  type: 'BUTTON',
                  name: '查看日志',
                  code: OPERATION_LOG_PERMISSIONS.VIEW,
                  description: '查看操作日志详情',
                },
                {
                  type: 'BUTTON',
                  name: '删除日志',
                  code: OPERATION_LOG_PERMISSIONS.DELETE,
                  description: '删除操作日志',
                },
                {
                  type: 'BUTTON',
                  name: '清理历史',
                  code: OPERATION_LOG_PERMISSIONS.CLEAN,
                  description: '清理指定天数前的操作日志',
                },
                {
                  type: 'BUTTON',
                  name: '清空全部',
                  code: OPERATION_LOG_PERMISSIONS.CLEAR,
                  description: '清空所有操作日志（危险）',
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
    const parentPermissionId = parentId || ROOT_PARENT_ID;
    // 创建权限记录
    const perm = await prisma.permission.upsert({
      where: { code: node.code },
      update: {
        name: node.name,
        type: node.type,
        parentPermissionId,
        description: node.description,
        origin: 'SYSTEM',
      },
      create: {
        name: node.name,
        code: node.code,
        type: node.type,
        action:
          node.type === 'BUTTON'
            ? node.code.split(':').pop() || 'list'
            : 'list',
        parentPermissionId,
        description: node.description,
        origin: 'SYSTEM',
      },
    });

    // DIRECTORY 和 MENU 需要 menuMeta
    if (node.type === 'DIRECTORY' || node.type === 'MENU') {
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
