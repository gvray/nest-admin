import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';
import { UserStatus } from '@/shared/constants/user-status.constant';

/**
 * 查询用户DTO
 */
export class QueryUserDto extends PaginationSortDto {
  @ApiPropertyOptional({
    description: '用户名（模糊查询）',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: '手机号（模糊查询）',
    example: '138',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ENABLED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '创建时间开始（ISO 8601格式）',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建时间结束（ISO 8601格式）',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  createdAtEnd?: string;

  @ApiPropertyOptional({
    description: '日期范围（格式：YYYY-MM-DD_to_YYYY-MM-DD）',
    example: '2025-07-16_to_2025-07-19',
  })
  @IsOptional()
  @IsString()
  dateRange?: string;
}
