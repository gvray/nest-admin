import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      },
      include: {
        roles: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    return user;
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
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
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

    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(hashedPassword && { password: hashedPassword }),
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
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
      },
    });
  }
} 