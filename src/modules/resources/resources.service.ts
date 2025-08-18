import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { ApiResponse } from '../../shared/interfaces/response.interface';
import { plainToInstance } from 'class-transformer';
import { ResourceType } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createResourceDto: CreateResourceDto,
  ): Promise<ApiResponse<ResourceResponseDto>> {
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

    const responseData = plainToInstance(ResourceResponseDto, resource);

    return {
      success: true,
      code: 200,
      message: '创建成功',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  async findAll(
    queryDto?: QueryResourceDto,
  ): Promise<ApiResponse<ResourceResponseDto[]>> {
    console.log('findAll called with queryDto:', queryDto);

    const whereConditions: any = { status: queryDto?.status ?? 1 };

    if (queryDto?.name) {
      // 尝试多种字符编码处理方法
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
      console.log('Original name:', queryDto.name);
      console.log('Processed name:', processedName);
    }

    if (queryDto?.code) {
      whereConditions.code = { contains: queryDto.code };
    }

    if (queryDto?.type) {
      whereConditions.type = queryDto.type;
    }

    console.log('Final whereConditions:', whereConditions);

    const resources = await this.prisma.resource.findMany({
      where: whereConditions,
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    console.log('Found resources count:', resources.length);

    const responseData = resources.map((resource) =>
      plainToInstance(ResourceResponseDto, resource),
    );

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  async findTree(
    queryDto?: QueryResourceDto,
  ): Promise<ApiResponse<ResourceResponseDto[]>> {
    console.log('findTree called with queryDto:', queryDto);

    const hasFilters = queryDto?.name || queryDto?.code || queryDto?.type;
    const filterMode = queryDto?.filterMode || 'strict';

    if (!hasFilters) {
      // 没有过滤条件，返回所有资源
      const allResources = await this.prisma.resource.findMany({
        where: { status: queryDto?.status ?? 1 },
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
      });

      const treeResources = this.buildMenuTreeForResponse(
        allResources.map((resource) =>
          plainToInstance(ResourceResponseDto, resource),
        ),
      );

      return {
        success: true,
        code: 200,
        message: '查询成功',
        data: treeResources,
        timestamp: new Date().toISOString(),
      };
    }

    if (filterMode === 'strict') {
      // 严格模式：只返回匹配条件的资源
      const whereConditions: any = { status: queryDto?.status ?? 1 };

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
        console.log('findTree - Original name:', queryDto.name);
        console.log('findTree - Processed name:', processedName);
      }

      if (queryDto?.code) {
        whereConditions.code = { contains: queryDto.code };
      }

      if (queryDto?.type) {
        whereConditions.type = queryDto.type;
      }

      console.log('findTree - Final whereConditions:', whereConditions);

      const filteredResources = await this.prisma.resource.findMany({
        where: whereConditions,
        orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
      });

      console.log(
        'findTree - Found resources count:',
        filteredResources.length,
      );

      const treeResources = this.buildMenuTreeForResponse(
        filteredResources.map((resource) =>
          plainToInstance(ResourceResponseDto, resource),
        ),
      );

      return {
        success: true,
        code: 200,
        message: '查询成功',
        data: treeResources,
        timestamp: new Date().toISOString(),
      };
    } else {
      // 宽松模式：返回匹配的资源及其完整父级路径
      return this.findTreeWithLooseFilter(queryDto);
    }
  }

  async findMenus(): Promise<ApiResponse<ResourceResponseDto[]>> {
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

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: treeMenuResources,
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(resourceId: string): Promise<ApiResponse<ResourceResponseDto>> {
    const resource = await this.prisma.resource.findUnique({
      where: { resourceId },
    });

    if (!resource) {
      throw new NotFoundException('资源不存在');
    }

    const responseData = plainToInstance(ResourceResponseDto, resource);

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  async update(
    resourceId: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<ApiResponse<ResourceResponseDto>> {
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

    const responseData = plainToInstance(ResourceResponseDto, resource);

    return {
      success: true,
      code: 200,
      message: '更新成功',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  async remove(resourceId: string): Promise<ApiResponse<null>> {
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

    return {
      success: true,
      code: 200,
      message: '删除成功',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  private buildMenuTree(resources: any[]): any[] {
    const resourceMap = new Map();
    const rootResources: any[] = [];

    // 创建资源映射 - 使用 resourceId 作为 key
    resources.forEach((resource) => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach((resource) => {
      // 使用 parentId 而不是 parentId，因为 DTO 转换后 parentId 被排除了
      if (resource.parentId) {
        const parent = resourceMap.get(resource.parentId);
        if (parent) {
          parent.children.push(resourceMap.get(resource.resourceId));
        }
      } else {
        rootResources.push(resourceMap.get(resource.resourceId));
      }
    });

    // 清理空的children数组
    const cleanupEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        const cleanNode = { ...node };
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

  private buildMenuTreeForResponse(resources: any[]): any[] {
    const resourceMap = new Map();
    const rootResources: any[] = [];
    
    console.log('buildMenuTreeForResponse called with resources:', resources); 
    
    // 创建资源映射 - 使用 resourceId 作为 key
    resources.forEach((resource) => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach((resource) => {
      const mappedResource = resourceMap.get(resource.resourceId);
      
      if (resource.parentId) {
        const parent = resourceMap.get(resource.parentId);
        if (parent) {
          parent.children.push(mappedResource);
        } else {
          // 如果父级不存在，将其作为根资源
          rootResources.push(mappedResource);
        }
      } else {
        // 没有父级的资源直接作为根资源
        rootResources.push(mappedResource);
      }
    });

    console.log('buildMenuTreeForResponse - rootResources count:', rootResources.length);
    console.log('buildMenuTreeForResponse - rootResources:', rootResources);

    // 清理空的children数组
    const cleanupEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        const cleanNode = { ...node };
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
  ): Promise<ApiResponse<ResourceResponseDto[]>> {
    // 构建过滤条件
    const whereConditions: any = { status: queryDto?.status ?? 1 };

    if (queryDto?.name) {
      whereConditions.name = { contains: queryDto.name };
    }

    if (queryDto?.code) {
      whereConditions.code = { contains: queryDto.code };
    }

    if (queryDto?.type) {
      whereConditions.type = queryDto.type;
    }

    // 找到所有匹配的资源
    const matchedResources = await this.prisma.resource.findMany({
      where: whereConditions,
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    if (matchedResources.length === 0) {
      return {
        success: true,
        code: 200,
        message: '查询成功',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }

    // 收集所有需要包含的资源ID（匹配的资源 + 它们的所有祖先）
    const resourceIdsToInclude = new Set<string>();

    for (const resource of matchedResources) {
      resourceIdsToInclude.add(resource.resourceId);

      // 添加所有祖先资源
      await this.addAncestorIds(resource.parentId, resourceIdsToInclude);
    }

    // 获取所有需要包含的资源
    const allIncludedResources = await this.prisma.resource.findMany({
      where: {
        resourceId: { in: Array.from(resourceIdsToInclude) },
        status: queryDto?.status ?? 1,
      },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }, { createdAt: 'asc' }],
    });

    const treeResources = this.buildMenuTreeForResponse(
      allIncludedResources.map((resource) =>
        plainToInstance(ResourceResponseDto, resource),
      ),
    );

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: treeResources,
      timestamp: new Date().toISOString(),
    };
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
}
