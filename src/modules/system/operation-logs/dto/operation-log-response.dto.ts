import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OperationLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  logId!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  userId!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  username!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  nickname!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  module!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  action!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  resource!: string | null;

  @ApiProperty()
  @Expose()
  method!: string;

  @ApiProperty()
  @Expose()
  path!: string;

  @ApiProperty({ nullable: true, type: Object })
  @Expose()
  query!: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, type: Object })
  @Expose()
  body!: Record<string, unknown> | null;

  @ApiProperty({ nullable: true })
  @Expose()
  ipAddress!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  userAgent!: string | null;

  @ApiProperty({ description: '1 成功, 0 失败' })
  @Expose()
  status!: number;

  @ApiProperty({ nullable: true })
  @Expose()
  message!: string | null;

  @ApiProperty()
  @Expose()
  latencyMs!: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
