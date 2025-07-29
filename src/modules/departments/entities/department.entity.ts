import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentEntity {
  @ApiProperty({ description: '部门ID' })
  id: number;

  @ApiProperty({ description: '部门名称' })
  name: string;

  @ApiProperty({ description: '部门编码' })
  code: string;

  @ApiPropertyOptional({ description: '部门描述' })
  description?: string | null;

  @ApiPropertyOptional({ description: '父部门ID' })
  parentId?: number | null;

  @ApiPropertyOptional({ description: '父部门信息' })
  parent?: DepartmentEntity | null;

  @ApiPropertyOptional({ description: '子部门列表' })
  children?: DepartmentEntity[];

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
