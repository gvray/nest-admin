import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class BatchDeleteOperationLogsDto {
  @ApiProperty({ description: '待删除操作日志ID列表', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids: number[];
}
