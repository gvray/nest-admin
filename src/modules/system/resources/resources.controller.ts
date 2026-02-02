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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { ApiResponse as IApiResponse } from '@/shared/interfaces/response.interface';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteResourcesDto } from './dto/batch-delete-resources.dto';

@ApiTags('资源管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @RequirePermissions('system:resource:create')
  @ApiOperation({ summary: '创建资源' })
  @ApiResponse({
    status: 201,
    description: '资源创建成功',
    type: ResourceResponseDto,
  })
  async create(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<IApiResponse<ResourceResponseDto>> {
    const data = await this.resourcesService.create(createResourceDto);
    return ResponseUtil.created(data, '资源创建成功');
  }

  @Get()
  @RequirePermissions('system:resource:view')
  @ApiOperation({ summary: '获取资源列表' })
  @ApiResponse({
    status: 200,
    description: '获取资源列表成功',
    type: [ResourceResponseDto],
  })
  async findAll(
    @Query() queryDto: QueryResourceDto,
  ): Promise<IApiResponse<unknown>> {
    const pageData = await this.resourcesService.findAll(queryDto);
    return ResponseUtil.paginated(pageData, '获取资源列表成功');
  }

  @Get('tree')
  @RequirePermissions('system:resource:view')
  @ApiOperation({ summary: '获取资源树' })
  @ApiResponse({
    status: 200,
    description: '获取资源树成功',
    type: [ResourceResponseDto],
  })
  async findTree(
    @Query() queryDto: QueryResourceDto,
  ): Promise<IApiResponse<ResourceResponseDto[]>> {
    const data = await this.resourcesService.findTree(queryDto);
    return ResponseUtil.found(data, '获取资源树成功');
  }

  @Get('menus')
  @RequirePermissions('system:resource:view')
  @ApiOperation({ summary: '获取菜单资源' })
  @ApiResponse({
    status: 200,
    description: '获取菜单资源成功',
    type: [ResourceResponseDto],
  })
  async findMenus(): Promise<IApiResponse<ResourceResponseDto[]>> {
    const data = await this.resourcesService.findMenus();
    return ResponseUtil.found(data, '获取菜单资源成功');
  }

  @Get(':resourceId')
  @RequirePermissions('system:resource:view')
  @ApiOperation({ summary: '获取资源详情' })
  @ApiParam({ name: 'resourceId', description: '资源ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '获取资源详情成功',
    type: ResourceResponseDto,
  })
  async findOne(
    @Param('resourceId') resourceId: string,
  ): Promise<IApiResponse<ResourceResponseDto>> {
    const data = await this.resourcesService.findOne(resourceId);
    return ResponseUtil.found(data, '获取资源详情成功');
  }

  @Patch(':resourceId')
  @RequirePermissions('system:resource:update')
  @ApiOperation({ summary: '更新资源' })
  @ApiParam({ name: 'resourceId', description: '资源ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '资源更新成功',
    type: ResourceResponseDto,
  })
  async update(
    @Param('resourceId') resourceId: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<IApiResponse<ResourceResponseDto>> {
    const data = await this.resourcesService.update(
      resourceId,
      updateResourceDto,
    );
    return ResponseUtil.updated(data, '资源更新成功');
  }

  @Delete(':resourceId')
  @RequirePermissions('system:resource:delete')
  @ApiOperation({ summary: '删除资源' })
  @ApiParam({ name: 'resourceId', description: '资源ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '资源删除成功',
  })
  async remove(
    @Param('resourceId') resourceId: string,
  ): Promise<IApiResponse<null>> {
    await this.resourcesService.remove(resourceId);
    return ResponseUtil.deleted(null, '资源删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:resource:delete')
  @ApiOperation({ summary: '批量删除资源' })
  @ApiBody({ type: BatchDeleteResourcesDto })
  async batchDelete(@Body() dto: BatchDeleteResourcesDto) {
    await this.resourcesService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '资源删除成功');
  }
}
