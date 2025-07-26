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
import { ResponseCode } from '../../shared/interfaces/response.interface';

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
        message =
          responseObj.message || responseObj.error || exception.message;

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

    // 构建错误响应
    const errorResponse = ResponseUtil.error(message, status, path);

    response.status(this.getHttpStatus(status)).json(errorResponse);
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