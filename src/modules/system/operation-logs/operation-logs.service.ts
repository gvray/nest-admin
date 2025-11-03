import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { OperationLogResponseDto } from './dto/operation-log-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import { ApiResponse, PaginationResponse } from '@/shared/interfaces/response.interface';

@Injectable()
export class OperationLogsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findAll(
    query: QueryOperationLogDto,
  ): Promise<
    PaginationResponse<OperationLogResponseDto> | ApiResponse<OperationLogResponseDto[]>
  > {
    const where: Prisma.OperationLogWhereInput = {};
    const {
      username,
      userId,
      module,
      action,
      status,
      path,
      keyword,
      startTime,
      endTime,
    } = query;

    if (username) where.username = { contains: username };
    if (userId) where.userId = userId;
    if (module) where.module = { contains: module };
    if (action) where.action = action;
    if (status !== undefined) where.status = status as number;
    if (path) where.path = { contains: path };
    if (keyword) {
      where.OR = [
        { message: { contains: keyword } },
        { path: { contains: keyword } },
        { resource: { contains: keyword } },
      ];
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const skip = query.getSkip?.();
    const take = query.getTake?.();

    if (skip !== undefined && take !== undefined) {
      const paged = await this.paginateWithResponse(
        this.prisma.operationLog,
        query,
        where,
        undefined,
        [{ createdAt: 'desc' }],
        '操作日志查询成功',
      );

      if (
        paged &&
        paged.data &&
        Array.isArray((paged as any).data.items)
      ) {
        const transformed = plainToInstance(
          OperationLogResponseDto,
          (paged as any).data.items,
          { excludeExtraneousValues: true },
        );
        (paged as any).data.items = transformed;
      }
      return paged as unknown as PaginationResponse<OperationLogResponseDto>;
    }

    const logs = await this.prisma.operationLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
    const data = plainToInstance(OperationLogResponseDto, logs, {
      excludeExtraneousValues: true,
    });
    return ResponseUtil.success(data, '操作日志查询成功');
  }

  async findOne(id: number): Promise<OperationLogResponseDto> {
    const log = await this.prisma.operationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('操作日志不存在');
    return plainToInstance(OperationLogResponseDto, log, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number) {
    await this.prisma.operationLog.delete({ where: { id } });
    return { deleted: 1 };
  }

  async removeMany(ids: number[]): Promise<void> {
    const numericIds = ids.filter((x) => typeof x === 'number');
    if (numericIds.length > 0) {
      await this.prisma.operationLog.deleteMany({
        where: { id: { in: numericIds } },
      });
    }
  }

  async clean(before?: Date) {
    const where: Prisma.OperationLogWhereInput = before
      ? { createdAt: { lte: before } }
      : {};
    const res = await this.prisma.operationLog.deleteMany({ where });
    return { deleted: res.count };
  }
}
