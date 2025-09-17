import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '日志UUID' })
  @Expose()
  logId: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @Expose()
  userId?: string;

  @ApiProperty({ description: '登录用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '登录IP地址' })
  @Expose()
  ipAddress: string;

  @ApiPropertyOptional({ description: '用户代理信息' })
  @Expose()
  userAgent?: string;

  @ApiProperty({ description: '登录时间' })
  @Expose()
  @Type(() => Date)
  loginTime: Date;

  @ApiProperty({ description: '登录状态：1-成功, 0-失败' })
  @Expose()
  status: number;

  @ApiPropertyOptional({ description: '失败原因' })
  @Expose()
  failReason?: string;

  @ApiPropertyOptional({ description: '登录地点' })
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

  @ApiPropertyOptional({ description: '备注信息' })
  @Expose()
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({ description: '用户信息' })
  @Expose()
  user?: {
    userId: string;
    username: string;
    nickname: string;
    email?: string;
  };
}