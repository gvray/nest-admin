import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class BatchDeleteLoginLogsDto {
  @ApiProperty({ description: '待删除日志ID列表', type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];
}
