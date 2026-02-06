import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ActionType {
  ACCESS = 'access',
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum PermissionType {
  DIRECTORY = 'DIRECTORY',
  MENU = 'MENU',
  BUTTON = 'BUTTON',
  API = 'API',
}

export class CreateMenuMetaDto {
  @ApiPropertyOptional({ description: '菜单路径' })
  @IsOptional()
  @IsString({ message: '菜单路径必须是字符串' })
  path?: string;

  @ApiPropertyOptional({ description: '菜单图标' })
  @IsOptional()
  @IsString({ message: '菜单图标必须是字符串' })
  icon?: string;

  @ApiPropertyOptional({ description: '菜单是否隐藏' })
  @IsOptional()
  hidden?: boolean;

  @ApiPropertyOptional({ description: '组件标识' })
  @IsOptional()
  @IsString({ message: '菜单组件必须是字符串' })
  component?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  sort?: number;
}

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称' })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @ApiProperty({ description: '权限代码（唯一）' })
  @IsString({ message: '权限代码必须是字符串' })
  code: string;

  @ApiProperty({ description: '权限类型', enum: PermissionType })
  @IsEnum(PermissionType, { message: '权限类型必须是有效的枚举值' })
  type: PermissionType;

  @ApiPropertyOptional({ description: '父级菜单的权限ID（仅非菜单时需要）' })
  @IsOptional()
  @IsString({ message: '父级权限ID必须是字符串' })
  parentPermissionId?: string;

  @ApiPropertyOptional({
    description: '操作类型（菜单默认为access）',
    enum: ActionType,
  })
  @IsOptional()
  @IsEnum(ActionType, { message: '操作类型必须是有效的枚举值' })
  action?: ActionType;

  @ApiPropertyOptional({ description: '权限描述' })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({
    description: '菜单元信息（仅菜单）',
    type: CreateMenuMetaDto,
  })
  @IsOptional()
  menuMeta?: CreateMenuMetaDto;
}
