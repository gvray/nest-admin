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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentEntity } from './entities/department.entity';

@ApiTags('部门管理')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({
    status: 201,
    description: '部门创建成功',
    type: DepartmentEntity,
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResponse({
    status: 200,
    description: '获取部门列表成功',
  })
  findAll(@Query() query: QueryDepartmentDto) {
    return this.departmentsService.findAll(query);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取部门树形结构' })
  @ApiResponse({
    status: 200,
    description: '获取部门树形结构成功',
    type: [DepartmentEntity],
  })
  getTree() {
    return this.departmentsService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取部门详情' })
  @ApiResponse({
    status: 200,
    description: '获取部门详情成功',
    type: DepartmentEntity,
  })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新部门' })
  @ApiResponse({
    status: 200,
    description: '部门更新成功',
    type: DepartmentEntity,
  })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({
    status: 200,
    description: '部门删除成功',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(+id);
  }
}
