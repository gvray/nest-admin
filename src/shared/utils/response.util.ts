import {
  ApiResponse,
  PaginationResponse,
  PaginationData,
  ResponseCode,
  ResponseMessage,
} from '../interfaces/response.interface';

/**
 * 响应格式工具类
 */
export class ResponseUtil {
  /**
   * 构建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param code 响应状态码
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static success<T>(
    data: T,
    message: string = ResponseMessage.SUCCESS,
    code: number = ResponseCode.SUCCESS,
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * 构建创建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static created<T>(
    data: T,
    message: string = ResponseMessage.CREATED,
    path?: string,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.CREATED, path);
  }

  /**
   * 构建更新成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static updated<T>(
    data: T,
    message: string = ResponseMessage.UPDATED,
    path?: string,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS, path);
  }

  /**
   * 构建删除成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static deleted<T>(
    data: T,
    message: string = ResponseMessage.DELETED,
    path?: string,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS, path);
  }

  /**
   * 构建查询成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static found<T>(
    data: T,
    message: string = ResponseMessage.SUCCESS,
    path?: string,
  ): ApiResponse<T> {
    return this.success(data, message, ResponseCode.SUCCESS, path);
  }

  /**
   * 构建分页响应
   * @param data 分页数据
   * @param message 响应消息
   * @returns 统一分页响应格式
   */
  static paginated<T>(
    data: PaginationData<T>,
    message: string = ResponseMessage.SUCCESS,
  ): PaginationResponse<T> {
    return {
      success: true,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 构建错误响应
   * @param message 错误消息
   * @param code 错误状态码
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static error(
    message: string,
    code: number = ResponseCode.INTERNAL_SERVER_ERROR,
    path?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * 构建请求错误响应
   * @param message 错误消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static badRequest(
    message: string = ResponseMessage.BAD_REQUEST,
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.BAD_REQUEST, path);
  }

  /**
   * 构建未授权响应
   * @param message 错误消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static unauthorized(
    message: string = ResponseMessage.UNAUTHORIZED,
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.UNAUTHORIZED, path);
  }

  /**
   * 构建禁止访问响应
   * @param message 错误消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static forbidden(
    message: string = ResponseMessage.FORBIDDEN,
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.FORBIDDEN, path);
  }

  /**
   * 构建资源不存在响应
   * @param message 错误消息
   * @param path 请求路径
   * @returns 统一响应格式
   */
  static notFound(
    message: string = ResponseMessage.NOT_FOUND,
    path?: string,
  ): ApiResponse<null> {
    return this.error(message, ResponseCode.NOT_FOUND, path);
  }
}
