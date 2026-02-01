import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DictionaryItemResponseDto {
  @ApiProperty({
    description: '字典项ID（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  itemId: string;

  @ApiProperty({
    description: '字典类型编码',
    example: 'user_status',
  })
  @Expose()
  typeCode: string;

  @ApiProperty({
    description: '字典项值',
    example: '1',
  })
  @Expose()
  value: string;

  @ApiProperty({
    description: '显示标签',
    example: '启用',
  })
  @Expose()
  label: string;

  @ApiPropertyOptional({
    description: '描述',
    example: '用户启用状态',
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
    example: '用户启用状态备注',
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
