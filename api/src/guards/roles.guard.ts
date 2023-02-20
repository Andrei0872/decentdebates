import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserCookieData, UserRoles } from 'src/entities/user/user.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor (private reflector: Reflector) { }
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<UserRoles[]>('roles', context.getClass());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.session.user as UserCookieData;

    return this.doRolesMatch(roles, user.role);
  }

  private doRolesMatch (acceptedRoles: UserRoles[], currentUserRole: UserRoles): boolean {
    return acceptedRoles.includes(currentUserRole);
  }
  
}
