import { PrismaClient } from '@prisma/client';

export async function seedPositions(prisma: PrismaClient) {
  console.log('开始创建岗位...');
  
  // 创建开发工程师岗位
  const developerPosition = await prisma.position.upsert({
    where: { code: 'DEVELOPER' },
    update: {},
    create: {
      name: '开发工程师',
      code: 'DEVELOPER',
      description: '负责系统开发',
      status: 1,
      sort: 1,
    },
  });

  // 创建部门经理岗位
  const managerPosition = await prisma.position.upsert({
    where: { code: 'MANAGER' },
    update: {},
    create: {
      name: '部门经理',
      code: 'MANAGER',
      description: '负责部门管理',
      status: 1,
      sort: 2,
    },
  });

  // 创建HR专员岗位
  const hrPosition = await prisma.position.upsert({
    where: { code: 'HR_SPECIALIST' },
    update: {},
    create: {
      name: 'HR专员',
      code: 'HR_SPECIALIST',
      description: '负责人力资源相关工作',
      status: 1,
      sort: 3,
    },
  });

  // 创建会计岗位
  const accountantPosition = await prisma.position.upsert({
    where: { code: 'ACCOUNTANT' },
    update: {},
    create: {
      name: '会计',
      code: 'ACCOUNTANT',
      description: '负责财务核算',
      status: 1,
      sort: 4,
    },
  });

  // 创建系统管理员岗位
  const adminPosition = await prisma.position.upsert({
    where: { name: '系统管理员' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'ADMIN',
      description: '负责系统管理和维护',
      status: 1,
      sort: 5,
    },
  });

  console.log('岗位创建完成');
  
  // 返回用于用户分配的岗位
  return { 
    developerPosition, 
    managerPosition, 
    hrPosition, 
    accountantPosition, 
    adminPosition 
  };
} 