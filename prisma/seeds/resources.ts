import { ROOT_PARENT_ID } from '@/shared/constants/root.constant';
import { PrismaClient, ResourceType } from '@prisma/client';

export async function seedResources(prisma: PrismaClient) {
  console.log('📁 开始创建基础资源...');

  const resources = [
    // 系统管理
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
    // 用户管理
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
    // 角色管理
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
    // 权限管理
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
    // 资源管理
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
    // 部门管理
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
    // 岗位管理
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
    // 字典管理
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
    // 配置管理
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
    // 日志管理
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
    // 操作日志
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
    // 登录日志
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

  const createdResources: Record<string, { resourceId: string }> = {};

  for (const resourceData of resources) {
    const { parentCode, ...data } = resourceData;

    let parentId: string = ROOT_PARENT_ID;
    if (parentCode) {
      const parentResource = createdResources[parentCode];
      if (parentResource) {
        parentId = parentResource.resourceId;
      }
    }

    const resource = await prisma.resource.upsert({
      where: { code: data.code },
      update: {},
      create: {
        ...data,
        type: data.type as ResourceType,
        parentId,
      },
    });

    createdResources[data.code] = resource;
    console.log(`✅ 创建资源: ${resource.name}`);
  }

  console.log('✅ 基础资源创建完成');
  return createdResources;
}
