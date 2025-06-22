import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { PositionEntity } from './entities/position.entity';

@ApiTags('岗位管理')
@ApiBearerAuth()
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ summary: '创建岗位' })
  @ApiResponse({
    status: 201,
    description: '岗位创建成功',
    type: PositionEntity,
  })
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(createPositionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取岗位列表' })
  @ApiResponse({
    status: 200,
    description: '获取岗位列表成功',
  })
  findAll(@Query() query: QueryPositionDto) {
    return this.positionsService.findAll(query);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: '根据部门获取岗位列表' })
  @ApiResponse({
    status: 200,
    description: '获取部门岗位列表成功',
    type: [PositionEntity],
  })
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.positionsService.findByDepartment(+departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取岗位详情' })
  @ApiResponse({
    status: 200,
    description: '获取岗位详情成功',
    type: PositionEntity,
  })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位更新成功',
    type: PositionEntity,
  })
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionsService.update(+id, updatePositionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除岗位' })
  @ApiResponse({
    status: 200,
    description: '岗位删除成功',
  })
  remove(@Param('id') id: string) {
    return this.positionsService.remove(+id);
  }
} 