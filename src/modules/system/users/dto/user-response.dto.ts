import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { UserStatus } from '@/shared/constants/user-status.constant';
import { Gender } from '@/shared/constants/gender.constant';

export class RoleResponseDto {
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
}

export class DepartmentResponseDto {
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
}

export class PositionResponseDto {
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
}

export class UserResponseDto {
  @ApiProperty({ description: '用户数据库ID' })
  @Exclude()
  id: number;

  @ApiProperty({
    description: '用户唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  userId: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  email?: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  avatar?: string;

  @ApiPropertyOptional({
    description: '性别',
    enum: Gender,
    example: Gender.MALE,
  })
  @Expose()
  @Transform(({ value }): Gender => value ?? Gender.UNKNOWN)
  gender?: Gender;

  @ApiPropertyOptional({ description: '备注信息' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  remark?: string;

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
    description: '用户角色列表',
    type: [RoleResponseDto],
  })
  @Expose()
  @Type(() => RoleResponseDto)
  @Transform(({ obj }) => {
    // 从userRoles中提取roles
    return obj.userRoles?.map((ur: any) => ur.role) || [];
  })
  roles?: RoleResponseDto[];

  @ApiPropertyOptional({
    description: '所属部门',
    type: DepartmentResponseDto,
  })
  @Expose()
  @Type(() => DepartmentResponseDto)
  department?: DepartmentResponseDto;

  @ApiPropertyOptional({
    description: '所属岗位列表',
    type: [PositionResponseDto],
  })
  @Expose()
  @Type(() => PositionResponseDto)
  @Transform(({ obj }) => {
    // 从userPositions中提取positions
    return obj.userPositions?.map((up: any) => up.position) || [];
  })
  positions?: PositionResponseDto[];
}
