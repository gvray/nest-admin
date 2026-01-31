import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CleanOperationLogsDto {
  @ApiProperty({ description: '清理多少天之前的操作日志', example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days: number;
}
