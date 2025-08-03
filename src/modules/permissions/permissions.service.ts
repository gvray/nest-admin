import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { PaginationSortDto } from '../../shared/dtos/pagination.dto';
import {
  ApiResponse,
  PaginationResponse,
} from '../../shared/interfaces/response.interface';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPermissionDto: CreatePermissionDto,
  ): Promise<ApiResponse<unknown>> {
    const { name, code, description, resourceId, action } = createPermissionDto;

    // 检查资源是否存在
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException('关联的资源不存在');
    }

    // 检查权限代码是否已存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermission) {
      throw new ConflictException('权限代码已存在');
    }

    const permission = await this.prisma.permission.create({
      data: {
        name,
        code,
        description,
        resourceId,
        action,
      },
      include: {
        resource: true,
      },
    });

    return ResponseUtil.created(permission, '权限创建成功');
  }

  async findAll(
    pagination?: PaginationSortDto,
  ): Promise<PaginationResponse<unknown> | ApiResponse<unknown>> {
    const include = {
      resource: true,
    };

    if (pagination) {
      return this.paginateWithSortAndResponse(
        this.prisma.permission,
        pagination,
        undefined,
        include,
        'createdAt',
        '权限列表查询成功',
      );
    }

    const permissions = await this.prisma.permission.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });

    return ResponseUtil.found(permissions, '权限列表查询成功');
  }

  async findOne(id: number): Promise<ApiResponse<unknown>> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        resource: true,
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return ResponseUtil.found(permission, '权限查询成功');
  }

  async update(
    id: number,
    updatePermissionDto: Partial<CreatePermissionDto>,
  ): Promise<ApiResponse<unknown>> {
    const { name, code, description, resourceId, action } = updatePermissionDto;

    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    // 如果更新资源ID，检查资源是否存在
    if (resourceId && resourceId !== permission.resourceId) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new NotFoundException('关联的资源不存在');
      }
    }

    // 如果更新权限代码，检查是否已存在
    if (code && code !== permission.code) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { code },
      });

      if (existingPermission) {
        throw new ConflictException('权限代码已存在');
      }
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        name,
        code,
        description,
        resourceId,
        action,
      },
      include: {
        resource: true,
      },
    });

    return ResponseUtil.updated(updatedPermission, '权限更新成功');
  }

  async remove(id: number): Promise<ApiResponse<unknown>> {
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
