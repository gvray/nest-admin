import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: '部门名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '部门编码' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '部门描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ description: '是否激活', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sort?: number;
} 