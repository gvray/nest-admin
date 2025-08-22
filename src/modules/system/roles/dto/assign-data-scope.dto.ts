import { IsInt, IsOptional, IsArray, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDataScopeDto {
  @ApiProperty({ 
    description: '数据权限类型：1-仅本人, 2-本部门, 3-本部门及以下, 4-自定义, 5-全部',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsInt()
  @Min(1)
  @Max(5)
  dataScope: number;

  @ApiProperty({ 
    description: '部门ID列表（当dataScope为4-自定义时必填）',
    example: ['dept1', 'dept2'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];
} 