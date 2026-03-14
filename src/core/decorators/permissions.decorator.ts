import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 * 自动为权限代码添加 'api:' 前缀，简化控制器中的权限声明
 * @param permissions 权限代码，例如 'system:user:create'
 * @example @RequirePermissions('system:user:create') // 实际检查 'api:system:user:create'
 */
export const RequirePermissions = (...permissions: string[]) => {
  // 自动为每个权限添加 'api:' 前缀（如果还没有的话）
  const apiPermissions = permissions.map((permission) =>
    permission.startsWith('api:') ? permission : `api:${permission}`,
  );
  return SetMetadata(PERMISSIONS_KEY, apiPermissions);
};
