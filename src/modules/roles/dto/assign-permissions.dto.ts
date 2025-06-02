import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ description: '权限ID列表', type: [Number] })
  @IsArray({ message: '权限ID必须是数组' })
  @IsNumber({}, { each: true, message: '权限ID必须是数字' })
  permissionIds: number[];
} 