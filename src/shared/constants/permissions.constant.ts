/**
 * 权限常量配置
 * 统一管理所有权限代码，供后端控制器和前端使用
 *
 * 命名规范：{module}:{resource}:{action}
 * - module: 模块名（如 system）
 * - resource: 资源名（如 user, role）
 * - action: 操作名（必须使用标准 action 词库）
 */

// ==================== 标准 Action 词库 ====================
// 约束后端开发者使用统一的 action 命名
export const PERMISSION_ACTIONS = {
  // 查询
  LIST: 'list',
  VIEW: 'view',

  // CRUD
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',

  // 数据交换
  IMPORT: 'import',
  EXPORT: 'export',

  // 关系操作
  ASSIGN: 'assign',
  REMOVE: 'remove',

  // 状态控制
  ENABLE: 'enable',
  DISABLE: 'disable',

  // 通用动作
  RESET: 'reset',

  // 内容管理
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',

  // 审批流（如果有）
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

// ==================== 系统管理目录 ====================
export const SYSTEM_DIRECTORY = 'system';

// ==================== 用户管理权限 ====================
const USER_RESOURCE = 'system:user';
export const USER_PERMISSIONS = {
  // 菜单
  MENU: USER_RESOURCE,

  // 查询操作
  LIST: `${USER_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${USER_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${USER_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,

  // 导入导出
  IMPORT: `${USER_RESOURCE}:${PERMISSION_ACTIONS.IMPORT}`,
  EXPORT: `${USER_RESOURCE}:${PERMISSION_ACTIONS.EXPORT}`,

  // 角色关系
  ASSIGN_ROLES: `${USER_RESOURCE}:${PERMISSION_ACTIONS.ASSIGN}-roles`,
  REMOVE_ROLES: `${USER_RESOURCE}:${PERMISSION_ACTIONS.REMOVE}-roles`,

  // 其他操作
  RESET_PASSWORD: `${USER_RESOURCE}:${PERMISSION_ACTIONS.RESET}-password`,
} as const;

// ==================== 角色管理权限 ====================
const ROLE_RESOURCE = 'system:role';
export const ROLE_PERMISSIONS = {
  // 菜单
  MENU: ROLE_RESOURCE,

  // 查询操作
  LIST: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,

  // 权限关系
  ASSIGN_PERMISSIONS: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.ASSIGN}-permissions`,
  REMOVE_PERMISSIONS: `${ROLE_RESOURCE}:${PERMISSION_ACTIONS.REMOVE}-permissions`,
} as const;

// ==================== 权限管理权限 ====================
const PERMISSION_RESOURCE = 'system:permission';
export const PERMISSION_PERMISSIONS = {
  // 菜单
  MENU: PERMISSION_RESOURCE,

  // 查询操作
  LIST: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${PERMISSION_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,

  // 特殊操作
  SCAN: `${PERMISSION_RESOURCE}:scan`, // 扫描控制器生成权限
} as const;

// ==================== 部门管理权限 ====================
const DEPARTMENT_RESOURCE = 'system:department';
export const DEPARTMENT_PERMISSIONS = {
  // 菜单
  MENU: DEPARTMENT_RESOURCE,

  // 查询操作
  LIST: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${DEPARTMENT_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 岗位管理权限 ====================
const POSITION_RESOURCE = 'system:position';
export const POSITION_PERMISSIONS = {
  // 菜单
  MENU: POSITION_RESOURCE,

  // 查询操作
  LIST: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${POSITION_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 字典管理权限 ====================
const DICTIONARY_RESOURCE = 'system:dictionary';
export const DICTIONARY_PERMISSIONS = {
  // 菜单
  MENU: DICTIONARY_RESOURCE,

  // 查询操作
  LIST: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${DICTIONARY_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,

  // 字典类型操作
  TYPE_LIST: `${DICTIONARY_RESOURCE}:type:${PERMISSION_ACTIONS.LIST}`,
  TYPE_VIEW: `${DICTIONARY_RESOURCE}:type:${PERMISSION_ACTIONS.VIEW}`,
  TYPE_CREATE: `${DICTIONARY_RESOURCE}:type:${PERMISSION_ACTIONS.CREATE}`,
  TYPE_UPDATE: `${DICTIONARY_RESOURCE}:type:${PERMISSION_ACTIONS.UPDATE}`,
  TYPE_DELETE: `${DICTIONARY_RESOURCE}:type:${PERMISSION_ACTIONS.DELETE}`,

  // 字典项操作
  ITEM_LIST: `${DICTIONARY_RESOURCE}:item:${PERMISSION_ACTIONS.LIST}`,
  ITEM_VIEW: `${DICTIONARY_RESOURCE}:item:${PERMISSION_ACTIONS.VIEW}`,
  ITEM_CREATE: `${DICTIONARY_RESOURCE}:item:${PERMISSION_ACTIONS.CREATE}`,
  ITEM_UPDATE: `${DICTIONARY_RESOURCE}:item:${PERMISSION_ACTIONS.UPDATE}`,
  ITEM_DELETE: `${DICTIONARY_RESOURCE}:item:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 配置管理权限 ====================
const CONFIG_RESOURCE = 'system:config';
export const CONFIG_PERMISSIONS = {
  // 菜单
  MENU: CONFIG_RESOURCE,

  // 查询操作
  LIST: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // CRUD 操作
  CREATE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.CREATE}`,
  UPDATE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.UPDATE}`,
  DELETE: `${CONFIG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 登录日志权限 ====================
const LOGIN_LOG_RESOURCE = 'system:loginlog';
export const LOGIN_LOG_PERMISSIONS = {
  // 菜单
  MENU: LOGIN_LOG_RESOURCE,

  // 查询操作
  LIST: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // 操作
  DELETE: `${LOGIN_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 操作日志权限 ====================
const OPERATION_LOG_RESOURCE = 'system:oplog';
export const OPERATION_LOG_PERMISSIONS = {
  // 菜单
  MENU: OPERATION_LOG_RESOURCE,

  // 查询操作
  LIST: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.LIST}`,
  VIEW: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.VIEW}`,

  // 操作
  DELETE: `${OPERATION_LOG_RESOURCE}:${PERMISSION_ACTIONS.DELETE}`,
} as const;

// ==================== 导出所有权限配置 ====================
export const PERMISSIONS = {
  USER: USER_PERMISSIONS,
  ROLE: ROLE_PERMISSIONS,
  PERMISSION: PERMISSION_PERMISSIONS,
  DEPARTMENT: DEPARTMENT_PERMISSIONS,
  POSITION: POSITION_PERMISSIONS,
  DICTIONARY: DICTIONARY_PERMISSIONS,
  CONFIG: CONFIG_PERMISSIONS,
  LOGIN_LOG: LOGIN_LOG_PERMISSIONS,
  OPERATION_LOG: OPERATION_LOG_PERMISSIONS,
} as const;

// ==================== 权限配置元数据（供前端使用） ====================
export interface PermissionMeta {
  code: string;
  name: string;
  description?: string;
  type: 'MENU' | 'BUTTON' | 'API';
}

/**
 * 权限配置元数据
 * 供前端获取权限列表和说明
 */
export const PERMISSION_METADATA: Record<string, PermissionMeta[]> = {
  user: [
    { code: USER_PERMISSIONS.MENU, name: '用户管理', type: 'MENU' },
    {
      code: USER_PERMISSIONS.VIEW,
      name: '查看用户',
      type: 'BUTTON',
      description: '查看用户列表和详情',
    },
    {
      code: USER_PERMISSIONS.CREATE,
      name: '创建用户',
      type: 'BUTTON',
      description: '创建新用户',
    },
    {
      code: USER_PERMISSIONS.UPDATE,
      name: '更新用户',
      type: 'BUTTON',
      description: '修改用户信息',
    },
    {
      code: USER_PERMISSIONS.DELETE,
      name: '删除用户',
      type: 'BUTTON',
      description: '删除用户',
    },
    {
      code: USER_PERMISSIONS.IMPORT,
      name: '导入用户',
      type: 'BUTTON',
      description: '批量导入用户',
    },
    {
      code: USER_PERMISSIONS.EXPORT,
      name: '导出用户',
      type: 'BUTTON',
      description: '导出用户数据',
    },
  ],
  role: [
    { code: ROLE_PERMISSIONS.MENU, name: '角色管理', type: 'MENU' },
    {
      code: ROLE_PERMISSIONS.VIEW,
      name: '查看角色',
      type: 'BUTTON',
      description: '查看角色列表和详情',
    },
    {
      code: ROLE_PERMISSIONS.CREATE,
      name: '创建角色',
      type: 'BUTTON',
      description: '创建新角色',
    },
    {
      code: ROLE_PERMISSIONS.UPDATE,
      name: '更新角色',
      type: 'BUTTON',
      description: '修改角色信息',
    },
    {
      code: ROLE_PERMISSIONS.DELETE,
      name: '删除角色',
      type: 'BUTTON',
      description: '删除角色',
    },
  ],
  permission: [
    { code: PERMISSION_PERMISSIONS.MENU, name: '权限管理', type: 'MENU' },
    {
      code: PERMISSION_PERMISSIONS.VIEW,
      name: '查看权限',
      type: 'BUTTON',
      description: '查看权限列表和详情',
    },
    {
      code: PERMISSION_PERMISSIONS.CREATE,
      name: '创建权限',
      type: 'BUTTON',
      description: '创建新权限',
    },
    {
      code: PERMISSION_PERMISSIONS.UPDATE,
      name: '更新权限',
      type: 'BUTTON',
      description: '修改权限信息',
    },
    {
      code: PERMISSION_PERMISSIONS.DELETE,
      name: '删除权限',
      type: 'BUTTON',
      description: '删除权限',
    },
  ],
  department: [
    { code: DEPARTMENT_PERMISSIONS.MENU, name: '部门管理', type: 'MENU' },
    {
      code: DEPARTMENT_PERMISSIONS.VIEW,
      name: '查看部门',
      type: 'BUTTON',
      description: '查看部门列表和详情',
    },
    {
      code: DEPARTMENT_PERMISSIONS.CREATE,
      name: '创建部门',
      type: 'BUTTON',
      description: '创建新部门',
    },
    {
      code: DEPARTMENT_PERMISSIONS.UPDATE,
      name: '更新部门',
      type: 'BUTTON',
      description: '修改部门信息',
    },
    {
      code: DEPARTMENT_PERMISSIONS.DELETE,
      name: '删除部门',
      type: 'BUTTON',
      description: '删除部门',
    },
  ],
  position: [
    { code: POSITION_PERMISSIONS.MENU, name: '岗位管理', type: 'MENU' },
    {
      code: POSITION_PERMISSIONS.VIEW,
      name: '查看岗位',
      type: 'BUTTON',
      description: '查看岗位列表和详情',
    },
    {
      code: POSITION_PERMISSIONS.CREATE,
      name: '创建岗位',
      type: 'BUTTON',
      description: '创建新岗位',
    },
    {
      code: POSITION_PERMISSIONS.UPDATE,
      name: '更新岗位',
      type: 'BUTTON',
      description: '修改岗位信息',
    },
    {
      code: POSITION_PERMISSIONS.DELETE,
      name: '删除岗位',
      type: 'BUTTON',
      description: '删除岗位',
    },
  ],
  dictionary: [
    { code: DICTIONARY_PERMISSIONS.MENU, name: '字典管理', type: 'MENU' },
    {
      code: DICTIONARY_PERMISSIONS.VIEW,
      name: '查看字典',
      type: 'BUTTON',
      description: '查看字典列表和详情',
    },
    {
      code: DICTIONARY_PERMISSIONS.CREATE,
      name: '创建字典',
      type: 'BUTTON',
      description: '创建新字典',
    },
    {
      code: DICTIONARY_PERMISSIONS.UPDATE,
      name: '更新字典',
      type: 'BUTTON',
      description: '修改字典信息',
    },
    {
      code: DICTIONARY_PERMISSIONS.DELETE,
      name: '删除字典',
      type: 'BUTTON',
      description: '删除字典',
    },
  ],
  config: [
    { code: CONFIG_PERMISSIONS.MENU, name: '配置管理', type: 'MENU' },
    {
      code: CONFIG_PERMISSIONS.VIEW,
      name: '查看配置',
      type: 'BUTTON',
      description: '查看系统配置',
    },
    {
      code: CONFIG_PERMISSIONS.UPDATE,
      name: '更新配置',
      type: 'BUTTON',
      description: '修改系统配置',
    },
  ],
  loginLog: [
    { code: LOGIN_LOG_PERMISSIONS.MENU, name: '登录日志', type: 'MENU' },
    {
      code: LOGIN_LOG_PERMISSIONS.VIEW,
      name: '查看日志',
      type: 'BUTTON',
      description: '查看登录日志',
    },
    {
      code: LOGIN_LOG_PERMISSIONS.DELETE,
      name: '删除日志',
      type: 'BUTTON',
      description: '删除登录日志',
    },
  ],
  operationLog: [
    { code: OPERATION_LOG_PERMISSIONS.MENU, name: '操作日志', type: 'MENU' },
    {
      code: OPERATION_LOG_PERMISSIONS.VIEW,
      name: '查看日志',
      type: 'BUTTON',
      description: '查看操作日志',
    },
    {
      code: OPERATION_LOG_PERMISSIONS.DELETE,
      name: '删除日志',
      type: 'BUTTON',
      description: '删除操作日志',
    },
  ],
};
