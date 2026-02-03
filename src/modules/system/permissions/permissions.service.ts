import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';
import type {
  Permission as PermissionModel,
  Resource as ResourceModel,
} from '@prisma/client';
import { ROOT_PARENT_ID } from '@/shared/constants/root.constant';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPermissionDto: CreatePermissionDto,
    currentUserId?: string,
  ): Promise<PermissionResponseDto> {
    const { name, description, resourceId, action } = createPermissionDto;

    // 查找资源（支持UUID和数字ID）
    let resource: ResourceModel | null = null;

    // 首先尝试按UUID查找
    resource = await this.prisma.resource.findUnique({
      where: { resourceId: resourceId },
    });

    // 如果UUID查找失败，尝试按数字ID查找
    if (!resource && !isNaN(Number(resourceId))) {
      resource = await this.prisma.resource.findUnique({
        where: { id: Number(resourceId) },
      });
    }

    if (!resource) {
      throw new NotFoundException('关联的资源不存在');
    }

    if (resource.type !== 'MENU') {
      throw new ConflictException(
        '权限只能挂载到菜单类型的资源上，不能挂载到目录类型',
      );
    }

    // 自动生成权限代码：资源code + action
    const code = `${resource.code}:${action}`;

    // 检查权限名称是否已存在
    const existingPermissionByName = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermissionByName) {
      throw new ConflictException('权限名称已存在');
    }

    // 检查权限代码是否已存在
    const existingPermissionByCode = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermissionByCode) {
      throw new ConflictException('权限代码已存在');
    }

    // 检查同一资源下是否已存在相同操作的权限
    const existingActionPermission = await this.prisma.permission.findFirst({
      where: {
        resourceId: resource.resourceId,
        action,
      },
      include: {
        resource: true,
      },
    });

    if (existingActionPermission) {
      throw new ConflictException(
        `资源"${existingActionPermission.resource.name}"已存在"${action}"操作权限`,
      );
    }

    const permission = await this.prisma.permission.create({
      data: {
        name,
        code,
        description,
        resourceId: resource.resourceId,
        action,
        createdById: currentUserId,
      },
      include: {
        resource: true,
      },
    });

    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryPermissionDto,
  ): Promise<PaginationData<PermissionResponseDto>> {
    const { name, code, action, resourceId, createdAtStart, createdAtEnd } =
      query;
    const where = this.buildWhere({
      contains: { name, code, action },
      equals: { resourceId },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.permission.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.permission.count({ where }),
      ]);
      const transformed = plainToInstance(PermissionResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.permission.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
    const total = await this.prisma.permission.count({ where });
    const transformed = plainToInstance(PermissionResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    // 支持UUID和数字ID查找
    let permission: PermissionModel | null = null;

    // 首先尝试用UUID查找 (permissionId)
    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    // 如果UUID查找失败，尝试数字ID查找
    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
        include: {
          rolePermissions: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    currentUserId?: string,
  ): Promise<PermissionResponseDto> {
    const { name, description, resourceId, action } = updatePermissionDto;

    // 支持UUID和数字ID查找
    let permission: PermissionModel | null = null;

    // 首先尝试用UUID查找 (permissionId)
    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
    });

    // 如果UUID查找失败，尝试数字ID查找
    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    // 如果更新资源ID，检查资源是否存在且为菜单类型
    let targetResource: ResourceModel | null = null;
    if (resourceId) {
      // 首先尝试按UUID查找
      targetResource = await this.prisma.resource.findUnique({
        where: { resourceId: resourceId },
      });

      // 如果UUID查找失败，尝试按数字ID查找
      if (!targetResource && !isNaN(Number(resourceId))) {
        targetResource = await this.prisma.resource.findUnique({
          where: { id: Number(resourceId) },
        });
      }

      if (!targetResource) {
        throw new NotFoundException('关联的资源不存在');
      }

      if (targetResource.type !== 'MENU') {
        throw new ConflictException(
          '权限只能挂载到菜单类型的资源上，不能挂载到目录类型',
        );
      }
    }

    // 如果更新权限名称，检查是否已存在
    if (name && name !== permission.name) {
      const existingPermissionByName = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (existingPermissionByName) {
        throw new ConflictException('权限名称已存在');
      }
    }

    // 自动生成新的权限代码（如果资源或操作发生变化）
    let newCode = permission.code;
    if (targetResource || action) {
      const finalResource =
        targetResource ||
        (await this.prisma.resource.findUnique({
          where: { resourceId: permission.resourceId },
        }));
      const finalAction = action || permission.action;
      if (!finalResource) {
        throw new NotFoundException('关联的资源不存在');
      }
      newCode = `${finalResource.code}:${finalAction}`;

      // 检查新代码是否已存在
      if (newCode !== permission.code) {
        const existingPermissionByCode =
          await this.prisma.permission.findUnique({
            where: { code: newCode },
          });

        if (existingPermissionByCode) {
          throw new ConflictException('自动生成的权限代码已存在');
        }
      }
    }

    // 如果更新资源或操作，检查同一资源下是否已存在相同操作的权限
    if (targetResource || action) {
      const finalResourceId = targetResource
        ? targetResource.resourceId
        : permission.resourceId;
      const finalAction = action || permission.action;

      const existingActionPermission = await this.prisma.permission.findFirst({
        where: {
          resourceId: finalResourceId,
          action: finalAction,
          id: { not: permission.id }, // 排除当前权限
        },
        include: {
          resource: true,
        },
      });

      if (existingActionPermission) {
        throw new ConflictException(
          `资源"${existingActionPermission.resource.name}"已存在"${finalAction}"操作权限`,
        );
      }
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id: permission.id },
      data: {
        name,
        code: newCode,
        description,
        resourceId: targetResource
          ? targetResource.resourceId
          : permission.resourceId,
        action,
        updatedById: currentUserId,
      },
      include: {
        resource: true,
      },
    });

    return plainToInstance(PermissionResponseDto, updatedPermission, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    let permission: (PermissionModel & { rolePermissions: unknown[] }) | null =
      null;

    // 首先尝试用UUID查找 (permissionId)
    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
      include: {
        rolePermissions: true,
      },
    });

    // 如果UUID查找失败，尝试数字ID查找
    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
        include: {
          rolePermissions: true,
        },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    // 检查权限是否被角色使用
    if (permission.rolePermissions && permission.rolePermissions.length > 0) {
      throw new ConflictException('该权限正在被角色使用，无法删除');
    }

    await this.prisma.permission.delete({
      where: { id: permission.id },
    });

    return;
  }

  /**
   * 获取权限树结构
   * @returns 按照资源层级组织的权限树
   */
  async getPermissionTree(queryDto?: QueryPermissionDto): Promise<unknown> {
    let allResources: Array<
      ResourceModel & {
        permissions: Array<{
          permissionId: string;
          name: string;
          code: string;
          action: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
      }
    > = [];

    // 检查是否有搜索条件
    const hasSearchConditions =
      queryDto?.name ||
      queryDto?.code ||
      queryDto?.action ||
      queryDto?.resourceId;

    if (hasSearchConditions) {
      // 有搜索条件时，先找到匹配的权限，然后获取对应的资源
      const permissionWhereConditions: Record<string, unknown> = {};

      if (queryDto?.name) {
        permissionWhereConditions.name = { contains: queryDto.name };
      }

      if (queryDto?.code) {
        permissionWhereConditions.code = { contains: queryDto.code };
      }

      if (queryDto?.action) {
        permissionWhereConditions.action = { contains: queryDto.action };
      }

      // 找到匹配的权限
      const matchedPermissions: Array<
        PermissionModel & { resource: ResourceModel }
      > = await this.prisma.permission.findMany({
        where: permissionWhereConditions,
        include: {
          resource: true,
        },
      });

      if (matchedPermissions.length > 0) {
        // 收集所有需要包含的资源ID（匹配权限的资源 + 它们的父级路径）
        const resourceIdsToInclude = new Set<string>();

        for (const permission of matchedPermissions) {
          resourceIdsToInclude.add(permission.resourceId);
          // 添加父级资源
          await this.addResourceAncestorIds(
            permission.resource.parentId ?? ROOT_PARENT_ID,
            resourceIdsToInclude,
          );
        }

        // 获取所有需要包含的资源
        allResources = await this.prisma.resource.findMany({
          where: {
            resourceId: { in: Array.from(resourceIdsToInclude) },
          },
          include: {
            permissions: {
              select: {
                permissionId: true,
                name: true,
                code: true,
                action: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: [{ action: 'asc' }],
            },
          },
          orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        });
      }
    } else {
      // 没有搜索条件时，获取所有资源
      allResources = await this.prisma.resource.findMany({
        include: {
          permissions: {
            select: {
              permissionId: true,
              name: true,
              code: true,
              action: true,
              description: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: [{ action: 'asc' }],
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      });
    }

    // 构建树结构
    type TreeNode = {
      resourceId?: string;
      permissionId?: string;
      name: string;
      code: string;
      type: string;
      action?: string;
      description?: string | null;
      path?: string | null;
      parentId?: string | null;
      sort: number;
      createdAt: Date;
      updatedAt?: Date;
      children?: TreeNode[];
    };
    const treeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // 先创建所有资源节点
    allResources.forEach((resource) => {
      const node: TreeNode = {
        resourceId: resource.resourceId,
        name: resource.name,
        code: resource.code,
        type: resource.type,
        path: resource.path,
        parentId: resource.parentId,
        sort: resource.sort,
        createdAt: resource.createdAt,
        children: [],
      };
      treeMap.set(resource.resourceId, node);

      resource.permissions.forEach((permission) => {
        const permissionNode: TreeNode = {
          permissionId: permission.permissionId,
          name: permission.name,
          code: permission.code,
          type: 'permission',
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          parentId: resource.resourceId,
          sort: 0,
        };
        node.children?.push(permissionNode);
      });
    });

    // 构建父子关系
    treeMap.forEach((node) => {
      if (node.parentId) {
        const parent = treeMap.get(node.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // 递归排序子节点并清理空children
    const sortAndCleanChildren = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type === 'permission' && b.type === 'permission') {
          const actionOrder = [
            'view',
            'create',
            'update',
            'delete',
            'export',
            'import',
          ];
          const aIndex = actionOrder.indexOf(a.action || '');
          const bIndex = actionOrder.indexOf(b.action || '');
          return aIndex - bIndex;
        }
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }
        return a.name.localeCompare(b.name);
      });

      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortAndCleanChildren(node.children);
        } else {
          delete node.children;
        }
      });
    };

    sortAndCleanChildren(rootNodes);

    return rootNodes;
  }

  /**
   * 递归添加资源祖先ID
   */
  private async addResourceAncestorIds(
    parentId: string,
    resourceIds: Set<string>,
  ): Promise<void> {
    if (parentId === ROOT_PARENT_ID) return;

    resourceIds.add(parentId);

    const parentResource = await this.prisma.resource.findUnique({
      where: { resourceId: parentId },
      select: { parentId: true },
    });

    if (
      parentResource?.parentId &&
      parentResource.parentId !== ROOT_PARENT_ID
    ) {
      await this.addResourceAncestorIds(parentResource.parentId, resourceIds);
    }
  }

  /**
   * 获取简化权限树结构（仅包含必要信息）
   * @returns 简化的权限树，主要用于前端权限选择器
   */
  async getSimplePermissionTree(): Promise<unknown> {
    // 获取所有资源和权限（包括目录和菜单）
    const allResources = await this.prisma.resource.findMany({
      include: {
        permissions: {
          select: {
            permissionId: true,
            code: true,
            name: true,
            action: true,
            createdAt: true,
          },
          orderBy: [{ action: 'asc' }],
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    // 构建简化的树结构
    type SimplifiedNode = {
      key: string;
      title: string;
      code: string;
      type: string;
      parentId?: string;
      sort: number;
      createdAt: Date;
      children?: SimplifiedNode[];
      action?: string;
      actionInfo?: { label: string; icon: string; color: string };
    };
    const treeMap = new Map<string, SimplifiedNode>();
    const rootNodes: SimplifiedNode[] = [];

    // 按操作类型分组权限
    const actionGroups: Record<
      string,
      { label: string; icon: string; color: string }
    > = {
      view: { label: '查看', icon: '👀', color: '#52c41a' },
      create: { label: '创建', icon: '➕', color: '#1890ff' },
      update: { label: '更新', icon: '✏️', color: '#faad14' },
      delete: { label: '删除', icon: '❌', color: '#ff4d4f' },
      export: { label: '导出', icon: '📤', color: '#722ed1' },
      import: { label: '导入', icon: '📥', color: '#13c2c2' },
    };

    allResources.forEach((resource) => {
      const node: SimplifiedNode = {
        key: resource.resourceId,
        title: resource.name,
        code: resource.code,
        type: resource.type,
        parentId: resource.parentId ?? ROOT_PARENT_ID,
        sort: resource.sort,
        createdAt: resource.createdAt,
        children: [],
      };
      treeMap.set(resource.resourceId, node);

      // 将权限作为子节点添加到资源节点
      resource.permissions.forEach((permission) => {
        const permissionNode: SimplifiedNode = {
          key: permission.permissionId,
          title: permission.name,
          code: permission.code,
          type: 'permission',
          action: permission.action,
          createdAt: permission.createdAt,
          parentId: resource.resourceId,
          sort: 0,
          actionInfo: actionGroups[permission.action] || {
            label: permission.action,
            icon: '🔧',
            color: '#666666',
          },
        };
        node.children?.push(permissionNode);
      });
    });

    // 构建父子关系
    treeMap.forEach((node) => {
      if (node.parentId && node.parentId !== ROOT_PARENT_ID) {
        const parent = treeMap.get(node.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // 递归排序并清理空children
    const sortAndCleanNodes = (nodes: SimplifiedNode[]) => {
      nodes.sort((a, b) => {
        // 如果是权限节点，按操作类型排序
        if (a.type === 'permission' && b.type === 'permission') {
          const actionOrder = [
            'view',
            'create',
            'update',
            'delete',
            'export',
            'import',
          ];
          const aIndex = actionOrder.indexOf(a.action || '');
          const bIndex = actionOrder.indexOf(b.action || '');
          return aIndex - bIndex;
        }
        // 资源节点按sort和名称排序
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }
        return (a.title || '').localeCompare(b.title || '');
      });

      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortAndCleanNodes(node.children);
        } else {
          // 移除空的children数组
          delete node.children;
        }
      });
    };

    sortAndCleanNodes(rootNodes);

    // 统计信息
    const totalResources = allResources.length;
    const menuResources = allResources.filter((r) => r.type === 'MENU').length;
    const directoryResources = allResources.filter(
      (r) => r.type === 'DIRECTORY',
    ).length;
    const totalPermissions = allResources.reduce(
      (sum, resource) => sum + resource.permissions.length,
      0,
    );

    // 按操作类型统计权限数量
    const actionStats: Record<string, number> = {};
    allResources.forEach((resource) => {
      resource.permissions.forEach((permission) => {
        if (!actionStats[permission.action]) {
          actionStats[permission.action] = 0;
        }
        actionStats[permission.action]++;
      });
    });

    const result = {
      summary: {
        totalResources,
        menuResources,
        directoryResources,
        totalPermissions,
        actionStats,
        actionGroups,
        message: `共 ${totalResources} 个资源（${directoryResources}个目录，${menuResources}个菜单），${totalPermissions} 个权限点`,
      },
      tree: rootNodes,
    };

    return result;
  }

  async removeMany(ids: string[]): Promise<void> {
    const perms = await this.prisma.permission.findMany({
      where: { permissionId: { in: ids } },
      include: { rolePermissions: true },
    });
    const blocked = perms.filter((p) => (p.rolePermissions?.length ?? 0) > 0);
    if (blocked.length > 0) {
      throw new ConflictException('存在关联角色，无法批量删除');
    }
    await this.prisma.permission.deleteMany({
      where: { permissionId: { in: ids } },
    });
  }
}
