import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';

export class QueryPermissionDto extends PaginationSortDto {
  @ApiPropertyOptional({ description: '权限名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '权限代码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '操作类型' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: '资源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  resourceId?: number;
}
