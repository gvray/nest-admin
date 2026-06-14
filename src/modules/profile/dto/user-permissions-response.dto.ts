import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleSimpleDto {
  @ApiProperty({ description: '角色ID' })
  roleId: string;

  @ApiProperty({ description: '角色名称' })
  name: string;

  @ApiProperty({ description: '角色标识' })
  roleKey: string;

  @ApiPropertyOptional({ description: '角色描述' })
  description: string | null;
}

export class UserPermissionSimpleDto {
  @ApiProperty({ description: '权限ID' })
  permissionId: string;

  @ApiProperty({ description: '权限名称' })
  name: string;

  @ApiProperty({ description: '权限代码' })
  code: string;

  @ApiProperty({ description: '权限类型' })
  type: string;

  @ApiProperty({ description: '操作动作' })
  action: string;

  @ApiPropertyOptional({ description: '权限描述' })
  description: string | null;

  @ApiPropertyOptional({ description: '父权限ID' })
  parentPermissionId: string | null;
}

export class UserPermissionsResponseDto {
  @ApiProperty({ description: '用户角色列表', type: [UserRoleSimpleDto] })
  roles: UserRoleSimpleDto[];

  @ApiProperty({
    description: '用户权限列表（去重）',
    type: [UserPermissionSimpleDto],
  })
  permissions: UserPermissionSimpleDto[];

  @ApiProperty({ description: '是否为超级管理员' })
  isSuperAdmin: boolean;
}
