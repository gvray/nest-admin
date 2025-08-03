import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  tableName: string;
  recordId: number;
  action: 'create' | 'update';
  operatorId?: string;
  operatorName?: string;
  timestamp: Date;
  data?: any;
}

/**
 * 审计服务
 * 提供审计日志查询功能
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取角色的审计日志
   */
  async getRoleAuditLogs(roleId?: number): Promise<AuditLogEntry[]> {
    const whereClause = roleId ? { id: roleId } : {};
    
    const roles = await this.prisma.role.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { userId: true, username: true, nickname: true },
        },
        updatedBy: {
          select: { userId: true, username: true, nickname: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const auditLogs: AuditLogEntry[] = [];

    for (const role of roles) {
      // 创建记录
      if (role.createdById) {
        auditLogs.push({
          tableName: 'roles',
          recordId: role.id,
          action: 'create',
          operatorId: role.createdById,
          operatorName: role.createdBy?.username || role.createdBy?.nickname,
          timestamp: role.createdAt,
          data: {
            name: role.name,
            description: role.description,
            remark: role.remark,
            sort: role.sort,
          },
        });
      }

      // 更新记录（如果有更新者且更新时间不等于创建时间）
      if (role.updatedById && role.updatedAt.getTime() !== role.createdAt.getTime()) {
        auditLogs.push({
          tableName: 'roles',
          recordId: role.id,
          action: 'update',
          operatorId: role.updatedById,
          operatorName: role.updatedBy?.username || role.updatedBy?.nickname,
          timestamp: role.updatedAt,
          data: {
            name: role.name,
            description: role.description,
            remark: role.remark,
            sort: role.sort,
          },
        });
      }
    }

    return auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取用户的审计日志
   */
  async getUserAuditLogs(userId?: string): Promise<AuditLogEntry[]> {
    const whereClause = userId ? { userId } : {};
    
    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { userId: true, username: true, nickname: true },
        },
        updatedBy: {
          select: { userId: true, username: true, nickname: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const auditLogs: AuditLogEntry[] = [];

    for (const user of users) {
      // 创建记录
      if (user.createdById) {
        auditLogs.push({
          tableName: 'users',
          recordId: user.id,
          action: 'create',
          operatorId: user.createdById,
          operatorName: user.createdBy?.username || user.createdBy?.nickname,
          timestamp: user.createdAt,
          data: {
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            phone: user.phone,
          },
        });
      }

      // 更新记录
      if (user.updatedById && user.updatedAt.getTime() !== user.createdAt.getTime()) {
        auditLogs.push({
          tableName: 'users',
          recordId: user.id,
          action: 'update',
          operatorId: user.updatedById,
          operatorName: user.updatedBy?.username || user.updatedBy?.nickname,
          timestamp: user.updatedAt,
          data: {
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            phone: user.phone,
          },
        });
      }
    }

    return auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取操作者的操作历史
   */
  async getOperatorHistory(operatorId: string): Promise<{
    createdRoles: number;
    updatedRoles: number;
    createdUsers: number;
    updatedUsers: number;
    lastActivity: Date | null;
  }> {
    const [
      createdRoles,
      updatedRoles,
      createdUsers,
      updatedUsers,
    ] = await Promise.all([
      this.prisma.role.count({ where: { createdById: operatorId } }),
      this.prisma.role.count({ where: { updatedById: operatorId } }),
      this.prisma.user.count({ where: { createdById: operatorId } }),
      this.prisma.user.count({ where: { updatedById: operatorId } }),
    ]);

    // 获取最后活动时间
    const lastRoleActivity = await this.prisma.role.findFirst({
      where: { 
        OR: [
          { createdById: operatorId },
          { updatedById: operatorId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const lastUserActivity = await this.prisma.user.findFirst({
      where: { 
        OR: [
          { createdById: operatorId },
          { updatedById: operatorId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const lastActivity = [lastRoleActivity?.updatedAt, lastUserActivity?.updatedAt]
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] || null;

    return {
      createdRoles,
      updatedRoles,
      createdUsers,
      updatedUsers,
      lastActivity,
    };
  }
}