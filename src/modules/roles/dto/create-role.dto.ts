import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsInt, Min } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString({ message: '角色名称必须是字符串' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @IsOptional()
  @IsString({ message: '备注信息必须是字符串' })
  remark?: string;

  @ApiPropertyOptional({ description: '排序权重，数字越小越靠前', example: 0 })
  @IsOptional()
  @IsInt({ message: '排序权重必须是整数' })
  @Min(0, { message: '排序权重不能小于0' })
  sort?: number;

  @ApiPropertyOptional({ description: '权限ID列表', type: [Number] })
  @IsOptional()
  @IsArray({ message: '权限ID必须是数组' })
  @IsNumber({}, { each: true, message: '权限ID必须是数字' })
  permissionIds?: number[];
}
