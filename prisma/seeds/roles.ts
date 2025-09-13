import { PrismaClient } from '@prisma/client';
import {
  SUPER_ROLE_KEY,
  SUPER_ROLE_NAME,
} from '../../src/shared/constants/role.constant';

export async function seedRoles(prisma: PrismaClient) {
  console.log('开始创建角色...');

  // 创建超级角色（不允许删除、创建和修改）
  const superAdminRole = await prisma.role.upsert({
    where: { roleKey: SUPER_ROLE_KEY },
    update: {},
    create: {
      name: SUPER_ROLE_NAME,
      roleKey: SUPER_ROLE_KEY,
      description: '超级管理员角色，拥有所有权限，不允许删除、创建和修改',
      remark: '系统超级管理员角色，具有最高权限且受保护',
      sort: 0,
      status: 1,
    },
  });

  // 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { roleKey: 'admin' },
    update: {},
    create: {
      name: '管理员',
      roleKey: 'admin',
      description: '系统管理员角色，拥有所有权限',
      remark: '系统默认管理员角色，具有最高权限',
      sort: 1,
      status: 1,
    },
  });

  // 创建普通用户角色
  const userRole = await prisma.role.upsert({
    where: { roleKey: 'user' },
    update: {},
    create: {
      name: '普通用户',
      roleKey: 'user',
      description: '普通用户角色，拥有基础权限',
      remark: '系统默认普通用户角色，具有基础查看权限',
      sort: 10,
      status: 1,
    },
  });

  // 创建部门经理角色
  const managerRole = await prisma.role.upsert({
    where: { roleKey: 'manager' },
    update: {},
    create: {
      name: '部门经理',
      roleKey: 'manager',
      description: '部门经理角色，拥有部门管理权限',
      remark: '部门经理角色，可以管理本部门用户和资源',
      sort: 5,
      status: 1,
    },
  });

  console.log('角色创建完成');

  // 返回创建的角色
  return { superRole: superAdminRole, adminRole, userRole, managerRole };
}
