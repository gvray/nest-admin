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
import { ROOT_PARENT_ID } from '@/shared/constants/root.constant';
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
    const {
      name,
      code,
      type,
      parentPermissionId,
      action,
      description,
      menuMeta,
    } = createPermissionDto;

    // 检查权限代码是否已存在
    const existingPermissionByCode = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermissionByCode) {
      throw new ConflictException('权限代码已存在');
    }

    // 业务校验：菜单则父为空，非菜单必须有父且父必须是菜单
    if (type === 'API') {
      throw new ConflictException('API 权限点由系统自动生成，不能手动创建');
    }
    if (type === 'DIRECTORY') {
      if (parentPermissionId) {
        const parent = await (this.prisma as any).permission.findUnique({
          where: { permissionId: parentPermissionId },
          select: { type: true } as any,
        });
        if (!parent || parent.type !== 'DIRECTORY') {
          throw new ConflictException('目录的父节点必须是目录');
        }
      }
    } else if (type === 'MENU') {
      if (parentPermissionId) {
        const parent = await (this.prisma as any).permission.findUnique({
          where: { permissionId: parentPermissionId },
          select: { type: true } as any,
        });
        if (!parent || parent.type !== 'DIRECTORY') {
          throw new ConflictException('菜单的父节点必须是目录');
        }
      }
    } else {
      if (!parentPermissionId) {
        throw new ConflictException('按钮权限必须指定父菜单');
      }
      const parent = await (this.prisma as any).permission.findUnique({
        where: { permissionId: parentPermissionId },
        select: { type: true } as any,
      });
      if (!parent || parent.type !== 'MENU') {
        throw new ConflictException('按钮的父节点必须是菜单');
      }
    }

    const finalAction = type === 'MENU' ? 'access' : action || 'view';

    const permission = await (this.prisma as any).permission.create({
      data: {
        name,
        code,
        type,
        origin: 'USER',
        parentPermissionId: parentPermissionId || ROOT_PARENT_ID,
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
    const where: Record<string, unknown> = this.buildWhere({
      contains: { name, code, action },
      equals: { type, parentPermissionId },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    // 排除已软删除的记录
    where['deletedAt'] = null;
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
    const {
      name,
      description,
      code,
      type,
      parentPermissionId,
      action,
      menuMeta,
    } = updatePermissionDto;

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

    // API 权限不允许手动修改
    if (permission.type === 'API') {
      throw new ConflictException('API 权限由系统自动管理，不能手动修改');
    }

    // type 创建后不可修改
    if (type && type !== permission.type) {
      throw new ConflictException('权限类型创建后不可修改');
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

    const finalParentId =
      parentPermissionId ??
      (permission as any).parentPermissionId ??
      ROOT_PARENT_ID;
    const finalAction =
      permission.type === 'MENU' ? 'access' : (action ?? permission.action);
    const updatedPermission = await (this.prisma as any).permission.update({
      where: { id: permission.id },
      data: {
        name,
        code: newCode,
        description,
        parentPermissionId: finalParentId,
        action: finalAction,
        updatedById: currentUserId,
      },
    });

    if (permission.type === 'MENU') {
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
    let permission: PermissionModel | null = null;

    permission = await this.prisma.permission.findUnique({
      where: { permissionId: id },
    });

    if (!permission && !isNaN(Number(id))) {
      permission = await this.prisma.permission.findUnique({
        where: { id: Number(id) },
      });
    }

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    // API 权限不允许手动删除（只能通过级联软删除）
    if (permission.type === 'API') {
      throw new ConflictException('API 权限由系统自动管理，不能手动删除');
    }

    await this.cascadeRemove(permission.permissionId);
  }

  /**
   * 级联删除权限及其所有子项
   * - 目录/菜单/按钮：解绑角色权限后真删除
   * - API：软删除（设置 deletedAt），解绑角色权限，parentPermissionId 保留不动
   */
  private async cascadeRemove(permissionId: string): Promise<void> {
    // 递归收集所有后代 permissionId
    const allIds: string[] = [];
    const collect = async (pid: string) => {
      allIds.push(pid);
      const children = await (this.prisma as any).permission.findMany({
        where: { parentPermissionId: pid, deletedAt: null },
        select: { permissionId: true },
      });
      for (const child of children) {
        await collect(child.permissionId);
      }
    };
    await collect(permissionId);

    // 分离 API 和非 API
    const allPerms = await this.prisma.permission.findMany({
      where: { permissionId: { in: allIds } },
      select: { permissionId: true, type: true },
    });
    const apiIds = allPerms
      .filter((p) => p.type === 'API')
      .map((p) => p.permissionId);
    const nonApiIds = allPerms
      .filter((p) => p.type !== 'API')
      .map((p) => p.permissionId);

    // 解绑所有相关角色权限
    await this.prisma.rolePermission.deleteMany({
      where: { permissionId: { in: allIds } },
    });

    // API 权限软删除，parentPermissionId 置 null（父节点即将被真删除）
    if (apiIds.length > 0) {
      await (this.prisma as any).permission.updateMany({
        where: { permissionId: { in: apiIds } },
        data: { deletedAt: new Date(), parentPermissionId: null },
      });
    }

    // 非 API 权限：先删 menuMeta 再真删除（从叶子到根）
    if (nonApiIds.length > 0) {
      await (this.prisma as any).menuMeta.deleteMany({
        where: { permissionId: { in: nonApiIds } },
      });

      // 将所有引用即将被删除节点的其他权限（如之前已软删除的 API）的 parentPermissionId 置 null
      await (this.prisma as any).permission.updateMany({
        where: {
          parentPermissionId: { in: nonApiIds },
          permissionId: { notIn: nonApiIds },
        },
        data: { parentPermissionId: null },
      });

      // 按层级从叶子到根删除，避免外键约束
      for (let i = allIds.length - 1; i >= 0; i--) {
        const pid = allIds[i];
        if (nonApiIds.includes(pid)) {
          await this.prisma.permission.delete({
            where: { permissionId: pid },
          });
        }
      }
    }
  }

  /**
   * 获取权限树结构
   * @returns 按照资源层级组织的权限树
   */
  async getPermissionTree(queryDto?: QueryPermissionDto): Promise<unknown> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (queryDto?.name) where['name'] = { contains: queryDto.name };
    if (queryDto?.code) where['code'] = { contains: queryDto.code };
    if (queryDto?.action) where['action'] = { contains: queryDto.action };
    if (queryDto?.type) {
      where['type'] = queryDto.type as unknown;
    } else {
      // 默认只返回目录/菜单/按钮，不返回 API
      where['type'] = { in: ['DIRECTORY', 'MENU', 'BUTTON'] };
    }
    if (queryDto?.parentPermissionId)
      where['parentPermissionId'] = queryDto.parentPermissionId;

    const permissions = await (this.prisma as any).permission.findMany({
      where,
      include: {
        menuMeta: {
          select: { path: true, icon: true, hidden: true, component: true, sort: true },
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
        sort?: number;
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
              sort: p.menuMeta.sort ?? 0,
            }
          : undefined,
        children: [],
      });
    });
    permissions.forEach((p) => {
      const node = map.get(p.permissionId);
      if (!node) return;
      const parentId = p.parentPermissionId;
      if (parentId && parentId !== ROOT_PARENT_ID) {
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
        // 目录/菜单按 menuMeta.sort 排序
        const as = a.menuMeta?.sort ?? 0;
        const bs = b.menuMeta?.sort ?? 0;
        if (as !== bs) return as - bs;
        // 按钮按 actionOrder 排序
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
      where: { deletedAt: null },
      include: { menuMeta: { select: { path: true, sort: true } } },
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
      sort?: number;
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
        sort: p.menuMeta?.sort ?? 0,
        children: [],
      });
    });
    permissions.forEach((p) => {
      const node = map.get(p.permissionId);
      if (!node) return;
      const parentId = p.parentPermissionId;
      if (parentId && parentId !== ROOT_PARENT_ID) {
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
        // 目录/菜单按 sort 排序
        const as = a.sort ?? 0;
        const bs = b.sort ?? 0;
        if (as !== bs) return as - bs;
        // 按钮按 actionOrder 排序
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
      select: { permissionId: true, type: true },
    });

    // 不允许直接批量删除 API 权限
    const apiPerms = perms.filter((p) => p.type === 'API');
    if (apiPerms.length > 0) {
      throw new ConflictException('API 权限由系统自动管理，不能手动删除');
    }

    for (const perm of perms) {
      await this.cascadeRemove(perm.permissionId);
    }
  }
}
