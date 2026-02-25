import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class MenuMetaDto {
  @ApiPropertyOptional({ description: '菜单路径', example: '/system/users' })
  @Expose()
  path?: string | null;

  @ApiPropertyOptional({ description: '菜单图标', example: 'UserOutlined' })
  @Expose()
  icon?: string | null;

  @ApiProperty({ description: '是否隐藏', example: false })
  @Expose()
  hidden?: boolean;

  @ApiPropertyOptional({ description: '组件路径', example: 'menu:system:user' })
  @Expose()
  component?: string | null;

  @ApiProperty({ description: '排序权重', example: 1 })
  @Expose()
  sort?: number;
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

  @ApiProperty({ description: '权限类型' })
  @Expose()
  type: string;

  @ApiProperty({ description: '权限来源', enum: ['USER', 'SYSTEM'] })
  @Expose()
  origin: string;

  @ApiPropertyOptional({ description: '父权限ID（仅非菜单）' })
  @Expose()
  parentPermissionId?: string;

  @ApiPropertyOptional({ description: '权限描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiPropertyOptional({
    description: '菜单元数据（仅 DIRECTORY 和 MENU 类型有）',
    type: MenuMetaDto,
  })
  @Expose()
  @Type(() => MenuMetaDto)
  menuMeta?: MenuMetaDto;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}

export class PermissionTreeNodeDto extends PermissionResponseDto {
  @ApiPropertyOptional({
    description: '子权限列表',
    type: () => [PermissionTreeNodeDto],
  })
  @Expose()
  @Type(() => PermissionTreeNodeDto)
  children?: PermissionTreeNodeDto[];
}
