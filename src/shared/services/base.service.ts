import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginationSortDto } from '../dtos/pagination.dto';
import { ResponseUtil } from '../utils/response.util';
import { PaginationResponse } from '../interfaces/response.interface';

/**
 * 基础服务类
 * 提供通用的CRUD操作和分页查询方法
 */
@Injectable()
export abstract class BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  protected buildWhere(params: {
    contains?: Record<string, string | undefined>;
    equals?: Record<string, unknown>;
    date?: {
      field: string;
      range?: string;
      start?: string;
      end?: string;
      separator?: string;
    };
  }): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (params.contains) {
      for (const [key, val] of Object.entries(params.contains)) {
        if (val !== undefined && val !== '') {
          where[key] = { contains: val };
        }
      }
    }
    if (params.equals) {
      for (const [key, val] of Object.entries(params.equals)) {
        if (val !== undefined && val !== null) {
          where[key] = val;
        }
      }
    }
    const d = params.date;
    if (d) {
      if (d.range) {
        const sep = d.separator ?? '_to_';
        const [startDate, endDate] = d.range.split(sep);
        if (startDate && endDate) {
          where[d.field] = {
            gte: new Date(startDate + 'T00:00:00.000Z'),
            lte: new Date(endDate + 'T23:59:59.999Z'),
          };
        }
      } else if (d.start || d.end) {
        const o: Record<string, Date> = {};
        if (d.start) o.gte = new Date(d.start);
        if (d.end) o.lte = new Date(d.end);
        where[d.field] = o;
      }
    }
    return where;
  }

  protected getPaginationState(
    pagination: PaginationDto,
  ): { skip: number; take: number; page: number; pageSize: number } | null {
    const skip = pagination.getSkip();
    const take = pagination.getTake();
    if (skip === undefined || take === undefined) return null;
    return {
      skip,
      take,
      page: pagination.page!,
      pageSize: pagination.pageSize!,
    };
  }

  /**
   * 执行分页查询
   * @param model Prisma模型
   * @param pagination 分页参数
   * @param where 查询条件
   * @param include 关联查询
   * @param orderBy 排序条件
   * @returns 分页结果
   */
  protected async paginate<T>(
    model: {
      findMany: (args: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, unknown> | Record<string, unknown>[];
        skip?: number;
        take?: number;
      }) => Promise<T[]>;
      count: (args: { where?: Record<string, unknown> }) => Promise<number>;
    },
    pagination: PaginationDto,
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
    orderBy?: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<{ items: T[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize } = pagination;
    const skip = pagination.getSkip();
    const take = pagination.getTake();

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        include,
        orderBy,
        skip,
        take,
      }),
      model.count({ where }),
    ]);

    return {
      items,
      total,
      page: page!,
      pageSize: pageSize!,
    };
  }

  /**
   * 执行分页查询并返回统一格式
   * @param model Prisma模型
   * @param pagination 分页参数
   * @param where 查询条件
   * @param include 关联查询
   * @param orderBy 排序条件
   * @param message 响应消息
   * @param path 请求路径
   * @returns 分页响应
   */
  protected async paginateWithResponse<T>(
    model: {
      findMany: (args?: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: any;
        skip?: number;
        take?: number;
      }) => Promise<T[]>;
      count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    },
    pagination: PaginationDto,
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
    orderBy?: any,
    message?: string,
  ): Promise<PaginationResponse<T>> {
    const result = await this.paginate<T>(
      model,
      pagination,
      where,
      include,
      orderBy,
    );
    const paginationData = {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };

    return ResponseUtil.paginated(paginationData, message);
  }

  /**
   * 执行分页排序查询
   * @param model Prisma模型
   * @param pagination 分页排序参数
   * @param where 查询条件
   * @param include 关联查询
   * @param defaultSortBy 默认排序字段
   * @returns 分页结果
   */
  protected async paginateWithSort<T>(
    model: {
      findMany: (args: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
        skip?: number;
        take?: number;
      }) => Promise<T[]>;
      count: (args: { where?: Record<string, unknown> }) => Promise<number>;
    },
    pagination: PaginationSortDto,
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
    defaultSortBy: string = 'createdAt',
  ): Promise<{ items: T[]; total: number; page: number; pageSize: number }> {
    const orderBy = pagination.getOrderBy(defaultSortBy);
    return this.paginate<T>(model, pagination, where, include, orderBy);
  }

  /**
   * 执行分页排序查询并返回统一格式
   * @param model Prisma模型
   * @param pagination 分页排序参数
   * @param where 查询条件
   * @param include 关联查询
   * @param defaultSortBy 默认排序字段
   * @param message 响应消息
   * @param path 请求路径
   * @returns 分页响应
   */
  protected async paginateWithSortAndResponse<T>(
    model: {
      findMany: (args: {
        where?: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
        skip?: number;
        take?: number;
      }) => Promise<T[]>;
      count: (args: { where?: Record<string, unknown> }) => Promise<number>;
    },
    pagination: PaginationSortDto,
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
    defaultSortBy: string = 'createdAt',
    message?: string,
  ): Promise<PaginationResponse<T>> {
    const result = await this.paginateWithSort<T>(
      model,
      pagination,
      where,
      include,
      defaultSortBy,
    );
    const paginationData = {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };

    return ResponseUtil.paginated(paginationData, message);
  }

  /**
   * 检查记录是否存在
   * @param model Prisma模型
   * @param where 查询条件
   * @param errorMessage 错误消息
   * @returns 记录
   */
  protected async findOneOrFail<T>(
    model: {
      findUnique: (args: {
        where: Record<string, unknown>;
      }) => Promise<T | null>;
    },
    where: Record<string, unknown>,
    errorMessage: string = '记录不存在',
  ): Promise<T> {
    const record = await model.findUnique({ where });
    if (!record) {
      throw new Error(errorMessage);
    }
    return record;
  }

  /**
   * 检查记录是否存在（包含关联数据）
   * @param model Prisma模型
   * @param where 查询条件
   * @param include 关联查询
   * @param errorMessage 错误消息
   * @returns 记录
   */
  protected async findOneWithIncludeOrFail<T>(
    model: {
      findUnique: (args: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => Promise<T | null>;
    },
    where: Record<string, unknown>,
    include: Record<string, unknown>,
    errorMessage: string = '记录不存在',
  ): Promise<T> {
    const record = await model.findUnique({ where, include });
    if (!record) {
      throw new Error(errorMessage);
    }
    return record;
  }
}
