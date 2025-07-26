import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedPermissions } from './seeds/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 初始化权限
  await seedPermissions();

  // 创建部门
  console.log('创建部门...');
  const itDepartment = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: '技术部',
      code: 'IT',
      description: '负责技术开发和维护',
      isActive: true,
      sort: 1,
    },
  });

  const hrDepartment = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: '人力资源部',
      code: 'HR',
      description: '负责人力资源管理',
      isActive: true,
      sort: 2,
    },
  });

  const financeDepartment = await prisma.department.upsert({
    where: { code: 'FINANCE' },
    update: {},
    create: {
      name: '财务部',
      code: 'FINANCE',
      description: '负责财务管理',
      isActive: true,
      sort: 3,
    },
  });

  // 创建岗位
  console.log('创建岗位...');
  await prisma.position.upsert({
    where: { code: 'DEVELOPER' },
    update: {},
    create: {
      name: '开发工程师',
      code: 'DEVELOPER',
      description: '负责系统开发',
      departmentId: itDepartment.id,
      isActive: true,
      sort: 1,
    },
  });

  const managerPosition = await prisma.position.upsert({
    where: { code: 'MANAGER' },
    update: {},
    create: {
      name: '部门经理',
      code: 'MANAGER',
      description: '负责部门管理',
      departmentId: itDepartment.id,
      isActive: true,
      sort: 2,
    },
  });

  await prisma.position.upsert({
    where: { code: 'HR_SPECIALIST' },
    update: {},
    create: {
      name: 'HR专员',
      code: 'HR_SPECIALIST',
      description: '负责人力资源相关工作',
      departmentId: hrDepartment.id,
      isActive: true,
      sort: 1,
    },
  });

  await prisma.position.upsert({
    where: { code: 'ACCOUNTANT' },
    update: {},
    create: {
      name: '会计',
      code: 'ACCOUNTANT',
      description: '负责财务核算',
      departmentId: financeDepartment.id,
      isActive: true,
      sort: 1,
    },
  });

  // 创建管理员角色
  console.log('创建管理员角色...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      description: '系统管理员',
    },
    create: {
      name: 'admin',
      description: '系统管理员',
    },
  });

  // 为管理员角色分配所有权限
  console.log('为管理员角色分配权限...');
  const allPermissions = await prisma.permission.findMany();
  console.log(`找到 ${allPermissions.length} 个权限，正在分配给管理员角色...`);

  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: allPermissions.map((permission) => ({ id: permission.id })),
      },
    },
  });

  // 创建管理员用户
  console.log('创建管理员用户...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      roles: {
        connect: { id: adminRole.id },
      },
      departmentId: itDepartment.id,
      positionId: managerPosition.id,
      phone: '13800138000',
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      phone: '13800138000',
      password: hashedPassword,
      isActive: true,
      departmentId: itDepartment.id,
      positionId: managerPosition.id,
      roles: {
        connect: { id: adminRole.id },
      },
    },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  });

  console.log('数据库初始化完成！');
  console.log('管理员账户信息:');
  console.log(`  邮箱: ${adminUser.email}`);
  console.log(`  用户名: ${adminUser.username}`);
  console.log(`  手机号: ${adminUser.phone}`);
  console.log(`  密码: admin123`);
  console.log(
    `  角色: ${adminUser.roles?.map((role) => role.name).join(', ') || ''}`,
  );
  console.log(
    `  权限数量: ${adminUser.roles?.reduce((total, role) => total + (role.permissions?.length || 0), 0) || 0}`,
  );
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
