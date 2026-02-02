import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { PaginationData } from '@/shared/interfaces/response.interface';
import { plainToInstance } from 'class-transformer';
import { ResourceType } from '@prisma/client';
import { BaseService } from '@/shared/services/base.service';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';

@Injectable()
export class ResourcesService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    // 检查代码是否已存在
    const existingCodeResource = await this.prisma.resource.findUnique({
      where: {
        code: createResourceDto.code,
      },
    });

    if (existingCodeResource) {
      throw new ConflictException('资源代码已存在');
    }

    // 检查名称是否已存在
    const existingNameResource = await this.prisma.resource.findUnique({
      where: {
        name: createResourceDto.name,
      },
    });

    if (existingNameResource) {
      throw new ConflictException('资源名称已存在');
    }

    // 验证资源层级关系
    await this.validateResourceHierarchy(
      createResourceDto.type,
      createResourceDto.parentId,
    );

    // 如果有父级资源，检查父级资源是否存在
    let parentId: string | null = null;

    if (createResourceDto.parentId) {
      const parentResource = await this.prisma.resource.findUnique({
        where: { resourceId: createResourceDto.parentId },
      });

      if (!parentResource) {
        throw new NotFoundException('父级资源不存在');
      }
      parentId = parentResource.resourceId;
    }

    const resource = await this.prisma.resource.create({
      data: {
        name: createResourceDto.name,
        code: createResourceDto.code,
        type: createResourceDto.type as ResourceType,
        path: createResourceDto.path,

        icon: createResourceDto.icon,
        parentId: parentId,
        sort: createResourceDto.sort,
        description: createResourceDto.description,
      },
      include: {
        parent: true,
      },
    });

    return plainToInstance(ResourceResponseDto, resource);
  }

  async findAll(
    queryDto: QueryResourceDto = new QueryResourceDto(),
  ): Promise<PaginationData<ResourceResponseDto>> {
    const { name, code, path, type, status, createdAtStart, createdAtEnd } =
      queryDto;
    const where = this.buildWhere({
      contains: { name, code, path },
      equals: { type, status },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    const state = this.getPaginationState(queryDto);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.resource.findMany({
          where,
          orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.resource.count({ where }),
      ]);
      const transformed = plainToInstance(ResourceResponseDto, items);
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.resource.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });
    const total = await this.prisma.resource.count({ where });
    const transformed = plainToInstance(ResourceResponseDto, items);
    return {
      items: transformed,
      total,
      page: queryDto.page ?? 1,
      pageSize: queryDto.pageSize ?? transformed.length,
    };
  }

  async findTree(queryDto?: QueryResourceDto): Promise<ResourceResponseDto[]> {
    const hasFilters =
      queryDto?.name ||
      queryDto?.code ||
      queryDto?.type ||
      queryDto?.createdAtStart !== undefined ||
      queryDto?.createdAtEnd !== undefined;
    const filterMode = queryDto?.filterMode || 'loose';

    if (!hasFilters) {
      // 没有过滤条件，返回所有资源（管理接口应该显示所有状态）
      const allResources = await this.prisma.resource.findMany({
        where:
          queryDto?.status !== undefined ? { status: queryDto.status } : {},
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
      });

      const treeResources = this.buildMenuTreeForResponse(
        allResources.map((resource) =>
          plainToInstance(ResourceResponseDto, resource),
        ),
      );

      return treeResources;
    }

    if (filterMode === 'strict') {
      // 严格模式：只返回匹配条件的资源
      const whereConditions: Record<string, unknown> = {};

      // 只有当明确指定 status 时才过滤状态
      if (queryDto?.status !== undefined) {
        whereConditions.status = queryDto.status;
      }

      if (queryDto?.name) {
        // 修复字符编码问题：对名称进行 URL 解码
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

      if (queryDto?.code) {
        whereConditions.code = { contains: queryDto.code };
      }

      if (queryDto?.type) {
        whereConditions.type = queryDto.type;
      }

      if (queryDto?.path) {
        whereConditions.path = { contains: queryDto.path };
      }

      if (queryDto?.createdAtStart || queryDto?.createdAtEnd) {
        const o: { gte?: Date; lte?: Date } = {};
        if (queryDto.createdAtStart)
          o.gte = startOfDay(queryDto.createdAtStart);
        if (queryDto.createdAtEnd) o.lte = endOfDay(queryDto.createdAtEnd);
        (whereConditions as Record<string, unknown>).createdAt = o;
      }

      const filteredResources = await this.prisma.resource.findMany({
        where: whereConditions,
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
      });

      const treeResources = this.buildMenuTreeForResponse(
        filteredResources.map((resource) =>
          plainToInstance(ResourceResponseDto, resource),
        ),
      );

      return treeResources;
    } else {
      // 宽松模式：返回匹配的资源及其完整父级路径
      const res = await this.findTreeWithLooseFilter(queryDto!);
      return res;
    }
  }

  async findMenus(): Promise<ResourceResponseDto[]> {
    const allMenuResources = await this.prisma.resource.findMany({
      where: {
        status: 1,
        type: {
          in: ['DIRECTORY', 'MENU'],
        },
      },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    const treeMenuResources = this.buildMenuTreeForResponse(
      allMenuResources.map((resource) =>
        plainToInstance(ResourceResponseDto, resource),
      ),
    );

    return treeMenuResources;
  }

  async findOne(resourceId: string): Promise<ResourceResponseDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { resourceId },
    });

    if (!resource) {
      throw new NotFoundException('资源不存在');
    }

    return plainToInstance(ResourceResponseDto, resource);
  }

  async update(
    resourceId: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    // 检查资源是否存在
    const existingResource = await this.prisma.resource.findUnique({
      where: { resourceId },
    });

    if (!existingResource) {
      throw new NotFoundException('资源不存在');
    }

    // 检查代码冲突（排除自己）
    if (
      updateResourceDto.code &&
      updateResourceDto.code !== existingResource.code
    ) {
      const existingCodeResource = await this.prisma.resource.findUnique({
        where: {
          code: updateResourceDto.code,
        },
      });

      if (
        existingCodeResource &&
        existingCodeResource.resourceId !== resourceId
      ) {
        throw new ConflictException('资源代码已存在');
      }
    }

    // 检查名称冲突（排除自己）
    if (
      updateResourceDto.name &&
      updateResourceDto.name !== existingResource.name
    ) {
      const existingNameResource = await this.prisma.resource.findUnique({
        where: {
          name: updateResourceDto.name,
        },
      });

      if (
        existingNameResource &&
        existingNameResource.resourceId !== resourceId
      ) {
        throw new ConflictException('资源名称已存在');
      }
    }

    // 验证资源层级关系（如果类型或父级资源发生变化）
    if (updateResourceDto.type || updateResourceDto.parentId !== undefined) {
      const typeToValidate = updateResourceDto.type || existingResource.type;
      const parentIdToValidate =
        updateResourceDto.parentId !== undefined
          ? updateResourceDto.parentId
          : existingResource.parentId;

      await this.validateResourceHierarchy(typeToValidate, parentIdToValidate);
    }

    // 处理父级资源
    let parentId: string | null = existingResource.parentId;
    if (updateResourceDto.parentId !== undefined) {
      if (updateResourceDto.parentId) {
        // 检查循环引用
        if (updateResourceDto.parentId === resourceId) {
          throw new ConflictException('不能将自己设置为父级资源');
        }

        const parentResource = await this.prisma.resource.findUnique({
          where: { resourceId: updateResourceDto.parentId },
        });

        if (!parentResource) {
          throw new NotFoundException('父级资源不存在');
        }

        // 检查是否会形成循环引用：不能将一个子级资源设置为父级
        const wouldCreateCycle = await this.isDescendant(
          existingResource.resourceId,
          parentResource.resourceId,
        );
        if (wouldCreateCycle) {
          throw new ConflictException('不能设置子级资源为父级资源');
        }

        parentId = parentResource.resourceId;
      } else {
        parentId = null;
      }
    }

    const resource = await this.prisma.resource.update({
      where: { resourceId },
      data: {
        name: updateResourceDto.name,
        code: updateResourceDto.code,
        type: updateResourceDto.type as ResourceType,
        path: updateResourceDto.path,

        icon: updateResourceDto.icon,
        parentId: parentId,
        status: updateResourceDto.status,
        sort: updateResourceDto.sort,
        description: updateResourceDto.description,
      },
      include: {
        parent: true,
      },
    });

    return plainToInstance(ResourceResponseDto, resource);
  }

  async remove(resourceId: string): Promise<void> {
    const resource = await this.prisma.resource.findUnique({
      where: { resourceId },
      include: {
        children: true,
        permissions: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('资源不存在');
    }

    // 检查是否有子资源
    if (resource.children && resource.children.length > 0) {
      throw new ConflictException('存在子级资源，无法删除');
    }

    // 检查是否有关联的权限
    if (resource.permissions && resource.permissions.length > 0) {
      throw new ConflictException('存在关联权限，无法删除');
    }

    await this.prisma.resource.delete({
      where: { resourceId },
    });

    return;
  }

  private buildMenuTree(
    resources: ResourceResponseDto[],
  ): ResourceResponseDto[] {
    const resourceMap = new Map<
      string,
      ResourceResponseDto & { children?: ResourceResponseDto[] }
    >();
    const rootResources: Array<
      ResourceResponseDto & { children?: ResourceResponseDto[] }
    > = [];

    // 创建资源映射 - 使用 resourceId 作为 key
    resources.forEach((resource) => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach((resource) => {
      if (resource.parentId) {
        const parent = resourceMap.get(resource.parentId);
        if (parent) {
          const child = resourceMap.get(resource.resourceId);
          if (child) {
            parent.children = parent.children || [];
            parent.children.push(child);
          }
        }
      } else {
        const node = resourceMap.get(resource.resourceId);
        if (node) rootResources.push(node);
      }
    });

    // 清理空的children数组
    const cleanupEmptyChildren = (
      nodes: Array<ResourceResponseDto & { children?: ResourceResponseDto[] }>,
    ): ResourceResponseDto[] => {
      return nodes.map((node) => {
        const cleanNode: ResourceResponseDto & {
          children?: ResourceResponseDto[];
        } = { ...node };
        if (cleanNode.children && cleanNode.children.length > 0) {
          cleanNode.children = cleanupEmptyChildren(cleanNode.children);
        } else {
          delete cleanNode.children;
        }
        return cleanNode;
      });
    };

    return cleanupEmptyChildren(rootResources);
  }

  private buildMenuTreeForResponse(
    resources: ResourceResponseDto[],
  ): ResourceResponseDto[] {
    const resourceMap = new Map<
      string,
      ResourceResponseDto & { children?: ResourceResponseDto[] }
    >();
    const rootResources: Array<
      ResourceResponseDto & { children?: ResourceResponseDto[] }
    > = [];

    resources.forEach((resource) => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach((resource) => {
      const mappedResource = resourceMap.get(resource.resourceId);
      if (!mappedResource) return;
      if (resource.parentId) {
        const parent = resourceMap.get(resource.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(mappedResource);
        } else {
          rootResources.push(mappedResource);
        }
      } else {
        rootResources.push(mappedResource);
      }
    });

    const cleanupEmptyChildren = (
      nodes: Array<ResourceResponseDto & { children?: ResourceResponseDto[] }>,
    ): ResourceResponseDto[] => {
      return nodes.map((node) => {
        const cleanNode: ResourceResponseDto & {
          children?: ResourceResponseDto[];
        } = { ...node };
        if (cleanNode.children && cleanNode.children.length > 0) {
          cleanNode.children = cleanupEmptyChildren(cleanNode.children);
        } else {
          delete cleanNode.children;
        }
        return cleanNode;
      });
    };

    return cleanupEmptyChildren(rootResources);
  }

  /**
   * 验证资源层级关系
   * 规则：
   * - 目录(DIRECTORY): 只能创建在顶级或目录下
   * - 菜单(MENU): 只能创建在顶级或目录下
   */
  private async validateResourceHierarchy(
    resourceType: string,
    parentId?: string | null,
  ): Promise<void> {
    // 如果没有父级资源，目录和菜单都可以创建在顶级
    if (!parentId) {
      if (resourceType !== 'DIRECTORY' && resourceType !== 'MENU') {
        throw new BadRequestException('只有目录和菜单可以创建在顶级');
      }
      return;
    }

    // 获取父级资源信息
    const parentResource = await this.prisma.resource.findUnique({
      where: { resourceId: parentId },
    });

    if (!parentResource) {
      throw new NotFoundException('父级资源不存在');
    }

    // 验证层级关系
    switch (resourceType) {
      case 'DIRECTORY':
        // 目录只能创建在顶级或目录下
        if (parentResource.type !== 'DIRECTORY') {
          throw new BadRequestException('目录只能创建在顶级或目录下');
        }
        break;

      case 'MENU':
        // 菜单可以创建在顶级或目录下
        if (parentResource.type !== 'DIRECTORY') {
          throw new BadRequestException('菜单只能创建在顶级或目录下');
        }
        break;

      default:
        throw new BadRequestException('无效的资源类型');
    }
  }

  /**
   * 获取资源类型的中文名称
   */
  private getResourceTypeName(type: string): string {
    const typeNames = {
      DIRECTORY: '目录',
      MENU: '菜单',
    };
    return typeNames[type] || type;
  }

  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const resource = await this.prisma.resource.findUnique({
      where: { resourceId: descendantId },
      include: {
        parent: true,
      },
    });

    if (!resource || !resource.parent) {
      return false;
    }

    if (resource.parent.resourceId === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, resource.parent.resourceId);
  }

  /**
   * 宽松过滤模式：返回匹配的资源及其完整父级路径
   */
  private async findTreeWithLooseFilter(
    queryDto: QueryResourceDto,
  ): Promise<ResourceResponseDto[]> {
    // 构建过滤条件
    const whereConditions: Record<string, unknown> = {};

    // 只有当明确指定 status 时才过滤状态
    if (queryDto?.status !== undefined) {
      whereConditions.status = queryDto.status;
    }

    if (queryDto?.name) {
      whereConditions.name = { contains: queryDto.name };
    }

    if (queryDto?.code) {
      whereConditions.code = { contains: queryDto.code };
    }

    if (queryDto?.type) {
      whereConditions.type = queryDto.type;
    }

    if (queryDto?.path) {
      whereConditions.path = { contains: queryDto.path };
    }

    if (queryDto?.createdAtStart || queryDto?.createdAtEnd) {
      const o: { gte?: Date; lte?: Date } = {};
      if (queryDto.createdAtStart) o.gte = startOfDay(queryDto.createdAtStart);
      if (queryDto.createdAtEnd) o.lte = endOfDay(queryDto.createdAtEnd);
      whereConditions.createdAt = o;
    }

    // 找到所有匹配的资源
    const matchedResources = await this.prisma.resource.findMany({
      where: whereConditions,
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    if (matchedResources.length === 0) {
      return [];
    }

    // 收集所有需要包含的资源ID（匹配的资源 + 它们的所有祖先）
    const resourceIdsToInclude = new Set<string>();

    for (const resource of matchedResources) {
      resourceIdsToInclude.add(resource.resourceId);

      // 添加所有祖先资源
      await this.addAncestorIds(resource.parentId, resourceIdsToInclude);
    }

    // 获取所有需要包含的资源
    const ancestorWhereConditions: Record<string, unknown> = {
      resourceId: { in: Array.from(resourceIdsToInclude) },
    };

    // 只有当明确指定 status 时才过滤状态
    if (queryDto?.status !== undefined) {
      ancestorWhereConditions.status = queryDto.status;
    }

    const allIncludedResources = await this.prisma.resource.findMany({
      where: ancestorWhereConditions,
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    const treeResources = this.buildMenuTreeForResponse(
      allIncludedResources.map((resource) =>
        plainToInstance(ResourceResponseDto, resource),
      ),
    );

    return treeResources;
  }

  /**
   * 递归添加祖先资源ID
   */
  private async addAncestorIds(
    parentId: string | null,
    resourceIds: Set<string>,
  ): Promise<void> {
    if (!parentId) return;

    resourceIds.add(parentId);

    const parentResource = await this.prisma.resource.findUnique({
      where: { resourceId: parentId },
      select: { parentId: true },
    });

    if (parentResource?.parentId) {
      await this.addAncestorIds(parentResource.parentId, resourceIds);
    }
  }

  async removeMany(ids: string[]): Promise<void> {
    const resources = await this.prisma.resource.findMany({
      where: { resourceId: { in: ids } },
      include: { children: true, permissions: true },
    });
    const blocked = resources.filter(
      (r) => (r.children?.length ?? 0) > 0 || (r.permissions?.length ?? 0) > 0,
    );
    if (blocked.length > 0) {
      throw new ConflictException('存在子级资源或关联权限，无法批量删除');
    }
    await this.prisma.resource.deleteMany({
      where: { resourceId: { in: ids } },
    });
  }
}
