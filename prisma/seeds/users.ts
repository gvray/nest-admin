import { PrismaClient, Department, Position, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Gender } from '../../src/shared/constants/gender.constant';
import { SUPER_ROLE_KEY } from '../../src/shared/constants/role.constant';

export async function seedUsers(
  prisma: PrismaClient,
  departments: { itDepartment: Department; hrDepartment: Department },
  positions: { managerPosition: Position; hrPosition: Position },
  roles: { superRole: Role; adminRole: Role; userRole: Role },
) {
  console.log('开始创建用户...');

  // 创建超级管理员用户（不可删除和禁用）
  console.log('创建超级管理员用户...');
  const hashedSuperPassword = await bcrypt.hash('super123', 10);
  const superUser = await prisma.user.upsert({
    where: { email: 'super@example.com' },
    update: {
      phone: '13900139000',
      status: 1, // 确保启用状态
    },
    create: {
      email: 'super@example.com',
      username: SUPER_ROLE_KEY,
      nickname: '超级管理员',
      phone: '13900139000',
      password: hashedSuperPassword,
      gender: Gender.OTHER, // 3-未知
      status: 1, // 确保启用状态
      remark: '系统超级管理员，不可删除和禁用',
    },
  });

  // 创建用户角色关联
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superUser.userId,
        roleId: roles.superRole.roleId,
      },
    },
    update: {},
    create: {
      userId: superUser.userId,
      roleId: roles.superRole.roleId,
    },
  });
  // 创建超级管理员用户设置
  const superSettings = {
    theme: 'light',
    language: 'zh-CN',
    sidebarCollapsed: false,
    pageSize: 20,
    timezone: 'Asia/Shanghai',
    showWatermark: true,
    enableNotification: true,
    colorScheme: 'default',
  };
  await prisma.userSettings.upsert({
    where: { userId: superUser.userId },
    update: { settings: superSettings },
    create: { userId: superUser.userId, settings: superSettings },
  });
  console.log(`超级管理员用户创建成功: ${superUser.username}`);

  // 创建管理员用户
  console.log('创建管理员用户...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      departmentId: departments.itDepartment.departmentId,
      phone: '13800138000',
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      nickname: '管理员',
      phone: '13800138000',
      password: hashedAdminPassword,
      gender: Gender.MALE, // 1-男
      status: 1 as const, // 启用状态
      departmentId: departments.itDepartment.departmentId,
    },
  });

  // 创建用户角色关联
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.userId,
        roleId: roles.adminRole.roleId,
      },
    },
    update: {},
    create: {
      userId: adminUser.userId,
      roleId: roles.adminRole.roleId,
    },
  });

  // 创建用户岗位关联
  await prisma.userPosition.upsert({
    where: {
      userId_positionId: {
        userId: adminUser.userId,
        positionId: positions.managerPosition.positionId,
      },
    },
    update: {},
    create: {
      userId: adminUser.userId,
      positionId: positions.managerPosition.positionId,
    },
  });

  // 创建管理员用户设置
  const adminSettings = {
    theme: 'dark',
    language: 'zh-CN',
    sidebarCollapsed: false,
    pageSize: 10,
    timezone: 'Asia/Shanghai',
    showWatermark: false,
    enableNotification: true,
    colorScheme: 'blue',
  };
  await prisma.userSettings.upsert({
    where: { userId: adminUser.userId },
    update: { settings: adminSettings },
    create: { userId: adminUser.userId, settings: adminSettings },
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
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'li.si',
        email: 'li.si@company.com',
        nickname: '李四',
        phone: '13800138002',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'wang.wu',
        email: 'wang.wu@company.com',
        nickname: '王五',
        phone: '13800138003',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'zhao.liu',
        email: 'zhao.liu@company.com',
        nickname: '赵六',
        phone: '13800138004',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'sun.qi',
        email: 'sun.qi@company.com',
        nickname: '孙七',
        phone: '13800138005',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'zhou.ba',
        email: 'zhou.ba@company.com',
        nickname: '周八',
        phone: '13800138006',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'wu.jiu',
        email: 'wu.jiu@company.com',
        nickname: '吴九',
        phone: '13800138007',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'zheng.shi',
        email: 'zheng.shi@company.com',
        nickname: '郑十',
        phone: '13800138008',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'chen.ming',
        email: 'chen.ming@company.com',
        nickname: '陈明',
        phone: '13800138009',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'lin.hua',
        email: 'lin.hua@company.com',
        nickname: '林华',
        phone: '13800138010',
        gender: Gender.FEMALE, // 2-女
      },
      {
        username: 'huang.lei',
        email: 'huang.lei@company.com',
        nickname: '黄磊',
        phone: '13800138011',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'xu.fang',
        email: 'xu.fang@company.com',
        nickname: '徐芳',
        phone: '13800138012',
        gender: Gender.FEMALE, // 2-女
      },
      {
        username: 'zhu.gang',
        email: 'zhu.gang@company.com',
        nickname: '朱刚',
        phone: '13800138013',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'he.mei',
        email: 'he.mei@company.com',
        nickname: '何美',
        phone: '13800138014',
        gender: Gender.FEMALE, // 2-女
      },
      {
        username: 'gao.qiang',
        email: 'gao.qiang@company.com',
        nickname: '高强',
        phone: '13800138015',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'ma.jun',
        email: 'ma.jun@company.com',
        nickname: '马俊',
        phone: '13800138016',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'luo.yan',
        email: 'luo.yan@company.com',
        nickname: '罗燕',
        phone: '13800138017',
        gender: Gender.FEMALE, // 2-女
      },
      {
        username: 'liang.bo',
        email: 'liang.bo@company.com',
        nickname: '梁波',
        phone: '13800138018',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'song.jie',
        email: 'song.jie@company.com',
        nickname: '宋杰',
        phone: '13800138019',
        gender: Gender.MALE, // 1-男
      },
      {
        username: 'tang.yu',
        email: 'tang.yu@company.com',
        nickname: '唐宇',
        phone: '13800138020',
        gender: Gender.MALE, // 1-男
      },
    ];

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 批量创建测试用户
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      const departmentToUse =
        i % 2 === 0 ? departments.itDepartment : departments.hrDepartment; // 交替分配部门
      const positionToUse =
        i % 2 === 0 ? positions.managerPosition : positions.hrPosition; // 交替分配岗位

      const user = await prisma.user.upsert({
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
          status: 1 as const,
          departmentId: departmentToUse.departmentId,
        },
      });

      // 创建用户角色关联
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.userId,
            roleId: roles.userRole.roleId,
          },
        },
        update: {},
        create: {
          userId: user.userId,
          roleId: roles.userRole.roleId,
        },
      });

      // 创建用户岗位关联
      await prisma.userPosition.upsert({
        where: {
          userId_positionId: {
            userId: user.userId,
            positionId: positionToUse.positionId,
          },
        },
        update: {},
        create: {
          userId: user.userId,
          positionId: positionToUse.positionId,
        },
      });

      // 创建用户设置
      const testSettings = {
        theme: i % 3 === 0 ? 'dark' : 'light',
        language: 'zh-CN',
        sidebarCollapsed: i % 2 === 0,
        pageSize: [10, 20, 50][i % 3],
        timezone: 'Asia/Shanghai',
        showWatermark: true,
        enableNotification: i % 4 !== 0,
        colorScheme: ['default', 'blue', 'green', 'purple'][i % 4],
      };
      await prisma.userSettings.upsert({
        where: { userId: user.userId },
        update: { settings: testSettings },
        create: { userId: user.userId, settings: testSettings },
      });
    }

    console.log(`✅ 成功创建 ${testUsers.length} 个测试用户`);
    console.log('📝 测试用户登录信息:');
    console.log('   用户名格式: zhang.san, li.si, wang.wu...');
    console.log('   邮箱格式: zhang.san@company.com');
    console.log('   统一密码: 123456');
  }

  console.log('用户创建完成');

  return { superUser, adminUser };
}


