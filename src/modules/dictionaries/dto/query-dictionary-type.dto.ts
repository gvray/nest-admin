import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

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
    description: '状态：0-禁用, 1-启用',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  @Min(0, { message: '状态不能小于0' })
  @Max(1, { message: '状态不能大于1' })
  status?: number;

  @ApiPropertyOptional({
    description: '时间范围，格式：YYYY-MM-DD_to_YYYY-MM-DD',
    example: '2025-08-05_to_2025-08-21',
  })
  @IsOptional()
  @IsString({ message: '时间范围必须是字符串' })
  dateRange?: string;
} 