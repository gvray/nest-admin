import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ResourceType } from '@prisma/client';

export class CreateResourceDto {
  @ApiProperty({ description: '资源名称', example: '用户管理' })
  @IsString()
  name: string;

  @ApiProperty({ description: '资源代码', example: 'user' })
  @IsString()
  code: string;

  @ApiProperty({
    description: '资源类型',
    enum: ['DIRECTORY', 'MENU'],
    example: 'MENU',
  })
  @IsEnum(['DIRECTORY', 'MENU'])
  type: string;

  @ApiProperty({
    description: '资源路径',
    example: '/system/users',
    required: false,
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: 'HTTP方法', example: 'GET', required: false })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({
    description: '图标',
    example: 'UserOutlined',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: '父级资源ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: '状态', example: 1, required: false })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({ description: '排序', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiProperty({
    description: '描述',
    example: '用户信息管理',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}