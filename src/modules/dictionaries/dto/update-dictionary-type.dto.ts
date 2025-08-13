import { PartialType } from '@nestjs/swagger';
import { CreateDictionaryTypeDto } from './create-dictionary-type.dto';

export class UpdateDictionaryTypeDto extends PartialType(CreateDictionaryTypeDto) {} 