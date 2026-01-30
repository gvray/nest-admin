import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({ description: '配置键' })
  @IsString()
  key: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  value: string;

  @ApiProperty({ description: '配置名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '配置类型', default: 'string' })
  @IsOptional()
  @IsString()
  type?: string = 'string';

  @ApiProperty({ description: '配置分组', default: 'system' })
  @IsOptional()
  @IsString()
  group?: string = 'system';

  @ApiProperty({ description: '状态', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = 1;

  @ApiProperty({ description: '排序权重', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number = 0;

  @ApiProperty({ description: '备注信息', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
