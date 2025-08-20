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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { Roles } from '@/core/decorators/roles.decorator';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';

@ApiTags('岗位管理')
@Controller('system/positions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('position:create')
  @Audit('create')
  @ApiOperation({ summary: '创建岗位' })
  @ApiResponse({
    status: 201,
    description: '岗位创建成功',
    type: PositionResponseDto,
  })
  create(@Body() createPositionDto: CreatePositionDto, @Request() req: any) {
    const currentUserId = req.user?.userId;
    return this.positionsService.create(createPositionDto, currentUserId);
  }

  @Get()
  @Roles('admin', 'user')
  @RequirePermissions('position:view')
  @ApiOperation({ summary: '获取岗位列表' })
  @ApiResponse({
    status: 200,
    description: '获取岗位列表成功',
  })
  findAll(@Query() query: QueryPositionDto) {
    return this.positionsService.findAll(query);
  }



  @Get(':id')
  @Roles('admin', 'user')
  @RequirePermissions('position:view')
  @ApiOperation({ summary: '获取岗位详情' })
  @ApiResponse({
    status: 200,
    description: '获取岗位详情成功',
    type: PositionResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('position:update')
  @Audit('update')
  @ApiOperation({ summary: '更新岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位更新成功',
    type: PositionResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @Request() req: any,
  ) {
    const currentUserId = req.user?.userId;
    return this.positionsService.update(id, updatePositionDto, currentUserId);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('position:delete')
  @Audit('delete')
  @ApiOperation({ summary: '删除岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位删除成功',
  })
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }
}
