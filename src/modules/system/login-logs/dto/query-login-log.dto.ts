import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryLoginLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '登录用户名/邮箱/手机号' })
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional({ description: '登录IP地址' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: '登录状态：1-成功, 0-失败' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional({
    description: '日期范围（格式：YYYY-MM-DD_to_YYYY-MM-DD）',
    example: '2025-01-20_to_2025-01-25',
  })
  @IsOptional()
  @IsString()
  dateRange?: string;

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

  @ApiPropertyOptional({ description: '登录地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '设备信息' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: '浏览器信息' })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统信息' })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional({ description: '登录类型' })
  @IsOptional()
  @IsString()
  loginType?: string;
}
