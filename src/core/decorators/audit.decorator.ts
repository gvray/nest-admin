import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

/**
 * 审计装饰器
 * 用于标记需要记录操作者的方法
 * 
 * @param operation 操作类型，如: 'create', 'update', 'delete'
 */
export const Audit = (operation: 'create' | 'update' | 'delete') =>
  SetMetadata(AUDIT_KEY, operation);

/**
 * 获取当前用户ID的辅助函数
 * 用于在Service中设置createdBy/updatedBy字段
 */
export const getCurrentUserId = (request: any): string | undefined => {
  return request?.auditUserId || request?.user?.userId;
};