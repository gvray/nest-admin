import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { UserStatus } from '../../../shared/constants/user-status.constant';

export class PermissionResponseDto {
  @ApiProperty({ description: '权限ID' })
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

  @ApiPropertyOptional({ description: '权限描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;
}

export class CurrentUserRoleResponseDto {
  @ApiProperty({ description: '角色ID' })
  @Exclude()
  id: number;

  @ApiProperty({
    description: '角色唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  roleId: string;

  @ApiProperty({ description: '角色名称' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiPropertyOptional({
    description: '角色权限列表',
    type: [PermissionResponseDto],
  })
  @Expose()
  @Type(() => PermissionResponseDto)
  @Transform(({ obj }: { obj: any }): PermissionResponseDto[] => {
    try {
      if (!obj || !obj?.rolePermissions || !Array.isArray(obj?.rolePermissions)) {
        return [];
      }
      return obj.rolePermissions
        .map((rp: any) => {
          if (!rp || !rp?.permission) {
            return null;
          }
          return rp.permission;
        })
        .filter((permission: any) => permission !== null);
    } catch (error) {
      console.error('Transform permissions error:', error);
      return [];
    }
  })
  permissions?: PermissionResponseDto[];
}

export class CurrentUserDepartmentResponseDto {
  @ApiProperty({ description: '部门ID' })
  @Exclude()
  id: number;

  @ApiProperty({
    description: '部门唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  departmentId: string;

  @ApiProperty({ description: '部门名称' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: '部门描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;
}

export class CurrentUserPositionResponseDto {
  @ApiProperty({ description: '岗位ID' })
  @Exclude()
  id: number;

  @ApiProperty({
    description: '岗位唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  positionId: string;

  @ApiProperty({ description: '岗位名称' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: '岗位描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ description: '用户数据库ID' })
  @Exclude()
  id: number;

  @ApiProperty({
    description: '用户唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  @ApiPropertyOptional({ description: '头像' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  avatar?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  email?: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  phone?: string;

  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ENABLED,
  })
  @Expose()
  status: UserStatus;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '用户角色列表（包含权限信息）',
    type: [CurrentUserRoleResponseDto],
  })
  @Expose()
  @Type(() => CurrentUserRoleResponseDto)
  roles?: CurrentUserRoleResponseDto[];

  @ApiPropertyOptional({
    description: '所属部门',
    type: CurrentUserDepartmentResponseDto,
  })
  @Expose()
  @Type(() => CurrentUserDepartmentResponseDto)
  department?: CurrentUserDepartmentResponseDto;

  @ApiPropertyOptional({
    description: '所属岗位',
    type: CurrentUserPositionResponseDto,
  })
  @Expose()
  @Type(() => CurrentUserPositionResponseDto)
  position?: CurrentUserPositionResponseDto;
}
