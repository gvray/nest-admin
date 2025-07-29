import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../shared/constants/user-status.constant';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: '用户唯一标识符（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440000',
    readOnly: true,
  })
  @IsOptional()
  @IsString({ message: '用户ID必须是字符串' })
  userId?: string;

  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '用户名' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  username: string;

  @ApiProperty({ description: '昵称' })
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称不能超过50个字符' })
  nickname: string;

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString({ message: '手机号码必须是字符串' })
  phone?: string;

  @ApiProperty({ description: '密码' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar?: string;

  @ApiPropertyOptional({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ENABLED,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: '用户状态必须是有效的枚举值' })
  status?: UserStatus;

  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsInt({ message: '部门ID必须是整数' })
  departmentId?: number;

  @ApiPropertyOptional({ description: '岗位ID' })
  @IsOptional()
  @IsInt({ message: '岗位ID必须是整数' })
  positionId?: number;
}
