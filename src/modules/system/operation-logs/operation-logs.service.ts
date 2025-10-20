import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OperationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    page?: number;
    pageSize?: number;
    username?: string;
    userId?: string;
    module?: string;
    action?: string;
    status?: number;
    path?: string;
    keyword?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 10)));

    const where: any = {};
    if (params.username) where.username = { contains: params.username };
    if (params.userId) where.userId = params.userId;
    if (params.module) where.module = { contains: params.module };
    if (params.action) where.action = params.action;
    if (params.status !== undefined) where.status = params.status;
    if (params.path) where.path = { contains: params.path };
    if (params.keyword) {
      where.OR = [
        { message: { contains: params.keyword } },
        { path: { contains: params.keyword } },
        { resource: { contains: params.keyword } },
      ];
    }
    if (params.startTime || params.endTime) {
      where.createdAt = {};
      if (params.startTime) where.createdAt.gte = params.startTime;
      if (params.endTime) where.createdAt.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(logId: string) {
    const log = await this.prisma.operationLog.findUnique({ where: { logId } });
    if (!log) throw new NotFoundException('操作日志不存在');
    return log;
  }

  async remove(logId: string) {
    await this.findOne(logId);
    await this.prisma.operationLog.delete({ where: { logId } });
    return { message: '删除成功' };
  }

  async clean(before?: Date) {
    const where = before ? { createdAt: { lte: before } } : {};
    const res = await this.prisma.operationLog.deleteMany({ where });
    return { message: '清理完成', deleted: res.count };
  }
}


