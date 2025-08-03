import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ActionType {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
}

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称' })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @ApiProperty({ description: '权限代码' })
  @IsString({ message: '权限代码必须是字符串' })
  code: string;

  @ApiProperty({ description: '资源ID' })
  @IsNumber({}, { message: '资源ID必须是数字' })
  @Type(() => Number)
  resourceId: number;

  @ApiProperty({ description: '操作类型', enum: ActionType })
  @IsEnum(ActionType, { message: '操作类型必须是有效的枚举值' })
  action: ActionType;

  @ApiPropertyOptional({ description: '权限描述' })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;
}
