import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IUser } from '../interfaces/user.interface';

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

    const { user }: { user: IUser } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      console.log('User or roles not found');
      return false;
    }

    // 获取用户所有角色的所有权限代码
    const userPermissions: string[] = user.roles.reduce(
      (permissions: string[], role) => {
        if (!role.permissions) {
          return permissions;
        }
        const rolePermissions: string[] = role.permissions.map(
          (permission) => permission.code,
        );
        return [...permissions, ...rolePermissions];
      },
      [],
    );

    // 检查用户是否拥有所有需要的权限
    const hasPermission: boolean = requiredPermissions.every(
      (permission: string) => userPermissions.includes(permission),
    );

    return hasPermission;
  }
}
