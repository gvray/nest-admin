import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class ResourceResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({ description: '资源ID' })
  @Expose()
  resourceId: string;

  @ApiProperty({ description: '资源名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '资源代码' })
  @Expose()
  code: string;

  @ApiProperty({
    description: '资源类型',
    enum: ['DIRECTORY', 'MENU', 'BUTTON', 'API', 'DATA'],
    example: 'MENU',
  })
  @Expose()
  type: string;

  @ApiProperty({ description: '资源路径', required: false })
  @Expose()
  path?: string;

  @ApiProperty({ description: 'HTTP方法', required: false })
  @Expose()
  method?: string;

  @ApiProperty({ description: '图标', required: false })
  @Expose()
  icon?: string;

  @Exclude()
  parentId?: string;

  @ApiProperty({ description: '父级资源ID', required: false })
  @Expose()
  @Transform(({ obj }) => {
    // parentId 字段本身就存储了父级的 resourceId
    return obj.parentId || null;
  })
  parentResourceId: string | null;

  @ApiProperty({
    description: '子资源列表',
    type: [ResourceResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => ResourceResponseDto)
  children?: ResourceResponseDto[];

  @ApiProperty({ description: '状态' })
  @Expose()
  status: number;

  @ApiProperty({ description: '排序' })
  @Expose()
  sort: number;

  @ApiProperty({ description: '描述', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}