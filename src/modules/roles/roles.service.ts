import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { BaseService } from '../../shared/services/base.service';
import { Prisma } from '@prisma/client';
import { ApiResponse, PaginationResponse } from '../../shared/interfaces/response.interface';

@Injectable()
export class RolesService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(createRoleDto: CreateRoleDto, currentUserId?: string): Promise<RoleResponseDto> {
    const { name, description, remark, sort, permissionIds } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        remark,
        sort: sort ?? 0,
        createdById: currentUserId,
      },
    });

    // 如果有权限ID，创建角色权限关联
    if (permissionIds && permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
          createdById: currentUserId,
        })),
      });
    }

    const result = await this.prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
    
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query?: QueryRoleDto,
  ): Promise<PaginationResponse<RoleResponseDto> | ApiResponse<RoleResponseDto[]>> {
    // 构建查询条件
    const where: Prisma.RoleWhereInput = {};

    if (query?.name) {
      where.name = {
        contains: query.name,
      };
    }

    if (query?.description) {
      where.description = {
        contains: query.description,
      };
    }

    // 基本字段选择，不包含关联数据
    const select = {
      id: true,
      name: true,
      description: true,
      remark: true,
      sort: true,
      createdAt: true,
      updatedAt: true,
    };

    // 判断是否需要分页 - 检查URL中是否真的传入了分页参数
    const hasPaginationParams = query && (
      (query.page !== undefined && query.page !== 1) || 
      (query.pageSize !== undefined && query.pageSize !== 10)
    );
    
    if (hasPaginationParams) {
      // 分页查询
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const [roles, totalItems] = await Promise.all([
        this.prisma.role.findMany({
          where,
          select,
          skip,
          take: pageSize,
          orderBy: [
            { sort: 'asc' },
            { createdAt: 'desc' },
          ],
        }),
        this.prisma.role.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        success: true,
        code: 200,
        message: '角色列表查询成功',
        data: {
          items: plainToInstance(RoleResponseDto, roles, {
            excludeExtraneousValues: true,
          }),
          total: totalItems,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 返回所有结果（不分页）
    const roles = await this.prisma.role.findMany({
      where,
      select,
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      code: 200,
      message: '角色列表查询成功',
      data: plainToInstance(RoleResponseDto, roles, {
        excludeExtraneousValues: true,
      }),
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: number): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                resource: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            nickname: true,
            status: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, currentUserId?: string): Promise<RoleResponseDto> {
    const { name, description, remark, sort, permissionIds } = updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    // 更新角色基本信息
    await this.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        remark,
        sort,
        updatedById: currentUserId,
      },
    });

    // 如果提供了权限ID，更新角色权限关联
    if (permissionIds !== undefined) {
      // 删除现有的角色权限关联
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // 创建新的角色权限关联
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const result = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
    
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  // 为角色分配权限
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 删除现有的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 创建新的角色权限关联
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    const result = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
    
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // 移除角色的权限
  async removePermissions(roleId: number, permissionIds: number[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 删除指定的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    const result = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
    
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
