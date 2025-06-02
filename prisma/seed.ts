import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 查找或创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      description: '系统管理员',
    },
    create: {
      name: 'admin',
      description: '系统管理员',
      permissions: {
        create: [
          {
            name: '用户管理',
            code: 'user:manage',
            description: '用户管理权限',
          },
          {
            name: '角色管理',
            code: 'role:manage',
            description: '角色管理权限',
          },
          {
            name: '权限管理',
            code: 'permission:manage',
            description: '权限管理权限',
          },
        ],
      },
    },
  });

  // 查找或创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: hashedPassword,
      isActive: true,
      roles: {
        connect: {
          id: adminRole.id,
        },
      },
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      isActive: true,
      roles: {
        connect: {
          id: adminRole.id,
        },
      },
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 