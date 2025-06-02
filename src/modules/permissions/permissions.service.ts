import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, code, description } = createPermissionDto;

    return this.prisma.permission.create({
      data: {
        name,
        code,
        description,
      },
    });
  }

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: Partial<CreatePermissionDto>) {
    const { name, code, description } = updatePermissionDto;

    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        name,
        code,
        description,
      },
    });
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return this.prisma.permission.delete({
      where: { id },
    });
  }
} 