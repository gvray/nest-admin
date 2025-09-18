import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLoginLogDto } from './dto/create-login-log.dto';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import {
  ApiResponse,
  PaginationResponse,
} from '@/shared/interfaces/response.interface';

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
  ): Promise<
    PaginationResponse<LoginLogResponseDto> | ApiResponse<LoginLogResponseDto[]>
  > {
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

    const where: Record<string, unknown> = {};

    if (account) {
      where.account = { contains: account };
    }

    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location };
    }

    if (device) {
      where.device = { contains: device };
    }

    if (browser) {
      where.browser = { contains: browser };
    }

    if (os) {
      where.os = { contains: os };
    }

    if (loginType) {
      where.loginType = { contains: loginType };
    }

    // 处理日期范围查询
    if (dateRange) {
      const [startDate, endDate] = dateRange.split('_to_');
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate + 'T00:00:00.000Z'),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        };
      }
    } else if (createdAtStart || createdAtEnd) {
      where.createdAt = {};
      if (createdAtStart) {
        (where.createdAt as Record<string, any>).gte = new Date(createdAtStart);
      }
      if (createdAtEnd) {
        (where.createdAt as Record<string, any>).lte = new Date(createdAtEnd);
      }
    }

    // 移除 user 关联，因为当前 schema 中没有这个关系

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query.getSkip();
    const take = query.getTake();

    if (skip !== undefined && take !== undefined && query) {
      const result = (await this.paginateWithResponse(
        this.prisma.loginLog,
        query,
        where,
        undefined,
        [{ createdAt: 'desc' }],
        '登录日志查询成功',
      )) as PaginationResponse<any>;

      if (
        'data' in result &&
        result.data &&
        'items' in result.data &&
        Array.isArray(result.data.items)
      ) {
        const transformedItems = plainToInstance(
          LoginLogResponseDto,
          result.data.items,
          {
            excludeExtraneousValues: true,
          },
        );
        return {
          ...result,
          data: {
            ...result.data,
            items: transformedItems,
          },
        };
      }

      return result;
    }

    // 不分页查询
    const loginLogs = await this.prisma.loginLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    const loginLogResponses = plainToInstance(LoginLogResponseDto, loginLogs, {
      excludeExtraneousValues: true,
    });
    return ResponseUtil.success(loginLogResponses, '登录日志查询成功');
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
    const existingLoginLog = await this.prisma.loginLog.findFirst({
      where: { id: Number(id) },
    });

    if (!existingLoginLog) {
      throw new Error(`登录日志ID ${id} 不存在`);
    }

    await this.prisma.loginLog.delete({
      where: { id: existingLoginLog.id },
    });
  }

  // 批量删除登录日志
  async removeMany(ids: string[]): Promise<void> {
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

  // 清理指定天数之前的登录日志
  async cleanOldLogs(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.loginLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // 获取登录统计信息
  async getLoginStats(days: number = 7): Promise<any> {
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
