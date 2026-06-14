import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DENY_ROLES_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import { IUser } from '../interfaces/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const deniedRoleKeys = this.reflector.getAllAndOverride<string[]>(
      DENY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !deniedRoleKeys) {
      return true;
    }

    const { user }: { user: IUser } = context.switchToHttp().getRequest();

    if (
      deniedRoleKeys?.some((roleKey) =>
        user.roles.some((role) => role.roleKey === roleKey),
      )
    ) {
      return false;
    }

    if (!requiredRoles) {
      return true;
    }

    return user.roles.some((role) => requiredRoles.includes(role.name));
  }
}
