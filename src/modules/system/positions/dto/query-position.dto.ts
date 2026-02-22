import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/shared/dtos/pagination.dto';

export class QueryPositionDto extends PaginationDto {
  @ApiPropertyOptional({ description: '岗位名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '岗位编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '状态：disabled-禁用, enabled-启用',
    example: 'enabled',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '创建时间开始（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({ description: '创建时间结束（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
