import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class DepartmentResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '部门唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  departmentId: string;

  @ApiProperty({ description: '部门名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '部门编码' })
  @Expose()
  code: string;

  @ApiPropertyOptional({ description: '部门描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  remark?: string;

  @Exclude()
  parentId?: number | null;

  @ApiPropertyOptional({ description: '父部门ID' })
  @Expose()
  @Transform(({ obj }) => {
    // 通过parent关联获取父部门的departmentId
    return obj.parent?.departmentId || null;
  })
  parentDepartmentId?: string | null;

  @ApiPropertyOptional({
    description: '父部门信息',
    type: DepartmentResponseDto,
  })
  @Expose()
  @Type(() => DepartmentResponseDto)
  parent?: DepartmentResponseDto | null;

  @ApiPropertyOptional({
    description: '子部门列表',
    type: [DepartmentResponseDto],
  })
  @Expose()
  @Type(() => DepartmentResponseDto)
  children?: DepartmentResponseDto[];

  @ApiProperty({ description: '状态' })
  @Expose()
  status: number;

  @ApiProperty({ description: '排序' })
  @Expose()
  sort: number;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;
}