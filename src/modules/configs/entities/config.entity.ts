import { ApiProperty } from '@nestjs/swagger';

export class Config {
  @ApiProperty({ description: '配置ID' })
  configId: string;

  @ApiProperty({ description: '配置键' })
  key: string;

  @ApiProperty({ description: '配置值' })
  value: string;

  @ApiProperty({ description: '配置名称' })
  name: string;

  @ApiProperty({ description: '描述', required: false })
  description?: string;

  @ApiProperty({ description: '配置类型', default: 'string' })
  type: string;

  @ApiProperty({ description: '配置分组', default: 'system' })
  group: string;

  @ApiProperty({ description: '状态', default: 1 })
  status: number;

  @ApiProperty({ description: '排序权重', default: 0 })
  sort: number;

  @ApiProperty({ description: '备注信息', required: false })
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
} 