import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedPermissions } from './seeds/permissions';
import { seedResources } from './seeds/resources';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建基础资源
  console.log('创建基础资源...');
  await seedResources(prisma);

  // 初始化权限
  await seedPermissions(prisma);

  // 创建部门
  console.log('创建部门...');
  const itDepartment = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: '技术部',
      code: 'IT',
      description: '负责技术开发和维护',
      status: 1,
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
      status: 1,
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
      status: 1,
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
      status: 1,
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
      status: 1,
      sort: 2,
    },
  });

  const hrPosition = await prisma.position.upsert({
    where: { code: 'HR_SPECIALIST' },
    update: {},
    create: {
      name: 'HR专员',
      code: 'HR_SPECIALIST',
      description: '负责人力资源相关工作',
      departmentId: hrDepartment.id,
      status: 1,
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
      status: 1,
      sort: 1,
    },
  });

  const department = await prisma.department.upsert({
    where: { name: '技术部' },
    update: {},
    create: {
      name: '技术部',
      code: 'tech',
      description: '负责技术开发和维护',
      sort: 1,
    },
  });

  const position = await prisma.position.upsert({
    where: { name: '系统管理员' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'admin',
      description: '负责系统管理和维护',
      departmentId: department.id,
      sort: 1,
    },
  });

  // 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '系统管理员角色，拥有所有权限',
    },
  });

  // 获取所有权限
  const permissions = await prisma.permission.findMany();

  // 为管理员角色分配所有权限
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

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
      nickname: '管理员',
      phone: '13800138000',
      password: hashedPassword,
      status: 1, // 启用状态
      departmentId: itDepartment.id,
      positionId: managerPosition.id,
      roles: {
        connect: { id: adminRole.id },
      },
    },
    include: {
      roles: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // 开发环境下创建测试用户
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 开发环境，开始创建测试用户...');

    const testUsers = [
      {
        username: 'zhang.san',
        email: 'zhang.san@company.com',
        nickname: '张三',
        phone: '13800138001',
      },
      {
        username: 'li.si',
        email: 'li.si@company.com',
        nickname: '李四',
        phone: '13800138002',
      },
      {
        username: 'wang.wu',
        email: 'wang.wu@company.com',
        nickname: '王五',
        phone: '13800138003',
      },
      {
        username: 'zhao.liu',
        email: 'zhao.liu@company.com',
        nickname: '赵六',
        phone: '13800138004',
      },
      {
        username: 'sun.qi',
        email: 'sun.qi@company.com',
        nickname: '孙七',
        phone: '13800138005',
      },
      {
        username: 'zhou.ba',
        email: 'zhou.ba@company.com',
        nickname: '周八',
        phone: '13800138006',
      },
      {
        username: 'wu.jiu',
        email: 'wu.jiu@company.com',
        nickname: '吴九',
        phone: '13800138007',
      },
      {
        username: 'zheng.shi',
        email: 'zheng.shi@company.com',
        nickname: '郑十',
        phone: '13800138008',
      },
      {
        username: 'chen.ming',
        email: 'chen.ming@company.com',
        nickname: '陈明',
        phone: '13800138009',
      },
      {
        username: 'lin.hua',
        email: 'lin.hua@company.com',
        nickname: '林华',
        phone: '13800138010',
      },
      {
        username: 'huang.lei',
        email: 'huang.lei@company.com',
        nickname: '黄磊',
        phone: '13800138011',
      },
      {
        username: 'xu.fang',
        email: 'xu.fang@company.com',
        nickname: '徐芳',
        phone: '13800138012',
      },
      {
        username: 'zhu.gang',
        email: 'zhu.gang@company.com',
        nickname: '朱刚',
        phone: '13800138013',
      },
      {
        username: 'he.mei',
        email: 'he.mei@company.com',
        nickname: '何美',
        phone: '13800138014',
      },
      {
        username: 'gao.qiang',
        email: 'gao.qiang@company.com',
        nickname: '高强',
        phone: '13800138015',
      },
      {
        username: 'ma.jun',
        email: 'ma.jun@company.com',
        nickname: '马俊',
        phone: '13800138016',
      },
      {
        username: 'luo.yan',
        email: 'luo.yan@company.com',
        nickname: '罗燕',
        phone: '13800138017',
      },
      {
        username: 'liang.bo',
        email: 'liang.bo@company.com',
        nickname: '梁波',
        phone: '13800138018',
      },
      {
        username: 'song.jie',
        email: 'song.jie@company.com',
        nickname: '宋杰',
        phone: '13800138019',
      },
      {
        username: 'tang.yu',
        email: 'tang.yu@company.com',
        nickname: '唐宇',
        phone: '13800138020',
      },
    ];

    // 创建普通用户角色（如果不存在）
    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: '普通用户角色，拥有基础权限',
      },
    });

    // 为普通用户角色分配基础权限
    const basicPermissions = await prisma.permission.findMany({
      where: {
        code: {
          in: ['user:view', 'resource:view'],
        },
      },
    });

    if (basicPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: basicPermissions.map((permission) => ({
          roleId: userRole.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 批量创建测试用户
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      const departmentToUse = i % 2 === 0 ? department : hrDepartment; // 交替分配部门
      const positionToUse = i % 2 === 0 ? position : hrPosition; // 交替分配岗位

      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          username: userData.username,
          nickname: userData.nickname,
          phone: userData.phone,
          password: hashedPassword,
          avatar: '',
          remark: `测试用户 - ${userData.nickname}`,
          status: 1,
          departmentId: departmentToUse.id,
          positionId: positionToUse.id,
          roles: {
            connect: { id: userRole.id },
          },
        },
      });
    }

    console.log(`✅ 成功创建 ${testUsers.length} 个测试用户`);
    console.log('📝 测试用户登录信息:');
    console.log('   用户名格式: zhang.san, li.si, wang.wu...');
    console.log('   邮箱格式: zhang.san@company.com');
    console.log('   统一密码: 123456');
  }

  console.log('数据库初始化完成！');
  console.log('管理员账户信息:');
  console.log(`  邮箱: ${adminUser.email}`);
  console.log(`  用户名: ${adminUser.username}`);
  console.log(`  手机号: ${adminUser.phone}`);
  console.log(`  密码: admin123`);
  console.log(
    `  角色: ${adminUser.roles?.map((role: any) => role.name).join(', ') || ''}`,
  );
  console.log(
    `  权限数量: ${adminUser.roles?.reduce((total: number, role: any) => total + (role.rolePermissions?.length || 0), 0) || 0}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
