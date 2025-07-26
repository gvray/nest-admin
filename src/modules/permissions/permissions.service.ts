import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { PaginationSortDto } from '../../shared/dtos/pagination.dto';
import { ApiResponse, PaginationResponse } from '../../shared/interfaces/response.interface';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<ApiResponse<any>> {
    const { name, code, description } = createPermissionDto;

    const permission = await this.prisma.permission.create({
      data: {
        name,
        code,
        description,
      },
    });

    return ResponseUtil.created(permission, '权限创建成功');
  }

  async findAll(pagination?: PaginationSortDto): Promise<PaginationResponse<any> | ApiResponse<any>> {
    if (pagination) {
      return this.paginateWithSortAndResponse(
        this.prisma.permission,
        pagination,
        undefined,
        undefined,
        'createdAt',
        '权限列表查询成功',
      );
    }
    
    const permissions = await this.prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return ResponseUtil.found(permissions, '权限列表查询成功');
  }

  async findOne(id: number): Promise<ApiResponse<any>> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return ResponseUtil.found(permission, '权限查询成功');
  }

  async update(id: number, updatePermissionDto: Partial<CreatePermissionDto>): Promise<ApiResponse<any>> {
    const { name, code, description } = updatePermissionDto;

    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        name,
        code,
        description,
      },
    });

    return ResponseUtil.updated(updatedPermission, '权限更新成功');
  }

  async remove(id: number): Promise<ApiResponse<any>> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return ResponseUtil.deleted(null, '权限删除成功');
  }
}