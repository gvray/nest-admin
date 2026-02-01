import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { DictionariesService } from './dictionaries.service';
import { CreateDictionaryTypeDto } from './dto/create-dictionary-type.dto';
import { UpdateDictionaryTypeDto } from './dto/update-dictionary-type.dto';
import { QueryDictionaryTypeDto } from './dto/query-dictionary-type.dto';
import { DictionaryTypeResponseDto } from './dto/dictionary-type-response.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import { UpdateDictionaryItemDto } from './dto/update-dictionary-item.dto';
import { QueryDictionaryItemDto } from './dto/query-dictionary-item.dto';
import { DictionaryItemResponseDto } from './dto/dictionary-item-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteDictionaryTypesDto } from './dto/batch-delete-dictionary-types.dto';
import { BatchDeleteDictionaryItemsDto } from './dto/batch-delete-dictionary-items.dto';

@ApiTags('字典管理')
@Controller('system/dictionaries')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  // 字典类型相关接口
  @Post('types')
  @RequirePermissions('system:dictionary:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建字典类型' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: DictionaryTypeResponseDto,
  })
  createDictionaryType(
    @Body() createDictionaryTypeDto: CreateDictionaryTypeDto,
    @CurrentUser() user: IUser,
  ) {
    return ResponseUtil.created(
      this.dictionariesService.createDictionaryType(
        createDictionaryTypeDto,
        user.userId,
      ),
      '创建成功',
    );
  }

  @Get('types')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取字典类型列表' })
  @ApiResponse({
    status: 200,
    description: '字典类型列表',
    type: [DictionaryTypeResponseDto],
  })
  async findAllDictionaryTypes(
    @Query() query: QueryDictionaryTypeDto = new QueryDictionaryTypeDto(),
  ) {
    const pageData =
      await this.dictionariesService.findAllDictionaryTypes(query);
    return ResponseUtil.paginated(pageData, '字典类型列表');
  }
  @Get('types/batch')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '根据多个字典类型编码获取字典项列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
          },
        },
      },
    },
  })
  async getDictionaryItemsByTypeCodes(@Query('typeCodes') typeCodes: string) {
    const typeCodeArray = typeCodes.split(',').map((code) => code.trim());
    const data =
      await this.dictionariesService.getDictionaryItemsByTypeCodes(
        typeCodeArray,
      );
    return ResponseUtil.found(data, '获取成功');
  }

  @Get('types/:typeId')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定字典类型（通过TypeId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DictionaryTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  async findOneDictionaryType(@Param('typeId') typeId: string) {
    const data = await this.dictionariesService.findOneDictionaryType(typeId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch('types/:typeId')
  @RequirePermissions('system:dictionary:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新字典类型（通过TypeId）' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: DictionaryTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  async updateDictionaryType(
    @Param('typeId') typeId: string,
    @Body() updateDictionaryTypeDto: UpdateDictionaryTypeDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.dictionariesService.updateDictionaryType(
      typeId,
      updateDictionaryTypeDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete('types/:typeId')
  @RequirePermissions('system:dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除字典类型（通过TypeId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  async removeDictionaryType(@Param('typeId') typeId: string) {
    await this.dictionariesService.removeDictionaryType(typeId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('types/batch-delete')
  @RequirePermissions('system:dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '批量删除字典类型' })
  @ApiBody({ type: BatchDeleteDictionaryTypesDto })
  async batchDeleteTypes(@Body() dto: BatchDeleteDictionaryTypesDto) {
    await this.dictionariesService.removeManyDictionaryTypes(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }

  // 字典项相关接口
  @Post('items')
  @RequirePermissions('system:dictionary:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建字典项' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: DictionaryItemResponseDto,
  })
  createDictionaryItem(
    @Body() createDictionaryItemDto: CreateDictionaryItemDto,
    @CurrentUser() user: IUser,
  ) {
    return ResponseUtil.created(
      // eslint-disable-next-line @typescript-eslint/return-await
      this.dictionariesService.createDictionaryItem(
        createDictionaryItemDto,
        user.userId,
      ),
      '创建成功',
    );
  }

  @Get('items')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取字典项列表' })
  @ApiResponse({
    status: 200,
    description: '字典项列表',
    type: [DictionaryItemResponseDto],
  })
  async findAllDictionaryItems(@Query() query: QueryDictionaryItemDto) {
    const pageData =
      await this.dictionariesService.findAllDictionaryItems(query);
    return ResponseUtil.paginated(pageData, '字典项列表');
  }

  @Get('items/:itemId')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定字典项（通过ItemId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DictionaryItemResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  async findOneDictionaryItem(@Param('itemId') itemId: string) {
    const data = await this.dictionariesService.findOneDictionaryItem(itemId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch('items/:itemId')
  @RequirePermissions('system:dictionary:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新字典项（通过ItemId）' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: DictionaryItemResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  async updateDictionaryItem(
    @Param('itemId') itemId: string,
    @Body() updateDictionaryItemDto: UpdateDictionaryItemDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.dictionariesService.updateDictionaryItem(
      itemId,
      updateDictionaryItemDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete('items/:itemId')
  @RequirePermissions('system:dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除字典项（通过ItemId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  async removeDictionaryItem(@Param('itemId') itemId: string) {
    await this.dictionariesService.removeDictionaryItem(itemId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  // 根据字典类型编码获取字典项列表
  @Get('items/type/:typeCode')
  @RequirePermissions('system:dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '根据字典类型编码获取字典项列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [DictionaryItemResponseDto],
  })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  async getDictionaryItemsByTypeCode(@Param('typeCode') typeCode: string) {
    const data =
      await this.dictionariesService.getDictionaryItemsByTypeCode(typeCode);
    return ResponseUtil.found(data, '获取成功');
  }

  @Post('items/batch-delete')
  @RequirePermissions('system:dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '批量删除字典项' })
  @ApiBody({ type: BatchDeleteDictionaryItemsDto })
  async batchDeleteItems(@Body() dto: BatchDeleteDictionaryItemsDto) {
    await this.dictionariesService.removeManyDictionaryItems(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
