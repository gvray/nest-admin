import { ApiProperty } from '@nestjs/swagger';

export class Permission {
  @ApiProperty({ description: '权限ID' })
  id: number;

  @ApiProperty({ description: '权限名称' })
  name: string;

  @ApiProperty({ description: '权限代码' })
  code: string;

  @ApiProperty({ description: '权限描述' })
  description?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
