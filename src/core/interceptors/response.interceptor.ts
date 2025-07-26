import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ResponseUtil } from '../../shared/utils/response.util';
import { ApiResponse } from '../../shared/interfaces/response.interface';

/**
 * 跳过响应格式化的装饰器键
 */
export const SKIP_RESPONSE_FORMAT = 'skipResponseFormat';

/**
 * 响应拦截器
 * 自动将控制器返回的数据包装为统一的响应格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // 检查是否跳过响应格式化
    const skipFormat = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_FORMAT,
      [context.getHandler(), context.getClass()],
    );

    if (skipFormat) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 如果返回的数据已经是统一格式，直接返回
        if (this.isApiResponse(data)) {
          return data;
        }

        // 根据HTTP方法确定响应类型
        const method = request.method;
        switch (method) {
          case 'POST':
            return ResponseUtil.created(data, undefined, path);
          case 'PUT':
          case 'PATCH':
            return ResponseUtil.updated(data, undefined, path);
          case 'DELETE':
            return ResponseUtil.deleted(data, undefined, path);
          default:
            return ResponseUtil.found(data, undefined, path);
        }
      }),
    );
  }

  /**
   * 检查数据是否已经是统一响应格式
   * @param data 数据
   * @returns 是否为统一响应格式
   */
  private isApiResponse(data: any): data is ApiResponse<T> {
    return (
      data &&
      typeof data === 'object' &&
      'code' in data &&
      'message' in data &&
      'data' in data &&
      'timestamp' in data &&
      'path' in data
    );
  }
}