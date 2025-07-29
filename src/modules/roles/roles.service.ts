import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds } = createRoleDto;

    return this.prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds
          ? {
              connect: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { name, description, permissionIds } = updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissionIds
          ? {
              set: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }

  // 为角色分配权限
  async assignPermissions(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  // 移除角色的权限
  async removePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: permissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }
}
