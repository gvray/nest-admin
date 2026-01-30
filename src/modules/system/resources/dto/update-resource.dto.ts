import { PartialType } from '@nestjs/swagger';
import { CreateResourceDto } from './create-resource.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';

export class UpdateResourceDto extends PartialType(CreateResourceDto) {
  @ApiProperty({ description: '状态', example: 1, required: false })
  @IsOptional()
  @IsInt()
  status?: number;
}
