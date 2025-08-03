import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * 审计拦截器
 * 自动记录敏感操作的创建者和更新者
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果有用户信息，添加到请求中用于后续处理
    if (user && user.userId) {
      request.auditUserId = user.userId;
    }

    return next.handle().pipe(
      tap(() => {
        // 可以在这里记录审计日志
        const method = request.method;
        const url = request.url;
        const userAgent = request.get('User-Agent');
        const ip = request.ip || request.connection.remoteAddress;

        if (user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          console.log(`🔍 审计日志: ${user.username} (${user.userId}) 执行 ${method} ${url}`, {
            ip,
            userAgent: userAgent?.substring(0, 100),
            timestamp: new Date().toISOString(),
          });
        }
      }),
    );
  }
}