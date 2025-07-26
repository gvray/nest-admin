import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 分页查询DTO
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: '页码',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  pageSize?: number = 10;

  /**
   * 获取跳过的记录数
   * @returns 跳过的记录数
   */
  getSkip(): number {
    return ((this.page || 1) - 1) * (this.pageSize || 10);
  }

  /**
   * 获取查询数量
   * @returns 查询数量
   */
  getTake(): number {
    return this.pageSize || 10;
  }
}

/**
 * 排序DTO
 */
export class SortDto {
  @ApiPropertyOptional({
    description: '排序字段',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 分页排序DTO
 */
export class PaginationSortDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '排序字段',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * 获取排序配置
   * @param defaultSortBy 默认排序字段
   * @returns 排序配置
   */
  getOrderBy(defaultSortBy: string = 'createdAt'): Record<string, 'asc' | 'desc'> {
    const sortBy = this.sortBy || defaultSortBy;
    return { [sortBy]: this.sortOrder || 'desc' };
  }
}