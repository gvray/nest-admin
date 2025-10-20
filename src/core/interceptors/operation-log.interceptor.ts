import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PrismaService } from '@/prisma/prisma.service';
import { OPLOG_META, OperationLogOptions } from '@/core/decorators/operation-log.decorator';
import { OPLOG_SKIP } from '@/core/decorators/no-operation-log.decorator';
import { randomUUID } from 'crypto';

function maskSensitive(input: unknown, maskFields: string[]): unknown {
  const fields = new Set(maskFields.map((f) => f.toLowerCase()));
  const maxLen = 2000; // 控制体积

  const replacer = (key: string, value: any) => {
    if (fields.has(key.toLowerCase())) return '***';
    if (typeof value === 'string' && value.length > 1000) return `${value.slice(0, 1000)}...[TRUNCATED]`;
    return value;
  };

  try {
    const json = JSON.stringify(input, replacer);
    if (!json) return input;
    return json.length > maxLen ? `${json.slice(0, maxLen)}...[TRUNCATED]` : JSON.parse(json);
  } catch {
    return input;
  }
}

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & any>();

    const enabled = process.env.OPLOG_ENABLED !== 'false';
    console.log('OperationLog Interceptor - enabled:', enabled, 'method:', req.method);
    if (!enabled) return next.handle();

    // 仅拦截 POST/PUT/DELETE
    const method = (req.method || '').toUpperCase();
    console.log('OperationLog Interceptor - method:', method, 'should intercept:', ['POST', 'PUT', 'DELETE'].includes(method));
    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // 跳过显式禁用
    const handler = context.getHandler();
    const controller = context.getClass();
    const skip = this.reflector.getAllAndOverride<boolean>(OPLOG_SKIP, [handler, controller]);
    if (skip) return next.handle();

    // 装饰器元数据
    const meta = this.reflector.getAllAndOverride<OperationLogOptions>(OPLOG_META, [handler, controller]) || {};

    const start = Date.now();
    const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.socket?.remoteAddress || '') as string;
    const ua = (req.headers['user-agent'] || '') as string;
    const path = req.originalUrl || req.url || '';

    const maskFields = (process.env.OPLOG_MASK_FIELDS || 'password,oldPassword,newPassword,token,authorization,secret,captcha')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const maskedQuery = maskSensitive(req.query, maskFields);
    const maskedBody = maskSensitive(req.body, maskFields);

    const finish = async (status: number, message?: string) => {
      try {
        const user = req.user || {};
        const latencyMs = Date.now() - start;
        const autoModule = (path.split('?')[0] || '/').split('/')[1] || '';
        const autoAction = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : method === 'DELETE' ? 'delete' : 'unknown';
        await this.prisma.operationLog.create({
          data: {
            logId: randomUUID(),
            userId: user.sub || user.userId || null,
            username: user.username || null,
            nickname: user.nickname || null,
            module: meta.module || autoModule,
            action: meta.action || autoAction,
            resource: meta.resource || path,
            method,
            path,
            query: maskedQuery as any,
            body: maskedBody as any,
            ipAddress: ip,
            userAgent: ua,
            status,
            message: message?.slice(0, 500),
            latencyMs,
          },
        });
      } catch (e) {
        // 写库失败不影响业务
        // eslint-disable-next-line no-console
        console.error('OperationLog write failed:', e);
      }
    };

    return next.handle().pipe(
      tap(async () => {
        await finish(1);
      }),
      catchError((err) => {
        const msg = (err?.message as string) || 'Unknown error';
        finish(0, msg);
        return throwError(() => err);
      }),
    );
  }
}


