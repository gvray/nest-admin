import { PartialType } from '@nestjs/swagger';
import { CreateConfigDto } from './create-config.dto';

export class UpdateConfigDto extends PartialType(CreateConfigDto) {}
