import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateDictionaryItemDto {
  @ApiProperty({
    description: '字典类型编码',
    example: 'user_status',
  })
  @IsString({ message: '字典类型编码必须是字符串' })
  typeCode: string;

  @ApiProperty({
    description: '字典项值',
    example: '1',
  })
  @IsString({ message: '字典项值必须是字符串' })
  value: string;

  @ApiProperty({
    description: '显示标签',
    example: '启用',
  })
  @IsString({ message: '显示标签必须是字符串' })
  label: string;

  @ApiPropertyOptional({
    description: '描述',
    example: '用户启用状态',
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({
    description: '状态：0-禁用, 1-启用',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  @Min(0, { message: '状态不能小于0' })
  @Max(1, { message: '状态不能大于1' })
  status?: number;

  @ApiPropertyOptional({
    description: '排序权重',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: '排序权重必须是整数' })
  sort?: number;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '用户启用状态备注',
  })
  @IsOptional()
  @IsString({ message: '备注信息必须是字符串' })
  remark?: string;
}
