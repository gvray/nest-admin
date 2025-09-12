import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser } from '../interfaces/user.interface';
import { SUPER_ROLE_KEY } from '../../shared/constants/role.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;

    // 超级角色直接通过角色检查
    if (user.roles.some((role) => role.roleKey === SUPER_ROLE_KEY)) {
      console.log('User has super role, bypassing role check');
      return true;
    }

    return user.roles.some((role) => requiredRoles.includes(role.name));
  }
}
