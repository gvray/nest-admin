import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '登录用户名/邮箱/手机号' })
  @Expose()
  account: string;

  @ApiProperty({ description: '登录IP地址' })
  @Expose()
  ipAddress: string;

  @ApiPropertyOptional({ description: '用户代理信息' })
  @Expose()
  userAgent?: string;

  @ApiProperty({ description: '登录状态：1-成功, 0-失败' })
  @Expose()
  status: number;

  @ApiProperty({ description: '登录类型', default: 'username' })
  @Expose()
  loginType: string;

  @ApiPropertyOptional({ description: '失败原因' })
  @Expose()
  failReason?: string;

  @ApiPropertyOptional({ description: '登录地点（可选，基于IP解析）' })
  @Expose()
  location?: string;

  @ApiPropertyOptional({ description: '设备信息' })
  @Expose()
  device?: string;

  @ApiPropertyOptional({ description: '浏览器信息' })
  @Expose()
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统信息' })
  @Expose()
  os?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;
}
