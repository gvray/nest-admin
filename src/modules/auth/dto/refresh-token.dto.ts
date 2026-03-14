import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh Token',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString({ message: 'Refresh token 必须是字符串' })
  @IsNotEmpty({ message: 'Refresh token 不能为空' })
  refreshToken: string;
}
