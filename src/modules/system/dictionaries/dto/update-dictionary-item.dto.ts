import { PartialType } from '@nestjs/swagger';
import { CreateDictionaryItemDto } from './create-dictionary-item.dto';

export class UpdateDictionaryItemDto extends PartialType(CreateDictionaryItemDto) {} 