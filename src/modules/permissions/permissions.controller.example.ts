import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsServiceExample } from './permissions.service.example';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PaginationSortDto } from '../../shared/dtos/pagination.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { SkipResponseFormat } from '../../core/decorators/skip-response-format.decorator';

/**
 * 权限控制器示例 - 展示如何使用统一响应格式
 * 这是一个示例文件，展示如何重构现有控制器以使用统一响应格式
 */
@ApiTags('权限管理示例')
@Controller('permissions-example')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsControllerExample {
  constructor(private readonly permissionsService: PermissionsServiceExample) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({
    status: 201,
    description: '权限创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 201 },
        message: { type: 'string', example: '权限创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '用户管理' },
            code: { type: 'string', example: 'user:manage' },
            description: { type: 'string', example: '用户管理权限' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/permissions-example' },
      },
    },
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    // 由于使用了全局响应拦截器，这里可以直接返回服务的结果
    // 拦截器会自动包装为统一格式
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询权限列表' })
  @ApiResponse({
    status: 200,
    description: '权限列表查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '权限列表查询成功' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '用户管理' },
                  code: { type: 'string', example: 'user:manage' },
                  description: { type: 'string', example: '用户管理权限' },
                  createdAt: {
                    type: 'string',
                    example: '2024-01-01T00:00:00.000Z',
                  },
                  updatedAt: {
                    type: 'string',
                    example: '2024-01-01T00:00:00.000Z',
                  },
                },
              },
            },
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/permissions-example' },
      },
    },
  })
  findAll(@Query() pagination: PaginationSortDto) {
    return this.permissionsService.findAll(pagination);
  }

  @Get('search')
  @Roles('admin')
  @ApiOperation({ summary: '搜索权限' })
  @ApiResponse({ status: 200, description: '权限搜索成功' })
  search(
    @Query('keyword') keyword: string,
    @Query() pagination: PaginationSortDto,
  ) {
    return this.permissionsService.search(keyword, pagination);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '根据ID查询权限' })
  @ApiResponse({ status: 200, description: '权限查询成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '权限更新成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: Partial<CreatePermissionDto>,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '权限删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  // 示例：跳过响应格式化的接口
  @Get('export')
  @Roles('admin')
  @SkipResponseFormat() // 使用装饰器跳过响应格式化
  @ApiOperation({ summary: '导出权限数据' })
  @ApiResponse({ status: 200, description: '导出成功' })
  export() {
    // 这个接口返回的数据不会被响应拦截器格式化
    // 适用于文件下载、流数据等场景
    return {
      filename: 'permissions.xlsx',
      data: 'binary data...',
    };
  }
}
