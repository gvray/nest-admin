import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Gender } from '../../src/shared/constants/gender.constant';

export async function seedUsers(
  prisma: PrismaClient,
  departments: { itDepartment: any; hrDepartment: any },
  positions: { managerPosition: any; hrPosition: any },
  roles: { adminRole: any; userRole: any }
) {
  console.log('开始创建用户...');
  
  // 创建管理员用户
  console.log('创建管理员用户...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      roles: {
        connect: [{ roleId: roles.adminRole.roleId }],
      },
      departmentId: departments.itDepartment.departmentId,
      positions: {
        connect: [{ positionId: positions.managerPosition.positionId }],
      },
      phone: '13800138000',
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      nickname: '管理员',
      phone: '13800138000',
      password: hashedAdminPassword,
      gender: Gender.MALE, // 1-男
      status: 1, // 启用状态
      departmentId: departments.itDepartment.departmentId,
      positions: {
        connect: [{ positionId: positions.managerPosition.positionId }],
      },
      roles: {
        connect: [{ roleId: roles.adminRole.roleId }],
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
      const departmentToUse = i % 2 === 0 ? departments.itDepartment : departments.hrDepartment; // 交替分配部门
      const positionToUse = i % 2 === 0 ? positions.managerPosition : positions.hrPosition; // 交替分配岗位

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
          departmentId: departmentToUse.departmentId,
          positions: {
            connect: [{ positionId: positionToUse.positionId }],
          },
          roles: {
            connect: [{ roleId: roles.userRole.roleId }],
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

  console.log('用户创建完成');
  
  return { adminUser };
} 