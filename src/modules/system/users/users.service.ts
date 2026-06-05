import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { BaseService } from '@/shared/services/base.service';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { UserStatus } from '@/shared/constants/user-status.constant';

import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';
import { plainToInstance } from 'class-transformer';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';

@Injectable()
export class UsersService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 检查用户是否为超级管理员
   * @param userId 用户ID
   * @returns 是否为超级管理员
   */
  private async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                roleKey: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    return user.userRoles.some((ur) => ur.role.roleKey === SUPER_ROLE_KEY);
  }

  /**
   * 检查角色ID列表中是否包含超级管理员角色
   * @param roleIds 角色ID列表
   * @returns 是否包含超级管理员角色
   */
  private async containsSuperAdminRole(roleIds: string[]): Promise<boolean> {
    if (!roleIds || roleIds.length === 0) {
      return false;
    }

    const roles = await this.prisma.role.findMany({
      where: { roleId: { in: roleIds } },
      select: { roleKey: true },
    });

    return roles.some((role) => role.roleKey === SUPER_ROLE_KEY);
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

  private async validateRoleIds(roleIds: string[]): Promise<void> {
    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const count = await this.prisma.role.count({
      where: { roleId: { in: roleIds } },
    });
    if (count !== new Set(roleIds).size) {
      throw new NotFoundException('部分角色不存在');
    }
  }

  async create(
    createUserDto: CreateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const { password, departmentId, positionIds, ...rest } = createUserDto;

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (rest.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: rest.email },
      });
      if (existingUser) {
        throw new ConflictException('邮箱已被注册');
      }
    }

    // 检查用户名是否已存在
    if (rest.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: rest.username },
      });
      if (existingUser) {
        throw new ConflictException('用户名已被注册');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 验证部门是否存在
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { departmentId: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionIds && positionIds.length > 0) {
      const positions = await this.prisma.position.findMany({
        where: { positionId: { in: positionIds } },
      });
      if (positions.length !== positionIds.length) {
        throw new NotFoundException('部分岗位不存在');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        department: departmentId ? { connect: { departmentId } } : undefined,
        // 岗位关联将在创建用户后单独处理
        // 角色关联将在创建用户后单独处理
        status: rest.status ?? UserStatus.ENABLED,
        createdBy: currentUserId
          ? { connect: { userId: currentUserId } }
          : undefined,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        department: true,
        userPositions: {
          include: {
            position: true,
          },
        },
      },
    });

    // 创建用户岗位关联
    if (positionIds && positionIds.length > 0) {
      await this.prisma.userPosition.createMany({
        data: positionIds.map((positionId) => ({
          userId: user.userId,
          positionId: positionId,
          createdById: currentUserId,
        })),
      });
    }

    // 初始化用户默认偏好设置
    await this.prisma.userSettings.create({
      data: {
        userId: user.userId,
        settings: {
          theme: 'light',
          language: 'zh-CN',
          sidebarCollapsed: false,
          pageSize: 10,
          timezone: 'Asia/Shanghai',
          showWatermark: true,
          enableNotification: true,
          colorScheme: 'default',
        },
      },
    });

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    const userResponse = plainToInstance(UserResponseDto, userWithoutPassword, {
      excludeExtraneousValues: true,
    });
    return userResponse;
  }

  async findAll(
    query: QueryUserDto = new QueryUserDto(),
  ): Promise<PaginationData<UserResponseDto>> {
    // 构建查询条件
    const where: Prisma.UserWhereInput = {};

    if (query?.username) {
      where.username = {
        contains: query.username,
      };
    }

    if (query?.nickname) {
      where.nickname = {
        contains: query.nickname,
      };
    }

    if (query?.phone) {
      where.phone = {
        contains: query.phone,
      };
    }

    if (query?.status !== undefined) {
      where.status = query.status;
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

    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            userId: true,
            email: true,
            username: true,
            nickname: true,
            phone: true,
            avatar: true,
            gender: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    roleId: true,
                    name: true,
                  },
                },
              },
            },
            department: {
              select: {
                departmentId: true,
                name: true,
              },
            },
            userPositions: {
              select: {
                position: {
                  select: {
                    positionId: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.user.count({ where }),
      ]);
      const transformed = plainToInstance(UserResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.user.findMany({
      where,
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    const total = await this.prisma.user.count({ where });
    const transformed = plainToInstance(UserResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        gender: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    return userResponse;
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const { departmentId, positionIds, ...rest } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (
      userId === currentUserId &&
      updateUserDto.status === UserStatus.DISABLED
    ) {
      throw new ForbiddenException('不能禁用自己账号');
    }

    // 验证部门是否存在
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { departmentId: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionIds && positionIds.length > 0) {
      const positions = await this.prisma.position.findMany({
        where: { positionId: { in: positionIds } },
      });
      if (positions.length !== positionIds.length) {
        throw new NotFoundException('部分岗位不存在');
      }
    }

    // 先删除现有的关联关系
    if (positionIds !== undefined) {
      await this.prisma.userPosition.deleteMany({
        where: { userId: user.userId },
      });
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        ...rest,
        department: departmentId ? { connect: { departmentId } } : undefined,
        updatedBy: currentUserId
          ? { connect: { userId: currentUserId } }
          : undefined,
      },
    });

    // 创建新的岗位关联
    if (positionIds && positionIds.length > 0) {
      await this.prisma.userPosition.createMany({
        data: positionIds.map((positionId) => ({
          userId: user.userId,
          positionId,
          createdById: currentUserId,
        })),
      });
    }

    // 重新查询用户以获取完整的关联数据
    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, userWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  async remove(userId: string, currentUserId?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能删除自己账号');
    }

    if (
      (await this.isSuperAdmin(userId)) &&
      (await this.countSuperAdminUsers()) <= 1
    ) {
      throw new ForbiddenException('不能删除最后一个超级管理员');
    }

    await this.prisma.user.delete({
      where: { userId: user.userId },
    });
    return;
  }

  // 为用户分配角色
  async assignRoles(
    userId: string,
    roleIds: string[],
    currentUserId: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    await this.validateRoleIds(roleIds);

    const targetIsSuperAdmin = await this.isSuperAdmin(userId);
    const containsSuperRole = await this.containsSuperAdminRole(roleIds);
    if (
      targetIsSuperAdmin &&
      !containsSuperRole &&
      (await this.countSuperAdminUsers()) <= 1
    ) {
      throw new ForbiddenException('至少保留 1 个超级管理员');
    }

    // 先删除现有的角色关联
    await this.prisma.userRole.deleteMany({
      where: { userId: user.userId },
    });

    // 创建新的角色关联
    if (roleIds && roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: user.userId,
          roleId,
          createdById: currentUserId,
        })),
      });
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { updatedById: currentUserId },
    });

    // 重新查询用户以获取完整的关联数据
    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, userWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  // 移除用户的角色
  async removeRoles(
    userId: string,
    roleIds: string[],
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    if (userId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    await this.validateRoleIds(roleIds);

    const removesSuperRole = await this.containsSuperAdminRole(roleIds);
    if (
      removesSuperRole &&
      (await this.isSuperAdmin(userId)) &&
      (await this.countSuperAdminUsers()) <= 1
    ) {
      throw new ForbiddenException('至少保留 1 个超级管理员');
    }

    // 删除指定的角色关联
    if (roleIds && roleIds.length > 0) {
      await this.prisma.userRole.deleteMany({
        where: {
          userId: user.userId,
          roleId: { in: roleIds },
        },
      });
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { updatedById: currentUserId },
    });

    // 重新查询用户以获取完整的关联数据
    const userWithRelations = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, userWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  async removeMany(ids: string[], currentUserId?: string): Promise<void> {
    if (currentUserId && ids.includes(currentUserId)) {
      throw new ForbiddenException('不能删除自己账号');
    }

    const users = await this.prisma.user.findMany({
      where: { userId: { in: ids } },
      select: { userId: true },
    });
    let deletingSuperAdminCount = 0;
    for (const u of users) {
      if (await this.isSuperAdmin(u.userId)) {
        deletingSuperAdminCount++;
      }
    }
    if (
      deletingSuperAdminCount > 0 &&
      (await this.countSuperAdminUsers()) - deletingSuperAdminCount < 1
    ) {
      throw new ForbiddenException('至少保留 1 个超级管理员');
    }
    await this.prisma.user.deleteMany({
      where: { userId: { in: ids } },
    });
  }
}
