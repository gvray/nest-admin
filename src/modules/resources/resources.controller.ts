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
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiResponse as IApiResponse } from '../../shared/interfaces/response.interface';

@ApiTags('资源管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: '创建资源' })
  @ApiResponse({
    status: 201,
    description: '资源创建成功',
    type: ResourceResponseDto,
  })
  async create(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<IApiResponse<ResourceResponseDto>> {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({ summary: '获取资源列表' })
  @ApiResponse({
    status: 200,
    description: '获取资源列表成功',
    type: [ResourceResponseDto],
  })
  findAll(@Query() queryDto: QueryResourceDto): Promise<IApiResponse<ResourceResponseDto[]>> {
    return this.resourcesService.findAll(queryDto);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取资源树' })
  @ApiResponse({
    status: 200,
    description: '获取资源树成功',
    type: [ResourceResponseDto],
  })
  findTree(@Query() queryDto: QueryResourceDto): Promise<IApiResponse<ResourceResponseDto[]>> {
    console.log('Controller findTree called with queryDto:', queryDto);
    console.log('Controller findTree - name parameter:', queryDto?.name);
    return this.resourcesService.findTree(queryDto);
  }

  @Get('menus')
  @ApiOperation({ summary: '获取菜单资源' })
  @ApiResponse({
    status: 200,
    description: '获取菜单资源成功',
    type: [ResourceResponseDto],
  })
  findMenus(): Promise<IApiResponse<ResourceResponseDto[]>> {
    return this.resourcesService.findMenus();
  }

  @Get(':resourceId')
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
    return this.resourcesService.findOne(resourceId);
  }

  @Patch(':resourceId')
  @ApiOperation({ summary: '更新资源' })
  @ApiParam({ name: 'resourceId', description: '资源ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '资源更新成功',
    type: ResourceResponseDto,
  })
  update(
    @Param('resourceId') resourceId: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<IApiResponse<ResourceResponseDto>> {
    return this.resourcesService.update(resourceId, updateResourceDto);
  }

  @Delete(':resourceId')
  @ApiOperation({ summary: '删除资源' })
  @ApiParam({ name: 'resourceId', description: '资源ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '资源删除成功',
  })
  remove(@Param('resourceId') resourceId: string): Promise<IApiResponse<null>> {
    return this.resourcesService.remove(resourceId);
  }
}
