import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 获取用户所有角色的所有权限代码
    const userPermissions = user.roles.reduce((permissions: string[], role) => {
      const rolePermissions = role.permissions.map((permission) => permission.code);
      return [...permissions, ...rolePermissions];
    }, []);

    // 检查用户是否拥有所有需要的权限
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
} 