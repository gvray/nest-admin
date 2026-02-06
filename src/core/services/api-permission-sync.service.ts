import {
  Injectable,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { PrismaService } from '@/prisma/prisma.service';
import { PERMISSIONS_KEY } from '@/core/decorators/permissions.decorator';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ApiPermissionSyncService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  private guessAction(methodPath: string, httpMethod: string): string {
    const segs = methodPath
      .split('/')
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    const isIdRoute = segs.some((s) => s.startsWith(':'));

    if (segs.includes('export')) return 'export';
    if (segs.includes('import')) return 'import';
    if (segs.includes('assign')) return 'assign';
    if (segs.includes('unbind') || segs.includes('unassign')) return 'unbind';
    if (segs.includes('enable')) return 'enable';
    if (segs.includes('disable')) return 'disable';
    if (segs.includes('download') && segs.includes('template'))
      return 'downloadTemplate';
    if (segs.includes('upload') && segs.includes('template'))
      return 'uploadTemplate';
    if (segs.includes('reset') && segs.includes('password'))
      return 'resetPassword';

    switch (httpMethod.toUpperCase()) {
      case 'GET':
        return isIdRoute ? 'get' : 'query';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return segs.some((s) => /batch|many/.test(s))
          ? 'batchDelete'
          : 'delete';
      default:
        return 'access';
    }
  }

  async onApplicationBootstrap() {
    // 构建菜单映射，直接用完整 code
    const menuPerms = await this.prisma.permission.findMany({
      where: { code: { startsWith: 'menu:' } },
      select: { permissionId: true, code: true },
    });
    const menuMap: Record<string, string> = {};
    menuPerms.forEach((p) => {
      menuMap[p.code] = p.permissionId;
    });

    // 预加载已有权限（包含已软删除的），避免 N+1 查询
    const existingPerms = await (this.prisma as any).permission.findMany({
      select: { code: true, deletedAt: true },
    });
    const existingSet = new Set(existingPerms.map((p: any) => p.code));
    const softDeletedSet = new Set(
      existingPerms
        .filter((p: any) => p.deletedAt !== null)
        .map((p: any) => p.code),
    );

    const metadataScanner = new MetadataScanner();
    const controllers = this.discovery.getControllers();
    const report: Array<{
      code: string;
      action: string;
      controller: string;
      method: string;
      httpMethod: string;
      route: string;
      menuCode: string;
      status: 'created' | 'exists' | 'reactivated' | 'skipped';
    }> = [];

    for (const controllerRef of controllers) {
      const metatype = (controllerRef as any).metatype;
      if (!metatype) continue;
      const prototype = metatype.prototype;
      const controllerPath: string =
        this.reflector.get<string>(PATH_METADATA, metatype) || '';
      const ctrlSegs = controllerPath.split('/').filter(Boolean);
      const moduleKey = ctrlSegs.length > 0 ? ctrlSegs[0] : 'core';

      const methodNames = metadataScanner.getAllMethodNames(prototype);
      for (const methodName of methodNames) {
        const methodRef = prototype[methodName];
        if (!methodRef) continue;

        const codes: string[] =
          this.reflector.get<string[]>(PERMISSIONS_KEY, methodRef) || [];
        const methodPath: string =
          this.reflector.get<string>(PATH_METADATA, methodRef) || '';
        const requestMethod: RequestMethod =
          this.reflector.get<RequestMethod>(METHOD_METADATA, methodRef) ??
          RequestMethod.ALL;
        const httpMethod = RequestMethod[requestMethod] ?? 'ALL';

        // 解析 menuCode：优先从控制器路径 /<module>/<menu> 推断
        let menuCode = ctrlSegs[1] || '';

        for (const code of codes) {
          if (!code || code === '*:*:*') continue;
          const parts = code.split(':');
          if (parts.length < 3 || parts[0] !== 'system') continue;
          menuCode = parts[1] || menuCode;
          const actionFromCode = parts.slice(2).join(':');
          const action =
            actionFromCode || this.guessAction(methodPath, httpMethod);

          const fullMenuCode = `menu:${moduleKey}:${menuCode}`;
          const parentId = menuMap[fullMenuCode];
          if (!parentId) continue;

          const apiCode = `api:${moduleKey}:${menuCode}:${action}`;
          const exists = existingSet.has(apiCode);
          const wasSoftDeleted = softDeletedSet.has(apiCode);
          report.push({
            code: apiCode,
            action,
            controller: metatype?.name ?? '',
            method: methodName,
            httpMethod,
            route: `/${[controllerPath, methodPath].filter(Boolean).join('/')}`,
            menuCode: fullMenuCode,
            status: exists ? (wasSoftDeleted ? 'reactivated' : 'exists') : 'created',
          });
        }
      }
    }

    // 写出报告
    try {
      const outDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, 'api-permissions.json');

      // 稳定排序
      const sorted = [...report].sort((a, b) => {
        const byCode = a.code.localeCompare(b.code);
        if (byCode !== 0) return byCode;
        const byRoute = a.route.localeCompare(b.route);
        if (byRoute !== 0) return byRoute;
        return a.method.localeCompare(b.method);
      });

      await fs.writeFile(outFile, JSON.stringify(sorted, null, 2), 'utf8');
      console.log(`API 权限扫描报告已生成: ${outFile}`);
    } catch (e) {
      console.warn('写出 API 权限扫描报告失败:', e);
    }
  }
}
