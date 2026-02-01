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
  ApiBody,
} from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { BatchDeletePositionsDto } from './dto/batch-delete-positions.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';

@ApiTags('岗位管理')
@Controller('system/positions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @RequirePermissions('system:position:create')
  @Audit('create')
  @ApiOperation({ summary: '创建岗位' })
  @ApiResponse({
    status: 201,
    description: '岗位创建成功',
    type: PositionResponseDto,
  })
  async create(
    @Body() createPositionDto: CreatePositionDto,
    @CurrentUser() user: IUser,
  ) {
    const currentUserId = user.userId;
    const data = await this.positionsService.create(
      createPositionDto,
      currentUserId,
    );
    return ResponseUtil.created(data, '岗位创建成功');
  }

  @Get()
  @RequirePermissions('system:position:view')
  @ApiOperation({ summary: '获取岗位列表' })
  @ApiResponse({
    status: 200,
    description: '获取岗位列表成功',
  })
  async findAll(@Query() query: QueryPositionDto) {
    const pageData = await this.positionsService.findAll(query);
    return ResponseUtil.paginated(pageData, '获取岗位列表成功');
  }

  @Get(':id')
  @RequirePermissions('system:position:view')
  @ApiOperation({ summary: '获取岗位详情' })
  @ApiResponse({
    status: 200,
    description: '获取岗位详情成功',
    type: PositionResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const data = await this.positionsService.findOne(id);
    return ResponseUtil.found(data, '获取岗位详情成功');
  }

  @Patch(':id')
  @RequirePermissions('system:position:update')
  @Audit('update')
  @ApiOperation({ summary: '更新岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位更新成功',
    type: PositionResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @CurrentUser() user: IUser,
  ) {
    const currentUserId = user.userId;
    const data = await this.positionsService.update(
      id,
      updatePositionDto,
      currentUserId,
    );
    return ResponseUtil.updated(data, '岗位更新成功');
  }

  @Delete(':id')
  @RequirePermissions('system:position:delete')
  @Audit('delete')
  @ApiOperation({ summary: '删除岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位删除成功',
  })
  async remove(@Param('id') id: string) {
    await this.positionsService.remove(id);
    return ResponseUtil.deleted(null, '岗位删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions('system:position:delete')
  @Audit('delete')
  @ApiOperation({ summary: '批量删除岗位' })
  @ApiBody({ type: BatchDeletePositionsDto })
  async batchDelete(@Body() dto: BatchDeletePositionsDto) {
    await this.positionsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '岗位删除成功');
  }
}
