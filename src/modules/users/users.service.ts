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
        where: { id: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionId) {
      const position = await this.prisma.position.findUnique({
        where: { id: positionId },
      });
      if (!position) {
        throw new NotFoundException('岗位不存在');
      }

      // 如果指定了部门，检查岗位是否属于该部门
      if (departmentId && position.departmentId !== departmentId) {
        throw new ConflictException('岗位不属于指定的部门');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        departmentId,
        positionId,
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
          id: true,
          name: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    if (query && (query.page || query.pageSize)) {
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
        id: true,
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
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
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
        id: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        remark: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
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

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        userId: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        status: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOneByAccount(account: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { username: account }, { phone: account }],
      },
      select: {
        id: true,
        userId: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        status: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { departmentId, positionId, ...rest } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 验证部门是否存在
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    // 验证岗位是否存在
    if (positionId) {
      const position = await this.prisma.position.findUnique({
        where: { id: positionId },
      });
      if (!position) {
        throw new NotFoundException('岗位不存在');
      }

      // 如果指定了部门，检查岗位是否属于该部门
      if (departmentId && position.departmentId !== departmentId) {
        throw new ConflictException('岗位不属于指定的部门');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { userId: userId },
      data: {
        ...rest,
        departmentId,
        positionId,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        remark: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async removeByUserId(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { userId: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const result = await this.prisma.user.deleteMany({
      where: { userId: userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('用户删除失败');
    }

    return { message: '用户删除成功' };
  }

  // 为用户分配角色
  async assignRoles(
    userId: string,
    roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { userId: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        remark: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
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
    roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { userId: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          disconnect: roleIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        remark: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
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
