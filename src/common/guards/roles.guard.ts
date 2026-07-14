import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';

interface RequestWithUser {
  user: JwtPayload;
}

/**
 * RBAC Roles Guard
 * Checks that the authenticated user has at least one of the required roles.
 * Must be used AFTER JwtAuthGuard.
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(RoleEnum.SUPER_ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Accès refusé : rôle insuffisant');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé : rôle(s) requis : ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
