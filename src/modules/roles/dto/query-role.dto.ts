import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '角色名称（支持模糊查询）',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '角色描述（支持模糊查询）',
    example: '管理员',
  })
  @IsOptional()
  @IsString()
  description?: string;
}