import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', example: '小明' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号码格式不正确' })
  phone?: string;

  @ApiPropertyOptional({
    description: '性别：0-未知, 1-男, 2-女, 3-其他',
    enum: [0, 1, 2, 3],
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1, 2, 3])
  gender?: number;
}
