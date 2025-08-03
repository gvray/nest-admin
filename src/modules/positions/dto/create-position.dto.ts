import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ description: '岗位名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '岗位编码' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '岗位描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '所属部门ID' })
  @IsInt()
  departmentId: number;

  @ApiPropertyOptional({ description: '状态', default: 1 })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sort?: number;
}
