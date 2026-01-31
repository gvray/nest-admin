import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { Type } from 'class-transformer';

export class QueryConfigDto extends PaginationDto {
  @ApiProperty({ description: '配置键', required: false })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ description: '配置名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '配置类型', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: '配置分组', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({ description: '状态', required: false })
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
}
