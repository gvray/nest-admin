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
import { ResponseUtil } from '@/shared/utils/response.util';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  PaginationResponse,
} from '@/shared/interfaces/response.interface';
import { UserStatus } from '@/shared/constants/user-status.constant';

import {
  SUPER_ROLE_KEY,
  SUPER_USER_KEY,
} from '@/shared/constants/role.constant';
import { plainToInstance } from 'class-transformer';

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

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
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
    return ResponseUtil.created(userResponse, '用户创建成功');
  }

  async findAll(
    query?: QueryUserDto,
  ): Promise<
    PaginationResponse<UserResponseDto> | ApiResponse<UserResponseDto[]>
  > {
    // 构建查询条件
    const where: Prisma.UserWhereInput = {};

    if (query?.username) {
      where.username = {
        contains: query.username,
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

    // 处理日期范围查询
    if (query?.dateRange) {
      const [startDate, endDate] = query.dateRange.split('_to_');
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate + 'T00:00:00.000Z'),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        };
      }
    } else if (query?.createdAtStart || query?.createdAtEnd) {
      where.createdAt = {};
      if (query.createdAtStart) {
        where.createdAt.gte = new Date(query.createdAtStart);
      }
      if (query.createdAtEnd) {
        where.createdAt.lte = new Date(query.createdAtEnd);
      }
    }

    const include = {
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
    };

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query?.getSkip();
    const take = query?.getTake();

    if (skip !== undefined && take !== undefined && query) {
      const result = (await this.paginateWithSortAndResponse(
        this.prisma.user,
        query,
        where,
        include,
        'createdAt',
        '用户列表查询成功',
      )) as PaginationResponse<any>;

      if (
        'data' in result &&
        result.data &&
        'items' in result.data &&
        Array.isArray(result.data.items)
      ) {
        const transformedItems = plainToInstance(
          UserResponseDto,
          result.data.items,
          {
            excludeExtraneousValues: true,
          },
        );
        return {
          ...result,
          data: {
            ...result.data,
            items: transformedItems,
          },
        } as PaginationResponse<UserResponseDto>;
      }
      return result as PaginationResponse<UserResponseDto>;
    }

    const users = await this.prisma.user.findMany({
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
      orderBy: query?.getOrderBy
        ? query.getOrderBy('createdAt')
        : { createdAt: 'desc' },
    });

    const userResponses = plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
    return ResponseUtil.found(userResponses, '用户列表查询成功');
  }

  async findOne(userId: string): Promise<ApiResponse<UserResponseDto>> {
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
    return ResponseUtil.found(userResponse, '用户查询成功');
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

  async remove(userId: string) {
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

    return this.prisma.user.delete({
      where: { userId: user.userId },
    });
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
}
