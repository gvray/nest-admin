import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import type { Department } from '@prisma/client';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';
import { Prisma } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { ROOT_PARENT_ID } from '@/shared/constants/root.constant';

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
    let parentIdFinal: string | null = null;
    if (parentId && parentId !== ROOT_PARENT_ID) {
      const parent = await this.prisma.department.findUnique({
        where: { departmentId: parentId },
      });
      if (!parent) {
        throw new NotFoundException('父部门不存在');
      }
      parentIdFinal = parent.departmentId;
    } else {
      parentIdFinal = ROOT_PARENT_ID;
    }
    const department = await this.prisma.department.create({
      data: {
        ...departmentData,
        parentId: parentIdFinal,
      },
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
  ): Promise<PaginationData<DepartmentResponseDto>> {
    const { name, status, parentId, createdAtStart, createdAtEnd } = query;
    const where = this.buildWhere({
      contains: { name },
      equals: { status, parentId },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    const include = {
      _count: { select: { users: true } },
    };
    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.department.findMany({
          where,
          include,
          skip: state.skip,
          take: state.take,
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.department.count({ where }),
      ]);
      const transformed = plainToInstance(DepartmentResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.department.findMany({
      where,
      include,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    const total = await this.prisma.department.count({ where });
    const transformed = plainToInstance(DepartmentResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(departmentId: string): Promise<DepartmentResponseDto> {
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      include: {
        parent: true,
        children: true,
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            userPositions: {
              include: {
                position: true,
              },
            },
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
    departmentId: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    // 检查部门是否存在
    const existingDepartment = await this.prisma.department.findUnique({
      where: { departmentId },
    });

    if (!existingDepartment) {
      throw new NotFoundException('部门不存在');
    }

    // 检查名称是否与其他部门冲突
    if (updateDepartmentDto.name) {
      const conflictDepartment = await this.prisma.department.findFirst({
        where: {
          name: updateDepartmentDto.name,
          NOT: { departmentId },
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
        departmentId,
        updateDepartmentDto.parentId,
      );
      if (isCircular) {
        throw new ConflictException('不能形成循环引用');
      }
    }

    const department = await this.prisma.department.update({
      where: { departmentId },
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

  async remove(departmentId: string): Promise<void> {
    // 检查部门是否存在
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
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
      where: { departmentId },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const deps = await this.prisma.department.findMany({
      where: { departmentId: { in: ids } },
      include: { children: true, users: true },
    });
    const blocked = deps.filter(
      (d) => (d.children?.length ?? 0) > 0 || (d.users?.length ?? 0) > 0,
    );
    if (blocked.length > 0) {
      throw new ConflictException('存在子部门或用户，无法批量删除');
    }
    await this.prisma.department.deleteMany({
      where: { departmentId: { in: ids } },
    });
  }

  async getTree(
    queryDto?: QueryDepartmentDto,
  ): Promise<DepartmentResponseDto[]> {
    type DeptMinimal = { departmentId: string; parentId: string };
    let allDepartments: Department[] = [];

    // 检查是否有搜索条件
    const hasSearchConditions =
      queryDto?.name ||
      queryDto?.status !== undefined ||
      queryDto?.parentId ||
      queryDto?.createdAtStart !== undefined ||
      queryDto?.createdAtEnd !== undefined;

    if (hasSearchConditions) {
      // 有搜索条件时，先找到匹配的部门，然后获取对应的父级路径
      const whereConditions: Prisma.DepartmentWhereInput = {};

      // 处理状态过滤
      if (queryDto?.status !== undefined) {
        whereConditions.status = queryDto.status;
      } else {
        whereConditions.status = 1;
      }

      // 处理名称搜索
      if (queryDto?.name) {
        let processedName = queryDto.name;
        try {
          processedName = decodeURIComponent(queryDto.name);
        } catch {
          processedName = queryDto.name;
        }
        if (processedName.includes('å') || processedName.includes('ä')) {
          try {
            const buffer = Buffer.from(queryDto.name, 'latin1');
            processedName = buffer.toString('utf8');
          } catch {
            processedName = queryDto.name;
          }
        }

        whereConditions.name = { contains: processedName };
      }

      // 处理父部门ID过滤
      if (queryDto?.parentId !== undefined) {
        whereConditions.parentId = queryDto.parentId;
      }
      if (queryDto?.createdAtStart || queryDto?.createdAtEnd) {
        const o: { gte?: Date; lte?: Date } = {};
        if (queryDto.createdAtStart)
          o.gte = startOfDay(queryDto.createdAtStart);
        if (queryDto.createdAtEnd) o.lte = endOfDay(queryDto.createdAtEnd);
        whereConditions.createdAt = o;
      }

      // 找到匹配的部门
      const matchedDepartmentsRaw = await this.prisma.department.findMany({
        where: whereConditions,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        select: { departmentId: true, parentId: true },
      });
      const matchedDepartments: DeptMinimal[] = matchedDepartmentsRaw.map(
        (d) => ({
          departmentId: d.departmentId,
          parentId: d.parentId ?? ROOT_PARENT_ID,
        }),
      );

      if (matchedDepartments.length > 0) {
        // 收集所有需要包含的部门ID（匹配的部门 + 它们的父级路径）
        const departmentIdsToInclude = new Set<string>();

        for (const department of matchedDepartments) {
          departmentIdsToInclude.add(department.departmentId);
          // 添加父级部门
          await this.addDepartmentAncestorIds(
            department.parentId,
            departmentIdsToInclude,
          );
        }

        // 获取所有需要包含的部门
        allDepartments = await this.prisma.department.findMany({
          where: {
            departmentId: { in: Array.from(departmentIdsToInclude) },
            status: queryDto?.status !== undefined ? queryDto.status : 1,
          },
          orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        });
      }
    } else {
      // 没有搜索条件时，获取所有启用状态的部门
      allDepartments = await this.prisma.department.findMany({
        where: { status: 1 },
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      });
    }

    // 构建完整的树形结构
    interface DepartmentNode extends Department {
      children: DepartmentNode[];
    }

    const departmentMap = new Map<string, DepartmentNode>();
    const rootDepartments: DepartmentNode[] = [];

    // 首先创建所有部门的映射
    allDepartments.forEach((dept) => {
      departmentMap.set(dept.departmentId, {
        ...dept,
        children: [],
      });
    });

    // 构建父子关系
    allDepartments.forEach((dept) => {
      const departmentNode = departmentMap.get(dept.departmentId);

      if (dept.parentId && dept.parentId !== ROOT_PARENT_ID) {
        const parentNode = departmentMap.get(dept.parentId);
        if (parentNode && departmentNode) {
          parentNode.children.push(departmentNode);
        } else if (departmentNode) {
          // 如果父节点不在当前结果中，将其作为根节点
          rootDepartments.push(departmentNode);
        }
      } else if (departmentNode) {
        rootDepartments.push(departmentNode);
      }
    });
    // 递归转换嵌套对象为 DTO 格式
    const convertToDto = (nodes: DepartmentNode[]): DepartmentResponseDto[] => {
      return nodes.map((node) => {
        const dto = plainToInstance(DepartmentResponseDto, node, {
          excludeExtraneousValues: true,
        });

        if (node.children && node.children.length > 0) {
          dto.children = convertToDto(node.children);
        }

        return dto;
      });
    };

    return convertToDto(rootDepartments);
  }

  /**
   * 递归添加部门祖先ID
   */
  private async addDepartmentAncestorIds(
    parentId: string,
    departmentIds: Set<string>,
  ): Promise<void> {
    if (parentId === ROOT_PARENT_ID) return;

    departmentIds.add(parentId);

    const parentDepartment = await this.prisma.department.findUnique({
      where: { departmentId: parentId },
      select: { parentId: true },
    });

    if (parentDepartment?.parentId && parentDepartment.parentId !== ROOT_PARENT_ID) {
      await this.addDepartmentAncestorIds(parentDepartment.parentId, departmentIds);
    }
  }

  private async checkCircularReference(
    departmentId: string,
    parentId: string,
  ): Promise<boolean> {
    let currentParentDepartmentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentDepartmentId) {
      if (visited.has(currentParentDepartmentId)) {
        return true; // 发现循环
      }

      const currentDepartmentRaw = await this.prisma.department.findUnique({
        where: { departmentId: currentParentDepartmentId },
        select: { departmentId: true, parentId: true },
      });

      if (!currentDepartmentRaw) {
        break;
      }

      if (currentDepartmentRaw.departmentId === departmentId) {
        return true; // 发现循环
      }

      visited.add(currentParentDepartmentId);
      const parentIdNext = currentDepartmentRaw.parentId ?? ROOT_PARENT_ID;
      currentParentDepartmentId =
        parentIdNext === ROOT_PARENT_ID ? null : parentIdNext;
    }

    return false;
  }
}
