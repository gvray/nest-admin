import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '@/shared/dtos/pagination.dto';
import { Type } from 'class-transformer';

export class QueryDictionaryItemDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '字典类型编码',
    example: 'user_status',
  })
  @IsOptional()
  @IsString({ message: '字典类型编码必须是字符串' })
  typeCode?: string;

  @ApiPropertyOptional({
    description: '字典项标签',
    example: '启用',
  })
  @IsOptional()
  @IsString({ message: '字典项标签必须是字符串' })
  label?: string;

  @ApiPropertyOptional({
    description: '字典项值',
    example: '1',
  })
  @IsOptional()
  @IsString({ message: '字典项值必须是字符串' })
  value?: string;

  @ApiPropertyOptional({
    description: '状态：disabled-禁用, enabled-启用',
    example: 'enabled',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
