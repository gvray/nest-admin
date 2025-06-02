import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedPermissions } from './seeds/permissions';

const prisma = new PrismaClient();

async function main() {
  // 初始化权限
  await seedPermissions();

  // 创建管理员角色
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
  const allPermissions = await prisma.permission.findMany();
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: allPermissions.map((permission) => ({ id: permission.id })),
      },
    },
  });

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      roles: {
        connect: { id: adminRole.id },
      },
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      isActive: true,
      roles: {
        connect: { id: adminRole.id },
      },
    },
  });

  console.log('数据库初始化完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 