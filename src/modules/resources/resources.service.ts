import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
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

    // 如果有父级资源，检查父级资源是否存在
    let parentId: string | null = null;

    if (createResourceDto.parentResourceId) {
      const parentResource = await this.prisma.resource.findUnique({
        where: { resourceId: createResourceDto.parentResourceId },
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
        method: createResourceDto.method,
        icon: createResourceDto.icon,
        parentId,
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

  async findAll(): Promise<ApiResponse<ResourceResponseDto[]>> {
    const resources = await this.prisma.resource.findMany({
      where: { status: 1 },
      orderBy: [
        { parentId: 'asc' },
        { sort: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        parent: true,
      },
    });

    const responseData = resources.map(resource => plainToInstance(
      ResourceResponseDto,
      resource,
    ));

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  async findTree(): Promise<ApiResponse<ResourceResponseDto[]>> {
    const allResources = await this.prisma.resource.findMany({
      where: { status: 1 },
      orderBy: [
        { parentId: 'asc' },
        { sort: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        parent: true,
        children: {
          where: { status: 1 },
          orderBy: [
            { sort: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    const treeResources = this.buildMenuTree(allResources.map(resource => plainToInstance(
      ResourceResponseDto,
      resource,
    )));

    return {
      success: true,
      code: 200,
      message: '查询成功',
      data: treeResources,
      timestamp: new Date().toISOString(),
    };
  }

  async findMenus(): Promise<ApiResponse<ResourceResponseDto[]>> {
    const allMenuResources = await this.prisma.resource.findMany({
      where: {
        status: 1,
        type: {
          in: ['DIRECTORY', 'MENU'],
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { sort: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        parent: true,
        children: {
          where: {
            status: 1,
            type: {
              in: ['DIRECTORY', 'MENU'],
            },
          },
          orderBy: [
            { sort: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    const treeMenuResources = this.buildMenuTreeForResponse(allMenuResources.map(resource => plainToInstance(
      ResourceResponseDto,
      resource,
    )));

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
      include: {
        parent: true,
      },
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

      if (existingCodeResource && existingCodeResource.resourceId !== resourceId) {
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

      if (existingNameResource && existingNameResource.resourceId !== resourceId) {
        throw new ConflictException('资源名称已存在');
      }
    }

    // 处理父级资源
    let parentId: string | null = existingResource.parentId;
    if (updateResourceDto.parentResourceId !== undefined) {
      if (updateResourceDto.parentResourceId) {
        // 检查循环引用
        if (updateResourceDto.parentResourceId === resourceId) {
          throw new ConflictException('不能将自己设置为父级资源');
        }

        const parentResource = await this.prisma.resource.findUnique({
          where: { resourceId: updateResourceDto.parentResourceId },
        });

        if (!parentResource) {
          throw new NotFoundException('父级资源不存在');
        }

        // 检查是否会形成循环引用
        const wouldCreateCycle = await this.isDescendant(
          parentResource.resourceId,
          existingResource.resourceId,
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
        method: updateResourceDto.method,
        icon: updateResourceDto.icon,
        parentId,
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
    resources.forEach(resource => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach(resource => {
      // 使用 parentResourceId 而不是 parentId，因为 DTO 转换后 parentId 被排除了
      if (resource.parentResourceId) {
        const parent = resourceMap.get(resource.parentResourceId);
        if (parent) {
          parent.children.push(resourceMap.get(resource.resourceId));
        }
      } else {
        rootResources.push(resourceMap.get(resource.resourceId));
      }
    });

    return rootResources;
  }

  private buildMenuTreeForResponse(resources: any[]): any[] {
    const resourceMap = new Map();
    const rootResources: any[] = [];

    // 创建资源映射 - 使用 resourceId 作为 key
    resources.forEach(resource => {
      resourceMap.set(resource.resourceId, { ...resource, children: [] });
    });

    // 构建树形结构
    resources.forEach(resource => {
      // 使用 parentResourceId 而不是 parentId，因为 DTO 转换后 parentId 被排除了
      if (resource.parentResourceId) {
        const parent = resourceMap.get(resource.parentResourceId);
        if (parent) {
          parent.children.push(resourceMap.get(resource.resourceId));
        }
      } else {
        rootResources.push(resourceMap.get(resource.resourceId));
      }
    });

    return rootResources;
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
}