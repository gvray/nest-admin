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

  async onApplicationBootstrap() {
    // 构建菜单映射
    const menuPerms = await this.prisma.permission.findMany({
      where: { code: { startsWith: 'menu:' } },
      select: { permissionId: true, code: true },
    });
    const menuMap: Record<string, string> = {};
    menuPerms.forEach((p) => {
      const parts = p.code.split(':'); // ["menu", "<module>", "<menu?>"]
      if (parts.length === 2) {
        // menu:<module>
        menuMap[parts[1]] = p.permissionId;
      } else if (parts.length >= 3) {
        // menu:<module>:<menu>
        menuMap[`${parts[1]}:${parts[2]}`] = p.permissionId;
      }
    });

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
      status: 'created' | 'exists' | 'skipped';
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
        let menuCode = '';
        if (ctrlSegs.length >= 2) {
          menuCode = ctrlSegs[1];
        }

        for (const code of codes) {
          if (!code || code === '*:*:*') continue;
          const parts = code.split(':');
          if (parts.length < 3 || parts[0] !== 'system') continue;
          menuCode = parts[1] || menuCode;
          const actionFromCode = parts.slice(2).join(':');
          let action = actionFromCode;
          if (!action) {
            const routeSegs = (methodPath || '').split('/').filter(Boolean);
            const segsLower = routeSegs.map((s) => s.toLowerCase());
            const isIdRoute = routeSegs.some((s) => s.startsWith(':'));
            if (segsLower.includes('export')) action = 'export';
            else if (segsLower.includes('import')) action = 'import';
            else if (segsLower.includes('assign')) action = 'assign';
            else if (segsLower.includes('unbind') || segsLower.includes('unassign'))
              action = 'unbind';
            else if (segsLower.includes('enable')) action = 'enable';
            else if (segsLower.includes('disable')) action = 'disable';
            else if (
              segsLower.includes('download') &&
              segsLower.includes('template')
            )
              action = 'downloadTemplate';
            else if (
              segsLower.includes('upload') &&
              segsLower.includes('template')
            )
              action = 'uploadTemplate';
            else if (segsLower.includes('reset') && segsLower.includes('password'))
              action = 'resetPassword';
            else {
              switch (httpMethod.toUpperCase()) {
                case 'GET':
                  action = isIdRoute ? 'get' : 'query';
                  break;
                case 'POST':
                  action = 'create';
                  break;
                case 'PUT':
                case 'PATCH':
                  action = 'update';
                  break;
                case 'DELETE':
                  action = segsLower.some((s) => /batch|many/.test(s))
                    ? 'batchDelete'
                    : 'delete';
                  break;
                default:
                  action = 'access';
              }
            }
          }
          const parentId = menuMap[`${moduleKey}:${menuCode}`] ?? menuMap[moduleKey];
          if (!parentId) continue;
          const apiCode = `api:${moduleKey}:${menuCode}:${action}`;
          const existing = await this.prisma.permission.findUnique({
            where: { code: apiCode },
            select: { permissionId: true },
          });
          report.push({
            code: apiCode,
            action,
            controller: metatype?.name ?? '',
            method: methodName,
            httpMethod,
            route: path.posix.join('/', controllerPath || '', methodPath || ''),
            menuCode,
            status: existing ? 'exists' : 'created',
          });
        }
      }
    }

    // 写出报告
    try {
      const outDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, 'api-permissions.json');
      // 稳定排序，方便提交到 Git
      const sorted = [...report].sort((a, b) => {
        const byCode = a.code.localeCompare(b.code);
        if (byCode !== 0) return byCode;
        const byRoute = a.route.localeCompare(b.route);
        if (byRoute !== 0) return byRoute;
        return a.method.localeCompare(b.method);
      });
      await fs.writeFile(outFile, JSON.stringify(sorted, null, 2), 'utf8');
      // eslint-disable-next-line no-console
      console.log(`API 权限扫描报告已生成: ${outFile}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('写出 API 权限扫描报告失败:', e);
    }
  }
}
