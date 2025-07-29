import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

@Injectable()
export class UsersService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<unknown>> {
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
    return ResponseUtil.created(userWithoutPassword, '用户创建成功');
  }

  async findAll(
    query?: QueryUserDto,
  ): Promise<PaginationResponse<unknown> | ApiResponse<unknown>> {
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
      return this.paginateWithSortAndResponse(
        this.prisma.user,
        query,
        where,
        include,
        'createdAt',
        '用户列表查询成功',
      );
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
      orderBy: query?.getOrderBy
        ? query.getOrderBy('createdAt')
        : { createdAt: 'desc' },
    });

    return ResponseUtil.found(users, '用户列表查询成功');
  }

  async findOne(id: number): Promise<ApiResponse<unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    return ResponseUtil.found(user, '用户查询成功');
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
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

  async findOneByUserId(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: parseInt(userId) },
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
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, departmentId, positionId, ...rest } = updateUserDto;
    let hashedPassword: string | undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
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

    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(hashedPassword && { password: hashedPassword }),
        departmentId,
        positionId,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        department: true,
        position: true,
      },
    });
  }

  async updateByUserId(userId: string, updateUserDto: UpdateUserDto) {
    const { password, departmentId, positionId, ...rest } = updateUserDto;
    let hashedPassword: string | undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.findFirst({
      where: { id: parseInt(userId) },
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

    const result = await this.prisma.user.updateMany({
      where: { id: parseInt(userId) },
      data: {
        ...rest,
        ...(hashedPassword && { password: hashedPassword }),
        departmentId,
        positionId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('用户更新失败');
    }

    return await this.findOneByUserId(userId);
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
      where: { id: parseInt(userId) },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const result = await this.prisma.user.deleteMany({
      where: { id: parseInt(userId) },
    });

    if (result.count === 0) {
      throw new NotFoundException('用户删除失败');
    }

    return { message: '用户删除成功' };
  }

  // 为用户分配角色
  async assignRoles(userId: string, roleIds: number[]) {
    const user = await this.prisma.user.findFirst({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })),
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        department: true,
        position: true,
      },
    });
  }

  // 移除用户的角色
  async removeRoles(userId: string, roleIds: number[]) {
    const user = await this.prisma.user.findFirst({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          disconnect: roleIds.map((id) => ({ id })),
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        department: true,
        position: true,
      },
    });
  }
}
