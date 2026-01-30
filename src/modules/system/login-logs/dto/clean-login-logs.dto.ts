import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CleanLoginLogsDto {
  @ApiProperty({
    description: '清理多少天之前的日志（不传则清空全部）',
    example: 7,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days: number;
}
