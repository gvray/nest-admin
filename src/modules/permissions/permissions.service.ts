import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import {
  ApiResponse,
  PaginationResponse,
} from '../../shared/interfaces/response.interface';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPermissionDto: CreatePermissionDto,
    currentUserId?: string,
  ): Promise<ApiResponse<unknown>> {
    const { name, description, resourceId, action } = createPermissionDto;

    // 查找资源（支持UUID和数字ID）
    let resource: any = null;

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

    return ResponseUtil.created(permission, '权限创建成功');
  }

  async findAll(
    query: QueryPermissionDto,
  ): Promise<
    | PaginationResponse<PermissionResponseDto>
    | ApiResponse<PermissionResponseDto[]>
  > {
    const { name, code, action, resourceId } = query;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name };
    }

    if (code) {
      where.code = { contains: code };
    }

    if (action) {
      where.action = { contains: action };
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    const include = {
      resource: true,
    };

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query.getSkip();
    const take = query.getTake();

    if (skip !== undefined && take !== undefined) {
      const result = (await this.paginateWithSortAndResponse(
        this.prisma.permission,
        query,
        where,
        include,
        'createdAt',
        '权限列表查询成功',
      )) as PaginationResponse<any>;

      if (
        'data' in result &&
        result.data &&
        'items' in result.data &&
        Array.isArray(result.data.items)
      ) {
        const transformedItems = plainToInstance(
          PermissionResponseDto,
          result.data.items,
          {
            excludeExtraneousValues: true,
          },
        );
        return {
          ...result,
          data: {
            ...result.data,
            items: transformedItems,
          },
        } as PaginationResponse<PermissionResponseDto>;
      }
      return result as PaginationResponse<PermissionResponseDto>;
    }

    // 返回全量数据
    const permissions = await this.prisma.permission.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }],
    });

    const permissionResponses = plainToInstance(
      PermissionResponseDto,
      permissions,
      {
        excludeExtraneousValues: true,
      },
    );
    return ResponseUtil.found(permissionResponses, '权限列表查询成功');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    // 支持UUID和数字ID查找
    let permission: any = null;

    // 首先尝试用UUID查找 (permissionId)
    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
      include: {
        resource: true,
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
          resource: true,
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

    return ResponseUtil.found(permission, '权限查询成功');
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    currentUserId?: string,
  ): Promise<ApiResponse<unknown>> {
    const { name, description, resourceId, action } = updatePermissionDto;

    // 支持UUID和数字ID查找
    let permission: any = null;

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
    let targetResource: any = null;
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

    return ResponseUtil.updated(updatedPermission, '权限更新成功');
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    // 支持UUID和数字ID查找
    let permission: any = null;

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

    return ResponseUtil.deleted(null, '权限删除成功');
  }

  /**
   * 获取权限树结构
   * @returns 按照资源层级组织的权限树
   */
  async getPermissionTree(): Promise<ApiResponse<unknown>> {
    // 获取所有资源（包括目录和菜单）和权限
    const allResources = await this.prisma.resource.findMany({
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

    // 构建树结构
    const treeMap = new Map();
    const rootNodes: any[] = [];

    // 先创建所有资源节点
    allResources.forEach((resource) => {
      const node: any = {
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

      // 将权限作为子节点添加到资源节点
      resource.permissions.forEach((permission) => {
        const permissionNode = {
          permissionId: permission.permissionId,
          name: permission.name,
          code: permission.code,
          type: 'permission',
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
          parentId: resource.resourceId,
          sort: 0, // 权限排序可以根据action设置
        };
        node.children.push(permissionNode);
      });
    });

    // 构建父子关系
    treeMap.forEach((node) => {
      if (node.parentId) {
        const parent = treeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // 如果父节点不存在（可能是目录类型），则作为根节点
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // 递归排序子节点并清理空children
    const sortAndCleanChildren = (nodes: any[]) => {
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
          const aIndex = actionOrder.indexOf(a.action);
          const bIndex = actionOrder.indexOf(b.action);
          return aIndex - bIndex;
        }
        // 资源节点按sort和名称排序
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }
        return a.name.localeCompare(b.name);
      });

      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortAndCleanChildren(node.children);
        } else {
          // 移除空的children数组
          delete node.children;
        }
      });
    };

    sortAndCleanChildren(rootNodes);

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

    const result = {
      summary: {
        totalResources,
        menuResources,
        directoryResources,
        totalPermissions,
        message: `共 ${totalResources} 个资源（${directoryResources}个目录，${menuResources}个菜单），${totalPermissions} 个权限点`,
      },
      tree: rootNodes,
    };

    return ResponseUtil.success(result, '权限树获取成功');
  }

  /**
   * 获取简化权限树结构（仅包含必要信息）
   * @returns 简化的权限树，主要用于前端权限选择器
   */
  async getSimplePermissionTree(): Promise<ApiResponse<unknown>> {
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
    const treeMap = new Map();
    const rootNodes: any[] = [];

    // 按操作类型分组权限
    const actionGroups = {
      view: { label: '查看', icon: '👀', color: '#52c41a' },
      create: { label: '创建', icon: '➕', color: '#1890ff' },
      update: { label: '更新', icon: '✏️', color: '#faad14' },
      delete: { label: '删除', icon: '❌', color: '#ff4d4f' },
      export: { label: '导出', icon: '📤', color: '#722ed1' },
      import: { label: '导入', icon: '📥', color: '#13c2c2' },
    };

    allResources.forEach((resource) => {
      const node: any = {
        key: resource.resourceId,
        title: resource.name,
        code: resource.code,
        type: resource.type,
        parentId: resource.parentId,
        sort: resource.sort,
        createdAt: resource.createdAt,
        children: [],
      };
      treeMap.set(resource.resourceId, node);

      // 将权限作为子节点添加到资源节点
      resource.permissions.forEach((permission) => {
        const permissionNode = {
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
        node.children.push(permissionNode);
      });
    });

    // 构建父子关系
    treeMap.forEach((node) => {
      if (node.parentId) {
        const parent = treeMap.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // 递归排序并清理空children
    const sortAndCleanNodes = (nodes: any[]) => {
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
          const aIndex = actionOrder.indexOf(a.action);
          const bIndex = actionOrder.indexOf(b.action);
          return aIndex - bIndex;
        }
        // 资源节点按sort和名称排序
        if (a.sort !== b.sort) {
          return a.sort - b.sort;
        }
        return a.title.localeCompare(b.title);
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
    const actionStats = {};
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

    return ResponseUtil.success(result, '简化权限树获取成功');
  }
}
