/**
 * 统一响应格式接口
 */
export interface ApiResponse<T = any> {
  /** 成功状态 */
  success: boolean;
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 - 成功时包含数据，错误时为null */
  data?: T | null;
  /** 响应时间戳 */
  timestamp: string;
  /** 请求路径 */
  path?: string;
}

/**
 * 分页响应数据接口
 */
export interface PaginationData<T = any> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 分页响应接口
 */
export interface PaginationResponse<T = any>
  extends ApiResponse<PaginationData<T>> {
  // 继承ApiResponse，专门用于分页数据
}

/**
 * 响应状态码枚举
 */
export enum ResponseCode {
  /** 成功 */
  SUCCESS = 200,
  /** 创建成功 */
  CREATED = 201,
  /** 无内容 */
  NO_CONTENT = 204,
  /** 请求参数错误 */
  BAD_REQUEST = 400,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 禁止访问 */
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,
  /** 请求方法不允许 */
  METHOD_NOT_ALLOWED = 405,
  /** 冲突 */
  CONFLICT = 409,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE = 503,
}

/**
 * 响应消息枚举
 */
export enum ResponseMessage {
  /** 操作成功 */
  SUCCESS = '操作成功',
  /** 创建成功 */
  CREATED = '创建成功',
  /** 更新成功 */
  UPDATED = '更新成功',
  /** 删除成功 */
  DELETED = '删除成功',
  /** 查询成功 */
  FOUND = '查询成功',
  /** 请求参数错误 */
  BAD_REQUEST = '请求参数错误',
  /** 未授权 */
  UNAUTHORIZED = '未授权',
  /** 禁止访问 */
  FORBIDDEN = '禁止访问',
  /** 资源不存在 */
  NOT_FOUND = '资源不存在',
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = '服务器内部错误',
}