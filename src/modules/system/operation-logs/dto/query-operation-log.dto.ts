import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryOperationLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'ID 精确匹配' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ description: '用户名 模糊匹配' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '用户ID 精确匹配' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '模块名 模糊匹配' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: '动作 create/update/delete 等' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: '状态 1成功/0失败', example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: '路径 模糊匹配' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '关键字：匹配 message/path/resource' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '开始时间(ISO字符串)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间(ISO字符串)' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
