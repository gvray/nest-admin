import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { BaseService } from '../../shared/services/base.service';
import {
  ApiResponse,
  PaginationResponse,
} from '../../shared/interfaces/response.interface';

@Injectable()
export class DepartmentsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    // 检查名称是否已存在
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        name: createDepartmentDto.name,
      },
    });

    if (existingDepartment) {
      throw new ConflictException('部门名称已存在');
    }

    // 如果有父部门，检查父部门是否存在
    if (createDepartmentDto.parentId) {
      const parentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: createDepartmentDto.parentId },
      });

      if (!parentDepartment) {
        throw new NotFoundException('父部门不存在');
      }
    }

    const { parentId, ...departmentData } = createDepartmentDto;
    const department = await this.prisma.department.create({
      data: {
        ...departmentData,
        ...(parentId && { parentId }),
      } as any,
      include: {
        parent: true,
        children: true,
      },
    });

    return plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryDepartmentDto,
  ): Promise<
    | PaginationResponse<DepartmentResponseDto>
    | ApiResponse<DepartmentResponseDto[]>
  > {
    const { name, status, parentId } = query;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const include = {
      _count: {
        select: {
          users: true,
        },
      },
    };

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query.getSkip();
    const take = query.getTake();

    if (skip !== undefined && take !== undefined) {
      // 分页查询
      const [departments, totalItems] = await Promise.all([
        this.prisma.department.findMany({
          where,
          include,
          skip,
          take,
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.department.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / take);

      return {
        success: true,
        code: 200,
        message: '部门列表查询成功',
        data: {
          items: plainToInstance(DepartmentResponseDto, departments, {
            excludeExtraneousValues: true,
          }),
          total: totalItems,
          page: query.page!,
          pageSize: query.pageSize!,
          totalPages,
          hasNext: query.page! < totalPages,
          hasPrev: query.page! > 1,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 返回全量数据（不分页）
    const departments = await this.prisma.department.findMany({
      where,
      include,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      code: 200,
      message: '部门列表查询成功',
      data: plainToInstance(DepartmentResponseDto, departments, {
        excludeExtraneousValues: true,
      }),
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: number): Promise<DepartmentResponseDto> {
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
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    return plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    // 检查部门是否存在
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException('部门不存在');
    }

    // 检查名称是否与其他部门冲突
    if (updateDepartmentDto.name) {
      const conflictDepartment = await this.prisma.department.findFirst({
        where: {
          name: updateDepartmentDto.name,
          NOT: { id },
        },
      });

      if (conflictDepartment) {
        throw new ConflictException('部门名称已存在');
      }
    }

    // 如果更新父部门，检查父部门是否存在且不形成循环引用
    if (updateDepartmentDto.parentId) {
      const parentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: updateDepartmentDto.parentId },
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

    return plainToInstance(DepartmentResponseDto, department, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number): Promise<void> {
    // 检查部门是否存在
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        children: true,
        users: true,
      },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    // 检查是否有子部门
    if (department.children && department.children.length > 0) {
      throw new ConflictException('该部门下还有子部门，无法删除');
    }

    // 检查是否有用户
    if (department.users && department.users.length > 0) {
      throw new ConflictException('该部门下还有用户，无法删除');
    }

    await this.prisma.department.delete({
      where: { id },
    });
  }

  async getTree(): Promise<DepartmentResponseDto[]> {
    const departments = await this.prisma.department.findMany({
      where: { status: 1 },
      include: {
        children: {
          where: { status: 1 },
          include: {
            children: {
              where: { status: 1 },
            },
          },
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    // 只返回顶级部门
    const topLevelDepartments = departments.filter((dept) => !dept.parentId);
    return plainToInstance(DepartmentResponseDto, topLevelDepartments, {
      excludeExtraneousValues: true,
    });
  }

  private async checkCircularReference(
    departmentId: number,
    parentId: string,
  ): Promise<boolean> {
    let currentParentDepartmentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentDepartmentId) {
      if (visited.has(currentParentDepartmentId)) {
        return true; // 发现循环
      }

      const currentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: currentParentDepartmentId },
        select: { id: true, parentId: true },
      });

      if (!currentDepartment) {
        break;
      }

      if (currentDepartment.id === departmentId) {
        return true; // 发现循环
      }

      visited.add(currentParentDepartmentId);
      currentParentDepartmentId = currentDepartment.parentId;
    }

    return false;
  }
}
