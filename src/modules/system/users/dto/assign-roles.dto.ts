import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: '角色ID列表（UUID）',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray({ message: '角色ID必须是数组' })
  @IsString({ each: true, message: '角色ID必须是字符串' })
  roleIds: string[];
}
