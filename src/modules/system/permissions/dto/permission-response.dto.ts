import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class PermissionResourceResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '资源唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  resourceId: string;

  @ApiProperty({ description: '资源名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '资源代码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '资源类型' })
  @Expose()
  type: string;
}

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

  @ApiProperty({
    description: '关联的资源',
    type: PermissionResourceResponseDto,
  })
  @Expose()
  @Type(() => PermissionResourceResponseDto)
  resource: PermissionResourceResponseDto;

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
