import { IsOptional, IsString, IsInt } from 'class-validator';
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
    description: '创建时间开始（YYYY-MM-DD）',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建时间结束（YYYY-MM-DD）',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsString()
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
