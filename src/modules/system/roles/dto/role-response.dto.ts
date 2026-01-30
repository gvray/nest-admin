import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class RolePermissionResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '权限唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  permissionId: string;

  @ApiProperty({ description: '权限名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '权限代码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '操作类型' })
  @Expose()
  action: string;
}

export class RoleUserResponseDto {
  @ApiProperty({
    description: '用户唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '用户昵称' })
  @Expose()
  nickname: string;

  @ApiProperty({ description: '用户邮箱' })
  @Expose()
  email: string;

  @ApiProperty({ description: '用户状态：0-禁用，1-启用' })
  @Expose()
  status: number;
}

export class RoleResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '角色唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  roleId: string;

  @ApiProperty({ description: '角色标识键' })
  @Expose()
  roleKey: string;

  @ApiProperty({ description: '角色名称' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  remark?: string;

  @ApiProperty({ description: '排序权重' })
  @Expose()
  sort: number;

  @ApiProperty({ description: '状态：0-禁用，1-启用' })
  @Expose()
  status: number;

  @ApiPropertyOptional({
    description: '权限列表',
    type: [RolePermissionResponseDto],
  })
  @Expose()
  @Type(() => RolePermissionResponseDto)
  @Transform(({ obj }) => {
    // 从rolePermissions中提取permissions
    return obj.rolePermissions?.map((rp: any) => rp.permission) || [];
  })
  permissions?: RolePermissionResponseDto[];

  @ApiPropertyOptional({
    description: '用户列表',
    type: [RoleUserResponseDto],
  })
  @Expose()
  @Type(() => RoleUserResponseDto)
  @Transform(({ obj }) => {
    // 从userRoles中提取users
    return obj.userRoles?.map((ur: any) => ur.user) || [];
  })
  users?: RoleUserResponseDto[];

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}
