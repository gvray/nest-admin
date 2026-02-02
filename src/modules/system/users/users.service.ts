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

import {
  SUPER_ROLE_KEY,
  SUPER_USER_KEY,
} from '@/shared/constants/role.constant';
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
   * 检查用户名是否为超级管理员用户名
   * @param username 用户名
   * @returns 是否为超级管理员用户名
   */
  private isSuperAdminUsername(username: string): boolean {
    return username === SUPER_USER_KEY;
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

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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

    // 禁止创建超级管理员账号
    if (this.isSuperAdminUsername(rest.username)) {
      throw new ForbiddenException('不允许创建超级管理员账号');
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
        })),
      });
    }

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
  ): Promise<UserResponseDto> {
    const { departmentId, positionIds, ...rest } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 禁止修改超级管理员账号
    if (await this.isSuperAdmin(userId)) {
      throw new ForbiddenException('不允许修改超级管理员账号');
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
      },
    });

    // 创建新的岗位关联
    if (positionIds && positionIds.length > 0) {
      await this.prisma.userPosition.createMany({
        data: positionIds.map((positionId) => ({
          userId: user.userId,
          positionId,
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

  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 禁止删除超级管理员账号
    if (await this.isSuperAdmin(userId)) {
      throw new ForbiddenException('不允许删除超级管理员账号');
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

    // 检查是否要修改超级管理员的角色
    if (await this.isSuperAdmin(userId)) {
      // 只有超级管理员才能修改超级管理员的角色
      const isCurrentUserSuperAdmin = await this.isSuperAdmin(currentUserId);
      if (!isCurrentUserSuperAdmin) {
        throw new ForbiddenException('只有超级管理员才能修改超级管理员的角色');
      }
      // 检查是否试图修改超级管理员用户的角色
      if (this.isSuperAdminUsername(user.username)) {
        throw new ForbiddenException('不允许修改超级管理员用户的角色分配');
      }
    }

    // 检查是否要分配超级管理员角色
    const containsSuperRole = await this.containsSuperAdminRole(roleIds);
    if (containsSuperRole) {
      // 只有超级管理员才能分配超级管理员角色
      const isCurrentUserSuperAdmin = await this.isSuperAdmin(currentUserId);
      if (!isCurrentUserSuperAdmin) {
        throw new ForbiddenException('只有超级管理员才能分配超级管理员角色');
      }
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

  // 移除用户的角色
  async removeRoles(
    userId: string,
    roleIds: string[],
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
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

  async removeMany(ids: string[]): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, username: true },
    });
    const blocked: string[] = [];
    for (const u of users) {
      if (await this.isSuperAdmin(u.userId)) {
        blocked.push(u.userId);
      }
      if (this.isSuperAdminUsername(u.username)) {
        blocked.push(u.userId);
      }
    }
    if (blocked.length > 0) {
      throw new ForbiddenException('包含超级管理员用户，无法批量删除');
    }
    await this.prisma.user.deleteMany({
      where: { userId: { in: ids } },
    });
  }
}
