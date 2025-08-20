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
import { DepartmentResponseDto } from './dto/department-response.dto';

@ApiTags('部门管理')
@ApiBearerAuth()
@Controller('system/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({
    status: 201,
    description: '部门创建成功',
    type: DepartmentResponseDto,
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
    type: [DepartmentResponseDto],
  })
  getTree(@Query() queryDto: QueryDepartmentDto) {
    return this.departmentsService.getTree(queryDto);
  }

  @Get(':departmentId')
  @ApiOperation({ summary: '获取部门详情' })
  @ApiResponse({
    status: 200,
    description: '获取部门详情成功',
    type: DepartmentResponseDto,
  })
  findOne(@Param('departmentId') departmentId: string) {
    return this.departmentsService.findOne(departmentId);
  }

  @Patch(':departmentId')
  @ApiOperation({ summary: '更新部门' })
  @ApiResponse({
    status: 200,
    description: '部门更新成功',
    type: DepartmentResponseDto,
  })
  update(
    @Param('departmentId') departmentId: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(departmentId, updateDepartmentDto);
  }

  @Delete(':departmentId')
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({
    status: 200,
    description: '部门删除成功',
  })
  remove(@Param('departmentId') departmentId: string) {
    return this.departmentsService.remove(departmentId);
  }
}
