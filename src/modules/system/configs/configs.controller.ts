import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';

import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeleteConfigsDto } from './dto/batch-delete-configs.dto';

@ApiTags('配置管理')
@Controller('system/configs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @RequirePermissions('system:config:create')
  @ApiOperation({ summary: '创建配置' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: ConfigResponseDto,
  })
  create(@Body() createConfigDto: CreateConfigDto, @CurrentUser() user: IUser) {
    return this.configsService.create(createConfigDto, user.userId);
  }

  @Get()
  @RequirePermissions('system:config:view')
  @ApiOperation({ summary: '获取配置列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [ConfigResponseDto],
  })
  async findAll(@Query() query: QueryConfigDto = new QueryConfigDto()) {
    const pageData = await this.configsService.findAll(query);
    return ResponseUtil.paginated(pageData, '配置列表获取成功');
  }

  @Get('key/:key')
  @RequirePermissions('system:config:view')
  @ApiOperation({ summary: '根据配置键获取配置' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: ConfigResponseDto,
  })
  async findByKey(@Param('key') key: string) {
    const data = await this.configsService.findByKey(key);
    return ResponseUtil.found(data, '获取成功');
  }

  @Get('group/:group')
  @RequirePermissions('system:config:view')
  @ApiOperation({ summary: '根据分组获取配置列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [ConfigResponseDto],
  })
  async findByGroup(@Param('group') group: string) {
    const data = await this.configsService.findByGroup(group);
    return ResponseUtil.found(data, '获取成功');
  }

  @Get('batch')
  @RequirePermissions('system:config:view')
  @ApiOperation({ summary: '根据多个配置键获取配置' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  async getConfigsByKeys(@Query('keys') keys: string) {
    const keyArray = keys.split(',').map((key) => key.trim());
    const data = await this.configsService.getConfigsByKeys(keyArray);
    return ResponseUtil.found(data, '获取成功');
  }

  @Get(':configId')
  @RequirePermissions('system:config:view')
  @ApiOperation({ summary: '根据ID获取配置详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: ConfigResponseDto,
  })
  async findOne(@Param('configId') configId: string) {
    const data = await this.configsService.findOne(configId);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':configId')
  @RequirePermissions('system:config:update')
  @ApiOperation({ summary: '更新配置' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: ConfigResponseDto,
  })
  async update(
    @Param('configId') configId: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.configsService.update(
      configId,
      updateConfigDto,
      user.userId,
    );
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':configId')
  @RequirePermissions('system:config:delete')
  @ApiOperation({ summary: '删除配置' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async remove(@Param('configId') configId: string) {
    await this.configsService.remove(configId);
    return ResponseUtil.deleted(null, '删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:config:delete')
  @ApiOperation({ summary: '批量删除配置' })
  @ApiBody({ type: BatchDeleteConfigsDto })
  async batchDelete(@Body() dto: BatchDeleteConfigsDto) {
    await this.configsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
