import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../permissions/types/permission.type';

export class Role {
  @ApiProperty({ description: '角色ID' })
  id: number;

  @ApiProperty({ description: '角色名称' })
  name: string;

  @ApiProperty({ description: '角色描述' })
  description?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiProperty({ description: '角色权限列表', type: [Permission] })
  permissions?: Permission[];
} 