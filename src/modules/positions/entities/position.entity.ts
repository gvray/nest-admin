import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionEntity {
  @ApiProperty({ description: '岗位ID' })
  id: number;

  @ApiProperty({ description: '岗位名称' })
  name: string;

  @ApiProperty({ description: '岗位编码' })
  code: string;

  @ApiPropertyOptional({ description: '岗位描述' })
  description?: string | null;

  @ApiProperty({ description: '所属部门ID' })
  departmentId: number;

  @ApiPropertyOptional({ description: '所属部门信息' })
  department?: {
    id: number;
    name: string;
    code: string;
    description?: string | null;
  };

  @ApiPropertyOptional({ description: '用户列表' })
  users?: {
    id: number;
    userId: string;
    username: string;
    nickname: string;
    email?: string | null;
  }[];

  @ApiProperty({ description: '状态' })
  status: number;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
