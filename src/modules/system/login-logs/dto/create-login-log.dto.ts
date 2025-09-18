import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoginLogDto {
  @ApiProperty({ description: '登录用户名/邮箱/手机号' })
  @IsString()
  account: string;

  @ApiProperty({ description: '登录IP地址' })
  @IsString()
  ipAddress: string;

  @ApiPropertyOptional({ description: '用户代理信息' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: '登录状态：1-成功, 0-失败' })
  @IsInt()
  status: number;

  @ApiProperty({ description: '登录类型', default: 'username' })
  @IsString()
  loginType: string;

  @ApiPropertyOptional({ description: '失败原因' })
  @IsOptional()
  @IsString()
  failReason?: string;

  @ApiPropertyOptional({ description: '登录地点（可选，基于IP解析）' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '设备信息' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: '浏览器信息' })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统信息' })
  @IsOptional()
  @IsString()
  os?: string;
}
