import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class PositionUserResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '用户唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  email?: string;
}

export class PositionResponseDto {
  @Exclude()
  id: number;

  @ApiProperty({
    description: '岗位唯一标识符（UUID）',
    example: 'a3d7d76e-5a4e-4f0a-93c3-d0b2b27d471e',
  })
  @Expose()
  positionId: string;

  @ApiProperty({ description: '岗位名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '岗位编码' })
  @Expose()
  code: string;

  @ApiPropertyOptional({ description: '岗位描述' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  description?: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @Expose()
  @Transform(({ value }): string => value ?? '')
  remark?: string;

  @ApiPropertyOptional({
    description: '用户列表',
    type: [PositionUserResponseDto],
  })
  @Expose()
  @Type(() => PositionUserResponseDto)
  users?: PositionUserResponseDto[];

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