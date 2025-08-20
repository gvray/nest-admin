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

  async findOne(departmentId: string): Promise<DepartmentResponseDto> {
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      include: {
        parent: true,
        children: true,
        users: {
          include: {
            roles: true,
            positions: true,
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

  async getTree(queryDto?: QueryDepartmentDto): Promise<ApiResponse<DepartmentResponseDto[]>> {
    console.log('getTree called with queryDto:', queryDto);

    let allDepartments: any[] = [];

    // 检查是否有搜索条件
    const hasSearchConditions = queryDto?.name || queryDto?.status !== undefined || queryDto?.parentId;

    if (hasSearchConditions) {
      // 有搜索条件时，先找到匹配的部门，然后获取对应的父级路径
      const whereConditions: any = {};

      // 处理状态过滤
      if (queryDto?.status !== undefined) {
        whereConditions.status = queryDto.status;
      } else {
        // 默认只显示启用状态的部门
        whereConditions.status = 1;
      }

      // 处理名称搜索
      if (queryDto?.name) {
        // 修复字符编码问题：对名称进行 URL 解码
        let processedName = queryDto.name;

        // 方法1：尝试 URL 解码
        try {
          processedName = decodeURIComponent(queryDto.name);
        } catch (error) {
          // 忽略错误
        }

        // 方法2：如果还是乱码，尝试 Buffer 转换
        if (processedName.includes('å') || processedName.includes('ä')) {
          try {
            const buffer = Buffer.from(queryDto.name, 'latin1');
            processedName = buffer.toString('utf8');
          } catch (error) {
            // 忽略错误
          }
        }

        whereConditions.name = { contains: processedName };
        console.log('getTree - Original name:', queryDto.name);
        console.log('getTree - Processed name:', processedName);
      }

      // 处理父部门ID过滤
      if (queryDto?.parentId !== undefined) {
        whereConditions.parentId = queryDto.parentId;
      }

      console.log('getTree - Final whereConditions:', whereConditions);

      // 找到匹配的部门
      const matchedDepartments = await this.prisma.department.findMany({
        where: whereConditions,
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      });

      console.log('getTree - Found departments count:', matchedDepartments.length);

      if (matchedDepartments.length > 0) {
        // 收集所有需要包含的部门ID（匹配的部门 + 它们的父级路径）
        const departmentIdsToInclude = new Set<string>();

        for (const department of matchedDepartments) {
          departmentIdsToInclude.add(department.departmentId);
          // 添加父级部门
          await this.addDepartmentAncestorIds(department.parentId, departmentIdsToInclude);
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

    console.log('getTree - Final departments count:', allDepartments.length);

    // 构建完整的树形结构
    interface DepartmentNode {
      [key: string]: any;
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

      if (dept.parentId) {
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

    const result = convertToDto(rootDepartments);

    return {
      success: true,
      code: 200,
      message: '操作成功',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 递归添加部门祖先ID
   */
  private async addDepartmentAncestorIds(
    parentId: string | null,
    departmentIds: Set<string>,
  ): Promise<void> {
    if (!parentId) return;

    departmentIds.add(parentId);

    const parentDepartment = await this.prisma.department.findUnique({
      where: { departmentId: parentId },
      select: { parentId: true },
    });

    if (parentDepartment?.parentId) {
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

      const currentDepartment = await this.prisma.department.findUnique({
        where: { departmentId: currentParentDepartmentId },
        select: { departmentId: true, parentId: true },
      });

      if (!currentDepartment) {
        break;
      }

      if (currentDepartment.departmentId === departmentId) {
        return true; // 发现循环
      }

      visited.add(currentParentDepartmentId);
      currentParentDepartmentId = currentDepartment.parentId;
    }

    return false;
  }
}
