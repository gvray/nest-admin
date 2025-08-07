import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('开始创建角色...');
  
  // 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '系统管理员角色，拥有所有权限',
      remark: '系统默认管理员角色，具有最高权限',
      sort: 1,
    },
  });

  // 创建普通用户角色
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: '普通用户角色，拥有基础权限',
      remark: '系统默认普通用户角色，具有基础查看权限',
      sort: 10,
    },
  });

  // 创建部门经理角色
  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: '部门经理角色，拥有部门管理权限',
      remark: '部门经理角色，可以管理本部门用户和资源',
      sort: 5,
    },
  });

  console.log('角色创建完成');
  
  // 返回创建的角色
  return { adminRole, userRole, managerRole };
} 