import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ description: '角色ID列表', type: [Number] })
  @IsArray({ message: '角色ID必须是数组' })
  @IsNumber({}, { each: true, message: '角色ID必须是数字' })
  roleIds: number[];
}
