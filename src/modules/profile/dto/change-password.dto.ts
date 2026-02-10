import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6, { message: '新密码长度不能少于6位' })
  @MaxLength(50)
  newPassword: string;
}
