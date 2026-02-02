import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryResourceDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '资源名称（支持模糊查询）',
    example: 'kk',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '资源代码（支持模糊查询）',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '资源路径（支持模糊查询）',
    example: '/system/users',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: '资源类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON', 'API', 'DATA'],
    example: 'MENU',
  })
  @IsOptional()
  @IsIn(['DIRECTORY', 'MENU', 'BUTTON', 'API', 'DATA'])
  type?: string;

  @ApiPropertyOptional({
    description: '状态（1: 启用, 0: 禁用）',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  status?: number;

  @ApiPropertyOptional({
    description: '过滤模式（strict: 严格模式，loose: 宽松模式，默认loose）',
    enum: ['strict', 'loose'],
    example: 'loose',
  })
  @IsOptional()
  @IsIn(['strict', 'loose'])
  filterMode?: 'strict' | 'loose' = 'loose';

  @ApiPropertyOptional({ description: '创建时间开始（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({ description: '创建时间结束（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
