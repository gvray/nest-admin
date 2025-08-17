import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions';
import { seedResources } from './seeds/resources';
import { seedDepartments } from './seeds/department';
import { seedPositions } from './seeds/positions';
import { seedRoles } from './seeds/roles';
import { seedRolePermissions } from './seeds/role-permissions';
import { seedUsers } from './seeds/users';
import { seedDictionaries } from './seeds/dictionaries';
import { seedConfigs } from './seeds/configs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 1. 创建基础资源
  await seedResources(prisma);

  // 2. 初始化权限
  await seedPermissions(prisma);

  // 3. 创建部门
  const { itDepartment, hrDepartment } = await seedDepartments(prisma);

  // 4. 创建岗位
  const { managerPosition, hrPosition } = await seedPositions(prisma);

  // 5. 创建角色
  const { adminRole, userRole } = await seedRoles(prisma);

  // 6. 创建角色权限关联
  await seedRolePermissions(prisma);

  // 7. 创建用户
  const { adminUser } = await seedUsers(
    prisma,
    { itDepartment, hrDepartment },
    { managerPosition, hrPosition },
    { adminRole, userRole },
  );

  // 8. 创建字典数据
  await seedDictionaries(prisma);

  // 9. 创建配置数据
  await seedConfigs();

  console.log('数据库初始化完成！');
  console.log('管理员账户信息:');
  console.log(`  邮箱: ${adminUser.email}`);
  console.log(`  用户名: ${adminUser.username}`);
  console.log(`  手机号: ${adminUser.phone}`);
  console.log(`  密码: admin123`);
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
