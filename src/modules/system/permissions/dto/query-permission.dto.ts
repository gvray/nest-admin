import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';
import { PermissionType } from './create-permission.dto';

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

  @ApiPropertyOptional({ description: '权限类型' })
  @IsOptional()
  type?: PermissionType;

  @ApiPropertyOptional({ description: '父权限ID' })
  @IsOptional()
  @IsString()
  parentPermissionId?: string;

  @ApiPropertyOptional({ description: '创建时间开始（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({ description: '创建时间结束（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
