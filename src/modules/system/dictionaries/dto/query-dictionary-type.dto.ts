import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryDictionaryTypeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '字典类型编码',
    example: 'user_status',
  })
  @IsOptional()
  @IsString({ message: '字典类型编码必须是字符串' })
  code?: string;

  @ApiPropertyOptional({
    description: '字典类型名称',
    example: '用户状态',
  })
  @IsOptional()
  @IsString({ message: '字典类型名称必须是字符串' })
  name?: string;

  @ApiPropertyOptional({
    description: '状态：disabled-禁用, enabled-启用',
    example: 'enabled',
  })
  @IsOptional()
  @IsString()
  status?: string;

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
}
