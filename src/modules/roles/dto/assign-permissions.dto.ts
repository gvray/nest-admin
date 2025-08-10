import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ description: '权限ID列表', type: [String] })
  @IsArray({ message: '权限ID必须是数组' })
  @IsString({ each: true, message: '权限ID必须是字符串' })
  permissionIds: string[];
}
