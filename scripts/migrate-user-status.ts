import { PrismaClient } from '@prisma/client';
import { UserStatus } from '../src/shared/constants/user-status.constant';

const prisma = new PrismaClient();

async function migrateUserStatus() {
  console.log('开始迁移用户状态数据...');
  
  try {
    // 由于我们已经删除了 isActive 字段，这里只是确保所有用户都有正确的默认状态
    const users = await prisma.user.findMany({
      select: { id: true, status: true }
    });
    
    console.log(`找到 ${users.length} 个用户`);
    
    // 检查是否有状态为 null 或无效的用户
    const invalidUsers = users.filter(user => 
      user.status === null || 
      user.status === undefined || 
      ![UserStatus.DISABLED, UserStatus.ENABLED, UserStatus.PENDING, UserStatus.BANNED].includes(user.status)
    );
    
    if (invalidUsers.length > 0) {
      console.log(`发现 ${invalidUsers.length} 个用户状态无效，将设置为启用状态`);
      
      for (const user of invalidUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ENABLED }
        });
      }
    }
    
    console.log('用户状态数据迁移完成！');
    
    // 显示状态统计
    const statusStats = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('\n用户状态统计:');
    statusStats.forEach(stat => {
      const statusName = {
        [UserStatus.DISABLED]: '禁用',
        [UserStatus.ENABLED]: '启用', 
        [UserStatus.PENDING]: '审核中',
        [UserStatus.BANNED]: '封禁'
      }[stat.status] || '未知';
      
      console.log(`${statusName} (${stat.status}): ${stat._count.status} 个用户`);
    });
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateUserStatus()
    .then(() => {
      console.log('\n迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移脚本执行失败:', error);
      process.exit(1);
    });
}

export default migrateUserStatus;