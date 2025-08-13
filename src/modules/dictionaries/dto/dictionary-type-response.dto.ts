import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class DictionaryTypeResponseDto {
  @ApiProperty({
    description: '字典类型ID（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  typeId: string;

  @ApiProperty({
    description: '字典类型编码',
    example: 'user_status',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: '字典类型名称',
    example: '用户状态',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: '描述',
    example: '用户状态字典类型',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: '状态：0-禁用, 1-启用',
    example: 1,
  })
  @Expose()
  status: number;

  @ApiProperty({
    description: '排序权重',
    example: 0,
  })
  @Expose()
  sort: number;

  @ApiPropertyOptional({
    description: '备注信息',
    example: '用户状态字典类型备注',
  })
  @Expose()
  remark?: string;

  @ApiProperty({
    description: '创建时间',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
} 