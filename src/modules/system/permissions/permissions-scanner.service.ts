import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS_KEY } from '@/core/decorators/permissions.decorator';

interface ScannedPermission {
  code: string;
  name: string;
  method: string;
  path: string;
  controller: string;
}

@Injectable()
export class PermissionsScannerService {
  private readonly logger = new Logger(PermissionsScannerService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 扫描所有控制器，提取 API 权限
   */
  async scanControllers(): Promise<{
    scanned: number;
    created: number;
    updated: number;
    deleted: number;
  }> {
    this.logger.log('🔍 开始扫描控制器权限...');

    const controllers = this.discoveryService.getControllers();
    const scannedPermissions: ScannedPermission[] = [];

    // 扫描所有控制器
    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const controllerPath = this.getControllerPath(metatype);
      if (!controllerPath) continue;

      const controllerName = metatype.name;

      // 扫描控制器中的所有方法
      const methodNames = this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance),
      );

      for (const methodName of methodNames) {
        const method = instance[methodName];
        if (!method) continue;

        // 获取方法上的权限装饰器
        const permissions = this.reflector.get<string[]>(
          PERMISSIONS_KEY,
          method,
        );

        if (!permissions || permissions.length === 0) continue;

        // 获取 HTTP 方法和路径
        const httpMethod = this.getHttpMethod(instance, methodName);
        const methodPath = this.getMethodPath(instance, methodName);

        if (!httpMethod) continue;

        const fullPath = this.buildFullPath(controllerPath, methodPath);

        // 为每个权限代码创建记录
        for (const permissionCode of permissions) {
          // 跳过非 api: 前缀的权限（这些是按钮权限）
          if (!permissionCode.startsWith('api:')) continue;

          scannedPermissions.push({
            code: permissionCode,
            name: this.generatePermissionName(permissionCode, httpMethod),
            method: httpMethod,
            path: fullPath,
            controller: controllerName,
          });
        }
      }
    }

    this.logger.log(`📊 扫描到 ${scannedPermissions.length} 个 API 权限`);

    // 同步到数据库
    const stats = await this.syncPermissions(scannedPermissions);

    this.logger.log('✅ 权限扫描完成');
    this.logger.log(`   - 新增: ${stats.created} 个`);
    this.logger.log(`   - 更新: ${stats.updated} 个`);
    this.logger.log(`   - 删除: ${stats.deleted} 个`);

    return {
      scanned: scannedPermissions.length,
      ...stats,
    };
  }

  /**
   * 同步权限到数据库
   */
  private async syncPermissions(
    scannedPermissions: ScannedPermission[],
  ): Promise<{ created: number; updated: number; deleted: number }> {
    let created = 0;
    let updated = 0;

    // 获取所有现有的 SYSTEM 来源的 API 权限
    const existingPermissions = await this.prisma.permission.findMany({
      where: {
        type: 'API',
        origin: 'SYSTEM',
        deletedAt: null,
      },
      select: {
        permissionId: true,
        code: true,
        name: true,
        action: true,
      },
    });

    const existingCodes = new Set(existingPermissions.map((p) => p.code));
    const scannedCodes = new Set(scannedPermissions.map((p) => p.code));

    // 创建或更新权限（使用 upsert 避免唯一约束冲突）
    for (const perm of scannedPermissions) {
      const existing = existingPermissions.find((p) => p.code === perm.code);

      await this.prisma.permission.upsert({
        where: { code: perm.code },
        update: {
          name: perm.name,
          action: perm.method,
          description: `${perm.method} ${perm.path}`,
          origin: 'SYSTEM',
          type: 'API',
          deletedAt: null, // 如果之前被软删除，恢复它
        },
        create: {
          code: perm.code,
          name: perm.name,
          type: 'API',
          origin: 'SYSTEM',
          action: perm.method,
          description: `${perm.method} ${perm.path}`,
          parentPermissionId: '00000000-0000-0000-0000-000000000000',
        },
      });

      if (existing) {
        // 检查是否有实际更新
        if (existing.name !== perm.name || existing.action !== perm.method) {
          updated++;
        }
      } else {
        created++;
      }
    }

    // 软删除不再存在的权限
    const toDelete = existingPermissions.filter(
      (p) => !scannedCodes.has(p.code),
    );
    let deleted = 0;

    for (const perm of toDelete) {
      await this.prisma.permission.update({
        where: { permissionId: perm.permissionId },
        data: { deletedAt: new Date() },
      });
      deleted++;
    }

    return { created, updated, deleted };
  }

  /**
   * 获取控制器路径
   */
  private getControllerPath(metatype: any): string | null {
    const path = Reflect.getMetadata('path', metatype);
    return path || null;
  }

  /**
   * 获取 HTTP 方法
   */
  private getHttpMethod(instance: any, methodName: string): string | null {
    const method = instance[methodName];
    const path = Reflect.getMetadata('path', method);

    // 检查各种 HTTP 方法装饰器
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const httpMethod of httpMethods) {
      const metadata = Reflect.getMetadata(
        `__${httpMethod.toLowerCase()}__`,
        method,
      );
      if (metadata !== undefined || path !== undefined) {
        // 通过检查元数据判断 HTTP 方法
        const methodMetadata = Reflect.getMetadata('method', method);
        if (methodMetadata !== undefined) {
          return httpMethod;
        }
      }
    }

    // 尝试通过路径元数据判断
    if (path !== undefined) {
      // 检查是否有 method 元数据
      const requestMethod = Reflect.getMetadata('method', method);
      if (requestMethod !== undefined) {
        return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'][requestMethod] || null;
      }
    }

    return null;
  }

  /**
   * 获取方法路径
   */
  private getMethodPath(instance: any, methodName: string): string {
    const method = instance[methodName];
    const path = Reflect.getMetadata('path', method);
    return path || '';
  }

  /**
   * 构建完整路径
   */
  private buildFullPath(controllerPath: string, methodPath: string): string {
    const base = controllerPath.startsWith('/')
      ? controllerPath
      : `/${controllerPath}`;
    if (!methodPath) return base;
    const path = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;
    return `${base}${path}`;
  }

  /**
   * 生成权限名称
   */
  private generatePermissionName(code: string, method: string): string {
    // 从 code 中提取操作名称
    // 例如: api:system:user:list -> 获取用户列表
    const parts = code.split(':');
    const action = parts[parts.length - 1];

    const actionMap: Record<string, string> = {
      list: '获取列表',
      detail: '获取详情',
      create: '创建接口',
      update: '更新接口',
      delete: '删除接口',
      'batch-delete': '批量删除接口',
      'assign-roles': '分配角色接口',
      'remove-roles': '移除角色接口',
      'assign-permissions': '分配权限接口',
    };

    const resource = parts[parts.length - 2];
    const resourceMap: Record<string, string> = {
      user: '用户',
      role: '角色',
      permission: '权限',
      department: '部门',
      position: '岗位',
      dictionary: '字典',
      config: '配置',
      loginlog: '登录日志',
      oplog: '操作日志',
    };

    const resourceName = resourceMap[resource] || resource;
    const actionName = actionMap[action] || action;

    return `${resourceName}${actionName}`;
  }
}
