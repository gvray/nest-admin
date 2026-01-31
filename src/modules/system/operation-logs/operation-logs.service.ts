import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { OperationLogResponseDto } from './dto/operation-log-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';

@Injectable()
export class OperationLogsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async findAll(
    query: QueryOperationLogDto,
  ): Promise<PaginationData<OperationLogResponseDto>> {
    const {
      username,
      userId,
      module,
      action,
      status,
      path,
      keyword,
      createdAtStart,
      createdAtEnd,
      id,
    } = query;

    const where: Prisma.OperationLogWhereInput = this.buildWhere({
      contains: { username, module, path },
      equals: { userId, action, status, id },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    }) as Prisma.OperationLogWhereInput;
    if (keyword) {
      where.OR = [
        { message: { contains: keyword } },
        { path: { contains: keyword } },
        { resource: { contains: keyword } },
      ];
    }

    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.operationLog.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.operationLog.count({ where }),
      ]);
      const transformed = plainToInstance(OperationLogResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }

    const items = await this.prisma.operationLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
    const total = await this.prisma.operationLog.count({ where });
    const transformed = plainToInstance(OperationLogResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(id: number): Promise<OperationLogResponseDto> {
    const log = await this.prisma.operationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('操作日志不存在');
    return plainToInstance(OperationLogResponseDto, log, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number): Promise<void> {
    if (!Number.isInteger(id)) {
      throw new BadRequestException('无效的操作日志ID');
    }
    const existing = await this.prisma.operationLog.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`操作日志ID ${id} 不存在`);
    }
    await this.prisma.operationLog.delete({ where: { id } });
  }

  async removeMany(ids: (string | number)[]): Promise<void> {
    const numericIds = ids
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n));
    if (numericIds.length > 0) {
      await this.prisma.operationLog.deleteMany({
        where: { id: { in: numericIds } },
      });
    }
  }

  async clearAll(): Promise<number> {
    const res = await this.prisma.operationLog.deleteMany({});
    return res.count;
  }

  async cleanBeforeDays(days: number): Promise<number> {
    if (!Number.isInteger(days) || days < 1) {
      throw new BadRequestException('days 必须为正整数');
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const res = await this.prisma.operationLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return res.count;
  }
}
