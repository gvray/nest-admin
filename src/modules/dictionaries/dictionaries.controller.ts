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
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { IUser } from '../../core/interfaces/user.interface';

@ApiTags('字典管理')
@Controller('dictionaries')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  // 字典类型相关接口
  @Post('types')
  @Roles('admin')
  @RequirePermissions('dictionary:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建字典类型' })
  @ApiResponse({ status: 201, description: '创建成功', type: DictionaryTypeResponseDto })
  createDictionaryType(
    @Body() createDictionaryTypeDto: CreateDictionaryTypeDto,
    @CurrentUser() user: IUser,
  ) {
    return this.dictionariesService.createDictionaryType(
      createDictionaryTypeDto,
      user.userId,
    );
  }

  @Get('types')
  @Roles('admin')
  @RequirePermissions('dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取字典类型列表' })
  @ApiResponse({
    status: 200,
    description: '字典类型列表',
    type: [DictionaryTypeResponseDto],
  })
  findAllDictionaryTypes(@Query() query: QueryDictionaryTypeDto = new QueryDictionaryTypeDto()) {
    return this.dictionariesService.findAllDictionaryTypes(query);
  }

  @Get('types/:typeId')
  @Roles('admin')
  @RequirePermissions('dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定字典类型（通过TypeId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DictionaryTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  findOneDictionaryType(@Param('typeId') typeId: string) {
    return this.dictionariesService.findOneDictionaryType(typeId);
  }

  @Patch('types/:typeId')
  @Roles('admin')
  @RequirePermissions('dictionary:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新字典类型（通过TypeId）' })
  @ApiResponse({ status: 200, description: '更新成功', type: DictionaryTypeResponseDto })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  updateDictionaryType(
    @Param('typeId') typeId: string,
    @Body() updateDictionaryTypeDto: UpdateDictionaryTypeDto,
    @CurrentUser() user: IUser,
  ) {
    return this.dictionariesService.updateDictionaryType(
      typeId,
      updateDictionaryTypeDto,
      user.userId,
    );
  }

  @Delete('types/:typeId')
  @Roles('admin')
  @RequirePermissions('dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除字典类型（通过TypeId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  removeDictionaryType(@Param('typeId') typeId: string) {
    return this.dictionariesService.removeDictionaryType(typeId);
  }

  // 字典项相关接口
  @Post('items')
  @Roles('admin')
  @RequirePermissions('dictionary:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建字典项' })
  @ApiResponse({ status: 201, description: '创建成功', type: DictionaryItemResponseDto })
  createDictionaryItem(
    @Body() createDictionaryItemDto: CreateDictionaryItemDto,
    @CurrentUser() user: IUser,
  ) {
    return this.dictionariesService.createDictionaryItem(
      createDictionaryItemDto,
      user.userId,
    );
  }

  @Get('items')
  @Roles('admin')
  @RequirePermissions('dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取字典项列表' })
  @ApiResponse({
    status: 200,
    description: '字典项列表',
    type: [DictionaryItemResponseDto],
  })
  findAllDictionaryItems(@Query() query: QueryDictionaryItemDto = new QueryDictionaryItemDto()) {
    return this.dictionariesService.findAllDictionaryItems(query);
  }

  @Get('items/:itemId')
  @Roles('admin')
  @RequirePermissions('dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定字典项（通过ItemId）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DictionaryItemResponseDto,
  })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  findOneDictionaryItem(@Param('itemId') itemId: string) {
    return this.dictionariesService.findOneDictionaryItem(itemId);
  }

  @Patch('items/:itemId')
  @Roles('admin')
  @RequirePermissions('dictionary:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新字典项（通过ItemId）' })
  @ApiResponse({ status: 200, description: '更新成功', type: DictionaryItemResponseDto })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  updateDictionaryItem(
    @Param('itemId') itemId: string,
    @Body() updateDictionaryItemDto: UpdateDictionaryItemDto,
    @CurrentUser() user: IUser,
  ) {
    return this.dictionariesService.updateDictionaryItem(
      itemId,
      updateDictionaryItemDto,
      user.userId,
    );
  }

  @Delete('items/:itemId')
  @Roles('admin')
  @RequirePermissions('dictionary:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除字典项（通过ItemId）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '字典项不存在' })
  removeDictionaryItem(@Param('itemId') itemId: string) {
    return this.dictionariesService.removeDictionaryItem(itemId);
  }

  // 根据字典类型编码获取字典项列表
  @Get('items/type/:typeCode')
  @Roles('admin')
  @RequirePermissions('dictionary:view')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '根据字典类型编码获取字典项列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [DictionaryItemResponseDto],
  })
  @ApiResponse({ status: 404, description: '字典类型不存在' })
  getDictionaryItemsByTypeCode(@Param('typeCode') typeCode: string) {
    return this.dictionariesService.getDictionaryItemsByTypeCode(typeCode);
  }
} 