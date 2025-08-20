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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { Roles } from '@/core/decorators/roles.decorator';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';

@ApiTags('配置管理')
@Controller('system/configs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('config:create')
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
  @Roles('admin')
  @RequirePermissions('config:view')
  @ApiOperation({ summary: '获取配置列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [ConfigResponseDto],
  })
  findAll(@Query() query: QueryConfigDto = new QueryConfigDto()) {
    return this.configsService.findAll(query);
  }

  @Get('key/:key')
  @Roles('admin')
  @RequirePermissions('config:view')
  @ApiOperation({ summary: '根据配置键获取配置' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: ConfigResponseDto,
  })
  findByKey(@Param('key') key: string) {
    return this.configsService.findByKey(key);
  }

  @Get('group/:group')
  @Roles('admin')
  @RequirePermissions('config:view')
  @ApiOperation({ summary: '根据分组获取配置列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [ConfigResponseDto],
  })
  findByGroup(@Param('group') group: string) {
    return this.configsService.findByGroup(group);
  }

  @Get('batch')
  @Roles('admin')
  @RequirePermissions('config:view')
  @ApiOperation({ summary: '根据多个配置键获取配置' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  getConfigsByKeys(@Query('keys') keys: string) {
    const keyArray = keys.split(',').map((key) => key.trim());
    return this.configsService.getConfigsByKeys(keyArray);
  }

  @Get(':configId')
  @Roles('admin')
  @RequirePermissions('config:view')
  @ApiOperation({ summary: '根据ID获取配置详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: ConfigResponseDto,
  })
  findOne(@Param('configId') configId: string) {
    return this.configsService.findOne(configId);
  }

  @Patch(':configId')
  @Roles('admin')
  @RequirePermissions('config:update')
  @ApiOperation({ summary: '更新配置' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: ConfigResponseDto,
  })
  update(
    @Param('configId') configId: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @CurrentUser() user: IUser,
  ) {
    return this.configsService.update(configId, updateConfigDto, user.userId);
  }

  @Delete(':configId')
  @Roles('admin')
  @RequirePermissions('config:delete')
  @ApiOperation({ summary: '删除配置' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  remove(@Param('configId') configId: string) {
    return this.configsService.remove(configId);
  }
} 