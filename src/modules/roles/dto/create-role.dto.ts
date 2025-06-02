import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString({ message: '角色名称必须是字符串' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '权限ID列表', type: [Number] })
  @IsOptional()
  @IsArray({ message: '权限ID必须是数组' })
  @IsNumber({}, { each: true, message: '权限ID必须是数字' })
  permissionIds?: number[];
} 