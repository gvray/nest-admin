import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLoginLogDto } from './dto/create-login-log.dto';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { LoginStatsResponse } from './dto/login-stats-response.dto';

@Injectable()
export class LoginLogsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createLoginLogDto: CreateLoginLogDto,
  ): Promise<LoginLogResponseDto> {
    const loginLog = await this.prisma.loginLog.create({
      data: createLoginLogDto,
    });

    return plainToInstance(LoginLogResponseDto, loginLog, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryLoginLogDto,
  ): Promise<PaginationData<LoginLogResponseDto>> {
    const {
      account,
      ipAddress,
      status,
      dateRange,
      createdAtStart,
      createdAtEnd,
      location,
      device,
      browser,
      os,
      loginType,
    } = query;

    const where = this.buildWhere({
      contains: {
        account,
        ipAddress,
        location,
        device,
        browser,
        os,
        loginType,
      },
      equals: {
        status,
      },
      date: {
        field: 'createdAt',
        range: dateRange,
        start: createdAtStart,
        end: createdAtEnd,
        separator: '_to_',
      },
    });

    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.loginLog.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.loginLog.count({ where }),
      ]);
      const transformedItems = plainToInstance(LoginLogResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformedItems,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }

    // 不分页查询
    const loginLogs = await this.prisma.loginLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    const total = await this.prisma.loginLog.count({ where });
    const loginLogResponses = plainToInstance(LoginLogResponseDto, loginLogs, {
      excludeExtraneousValues: true,
    });
    return {
      items: loginLogResponses,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? loginLogResponses.length,
    };
  }

  async findOne(id: string): Promise<LoginLogResponseDto> {
    const loginLog = await this.prisma.loginLog.findFirst({
      where: { id: Number(id) },
    });

    if (!loginLog) {
      throw new Error(`登录日志ID ${id} 不存在`);
    }

    return plainToInstance(LoginLogResponseDto, loginLog, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      throw new BadRequestException('无效的登录日志ID');
    }
    const existing = await this.prisma.loginLog.findUnique({
      where: { id: numericId },
    });
    if (!existing) {
      throw new NotFoundException(`登录日志ID ${id} 不存在`);
    }
    await this.prisma.loginLog.delete({
      where: { id: numericId },
    });
  }

  // 批量删除登录日志
  async removeMany(ids: number[]): Promise<void> {
    const numericIds = ids
      .filter((id) => !isNaN(Number(id)))
      .map((id) => Number(id));

    if (numericIds.length > 0) {
      await this.prisma.loginLog.deleteMany({
        where: {
          id: {
            in: numericIds,
          },
        },
      });
    }
  }

  // 清空所有登录日志
  async clearAll(): Promise<number> {
    const res = await this.prisma.loginLog.deleteMany({});
    return res.count;
  }

  // 清理指定天数之前的登录日志
  async cleanBeforeDays(days: number): Promise<number> {
    if (!Number.isInteger(days) || days < 1) {
      throw new BadRequestException('days 必须为正整数');
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const res = await this.prisma.loginLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return res.count;
  }

  // 获取登录统计信息
  async getLoginStats(days: number = 7): Promise<LoginStatsResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 总登录次数
    const totalLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // 成功登录次数
    const successLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 1,
      },
    });

    // 失败登录次数
    const failedLogins = await this.prisma.loginLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 0,
      },
    });

    // 独立账户数（基于 account 字段）
    const uniqueAccounts = await this.prisma.loginLog.groupBy({
      by: ['account'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    return {
      totalLogins,
      successLogins,
      failedLogins,
      uniqueAccounts: uniqueAccounts.length,
      successRate: totalLogins > 0 ? (successLogins / totalLogins) * 100 : 0,
    };
  }
}
