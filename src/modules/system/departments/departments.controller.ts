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
  ApiBody,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { DEPARTMENT_PERMISSIONS } from '@/shared/constants/permissions.constant';
import { BatchDeleteDepartmentsDto } from './dto/batch-delete-departments.dto';

@ApiTags('部门管理')
@ApiBearerAuth()
@Controller('system/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @RequirePermissions(DEPARTMENT_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({
    status: 201,
    description: '部门创建成功',
    type: DepartmentResponseDto,
  })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const data = await this.departmentsService.create(createDepartmentDto);
    return ResponseUtil.created(data, '部门创建成功');
  }

  @Get()
  @RequirePermissions(DEPARTMENT_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResponse({
    status: 200,
    description: '获取部门列表成功',
  })
  async findAll(@Query() query: QueryDepartmentDto) {
    const pageData = await this.departmentsService.findAll(query);
    return ResponseUtil.paginated(pageData, '获取部门列表成功');
  }

  @Get('tree')
  @RequirePermissions(DEPARTMENT_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取部门树形结构' })
  @ApiResponse({
    status: 200,
    description: '获取部门树形结构成功',
    type: [DepartmentResponseDto],
  })
  async getTree(@Query() queryDto: QueryDepartmentDto) {
    const data = await this.departmentsService.getTree(queryDto);
    return ResponseUtil.found(data, '获取部门树形结构成功');
  }

  @Get(':id')
  @RequirePermissions(DEPARTMENT_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取部门详情' })
  @ApiResponse({
    status: 200,
    description: '获取部门详情成功',
    type: DepartmentResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const data = await this.departmentsService.findOne(id);
    return ResponseUtil.found(data, '获取部门详情成功');
  }

  @Patch(':id')
  @RequirePermissions(DEPARTMENT_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新部门' })
  @ApiResponse({
    status: 200,
    description: '部门更新成功',
    type: DepartmentResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const data = await this.departmentsService.update(id, updateDepartmentDto);
    return ResponseUtil.updated(data, '部门更新成功');
  }

  @Delete(':id')
  @RequirePermissions(DEPARTMENT_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '删除部门' })
  @ApiResponse({
    status: 200,
    description: '部门删除成功',
  })
  async remove(@Param('id') id: string) {
    await this.departmentsService.remove(id);
    return ResponseUtil.deleted(null, '部门删除成功');
  }

  @Post('batch-delete')
  @RequirePermissions(DEPARTMENT_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '批量删除部门' })
  @ApiBody({ type: BatchDeleteDepartmentsDto })
  async batchDelete(@Body() dto: BatchDeleteDepartmentsDto) {
    await this.departmentsService.removeMany(dto.ids);
    return ResponseUtil.deleted(null, '部门删除成功');
  }
}
