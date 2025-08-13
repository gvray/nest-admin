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
  ];

  const createdResources = {};

  for (const resourceData of resources) {
    const { parentCode, ...data } = resourceData;
    
    let parentId = null;
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
