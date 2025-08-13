import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

export class QueryDictionaryItemDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '字典类型ID（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString({ message: '字典类型ID必须是字符串' })
  typeId?: string;

  @ApiPropertyOptional({
    description: '字典项编码',
    example: 'enabled',
  })
  @IsOptional()
  @IsString({ message: '字典项编码必须是字符串' })
  code?: string;

  @ApiPropertyOptional({
    description: '字典项名称',
    example: '启用',
  })
  @IsOptional()
  @IsString({ message: '字典项名称必须是字符串' })
  name?: string;

  @ApiPropertyOptional({
    description: '字典项值',
    example: '1',
  })
  @IsOptional()
  @IsString({ message: '字典项值必须是字符串' })
  value?: string;

  @ApiPropertyOptional({
    description: '状态：0-禁用, 1-启用',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  @Min(0, { message: '状态不能小于0' })
  @Max(1, { message: '状态不能大于1' })
  status?: number;
} 