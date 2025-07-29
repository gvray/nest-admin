import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称' })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @ApiProperty({ description: '权限代码' })
  @IsString({ message: '权限代码必须是字符串' })
  code: string;

  @ApiPropertyOptional({ description: '权限描述' })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;
}
