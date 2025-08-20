import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ConfigResponseDto {
  @Expose()
  @ApiProperty({ description: '配置ID' })
  configId: string;

  @Expose()
  @ApiProperty({ description: '配置键' })
  key: string;

  @Expose()
  @ApiProperty({ description: '配置值' })
  value: string;

  @Expose()
  @ApiProperty({ description: '配置名称' })
  name: string;

  @Expose()
  @ApiProperty({ description: '描述' })
  description?: string;

  @Expose()
  @ApiProperty({ description: '配置类型' })
  type: string;

  @Expose()
  @ApiProperty({ description: '配置分组' })
  group: string;

  @Expose()
  @ApiProperty({ description: '状态' })
  status: number;

  @Expose()
  @ApiProperty({ description: '排序权重' })
  sort: number;

  @Expose()
  @ApiProperty({ description: '备注信息' })
  remark?: string;

  @Expose()
  @ApiProperty({ description: '创建时间' })
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '更新时间' })
  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date;
} 