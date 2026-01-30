import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignUsersDto {
  @ApiProperty({
    description: '用户ID列表',
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    type: [String],
  })
  @IsArray({ message: '用户ID列表必须是数组' })
  @IsString({ each: true, message: '用户ID必须是字符串' })
  userIds: string[];
}
