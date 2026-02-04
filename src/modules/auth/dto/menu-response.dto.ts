import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class MenuMetaDto {
  @ApiPropertyOptional({ description: '菜单路径' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  path?: string | null;

  @ApiPropertyOptional({ description: '菜单图标' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  icon?: string | null;

  @ApiPropertyOptional({ description: '是否隐藏' })
  @Expose()
  @Transform(({ value }): boolean => Boolean(value))
  hidden?: boolean;

  @ApiPropertyOptional({ description: '组件标识' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  component?: string | null;

  @ApiPropertyOptional({ description: '排序' })
  @Expose()
  @Transform(({ value }): number => (typeof value === 'number' ? value : 0))
  sort?: number;
}

export class MenuResponseDto {
  @ApiProperty({ description: '权限唯一标识符（UUID）' })
  @Expose()
  permissionId: string;

  @ApiPropertyOptional({ description: '父级权限ID（菜单层级）' })
  @Expose()
  @Transform(({ value }): string | null => value ?? null)
  parentPermissionId?: string | null;

  @ApiProperty({ description: '权限名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '权限代码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '权限类型' })
  @Expose()
  type: string;

  @ApiProperty({ description: '操作类型' })
  @Expose()
  action: string;

  @ApiPropertyOptional({ description: '菜单元数据', type: MenuMetaDto })
  @Expose()
  @Type(() => MenuMetaDto)
  meta?: MenuMetaDto;

  @ApiPropertyOptional({ description: '子节点', type: [MenuResponseDto] })
  @Expose()
  @Type(() => MenuResponseDto)
  children?: MenuResponseDto[];
}
