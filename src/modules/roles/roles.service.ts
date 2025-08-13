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
    const { name, roleKey, description, remark, sort, status, permissionIds } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name,
        roleKey,
        description,
        remark,
        sort: sort ?? 0,
        status: status ?? 1,
        createdById: currentUserId,
      },
    });

    // 如果有权限ID，创建角色权限关联
    if (permissionIds && permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.roleId,
          permissionId: permissionId.toString(),
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
      roleId: true,
      roleKey: true,
      name: true,
      description: true,
      remark: true,
      sort: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    };

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query?.getSkip();
    const take = query?.getTake();
    
    if (skip !== undefined && take !== undefined && query) {
      // 分页查询
      const [roles, totalItems] = await Promise.all([
        this.prisma.role.findMany({
          where,
          select,
          skip,
          take,
          orderBy: [
            { sort: 'asc' },
            { createdAt: 'desc' },
          ],
        }),
        this.prisma.role.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / take);

      return {
        success: true,
        code: 200,
        message: '角色列表查询成功',
        data: {
          items: plainToInstance(RoleResponseDto, roles, {
            excludeExtraneousValues: true,
          }),
          total: totalItems,
          page: query.page!,
          pageSize: query.pageSize!,
          totalPages,
          hasNext: query.page! < totalPages,
          hasPrev: query.page! > 1,
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

  async findOne(roleId: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
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
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  async update(roleId: string, updateRoleDto: UpdateRoleDto, currentUserId?: string): Promise<RoleResponseDto> {
    const { name, roleKey, description, remark, sort, status, permissionIds } = updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 更新角色基本信息
    await this.prisma.role.update({
      where: { roleId },
      data: {
        name,
        roleKey,
        description,
        remark,
        sort,
        status,
        updatedById: currentUserId,
      },
    });

    // 如果提供了权限ID，更新角色权限关联
    if (permissionIds !== undefined) {
      // 删除现有的角色权限关联
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: role.roleId },
      });

      // 创建新的角色权限关联
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.roleId,
            permissionId: permissionId.toString(),
          })),
        });
      }
    }

    const result = await this.prisma.role.findUnique({
      where: { roleId },
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

  async remove(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    await this.prisma.role.delete({
      where: { roleId },
    });
  }

  // 为角色分配权限
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 删除现有的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: role.roleId },
    });

    // 创建新的角色权限关联
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.roleId,
          permissionId: permissionId,
        })),
      });
    }

    const result = await this.prisma.role.findUnique({
      where: { roleId },
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
  async removePermissions(roleId: string, permissionIds: string[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 删除指定的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: role.roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    const result = await this.prisma.role.findUnique({
      where: { roleId },
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

  // 为角色分配用户
  async assignUsers(roleId: string, userIds: string[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 验证用户是否存在
    const users = await this.prisma.user.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('部分用户不存在');
    }

    // 先删除该角色的所有用户关联
    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
      },
    });

    // 创建新的用户角色关联
    await this.prisma.userRole.createMany({
      data: userIds.map((userId) => ({
        roleId,
        userId,
      })),
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
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
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, updatedRole, {
      excludeExtraneousValues: true,
    });
  }

  // 移除角色的用户
  async removeUsers(roleId: string, userIds: string[]): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
        userId: {
          in: userIds,
        },
      },
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
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
        userRoles: {
          include: {
            user: {
              select: {
                userId: true,
                username: true,
                nickname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, updatedRole, {
      excludeExtraneousValues: true,
    });
  }
}
