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
}


