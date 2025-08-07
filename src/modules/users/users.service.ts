import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  PaginationResponse,
} from '../../shared/interfaces/response.interface';
import { UserStatus } from '../../shared/constants/user-status.constant';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const { password, departmentId, positionId, ...rest } = createUserDto;
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
    if (positionId) {
      const position = await this.prisma.position.findUnique({
        where: { positionId: positionId },
      });
      if (!position) {
        throw new NotFoundException('岗位不存在');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        department: departmentId ? { connect: { departmentId } } : undefined,
        position: positionId ? { connect: { positionId } } : undefined,
        status: rest.status ?? UserStatus.ENABLED,
      },
      include: {
        roles: true,
        department: true,
        position: true,
      },
    });

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
      roles: {
        select: {
          roleId: true,
          name: true,
        },
      },
      department: {
        select: {
          departmentId: true,
          name: true,
        },
      },
      position: {
        select: {
          positionId: true,
          name: true,
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
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            roleId: true,
            name: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        position: {
          select: {
            positionId: true,
            name: true,
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
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            roleId: true,
            name: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        position: {
          select: {
            positionId: true,
            name: true,
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
    const { departmentId, positionId, ...rest } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
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
    if (positionId) {
      const position = await this.prisma.position.findUnique({
        where: { positionId: positionId },
      });
      if (!position) {
        throw new NotFoundException('岗位不存在');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        ...rest,
        department: departmentId ? { connect: { departmentId } } : undefined,
        position: positionId ? { connect: { positionId } } : undefined,
      },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            roleId: true,
            name: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        position: {
          select: {
            positionId: true,
            name: true,
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, updatedUser, {
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

    return this.prisma.user.delete({
      where: { userId: user.userId },
    });
  }

  // 为用户分配角色
  async assignRoles(
    userId: string,
    roleIds: string[],
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        roles: {
          set: roleIds.map((roleId) => ({ roleId: roleId })),
        },
      },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            roleId: true,
            name: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        position: {
          select: {
            positionId: true,
            name: true,
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, updatedUser, {
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

    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        roles: {
          disconnect: roleIds.map((roleId) => ({ roleId: roleId })),
        },
      },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            roleId: true,
            name: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
          },
        },
        position: {
          select: {
            positionId: true,
            name: true,
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }
}
