import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommonStatus } from '@/shared/constants/common-status.constant';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { DataScopeService } from './services/data-scope.service';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';

@Injectable()
export class RolesService extends BaseService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {
    super(prisma);
  }

  private async countSuperAdminUsers(): Promise<number> {
    return this.prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: {
              roleKey: SUPER_ROLE_KEY,
            },
          },
        },
      },
    });
  }

  private async validatePermissionIds(permissionIds: string[]): Promise<void> {
    if (!permissionIds || permissionIds.length === 0) {
      return;
    }

    const count = await this.prisma.permission.count({
      where: {
        permissionId: { in: permissionIds },
        origin: 'SYSTEM',
        deletedAt: null,
      },
    });
    if (count !== new Set(permissionIds).size) {
      throw new NotFoundException('部分权限不存在或不是扫描生成权限');
    }
  }

  async create(
    createRoleDto: CreateRoleDto,
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const { name, roleKey, description, remark, sort, status, permissionIds } =
      createRoleDto;

    await this.validatePermissionIds(permissionIds ?? []);

    // 检查是否尝试创建超级角色
    if (roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('不允许创建超级管理员角色');
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        roleKey,
        description,
        remark,
        sort: sort ?? 0,
        status: (status as string) ?? CommonStatus.ENABLED,
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
            permission: true,
          },
        },
      },
    });
    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryRoleDto = new QueryRoleDto(),
  ): Promise<PaginationData<RoleResponseDto>> {
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

    if (query?.roleKey) {
      where.roleKey = {
        contains: query.roleKey,
      };
    }

    if (query?.status !== undefined) {
      where.status = query.status as string;
    }

    if (query?.createdAtStart || query?.createdAtEnd) {
      where.createdAt = {};
      if (query.createdAtStart) {
        where.createdAt.gte = startOfDay(query.createdAtStart);
      }
      if (query.createdAtEnd) {
        where.createdAt.lte = endOfDay(query.createdAtEnd);
      }
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

    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          select,
          skip: state.skip,
          take: state.take,
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.role.count({ where }),
      ]);
      const transformed = plainToInstance(RoleResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.role.findMany({
      where,
      select,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    const total = await this.prisma.role.count({ where });
    const transformed = plainToInstance(RoleResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(roleId: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
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

  async update(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const { name, roleKey, description, remark, sort, status, permissionIds } =
      updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: { userRoles: true },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (roleKey && roleKey !== role.roleKey) {
      throw new ForbiddenException('角色标识不可修改');
    }

    // 检查是否为超级角色，如果是则不允许修改
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改');
    }

    await this.validatePermissionIds(permissionIds ?? []);

    // 更新角色基本信息
    await this.prisma.role.update({
      where: { roleId },
      data: {
        name,
        description,
        remark,
        sort,
        status: status as string | undefined,
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
            createdById: currentUserId,
          })),
        });
      }
    }

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
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
      include: { userRoles: true },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许删除
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许删除');
    }

    if ((role.userRoles?.length ?? 0) > 0) {
      throw new ForbiddenException('不能删除正在被使用的角色');
    }

    await this.prisma.role.delete({
      where: { roleId },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const roles = await this.prisma.role.findMany({
      where: { roleId: { in: ids } },
      include: { userRoles: true },
    });
    const blocked = roles.filter(
      (r) => r.roleKey === SUPER_ROLE_KEY || (r.userRoles?.length ?? 0) > 0,
    );
    if (blocked.length > 0) {
      throw new ForbiddenException('存在超级角色或绑定用户，无法批量删除');
    }
    await this.prisma.role.deleteMany({
      where: { roleId: { in: ids } },
    });
  }

  // 为角色分配权限
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许修改权限
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改权限');
    }

    await this.validatePermissionIds(permissionIds);

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
          createdById: currentUserId,
        })),
      });
    }

    await this.prisma.role.update({
      where: { roleId: role.roleId },
      data: { updatedById: currentUserId },
    });

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // 移除角色的权限
  async removePermissions(
    roleId: string,
    permissionIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 检查是否为超级角色，如果是则不允许移除权限
    if (role.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许移除权限');
    }

    await this.validatePermissionIds(permissionIds);

    // 删除指定的角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: role.roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    await this.prisma.role.update({
      where: { roleId: role.roleId },
      data: { updatedById: currentUserId },
    });

    const result = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return plainToInstance(RoleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  // 为角色分配用户
  async assignUsers(
    roleId: string,
    userIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (role.roleKey === SUPER_ROLE_KEY && userIds.length === 0) {
      throw new ForbiddenException('至少保留 1 个超级管理员');
    }

    if (currentUserId) {
      const currentMembership = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: currentUserId,
            roleId,
          },
        },
      });
      if (Boolean(currentMembership) !== userIds.includes(currentUserId)) {
        throw new ForbiddenException('不能修改自己的角色');
      }
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
        createdById: currentUserId,
      })),
    });

    await this.prisma.role.update({
      where: { roleId },
      data: { updatedById: currentUserId },
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
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
  async removeUsers(
    roleId: string,
    userIds: string[],
    currentUserId?: string,
  ): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    if (currentUserId && userIds.includes(currentUserId)) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    if (role.roleKey === SUPER_ROLE_KEY) {
      const removingCount = await this.prisma.userRole.count({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });
      if ((await this.countSuperAdminUsers()) - removingCount < 1) {
        throw new ForbiddenException('至少保留 1 个超级管理员');
      }
    }

    await this.prisma.userRole.deleteMany({
      where: {
        roleId,
        userId: {
          in: userIds,
        },
      },
    });

    await this.prisma.role.update({
      where: { roleId },
      data: { updatedById: currentUserId },
    });

    const updatedRole = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
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

  // 为角色分配数据权限
  async assignDataScope(
    roleId: string,
    dataScope: number,
    departmentIds?: string[],
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    // 检查是否为超级角色，如果是则不允许修改数据权限
    if (role?.roleKey === SUPER_ROLE_KEY) {
      throw new ForbiddenException('超级管理员角色不允许修改数据权限');
    }

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.dataScopeService.assignDataScopeToRole(
      roleId,
      dataScope,
      departmentIds,
      currentUserId,
    );
  }

  // 获取角色的数据权限
  async getRoleDataScope(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.dataScopeService.getRoleDataScope(roleId);
  }
}
