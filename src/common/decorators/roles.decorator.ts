import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator for RBAC access control.
 *
 * @example
 * @Roles(RoleEnum.SUPER_ADMIN)
 * @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.DIRECTEUR)
 *
 * Must be combined with @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
