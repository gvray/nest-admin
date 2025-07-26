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
import { PaginationSortDto } from '../../shared/dtos/pagination.dto';
import {
  ApiResponse,
  PaginationResponse,
} from '../../shared/interfaces/response.interface';

@Injectable()
export class UsersService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<any>> {
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
    pagination?: PaginationSortDto,
  ): Promise<PaginationResponse<any> | ApiResponse<any>> {
    if (pagination) {
      return this.paginateWithSortAndResponse(
        this.prisma.user,
        pagination,
        {
          roles: {
            include: {
              permissions: true,
            },
          },
          department: true,
          position: true,
        },
        undefined,
        'createdAt',
        '用户列表查询成功',
      );
    }

    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        department: true,
        position: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return ResponseUtil.found(usersWithoutPassword, '用户列表查询成功');
  }

  async findOne(id: number): Promise<ApiResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return ResponseUtil.found(userWithoutPassword, '用户查询成功');
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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

  async findOneByAccount(account: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { username: account }, { phone: account }],
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

  // 为用户分配角色
  async assignRoles(userId: number, roleIds: number[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return this.prisma.user.update({
      where: { id: userId },
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
  async removeRoles(userId: number, roleIds: number[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    return this.prisma.user.update({
      where: { id: userId },
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
