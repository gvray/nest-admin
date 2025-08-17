import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

export class QueryDictionaryItemDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '字典类型编码',
    example: 'user_status',
  })
  @IsOptional()
  @IsString({ message: '字典类型编码必须是字符串' })
  typeCode?: string;



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