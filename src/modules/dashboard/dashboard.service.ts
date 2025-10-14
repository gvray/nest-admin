import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<{ users: number; roles: number; permissions: number }> {
    const [users, roles, permissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
    ]);
    return { users, roles, permissions };
  }

  async getRoleDistribution(): Promise<Array<{ name: string; value: number }>> {
    const roles = await this.prisma.role.findMany({
      select: { name: true, roleId: true },
    });

    if (roles.length === 0) return [];

    const counts = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      _count: { roleId: true },
    });

    const countMap = new Map<string, number>(
      counts.map((c) => [c.roleId, c._count.roleId])
    );

    return roles.map((r) => ({ name: r.name, value: countMap.get(r.roleId) ?? 0 }));
  }

  async getLoginTrendLast7Days(): Promise<Array<{ date: string; value: number }>> {
    const days = 7;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const logs = await this.prisma.loginLog.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: { createdAt: true },
    });

    const formatDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const trendMap = new Map<string, number>();
    // 先初始化 7 天为 0
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      trendMap.set(formatDate(d), 0);
    }

    // 统计日志数量（总次数，不区分成败）
    for (const log of logs) {
      const key = formatDate(new Date(log.createdAt));
      const prev = trendMap.get(key) ?? 0;
      trendMap.set(key, prev + 1);
    }

    return Array.from(trendMap.entries()).map(([date, value]) => ({ date, value }));
  }
}


