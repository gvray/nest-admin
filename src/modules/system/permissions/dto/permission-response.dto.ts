import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

export class PermissionResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '权限唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  permissionId: string;

  @ApiProperty({ description: '权限名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '权限代码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '操作类型' })
  @Expose()
  action: string;

  @ApiProperty({ description: '关联资源ID（UUID）' })
  @Expose()
  resourceId: string;

  @ApiPropertyOptional({ description: '权限描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}
