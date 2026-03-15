import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '../../shared/utils/response.util';
import {
  ResponseCode,
  ErrorShowType,
} from '../../shared/interfaces/response.interface';

/**
 * HTTP异常过滤器
 * 统一处理HTTP异常并返回统一格式的错误响应
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || responseObj.error || exception.message;

        // 如果是验证错误，聚合详细信息到message中
        if (Array.isArray(responseObj.message)) {
          message = `请求参数错误: ${responseObj.message.join(', ')}`;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || '服务器内部错误';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
    }

    // 记录错误日志
    this.logger.error(
      `HTTP Exception: ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
      `${request.method} ${path}`,
    );

    // 获取错误展示类型
    const showType = this.getShowType(status);

    // 构建错误响应
    const errorResponse = ResponseUtil.error(message, status, path, showType);

    response.status(this.getHttpStatus(status)).json(errorResponse);
  }

  /**
   * 根据状态码获取错误展示类型
   * @param code 状态码
   * @returns 错误展示类型
   */
  private getShowType(code: number): ErrorShowType {
    switch (code) {
      // 认证/授权相关 - 使用通知提醒
      case HttpStatus.UNAUTHORIZED:
      case HttpStatus.FORBIDDEN:
        return ErrorShowType.NOTIFICATION;

      // 验证错误 - 使用错误消息提示
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorShowType.ERROR_MESSAGE;

      // 资源不存在 - 使用警告消息
      case HttpStatus.NOT_FOUND:
        return ErrorShowType.WARN_MESSAGE;

      // 冲突 - 使用错误消息提示
      case HttpStatus.CONFLICT:
        return ErrorShowType.ERROR_MESSAGE;

      // 服务器错误 - 使用通知提醒
      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorShowType.NOTIFICATION;

      // 默认使用错误消息提示
      default:
        return ErrorShowType.ERROR_MESSAGE;
    }
  }

  /**
   * 获取HTTP状态码
   * @param code 业务状态码
   * @returns HTTP状态码
   */
  private getHttpStatus(code: number): number {
    // 如果是标准HTTP状态码，直接返回
    if (code >= 100 && code < 600) {
      return code;
    }

    // 根据业务状态码映射HTTP状态码
    switch (code) {
      case ResponseCode.SUCCESS:
      case ResponseCode.CREATED:
      case ResponseCode.NO_CONTENT:
        return HttpStatus.OK;
      case ResponseCode.BAD_REQUEST:
        return HttpStatus.BAD_REQUEST;
      case ResponseCode.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case ResponseCode.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case ResponseCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ResponseCode.METHOD_NOT_ALLOWED:
        return HttpStatus.METHOD_NOT_ALLOWED;
      case ResponseCode.CONFLICT:
        return HttpStatus.CONFLICT;
      case ResponseCode.INTERNAL_SERVER_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case ResponseCode.SERVICE_UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
