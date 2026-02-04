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
import type { Permission as PermissionModel } from '@prisma/client';

@Injectable()
export class PermissionsService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPermissionDto: CreatePermissionDto,
    currentUserId?: string,
  ): Promise<PermissionResponseDto> {
    const { name, code, type, parentPermissionId, action, description, menuMeta } =
      createPermissionDto;

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

    // 业务校验：菜单则父为空，非菜单必须有父且父必须是菜单
    if (type === 'MENU') {
      if (parentPermissionId) {
        throw new ConflictException('菜单权限不能指定父权限');
      }
    } else {
      if (!parentPermissionId) {
        throw new ConflictException('非菜单权限必须指定父菜单权限');
      }
      const parent = await (this.prisma as any).permission.findUnique({
        where: { permissionId: parentPermissionId },
        select: { type: true } as any,
      });
      if (!parent || parent.type !== 'MENU') {
        throw new ConflictException('父权限必须是菜单类型');
      }
    }

    const finalAction = type === 'MENU' ? 'access' : action || 'view';

    const permission = await (this.prisma as any).permission.create({
      data: {
        name,
        code,
        type,
        parentPermissionId: parentPermissionId ?? null,
        description,
        action: finalAction,
        createdById: currentUserId,
      },
    });

    if (type === 'MENU') {
      await (this.prisma as any).menuMeta.upsert({
        where: { permissionId: permission.permissionId },
        update: {
          path: menuMeta?.path ?? undefined,
          icon: menuMeta?.icon ?? undefined,
          hidden: menuMeta?.hidden ?? false,
          component: menuMeta?.component ?? undefined,
          sort: menuMeta?.sort ?? 0,
        },
        create: {
          permissionId: permission.permissionId,
          path: menuMeta?.path ?? undefined,
          icon: menuMeta?.icon ?? undefined,
          hidden: menuMeta?.hidden ?? false,
          component: menuMeta?.component ?? undefined,
          sort: menuMeta?.sort ?? 0,
        },
      });
    }

    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryPermissionDto,
  ): Promise<PaginationData<PermissionResponseDto>> {
    const {
      name,
      code,
      action,
      type,
      parentPermissionId,
      createdAtStart,
      createdAtEnd,
    } = query;
    const where = this.buildWhere({
      contains: { name, code, action },
      equals: { type, parentPermissionId },
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
    const { name, description, code, type, parentPermissionId, action, menuMeta } =
      updatePermissionDto;

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

    // 校验类型变更与父关系
    if (type && type !== permission.type) {
      if (type === 'MENU') {
        if (parentPermissionId) {
          throw new ConflictException('菜单权限不能指定父权限');
        }
      } else {
        const parentId = parentPermissionId ?? permission.parentPermissionId;
        if (!parentId) {
          throw new ConflictException('非菜单权限必须指定父菜单权限');
        }
        const parent = await (this.prisma as any).permission.findUnique({
          where: { permissionId: parentId },
          select: { type: true } as any,
        });
        if (!parent || parent.type !== 'MENU') {
          throw new ConflictException('父权限必须是菜单类型');
        }
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

    // 校验名称与代码唯一
    if (name && name !== permission.name) {
      const existingPermissionByName = await this.prisma.permission.findUnique({
        where: { name },
      });
      if (existingPermissionByName) {
        throw new ConflictException('权限名称已存在');
      }
    }
    let newCode = permission.code;
    if (code && code !== permission.code) {
      const existingPermissionByCode = await this.prisma.permission.findUnique({
        where: { code },
      });
      if (existingPermissionByCode) {
        throw new ConflictException('权限代码已存在');
      }
      newCode = code;
    }

    const finalType = type ?? (permission as any).type;
    const finalParentId =
      finalType === 'MENU'
        ? null
        : (parentPermissionId ?? (permission as any).parentPermissionId);
    const finalAction =
      finalType === 'MENU' ? 'access' : (action ?? permission.action);
    const updatedPermission = await (this.prisma as any).permission.update({
      where: { id: permission.id },
      data: {
        name,
        code: newCode,
        description,
        type: finalType,
        parentPermissionId: finalParentId ?? null,
        action: finalAction,
        updatedById: currentUserId,
      },
    });

    if (finalType === 'MENU') {
      await (this.prisma as any).menuMeta.upsert({
        where: { permissionId: updatedPermission.permissionId },
        update: {
          path: menuMeta?.path ?? undefined,
          icon: menuMeta?.icon ?? undefined,
          hidden: menuMeta?.hidden ?? false,
          component: menuMeta?.component ?? undefined,
          sort: menuMeta?.sort ?? 0,
        },
        create: {
          permissionId: updatedPermission.permissionId,
          path: menuMeta?.path ?? undefined,
          icon: menuMeta?.icon ?? undefined,
          hidden: menuMeta?.hidden ?? false,
          component: menuMeta?.component ?? undefined,
          sort: menuMeta?.sort ?? 0,
        },
      });
    }

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
    const where: Record<string, unknown> = {};
    if (queryDto?.name) where['name'] = { contains: queryDto.name };
    if (queryDto?.code) where['code'] = { contains: queryDto.code };
    if (queryDto?.action) where['action'] = { contains: queryDto.action };
    if (queryDto?.type) where['type'] = queryDto.type as unknown;
    if (queryDto?.parentPermissionId)
      where['parentPermissionId'] = queryDto.parentPermissionId;

    const permissions = await (this.prisma as any).permission.findMany({
      where,
      include: {
        menuMeta: {
          select: { path: true, icon: true, hidden: true, component: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    type TreeNode = {
      permissionId: string;
      name: string;
      code: string;
      type: string;
      action?: string;
      description?: string | null;
      createdAt: Date;
      updatedAt?: Date;
      menuMeta?: {
        path?: string | null;
        icon?: string | null;
        hidden?: boolean;
        component?: string | null;
      };
      children?: TreeNode[];
    };
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    permissions.forEach((p) => {
      map.set(p.permissionId, {
        permissionId: p.permissionId,
        name: p.name,
        code: p.code,
        type: p.type,
        action: p.action,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        menuMeta: p.menuMeta
          ? {
              path: p.menuMeta.path ?? null,
              icon: p.menuMeta.icon ?? null,
              hidden: p.menuMeta.hidden ?? false,
              component: p.menuMeta.component ?? null,
            }
          : undefined,
        children: [],
      });
    });
    permissions.forEach((p) => {
      const node = map.get(p.permissionId);
      if (!node) return;
      const parentId = p.parentPermissionId;
      if (parentId) {
        const parent = map.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    const actionOrder = [
      'view',
      'create',
      'update',
      'delete',
      'export',
      'import',
      'access',
    ];
    const sortChildren = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const ai = actionOrder.indexOf(a.action || '');
        const bi = actionOrder.indexOf(b.action || '');
        if (ai !== -1 && bi !== -1 && ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) sortChildren(n.children);
        else delete n.children;
      });
    };
    sortChildren(roots);
    return roots;
  }

  /**
   * 递归添加资源祖先ID
   */

  /**
   * 获取简化权限树结构（仅包含必要信息）
   * @returns 简化的权限树，主要用于前端权限选择器
   */
  async getSimplePermissionTree(): Promise<unknown> {
    const permissions = await (this.prisma as any).permission.findMany({
      include: { menuMeta: { select: { path: true } } },
      orderBy: [{ createdAt: 'asc' }],
    });
    type Node = {
      key: string;
      title: string;
      code: string;
      type: string;
      parentId?: string | null;
      children?: Node[];
      action?: string;
    };
    const map = new Map<string, Node>();
    const roots: Node[] = [];
    permissions.forEach((p) => {
      map.set(p.permissionId, {
        key: p.permissionId,
        title: p.name,
        code: p.code,
        type: p.type,
        parentId: p.parentPermissionId ?? null,
        action: p.action,
        children: [],
      });
    });
    permissions.forEach((p) => {
      const node = map.get(p.permissionId);
      if (!node) return;
      const parentId = p.parentPermissionId;
      if (parentId) {
        const parent = map.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    const actionOrder = [
      'view',
      'create',
      'update',
      'delete',
      'export',
      'import',
      'access',
    ];
    const sortNodes = (nodes: Node[]) => {
      nodes.sort((a, b) => {
        if (a.action && b.action) {
          const ai = actionOrder.indexOf(a.action);
          const bi = actionOrder.indexOf(b.action);
          if (ai !== -1 && bi !== -1 && ai !== bi) return ai - bi;
        }
        return a.title.localeCompare(b.title);
      });
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) sortNodes(n.children);
        else delete n.children;
      });
    };
    sortNodes(roots);
    return { tree: roots };
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
