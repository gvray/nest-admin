import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentEntity } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    // 检查部门名称和编码是否已存在
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        OR: [
          { name: createDepartmentDto.name },
          { code: createDepartmentDto.code },
        ],
      },
    });

    if (existingDepartment) {
      throw new ConflictException('部门名称或编码已存在');
    }

    // 如果有父部门，检查父部门是否存在
    if (createDepartmentDto.parentId) {
      const parentDepartment = await this.prisma.department.findUnique({
        where: { id: createDepartmentDto.parentId },
      });

      if (!parentDepartment) {
        throw new NotFoundException('父部门不存在');
      }
    }

    const department = await this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return department;
  }

  async findAll(query: QueryDepartmentDto) {
    const { name, code, isActive, parentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name };
    }

    if (code) {
      where.code = { contains: code };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              users: true,
              positions: true,
            },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<DepartmentEntity> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        users: {
          include: {
            roles: true,
            position: true,
          },
        },
        positions: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    // 检查部门是否存在
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException('部门不存在');
    }

    // 检查名称和编码是否与其他部门冲突
    if (updateDepartmentDto.name || updateDepartmentDto.code) {
      const conflictDepartment = await this.prisma.department.findFirst({
        where: {
          OR: [
            ...(updateDepartmentDto.name
              ? [{ name: updateDepartmentDto.name }]
              : []),
            ...(updateDepartmentDto.code
              ? [{ code: updateDepartmentDto.code }]
              : []),
          ],
          NOT: { id },
        },
      });

      if (conflictDepartment) {
        throw new ConflictException('部门名称或编码已存在');
      }
    }

    // 检查父部门
    if (updateDepartmentDto.parentId) {
      if (updateDepartmentDto.parentId === id) {
        throw new ConflictException('不能将自己设为父部门');
      }

      const parentDepartment = await this.prisma.department.findUnique({
        where: { id: updateDepartmentDto.parentId },
      });

      if (!parentDepartment) {
        throw new NotFoundException('父部门不存在');
      }

      // 检查是否形成循环引用
      const isCircular = await this.checkCircularReference(
        id,
        updateDepartmentDto.parentId,
      );
      if (isCircular) {
        throw new ConflictException('不能形成循环引用');
      }
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return department;
  }

  async remove(id: number): Promise<void> {
    // 检查部门是否存在
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        children: true,
        users: true,
        positions: true,
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    // 检查是否有子部门
    if (department.children.length > 0) {
      throw new ConflictException('请先删除子部门');
    }

    // 检查是否有用户
    if (department.users.length > 0) {
      throw new ConflictException('请先移除部门下的用户');
    }

    // 检查是否有岗位
    if (department.positions.length > 0) {
      throw new ConflictException('请先删除部门下的岗位');
    }

    await this.prisma.department.delete({
      where: { id },
    });
  }

  async getTree(): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    // 只返回顶级部门
    return departments.filter((dept) => !dept.parentId);
  }

  private async checkCircularReference(
    departmentId: number,
    parentId: number,
  ): Promise<boolean> {
    let currentParentId: number | null = parentId;
    const visited = new Set<number>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // 发现循环
      }

      visited.add(currentParentId);

      const parent: { parentId: number | null } | null =
        await this.prisma.department.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentId;
    }

    return false;
  }
}
