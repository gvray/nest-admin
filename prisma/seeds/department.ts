import { PrismaClient } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient) {
  console.log('开始创建部门');
  // 创建技术部（用于管理员用户）
  const itDepartment = await prisma.department.upsert({
    where: { name: '技术部' },
    update: {},
    create: {
      name: '技术部',
      description: '负责技术开发和维护',
      status: 1,
      sort: 1,
      parentId: '00000000-0000-0000-0000-000000000000',
    },
  });

  // 创建人力资源部（用于测试用户）
  const hrDepartment = await prisma.department.upsert({
    where: { name: '人力资源部' },
    update: {},
    create: {
      name: '人力资源部',
      description: '负责人力资源管理',
      status: 1,
      sort: 2,
      parentId: '00000000-0000-0000-0000-000000000000',
    },
  });

  // 顶级：集团总部
  const groupHQ = await prisma.department.create({
    data: {
      name: '集团总部',
      description: '顶级组织结构',
      sort: 0, // 设置为0，确保排在最前面
      status: 1,
      parentId: '00000000-0000-0000-0000-000000000000',
    },
  });

  // 直属部门：财务中心
  await prisma.department.create({
    data: {
      name: '财务中心',
      description: '集团直属部门',
      parentId: groupHQ.departmentId,
      sort: 2,
      status: 1,
    },
  });

  // 华北分公司
  const northBranch = await prisma.department.create({
    data: {
      name: '华北分公司',
      description: '华北地区分公司',
      parentId: groupHQ.departmentId,
      sort: 3,
      status: 1,
    },
  });

  // 华北子部门
  await prisma.department.createMany({
    data: [
      {
        name: '研发部（华北）',
        description: '华北分公司研发部门',
        parentId: northBranch.departmentId,
        sort: 1,
        status: 1,
      },
      {
        name: '市场部（华北）',
        description: '华北市场营销',
        parentId: northBranch.departmentId,
        sort: 2,
        status: 1,
      },
    ],
  });

  // 华南分公司
  const southBranch = await prisma.department.create({
    data: {
      name: '华南分公司',
      description: '华南地区分公司',
      parentId: groupHQ.departmentId,
      sort: 4,
      status: 1,
    },
  });

  // 华南子部门
  await prisma.department.createMany({
    data: [
      {
        name: '研发部（华南）',
        description: '华南分公司研发部门',
        parentId: southBranch.departmentId,
        sort: 1,
        status: 1,
      },
      {
        name: '销售部（华南）',
        description: '华南分公司销售部门',
        parentId: southBranch.departmentId,
        sort: 2,
        status: 1,
      },
    ],
  });

  console.log('部门创建完成');

  // 返回用于用户分配的部门
  return { itDepartment, hrDepartment };
}
