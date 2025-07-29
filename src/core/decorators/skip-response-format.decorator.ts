import { SetMetadata } from '@nestjs/common';
import { SKIP_RESPONSE_FORMAT } from '../interceptors/response.interceptor';

/**
 * 跳过响应格式化装饰器
 * 用于标记某些接口不需要统一响应格式化
 *
 * @example
 * ```typescript
 * @Get('download')
 * @SkipResponseFormat()
 * downloadFile() {
 *   // 返回文件流，不需要格式化
 *   return fileStream;
 * }
 * ```
 */
export const SkipResponseFormat = () => SetMetadata(SKIP_RESPONSE_FORMAT, true);
