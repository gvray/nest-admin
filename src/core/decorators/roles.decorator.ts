import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const DENY_ROLES_KEY = 'denyRoles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const DenyRoles = (...roleKeys: string[]) =>
  SetMetadata(DENY_ROLES_KEY, roleKeys);
