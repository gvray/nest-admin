import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryResourceDto {
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
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  status?: number;

  @ApiPropertyOptional({
    description: '过滤模式（strict: 严格模式，loose: 宽松模式，默认strict）',
    enum: ['strict', 'loose'],
    example: 'strict',
  })
  @IsOptional()
  @IsIn(['strict', 'loose'])
  filterMode?: 'strict' | 'loose' = 'strict';
}