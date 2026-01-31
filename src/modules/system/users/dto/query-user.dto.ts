import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationSortDto } from '@/shared/dtos/pagination.dto';
import { UserStatus } from '@/shared/constants/user-status.constant';

/**
 * 查询用户DTO
 */
export class QueryUserDto extends PaginationSortDto {
  @ApiPropertyOptional({
    description: '用户名（模糊查询）',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: '手机号（模糊查询）',
    example: '138',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ENABLED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '创建时间开始（YYYY-MM-DD）',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建时间结束（YYYY-MM-DD）',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsString()
  createdAtEnd?: string;
}
