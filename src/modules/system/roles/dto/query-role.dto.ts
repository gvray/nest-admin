import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '角色名称（支持模糊查询）',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '角色描述（支持模糊查询）',
    example: '管理员',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '角色状态（0: 禁用, 1: 启用）',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @ApiPropertyOptional({
    description: '角色键（支持模糊查询）',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  roleKey?: string;

  @ApiPropertyOptional({
    description: '创建开始日期',
    example: '2025-08-01',
  })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建结束日期',
    example: '2025-08-31',
  })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
